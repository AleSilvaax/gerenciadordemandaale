import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  name: string;
  role: string;
  organizationId: string;
  teamId?: string;
  tempPassword: string;
  mustChangePassword?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Initialize regular client for the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify requesting user has permission
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Check if user has admin permissions
    const { data: userRole } = await supabase.rpc('get_current_user_role');
    const { data: userOrgId } = await supabase.rpc('get_current_user_organization_id');
    
    const isSuperAdmin = userRole === 'super_admin';
    const isOrgAdmin = ['owner', 'administrador'].includes(userRole) && userOrgId;

    if (!isSuperAdmin && !isOrgAdmin) {
      throw new Error('Insufficient permissions to create users');
    }

    const requestData: CreateUserRequest = await req.json();
    const { email, name, role, organizationId, teamId, tempPassword, mustChangePassword = true } = requestData;

    // Validate organization access
    if (!isSuperAdmin && userOrgId !== organizationId) {
      throw new Error('Cannot create users for other organizations');
    }

    console.log(`Creating user: ${email} with role: ${role} in org: ${organizationId}`);

    // Create user with Supabase Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        team_id: teamId,
        organization_id: organizationId,
      },
    });

    if (createError) {
      console.error('User creation error:', createError);
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error('User creation failed - no user returned');
    }

    console.log(`User created successfully: ${newUser.user.id}`);

    // Update profile with correct organization and team
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        organization_id: organizationId,
        team_id: teamId || null,
        must_change_password: mustChangePassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't throw here as user is already created
    }

    // Upsert user role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: newUser.user.id,
        role,
      });

    if (roleError) {
      console.error('User role error:', roleError);
    }

    // Upsert organization role
    const { error: orgRoleError } = await supabaseAdmin
      .from('organization_roles')
      .upsert({
        user_id: newUser.user.id,
        organization_id: organizationId,
        role,
        assigned_by: user.id,
        is_active: true,
      });

    if (orgRoleError) {
      console.error('Organization role error:', orgRoleError);
    }

    console.log(`User setup completed for: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          name,
          role,
          organizationId,
          teamId,
        },
        message: `Usuário ${email} criado com sucesso`,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in admin-create-user function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);