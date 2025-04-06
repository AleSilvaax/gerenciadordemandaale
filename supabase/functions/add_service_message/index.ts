
// Follow Deno's ES modules conventions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Add CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Parse request body
    const { serviceId, message } = await req.json();
    
    console.log('Received request to add message:', { serviceId, message });
    
    if (!serviceId || !message) {
      return new Response(
        JSON.stringify({ error: 'Service ID and message are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Check if the service exists
    const { data: service, error: serviceError } = await supabaseClient
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .single();
      
    if (serviceError || !service) {
      console.error('Service not found:', serviceError);
      return new Response(
        JSON.stringify({ error: 'Service not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Insert message directly into service_messages table
    const { data: messageData, error: insertError } = await supabaseClient
      .from('service_messages')
      .insert({
        service_id: serviceId,
        sender_id: message.author || 'system',
        sender_name: message.author_name || message.author || 'System',
        sender_role: message.type || 'system',
        message: message.text,
        timestamp: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error inserting message:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store message' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log('Message added successfully');
    
    // Get all messages for this service to return updated list
    const { data: messagesData, error: messagesError } = await supabaseClient
      .from('service_messages')
      .select('*')
      .eq('service_id', serviceId)
      .order('timestamp', { ascending: true });
      
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      // Still return success but without updated messages list
      return new Response(
        JSON.stringify({ success: true, data: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: messagesData.map(m => ({
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          message: m.message,
          timestamp: m.timestamp
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
