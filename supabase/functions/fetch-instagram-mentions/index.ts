import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramMediaResponse {
  data?: Array<{
    id: string;
    caption?: string;
    media_type: string;
    timestamp: string;
    like_count?: number;
    comments_count?: number;
    media_url?: string;
    permalink: string;
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

    const instagramAccessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN');
    if (!instagramAccessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'INSTAGRAM_ACCESS_TOKEN não configurado' }),
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

    console.log('Iniciando coleta de menções do Instagram...');

    for (const politician of politicians) {
      try {
        console.log(`Processando Instagram para ${politician.name || politician}...`);
        
        // Instagram Basic Display API - buscar posts recentes
        // Nota: Para menções específicas, seria necessário Instagram Business API
        const fields = 'id,caption,media_type,timestamp,like_count,comments_count,permalink';
        const searchUrl = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${instagramAccessToken}&limit=50`;

        const response = await fetch(searchUrl);

        if (!response.ok) {
          const body = await response.text();
          console.error(`Erro ao buscar posts do Instagram:`, response.status, body);
          return new Response(
            JSON.stringify({ success: false, error: `Instagram API error ${response.status}`, detail: body }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data: InstagramMediaResponse = await response.json();
        
        if (!data.data || data.data.length === 0) {
          console.log(`Nenhum post encontrado no Instagram`);
          continue;
        }

        // Definir palavras-chave para busca
        const keywords = politician.keywords || [politician.name || politician];
        console.log(`Buscando por palavras-chave:`, keywords);

        // Filtrar posts que mencionam o político (usando qualquer uma das palavras-chave)
        const relevantPosts = data.data.filter(post => {
          if (!post.caption) return false;
          const content = post.caption.toLowerCase();
          return keywords.some(keyword => content.includes(keyword.toLowerCase()));
        });

        // Processar cada post relevante
        for (const post of relevantPosts) {
          const engagementScore = (post.like_count || 0) + (post.comments_count || 0);
          const reachEstimate = engagementScore * 15; // Instagram tem maior alcance orgânico

          // Salvar no banco de dados
          const { error } = await supabase
            .from('social_mentions')
            .insert({
              platform: 'instagram',
              politician_name: politician.name || politician,
              content: post.caption || '',
              timestamp: post.timestamp,
              url: post.permalink,
              mention_type: 'post',
              sentiment: 'neutral', // Será analisado pela função de IA
              reach_estimate: reachEstimate,
              engagement_score: engagementScore,
              raw_data: {
                post_id: post.id,
                media_type: post.media_type,
                like_count: post.like_count,
                comments_count: post.comments_count,
                media_url: post.media_url
              }
            });

          if (error) {
            console.error('Erro ao salvar menção do Instagram:', error);
          } else {
            console.log(`Menção do Instagram salva para ${politician.name || politician}: ${post.caption?.substring(0, 50)}...`);
          }
        }

        // Delay para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Erro ao processar Instagram para ${politician}:`, error);
      }
    }

    // Disparar análise de sentimento para novas menções
    try {
      await supabase.functions.invoke('analyze-social-sentiment');
    } catch (error) {
      console.error('Erro ao disparar análise de sentimento:', error);
    }

    const success = true; // se chegou até aqui sem retornar erro, consideramos execução bem-sucedida
    return new Response(
      JSON.stringify({ 
        success, 
        message: 'Coleta de menções do Instagram concluída',
        politicians_processed: politicians.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função fetch-instagram-mentions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});