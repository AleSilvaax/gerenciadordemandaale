// Arquivo: supabase/functions/create-invite/index.ts (VERSÃO CORRIGIDA)

/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.3.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Trata a requisição OPTIONS (pré-voo) para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role } = await req.json()

    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'Email e cargo (role) são obrigatórios.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Cria um cliente Supabase com privilégios de administrador para usar dentro da função
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Pega o ID do usuário que está a fazer a chamada a partir do token de autenticação
    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Busca o perfil do usuário para obter o organization_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !profile.organization_id) {
       return new Response(JSON.stringify({ error: 'Usuário não pertence a uma organização.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }
    
    const organizationId = profile.organization_id

    // Gera um token de convite único e seguro
    const token = crypto.randomUUID()

    // Insere o convite na tabela 'invitations'
    const { data: invite, error: insertError } = await supabaseAdmin
      .from('invitations')
      .insert({
        organization_id: organizationId,
        email: email,
        role: role,
        token: token,
        invited_by: user.id, // Armazena quem enviou o convite
      })
      .select()
      .single()

    if (insertError) {
      // Verifica se o erro é de violação de unicidade (convite já existe)
      if (insertError.code === '23505') {
        return new Response(JSON.stringify({ error: 'Um convite para este email já existe.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409, // HTTP 409 Conflict
        })
      }
      throw insertError
    }
    
    return new Response(JSON.stringify({ success: true, invite }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201, // HTTP 201 Created
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
