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
    let politicians: any[] = [];
    let platforms: string[] = ['twitter', 'instagram', 'facebook', 'tiktok'];
    let tenantId: string | null = null;

    try {
      const body = await req.json();
      if (body.politicians && Array.isArray(body.politicians)) {
        politicians = body.politicians;
      }
      if (body.platforms && Array.isArray(body.platforms)) {
        platforms = body.platforms;
      }
      if (typeof body.tenantId === 'string') {
        tenantId = body.tenantId;
      }
    } catch (error) {
      console.log('Usando configurações padrão');
    }

    if (!tenantId) {
      return new Response(
        JSON.stringify({ success: false, error: 'tenantId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Determinar plataformas ativas com base nos tokens configurados
    const tokenPresence: Record<string, boolean> = {
      twitter: !!Deno.env.get('TWITTER_BEARER_TOKEN'),
      instagram: !!Deno.env.get('INSTAGRAM_ACCESS_TOKEN'),
      facebook: !!(Deno.env.get('FACEBOOK_ACCESS_TOKEN') && Deno.env.get('FACEBOOK_PAGE_ID')),
      tiktok: !!Deno.env.get('TIKTOK_ACCESS_TOKEN'),
    };

    const disabledPlatforms = platforms.filter((p: string) => !tokenPresence[p]);
    const activePlatforms = platforms.filter((p: string) => tokenPresence[p]);

    // Marcar plataformas sem token como 'pulado'
    disabledPlatforms.forEach((p: string) => {
      (results as any)[p] = {
        success: true,
        message: 'Pulado: token ausente (configure o token para habilitar)',
        error: null,
        skipped: true,
      };
    });

    // Executar coletas em paralelo apenas para plataformas ativas
    const promises = activePlatforms.map(async (platform: string) => {
      try {
        console.log(`Iniciando coleta do ${platform}...`);
        
        const { data, error } = await supabase.functions.invoke(`fetch-${platform}-mentions`, {
          body: { politicians, tenantId }
        });
        
        if (error) {
          throw error;
        }
        
        const success = data?.success !== false; // default true, but respect explicit false
        results[platform as keyof typeof results] = {
          success,
          message: data?.message || `Coleta do ${platform} concluída`,
          error: success ? null : (data?.error || 'Falha na coleta')
        };
        
        console.log(`✅ ${platform} ${success ? 'concluído' : 'com falhas'}`);
        
      } catch (error: any) {
        console.error(`❌ Erro no ${platform}:`, error);
        results[platform as keyof typeof results] = {
          success: false,
          message: '',
          error: error.message || String(error)
        };
      }
    });

    // Aguardar todas as coletas
    await Promise.allSettled(promises);

    // Contar sucessos, falhas e pulos
    const values = Object.values(results) as any[];
    const skippedCount = values.filter(r => r?.skipped).length;
    const successCount = values.filter(r => r?.success && !r?.skipped).length;
    const totalRequested = platforms.length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        message: `Coleta concluída: ${successCount}/${totalRequested} plataformas com dados; ${skippedCount} puladas por falta de token`,
        results,
        summary: {
          requested_platforms: totalRequested,
          active_platforms: totalRequested - skippedCount,
          skipped_platforms: skippedCount,
          successful_platforms: successCount,
          failed_platforms: (totalRequested - skippedCount) - successCount,
          politicians_processed: politicians.length,
          disabled: disabledPlatforms,
          active: activePlatforms,
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