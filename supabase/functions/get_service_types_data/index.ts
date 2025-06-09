
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Fetching service types from database...')
    
    // Fetch service types from the new table
    const { data: serviceTypes, error } = await supabase
      .from('service_types')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching service types:', error)
      
      // Return default service types if database query fails
      const defaultTypes = [
        {
          id: '1',
          name: 'Manutenção Preventiva',
          description: 'Serviços de manutenção preventiva em equipamentos',
          estimated_hours: 2,
          default_priority: 'media'
        },
        {
          id: '2',
          name: 'Manutenção Corretiva',
          description: 'Reparos e correções em equipamentos com defeito',
          estimated_hours: 4,
          default_priority: 'alta'
        },
        {
          id: '3',
          name: 'Instalação',
          description: 'Instalação de novos equipamentos ou sistemas',
          estimated_hours: 6,
          default_priority: 'media'
        },
        {
          id: '4',
          name: 'Inspeção',
          description: 'Inspeção técnica e avaliação de equipamentos',
          estimated_hours: 1,
          default_priority: 'baixa'
        },
        {
          id: '5',
          name: 'Emergência',
          description: 'Atendimento de emergência para problemas críticos',
          estimated_hours: 8,
          default_priority: 'urgente'
        }
      ]
      
      return new Response(JSON.stringify(defaultTypes), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (!serviceTypes || serviceTypes.length === 0) {
      console.log('No service types found in database')
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    console.log(`Found ${serviceTypes.length} service types`)
    
    return new Response(JSON.stringify(serviceTypes), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
