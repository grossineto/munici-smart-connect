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

    for (const politician of politicians) {
      try {
        // Extrair nome do político (pode vir como objeto ou string)
        const politicianName = typeof politician === 'string' ? politician : politician.name;
        console.log(`Processando político: ${politicianName}`);
        
        // Buscar menções do político no Twitter
        const searchQuery = `"${politicianName}" -is:retweet lang:pt`;
        const searchUrl = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(searchQuery)}&max_results=10&tweet.fields=created_at,public_metrics,author_id&expansions=author_id`;

        const response = await fetch(searchUrl, {
          headers: {
            'Authorization': `Bearer ${twitterBearerToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error(`Erro ao buscar menções para ${politician}:`, response.status, await response.text());
          continue;
        }

        const data: TwitterResponse = await response.json();
        
        if (!data.data || data.data.length === 0) {
          console.log(`Nenhuma menção encontrada para ${politicianName}`);
          continue;
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

          // Salvar no banco de dados
          const { error } = await supabase
            .from('social_mentions')
            .insert({
              platform: 'twitter',
              politician_name: politicianName,
              content: tweet.text,
              timestamp: tweet.created_at,
              url: `https://twitter.com/i/status/${tweet.id}`,
              mention_type: 'mention',
              sentiment: 'neutral', // Será analisado pela função de IA
              reach_estimate: reachEstimate,
              engagement_score: engagementScore,
              raw_data: {
                tweet_id: tweet.id,
                author_id: tweet.author_id,
                public_metrics: tweet.public_metrics
              }
            });

          if (error) {
            console.error('Erro ao salvar menção:', error);
          } else {
            console.log(`Menção salva para ${politicianName}: ${tweet.text.substring(0, 50)}...`);
          }
        }

        // Delay para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Erro ao processar ${politicianName}:`, error);
      }
    }

    // Disparar análise de sentimento para novas menções
    try {
      await supabase.functions.invoke('analyze-social-sentiment');
    } catch (error) {
      console.error('Erro ao disparar análise de sentimento:', error);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Coleta de menções do Twitter concluída',
        politicians_processed: politicians.length 
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