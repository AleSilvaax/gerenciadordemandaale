import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { InviteEmail } from "./_templates/invite-email.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  inviteId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Configurar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { inviteId }: InviteRequest = await req.json();

    if (!inviteId) {
      return new Response(
        JSON.stringify({ error: 'Invite ID is required' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[SEND-INVITE] Enviando convite: ${inviteId}`);

    // Buscar dados do convite
    const { data: invite, error: inviteError } = await supabase
      .from('user_invites')
      .select(`
        *,
        organizations!inner(name),
        profiles!user_invites_invited_by_fkey(name)
      `)
      .eq('id', inviteId)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      console.error('[SEND-INVITE] Convite não encontrado:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Invite not found or expired' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar se o usuário tem permissão para enviar este convite
    const { data: hasPermission } = await supabase.rpc('is_organization_owner', {
      check_user_id: user.id,
      org_id: invite.organization_id
    });

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Configurar Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Criar URL de convite
    const baseUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173';
    const inviteUrl = `${baseUrl}/register?invite=${invite.token}`;

    // Renderizar template do email
    const emailHtml = await renderAsync(
      React.createElement(InviteEmail, {
        organizationName: invite.organizations.name,
        inviterName: invite.profiles.name || 'Alguém',
        role: invite.role,
        inviteUrl,
        expiresAt: invite.expires_at
      })
    );

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: "Sistema de Gestão <convites@resend.dev>",
      to: [invite.email],
      subject: `Convite para ${invite.organizations.name}`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error('[SEND-INVITE] Erro ao enviar email:', emailResponse.error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[SEND-INVITE] Email enviado com sucesso para: ${invite.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invite sent successfully',
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[SEND-INVITE] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);