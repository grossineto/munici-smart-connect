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

    // Obter lista de políticos do request (ou usar lista padrão)
    let politicians = [
      'João Dória',
      'Rodrigo Garcia', 
      'Fernando Haddad',
      'Bruno Covas',
      'Ricardo Nunes'
    ];

    // Se houver políticos específicos no body da requisição, usar eles
    try {
      const body = await req.json();
      if (body.politicians && Array.isArray(body.politicians) && body.politicians.length > 0) {
        politicians = body.politicians;
        console.log('Usando políticos personalizados:', politicians);
      }
    } catch (error) {
      console.log('Usando lista padrão de políticos');
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
        
        // Montar query com todas as palavras-chave (OR) e filtros
        const keywordQuery = keywords
          .map(k => `"${k.replace(/\"/g, '\\\"')}"`)
          .join(' OR ');
        const searchQuery = `(${keywordQuery}) -is:retweet lang:pt`;
        const baseUrl = 'https://api.twitter.com/2/tweets/search/recent';

        let attempt = 0;
        const maxAttempts = 3;
        let fetched = false;
        let lastError: any = null;

        while (attempt < maxAttempts && !fetched) {
          const backoffMs = attempt === 0 ? 0 : 1000 * Math.pow(2, attempt); // 0, 2000, 4000
          if (backoffMs) {
            await new Promise(r => setTimeout(r, backoffMs));
          }

          const url = `${baseUrl}?query=${encodeURIComponent(searchQuery)}&max_results=10&tweet.fields=created_at,public_metrics,author_id&expansions=author_id`;
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${twitterBearerToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.status === 429) {
            rateLimitHits += 1;
            lastError = { status: 429, body: await response.text() };
            console.error(`Rate limit no Twitter para ${politicianName} (tentativa ${attempt + 1}/${maxAttempts})`);
            attempt += 1;
            continue;
          }

          if (!response.ok) {
            lastError = { status: response.status, body: await response.text() };
            console.error(`Erro ao buscar menções para ${politicianName}:`, response.status, lastError.body);
            // Para outros erros, não adianta retry imediato
            break;
          }

          const data: TwitterResponse = await response.json();
          if (!data.data || data.data.length === 0) {
            console.log(`Nenhuma menção encontrada para ${politicianName}`);
            fetched = true;
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
                  search_keywords: keywords
                }
              });

            if (error) {
              console.error('Erro ao salvar menção:', error);
            } else {
              totalInserted += 1;
            }
          }

          // Concluído para este político
          fetched = true;

          // Delay curto entre políticos para evitar rate limit
          await new Promise(resolve => setTimeout(resolve, 800));
        }

        if (!fetched && lastError) {
          console.error(`Falha final para ${politicianName}:`, lastError);
        }
        
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