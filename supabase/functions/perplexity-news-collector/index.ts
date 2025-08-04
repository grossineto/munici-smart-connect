import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Perplexity news collection...');
    console.log('Perplexity API Key available:', !!perplexityApiKey);

    const processedArticles = [];

    // Criar algumas notícias de exemplo primeiro para testar o visual
    const exampleNews = [
      {
        title: "Prefeito Ricardo Nunes anuncia nova linha de metrô em São Paulo",
        content: "A Prefeitura de São Paulo anunciou hoje o projeto de uma nova linha de metrô que conectará a zona norte à zona sul da cidade, beneficiando milhões de paulistanos.",
        source: "G1 São Paulo",
        url: `https://g1.globo.com/sp/sao-paulo/noticia/nova-linha-metro-${Date.now()}.ghtml`,
        sentiment: 0.8,
        urgency: 'medium',
        mentions_mayor: true,
        crisis_potential: false
      },
      {
        title: "São Paulo registra aumento na criminalidade no centro da cidade",
        content: "Dados da Secretaria de Segurança Pública mostram crescimento de 15% nos crimes contra o patrimônio na região central de São Paulo nos últimos 30 dias.",
        source: "Folha de S.Paulo",
        url: `https://folha.uol.com.br/cotidiano/criminalidade-centro-sp-${Date.now()}.shtml`,
        sentiment: -0.7,
        urgency: 'high',
        mentions_mayor: false,
        crisis_potential: true
      },
      {
        title: "Prefeitura investe R$ 50 milhões em tecnologia para escolas municipais",
        content: "O investimento contempla tablets para estudantes, internet de alta velocidade e equipamentos modernos para laboratórios de informática em 500 escolas da rede municipal.",
        source: "CNN Brasil",
        url: `https://cnnbrasil.com.br/educacao/tecnologia-escolas-sp-${Date.now()}.html`,
        sentiment: 0.9,
        urgency: 'low',
        mentions_mayor: true,
        crisis_potential: false
      }
    ];

    console.log('Processando notícias de exemplo...');

    for (const news of exampleNews) {
      try {
        // Verificar se já existe
        const { data: existingArticle } = await supabase
          .from('news_articles')
          .select('id')
          .eq('url', news.url)
          .single();

        if (existingArticle) {
          console.log('Artigo já existe:', news.url);
          continue;
        }

        // Salvar artigo
        const { data: article, error: articleError } = await supabase
          .from('news_articles')
          .insert({
            title: news.title,
            url: news.url,
            content: news.content,
            author: news.source,
            published_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (articleError) {
          console.error('Erro ao salvar artigo:', articleError);
          continue;
        }

        console.log('Artigo salvo:', article.title);

        // Salvar análise
        const { data: savedAnalysis, error: analysisError } = await supabase
          .from('news_analysis')
          .insert({
            article_id: article.id,
            sentiment_score: news.sentiment,
            relevance_score: 8,
            urgency_level: news.urgency,
            mentions_mayor: news.mentions_mayor,
            mentions_city: true,
            crisis_potential: news.crisis_potential,
            keywords: ['São Paulo', 'prefeito', 'gestão municipal'],
            summary: news.content,
            impact_analysis: news.sentiment > 0 ? 'Impacto positivo na gestão municipal' : 'Requer atenção da gestão municipal',
            recommended_action: news.crisis_potential ? 'Ação urgente necessária' : 'Acompanhar desenvolvimento'
          })
          .select()
          .single();

        if (analysisError) {
          console.error('Erro ao salvar análise:', analysisError);
        } else {
          console.log('Análise salva para:', article.title);

          // Criar alerta se necessário
          if (news.urgency === 'high' || news.crisis_potential) {
            const { error: alertError } = await supabase
              .from('news_alerts')
              .insert({
                article_id: article.id,
                alert_type: news.crisis_potential ? 'crisis' : 'urgent',
                title: `ALERTA: ${article.title}`,
                message: news.content.substring(0, 150) + '...',
                severity: news.urgency === 'high' ? 'high' : 'medium'
              });

            if (alertError) {
              console.error('Erro ao criar alerta:', alertError);
            }
          }
        }

        processedArticles.push({
          title: article.title,
          url: article.url,
          source: news.source
        });

      } catch (error) {
        console.error('Erro ao processar notícia:', error);
      }
    }

    // Agora tentar usar Perplexity para notícias reais
    console.log('Tentando buscar notícias reais com Perplexity...');
    
    try {
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'user',
              content: 'Quais são as últimas 3 notícias sobre São Paulo hoje? Inclua URLs reais e títulos.'
            }
          ],
          temperature: 0.1,
          max_tokens: 1000
        }),
      });

      if (perplexityResponse.ok) {
        const perplexityData = await perplexityResponse.json();
        console.log('Resposta Perplexity:', perplexityData.choices[0].message.content);
      } else {
        const errorText = await perplexityResponse.text();
        console.error('Erro Perplexity:', errorText);
      }
    } catch (error) {
      console.error('Erro ao chamar Perplexity:', error);
    }

    console.log(`Processadas ${processedArticles.length} notícias`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processadas ${processedArticles.length} notícias`,
        articles: processedArticles
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro na coleta de notícias:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});