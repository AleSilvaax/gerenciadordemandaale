import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface InviteRequest {
  email: string;
  role: string;
  organizationId: string;
  teamId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, role, organizationId, teamId }: InviteRequest = await req.json();

    // Validar dados do convite
    if (!email || !role || !organizationId) {
      return new Response(
        JSON.stringify({ error: "Dados obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar informações da organização
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      throw new Error("Organização não encontrada");
    }

    // Buscar convite existente
    const { data: existingInvite } = await supabase
      .from('user_invites')
      .select('*')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .is('used_at', null)
      .single();

    let inviteToken;
    
    if (existingInvite) {
      inviteToken = existingInvite.token;
    } else {
      // Criar novo convite
      const { data: newInvite, error: inviteError } = await supabase
        .from('user_invites')
        .insert({
          email,
          role,
          organization_id: organizationId,
          team_id: teamId || null,
          invited_by: '00000000-0000-0000-0000-000000000000'  // Placeholder
        })
        .select('token')
        .single();

      if (inviteError) {
        throw new Error("Erro ao criar convite");
      }

      inviteToken = newInvite.token;
    }

    // Construir URL de registro
    const frontendUrl = 'https://9baeb7cd-02b2-4ec6-b4a2-9e66f9f88776.lovableproject.com';
    const registerUrl = `${frontendUrl}/register?invite=${inviteToken}`;

    // Definir papel em português
    const roleNames = {
      'super_admin': 'Super Administrador',
      'owner': 'Proprietário',
      'administrador': 'Administrador',
      'gestor': 'Gestor',
      'tecnico': 'Técnico',
      'requisitor': 'Requisitor'
    };

    const roleName = roleNames[role as keyof typeof roleNames] || role;

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: "Sistema de Gestão <noreply@resend.dev>",
      to: [email],
      subject: `Convite para ${organization.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Convite para ${organization.name}</h1>
          
          <p>Olá!</p>
          
          <p>Você foi convidado(a) para fazer parte da equipe da <strong>${organization.name}</strong> como <strong>${roleName}</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registerUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Aceitar Convite
            </a>
          </div>
          
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${registerUrl}
          </p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Este convite expira em 7 dias. Se você não desejava receber este email, pode ignorá-lo com segurança.
          </p>
        </div>
      `,
    });

    console.log("Email enviado:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Convite enviado com sucesso!",
        inviteToken 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Erro ao enviar convite:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno do servidor" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);