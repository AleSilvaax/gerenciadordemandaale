
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse the request body
    const { serviceId, message } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, get the current service
    const { data: service, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();
    
    if (fetchError) {
      throw new Error(`Error fetching service: ${fetchError.message}`);
    }
    
    // Initialize or get messages array
    let messages = service.messages || [];
    
    // Add new message
    messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    
    // Update service with new messages array
    const { data, error } = await supabase
      .from('services')
      .update({ messages })
      .eq('id', serviceId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating service: ${error.message}`);
    }
    
    // Return success response with updated service
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error adding service message:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 400 
      }
    );
  }
});
