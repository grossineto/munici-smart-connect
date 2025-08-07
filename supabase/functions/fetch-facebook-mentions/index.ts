import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FacebookPostResponse {
  data?: Array<{
    id: string;
    message?: string;
    created_time: string;
    likes?: {
      summary: {
        total_count: number;
      };
    };
    comments?: {
      summary: {
        total_count: number;
      };
    };
    shares?: {
      count: number;
    };
    permalink_url?: string;
  }>;
  paging?: {
    next?: string;
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

    const facebookAccessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
    const facebookPageId = Deno.env.get('FACEBOOK_PAGE_ID');
    
    if (!facebookAccessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'FACEBOOK_ACCESS_TOKEN não configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!facebookPageId) {
      return new Response(
        JSON.stringify({ success: false, error: 'FACEBOOK_PAGE_ID não configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter lista de políticos do request
    let politicians = [
      { name: 'Ricardo Nunes', keywords: ['Ricardo Nunes', 'prefeito São Paulo'] }
    ];

    try {
      const body = await req.json();
      if (body.politicians && Array.isArray(body.politicians) && body.politicians.length > 0) {
        politicians = body.politicians;
        console.log('Usando políticos personalizados:', politicians);
      }
    } catch (error) {
      console.log('Usando lista padrão de políticos');
    }

    console.log('Iniciando coleta de menções do Facebook...');

    for (const politician of politicians) {
      try {
        console.log(`Processando Facebook para ${politician.name || politician}...`);
        
        // Facebook Graph API - buscar posts da página
        const fields = 'id,message,created_time,likes.summary(true),comments.summary(true),shares,permalink_url';
        const searchUrl = `https://graph.facebook.com/v18.0/${facebookPageId}/posts?fields=${fields}&access_token=${facebookAccessToken}&limit=50`;

        const response = await fetch(searchUrl);

        if (!response.ok) {
          const body = await response.text();
          console.error(`Erro ao buscar posts do Facebook:`, response.status, body);
          return new Response(
            JSON.stringify({ success: false, error: `Facebook API error ${response.status}`, detail: body }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data: FacebookPostResponse = await response.json();
        
        if (!data.data || data.data.length === 0) {
          console.log(`Nenhum post encontrado no Facebook`);
          continue;
        }

        // Definir palavras-chave para busca
        const keywords = politician.keywords || [politician.name || politician];
        console.log(`Buscando por palavras-chave:`, keywords);

        // Filtrar posts que mencionam o político (usando qualquer uma das palavras-chave)
        const relevantPosts = data.data.filter(post => {
          if (!post.message) return false;
          const content = post.message.toLowerCase();
          return keywords.some(keyword => content.includes(keyword.toLowerCase()));
        });

        // Processar cada post relevante
        for (const post of relevantPosts) {
          const likeCount = post.likes?.summary.total_count || 0;
          const commentCount = post.comments?.summary.total_count || 0;
          const shareCount = post.shares?.count || 0;
          
          const engagementScore = likeCount + commentCount + shareCount;
          const reachEstimate = engagementScore * 20; // Facebook tem algoritmo de alcance

          // Salvar no banco de dados
          const { error } = await supabase
            .from('social_mentions')
            .insert({
              platform: 'facebook',
              politician_name: politician.name || politician,
              content: post.message || '',
              timestamp: post.created_time,
              url: post.permalink_url || `https://facebook.com/${post.id}`,
              mention_type: 'post',
              sentiment: 'neutral', // Será analisado pela função de IA
              reach_estimate: reachEstimate,
              engagement_score: engagementScore,
              raw_data: {
                post_id: post.id,
                like_count: likeCount,
                comment_count: commentCount,
                share_count: shareCount
              }
            });

          if (error) {
            console.error('Erro ao salvar menção do Facebook:', error);
          } else {
            console.log(`Menção do Facebook salva para ${politician.name || politician}: ${post.message?.substring(0, 50)}...`);
          }
        }

        // Delay para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Erro ao processar Facebook para ${politician.name || politician}:`, error);
      }
    }

    // Disparar análise de sentimento para novas menções
    try {
      await supabase.functions.invoke('analyze-social-sentiment');
    } catch (error) {
      console.error('Erro ao disparar análise de sentimento:', error);
    }

    const success = true; // execução bem-sucedida se não houve erro fatal
    return new Response(
      JSON.stringify({ 
        success, 
        message: 'Coleta de menções do Facebook concluída',
        politicians_processed: politicians.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função fetch-facebook-mentions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});