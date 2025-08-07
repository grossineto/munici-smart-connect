import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TikTokVideoResponse {
  data?: {
    videos?: Array<{
      id: string;
      title?: string;
      video_description?: string;
      create_time: number;
      cover_image_url?: string;
      share_url?: string;
      duration?: number;
      height?: number;
      width?: number;
      like_count?: number;
      comment_count?: number;
      share_count?: number;
      view_count?: number;
    }>;
  };
  error?: {
    code: string;
    message: string;
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

    const tiktokAccessToken = Deno.env.get('TIKTOK_ACCESS_TOKEN');
    
    if (!tiktokAccessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'TIKTOK_ACCESS_TOKEN não configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter lista de políticos do request
    let politicians = [
      'João Dória',
      'Rodrigo Garcia', 
      'Fernando Haddad',
      'Bruno Covas',
      'Ricardo Nunes'
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

    console.log('Iniciando coleta de menções do TikTok...');

    for (const politician of politicians) {
      try {
        // Normalizar estrutura (string ou objeto)
        const politicianObj = typeof politician === 'string'
          ? { name: politician, keywords: [politician] }
          : politician;
        const politicianName: string = politicianObj.name || (typeof politician === 'string' ? politician : '');
        const keywords: string[] = Array.isArray(politicianObj.keywords) && politicianObj.keywords.length > 0
          ? politicianObj.keywords
          : [politicianName];

        console.log(`Processando TikTok para ${politicianName}...`);
        console.log('Palavras-chave:', keywords);
        
        // TikTok Research API - buscar vídeos por palavras-chave
        const searchUrl = `https://open.tiktokapis.com/v2/research/video/query/`;
        
        const searchPayload = {
          query: {
            and: [
              {
                operation: "IN",
                field_name: "keyword",
                field_values: keywords
              }
            ]
          },
          max_count: 20,
          start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // últimos 7 dias
          end_date: new Date().toISOString().split('T')[0]
        };

        const response = await fetch(searchUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tiktokAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(searchPayload)
        });

        if (!response.ok) {
          const body = await response.text();
          console.error(`Erro ao buscar vídeos do TikTok para ${politicianName}:`, response.status, body);
          return new Response(
            JSON.stringify({ success: false, error: `TikTok API error ${response.status}`, detail: body }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data: TikTokVideoResponse = await response.json();
        
        if (data.error) {
          console.error(`Erro na API do TikTok:`, data.error);
          continue;
        }

        if (!data.data?.videos || data.data.videos.length === 0) {
          console.log(`Nenhum vídeo encontrado no TikTok para ${politicianName}`);
          continue;
        }

        // Processar cada vídeo encontrado
        for (const video of data.data.videos) {
          const likeCount = video.like_count || 0;
          const commentCount = video.comment_count || 0;
          const shareCount = video.share_count || 0;
          const viewCount = video.view_count || 0;
          
          const engagementScore = likeCount + commentCount + shareCount;
          const reachEstimate = viewCount; // Views são uma boa métrica de alcance no TikTok

          // Combinar título e descrição para o conteúdo
          const content = [video.title, video.video_description]
            .filter(Boolean)
            .join(' - ');

          // Salvar no banco de dados
          const { error } = await supabase
            .from('social_mentions')
            .insert({
              platform: 'tiktok',
              politician_name: politicianName,
              content: content || `Vídeo mencionando ${politicianName}`,
              timestamp: new Date(video.create_time * 1000).toISOString(),
              url: video.share_url || `https://tiktok.com/@user/video/${video.id}`,
              mention_type: 'post',
              sentiment: 'neutral', // Será analisado pela função de IA
              reach_estimate: reachEstimate,
              engagement_score: engagementScore,
              raw_data: {
                video_id: video.id,
                like_count: likeCount,
                comment_count: commentCount,
                share_count: shareCount,
                view_count: viewCount,
                duration: video.duration,
                cover_image_url: video.cover_image_url,
                search_keywords: keywords
              }
            });

          if (error) {
            console.error('Erro ao salvar menção do TikTok:', error);
          } else {
            console.log(`Menção do TikTok salva para ${politicianName}: ${content.substring(0, 50)}...`);
          }
        }

        // Delay para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`Erro ao processar TikTok para ${typeof politician === 'string' ? politician : politician.name}:`, error);
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
        message: 'Coleta de menções do TikTok concluída',
        politicians_processed: politicians.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função fetch-tiktok-mentions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});