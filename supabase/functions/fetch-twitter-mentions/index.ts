import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TwitterResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    public_metrics: {
      retweet_count: number;
      like_count: number;
      reply_count: number;
      quote_count: number;
    };
  }>;
  includes?: {
    users: Array<{
      id: string;
      username: string;
      name: string;
    }>;
  };
}

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

    const twitterBearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');
    if (!twitterBearerToken) {
      throw new Error('TWITTER_BEARER_TOKEN não configurado');
    }

    // Obter lista de políticos e tenant do request (ou usar lista padrão)
    let politicians: any[] = [
      'João Dória',
      'Rodrigo Garcia', 
      'Fernando Haddad',
      'Bruno Covas',
      'Ricardo Nunes'
    ];
    let tenantId: string | null = null;

    // Se houver políticos específicos no body da requisição, usar eles
    try {
      const body = await req.json();
      if (body.politicians && Array.isArray(body.politicians) && body.politicians.length > 0) {
        politicians = body.politicians;
        console.log('Usando políticos personalizados:', politicians);
      }
      if (typeof body.tenantId === 'string') {
        tenantId = body.tenantId;
      }
    } catch (error) {
      console.log('Usando lista padrão de políticos');
    }

    if (!tenantId) {
      return new Response(
        JSON.stringify({ success: false, error: 'tenantId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Iniciando coleta de menções do Twitter...');

    let totalInserted = 0;
    let rateLimitHits = 0;

    for (const politician of politicians) {
      try {
        // Normalizar estrutura do político (aceita string ou objeto)
        const politicianObj = typeof politician === 'string' 
          ? { name: politician, keywords: [politician] } 
          : politician;

        const politicianName: string = politicianObj.name || (typeof politician === 'string' ? politician : '');
        const keywords: string[] = Array.isArray(politicianObj.keywords) && politicianObj.keywords.length > 0
          ? politicianObj.keywords
          : [politicianName];

        console.log(`Processando político: ${politicianName}`);
        console.log('Palavras-chave:', keywords);
        
        // Dividir palavras-chave em grupos para reduzir query e distribuir chamadas
        const groups: string[][] = [];
        for (let i = 0; i < keywords.length; i += 6) {
          groups.push(keywords.slice(i, i + 6));
        }
        if (groups.length === 0) groups.push([politicianName]);

        const baseUrl = 'https://api.twitter.com/2/tweets/search/recent';
        let lastError: any = null;

        for (const group of groups) {
          let attempt = 0;
          const maxAttempts = 3;
          let groupFetched = false;

          while (attempt < maxAttempts && !groupFetched) {
            const jitter = Math.floor(Math.random() * 500);
            const backoffMs = attempt === 0 ? 0 : 1500 * Math.pow(2, attempt) + jitter; // 0, ~2000, ~4000+
            if (backoffMs) {
              await new Promise(r => setTimeout(r, backoffMs));
            }

            const keywordQuery = group
              .map(k => `"${k.replace(/\"/g, '\\\"')}"`)
              .join(' OR ');
            const searchQuery = `(${keywordQuery}) -is:retweet lang:pt`;
            const url = `${baseUrl}?query=${encodeURIComponent(searchQuery)}&max_results=10&tweet.fields=created_at,public_metrics,author_id&expansions=author_id`;

            const response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${twitterBearerToken}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.status === 429) {
              rateLimitHits += 1;
              const body = await response.text();
              const reset = response.headers.get('x-rate-limit-reset');
              console.error(`Rate limit no Twitter para ${politicianName} (grupo ${attempt + 1}/${maxAttempts})`, body);
              attempt += 1;
              // Se tivermos o reset, esperar até lá (com teto de 15s)
              if (reset) {
                const resetMs = parseInt(reset, 10) * 1000;
                const waitMs = Math.min(Math.max(resetMs - Date.now(), 0) + 500, 15000);
                await new Promise(r => setTimeout(r, waitMs));
              }
              continue;
            }

            if (!response.ok) {
              lastError = { status: response.status, body: await response.text() };
              console.error(`Erro ao buscar menções para ${politicianName}:`, response.status, lastError.body);
              // Para outros erros, não adianta retry imediato deste grupo
              break;
            }

            const data: TwitterResponse = await response.json();
            if (!data.data || data.data.length === 0) {
              console.log(`Nenhuma menção encontrada para ${politicianName} neste grupo`);
              groupFetched = true;
              break;
            }

            // Processar cada tweet encontrado
            for (const tweet of data.data) {
              const engagementScore = 
                tweet.public_metrics.like_count + 
                tweet.public_metrics.retweet_count + 
                tweet.public_metrics.reply_count + 
                tweet.public_metrics.quote_count;

              // Estimativa simples de alcance (engagement * 10)
              const reachEstimate = engagementScore * 10;

              const { error } = await supabase
                .from('social_mentions')
                .insert({
                  tenant_id: tenantId,
                  platform: 'twitter',
                  politician_name: politicianName,
                  content: tweet.text,
                  timestamp: tweet.created_at,
                  url: `https://twitter.com/i/status/${tweet.id}`,
                  mention_type: 'mention',
                  sentiment: 'neutral',
                  reach_estimate: reachEstimate,
                  engagement_score: engagementScore,
                  raw_data: {
                    tweet_id: tweet.id,
                    author_id: tweet.author_id,
                    public_metrics: tweet.public_metrics,
                    search_keywords: group
                  }
                });

              if (error) {
                console.error('Erro ao salvar menção:', error);
              } else {
                totalInserted += 1;
              }
            }

            groupFetched = true;
          }

          // Pequeno intervalo entre grupos
          await new Promise(r => setTimeout(r, 400 + Math.floor(Math.random() * 400)));
        }

        // Delay curto entre políticos para evitar rate limit (com jitter)
        await new Promise(resolve => setTimeout(resolve, 500 + Math.floor(Math.random() * 700)));
        
      } catch (error) {
        console.error(`Erro ao processar ${typeof politician === 'string' ? politician : politician.name}:`, error);
      }
    }

    // Disparar análise de sentimento para novas menções
    try {
      await supabase.functions.invoke('analyze-social-sentiment');
    } catch (error) {
      console.error('Erro ao disparar análise de sentimento:', error);
    }

    const success = totalInserted > 0;
    return new Response(
      JSON.stringify({ 
        success, 
        message: success ? 'Coleta de menções do Twitter concluída' : 'Nenhuma menção salva do Twitter',
        inserted: totalInserted,
        rate_limited: rateLimitHits > 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função fetch-twitter-mentions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});