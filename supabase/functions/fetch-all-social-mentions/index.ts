import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obter parâmetros do request
    let politicians = [];
    let platforms = ['twitter', 'instagram', 'facebook', 'tiktok'];

    try {
      const body = await req.json();
      if (body.politicians && Array.isArray(body.politicians)) {
        politicians = body.politicians;
      }
      if (body.platforms && Array.isArray(body.platforms)) {
        platforms = body.platforms;
      }
    } catch (error) {
      console.log('Usando configurações padrão');
    }

    console.log('Iniciando coleta de todas as redes sociais...');
    console.log('Plataformas:', platforms);
    console.log('Políticos:', politicians);

    const results = {
      twitter: { success: false, message: '', error: null },
      instagram: { success: false, message: '', error: null },
      facebook: { success: false, message: '', error: null },
      tiktok: { success: false, message: '', error: null }
    };

    // Executar coletas em paralelo para diferentes plataformas
    const promises = platforms.map(async (platform) => {
      try {
        console.log(`Iniciando coleta do ${platform}...`);
        
        const { data, error } = await supabase.functions.invoke(`fetch-${platform}-mentions`, {
          body: { politicians }
        });
        
        if (error) {
          throw error;
        }
        
        results[platform as keyof typeof results] = {
          success: true,
          message: data.message || `Coleta do ${platform} concluída`,
          error: null
        };
        
        console.log(`✅ ${platform} concluído`);
        
      } catch (error) {
        console.error(`❌ Erro no ${platform}:`, error);
        results[platform as keyof typeof results] = {
          success: false,
          message: '',
          error: error.message
        };
      }
    });

    // Aguardar todas as coletas
    await Promise.allSettled(promises);

    // Contar sucessos e falhas
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = platforms.length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        message: `Coleta concluída: ${successCount}/${totalCount} plataformas processadas com sucesso`,
        results,
        summary: {
          total_platforms: totalCount,
          successful_platforms: successCount,
          failed_platforms: totalCount - successCount,
          politicians_processed: politicians.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função fetch-all-social-mentions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});