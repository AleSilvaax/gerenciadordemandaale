
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

// Configuração para CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  // Tratar CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Criar cliente Supabase usando as variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar buckets existentes
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw bucketsError;
    }

    // Criar bucket de avatares se não existir
    if (!buckets.find(b => b.name === "avatars")) {
      const { error: avatarError } = await supabase.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      });
      
      if (avatarError) {
        throw avatarError;
      }
      
      // Adicionar política para acesso público
      await supabase.storage.from("avatars").getPublicUrl("");
    }

    // Criar bucket de fotos de serviços se não existir
    if (!buckets.find(b => b.name === "service-photos")) {
      const { error: servicePhotosError } = await supabase.storage.createBucket("service-photos", {
        public: true,
        fileSizeLimit: 1024 * 1024 * 5, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      });
      
      if (servicePhotosError) {
        throw servicePhotosError;
      }
      
      // Adicionar política para acesso público
      await supabase.storage.from("service-photos").getPublicUrl("");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Buckets de armazenamento criados/verificados com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Erro:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
