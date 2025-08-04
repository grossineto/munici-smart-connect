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

    // Buscar notícias em tempo real sobre São Paulo e prefeito
    const newsQueries = [
      'São Paulo prefeito Ricardo Nunes últimas notícias',
      'prefeitura São Paulo política decisões recentes',
      'São Paulo cidade problemas urbanos infraestrutura',
      'São Paulo transporte público metrô ônibus',
      'São Paulo segurança pública criminalidade'
    ];

    const processedArticles = [];

    for (const query of newsQueries) {
      console.log(`Searching for: ${query}`);
      
      // Buscar notícias com Perplexity
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente especializado em encontrar notícias recentes. Forneça informações detalhadas sobre as notícias mais recentes incluindo título, fonte, data, URL e resumo do conteúdo.'
            },
            {
              role: 'user',
              content: `Encontre as 3 notícias mais recentes sobre: ${query}. Para cada notícia, forneça: título, fonte/veículo, data de publicação, URL, e um resumo detalhado do conteúdo. Foque em veículos brasileiros como G1, Folha, Estadão, UOL, R7, Band, SBT, Record.`
            }
          ],
          temperature: 0.2,
          max_tokens: 2000,
          search_domain_filter: ['g1.globo.com', 'folha.uol.com.br', 'estadao.com.br', 'uol.com.br', 'r7.com', 'band.uol.com.br'],
          search_recency_filter: 'day'
        }),
      });

      if (!perplexityResponse.ok) {
        console.error('Erro na API Perplexity:', await perplexityResponse.text());
        continue;
      }

      const perplexityData = await perplexityResponse.json();
      const newsContent = perplexityData.choices[0].message.content;
      
      console.log('Conteúdo encontrado:', newsContent.substring(0, 500) + '...');

      // Extrair URLs e informações das notícias usando regex
      const urlRegex = /https?:\/\/[^\s\)]+/g;
      const urls = newsContent.match(urlRegex) || [];
      
      // Processar cada URL encontrada
      for (const url of urls.slice(0, 3)) { // Limitar a 3 por query
        try {
          // Verificar se a notícia já existe
          const { data: existingArticle } = await supabase
            .from('news_articles')
            .select('id')
            .eq('url', url)
            .single();

          if (existingArticle) {
            console.log('Artigo já existe:', url);
            continue;
          }

          // Extrair informações básicas da notícia do conteúdo
          const lines = newsContent.split('\n');
          const urlLine = lines.find(line => line.includes(url));
          const urlIndex = lines.indexOf(urlLine || '');
          
          let title = 'Notícia encontrada via Perplexity';
          let source = 'Fonte não identificada';
          
          // Tentar extrair título e fonte das linhas próximas
          for (let i = Math.max(0, urlIndex - 3); i <= Math.min(lines.length - 1, urlIndex + 3); i++) {
            const line = lines[i]?.trim();
            if (line && line.length > 20 && !line.includes('http') && line.includes(':')) {
              title = line.split(':')[1]?.trim() || title;
            }
            if (line && (line.includes('G1') || line.includes('Folha') || line.includes('Estadão') || line.includes('UOL') || line.includes('R7'))) {
              source = line;
            }
          }

          // Determinar a fonte baseada na URL
          if (url.includes('g1.globo.com')) source = 'G1';
          else if (url.includes('folha.uol.com.br')) source = 'Folha de S.Paulo';
          else if (url.includes('estadao.com.br')) source = 'O Estado de S. Paulo';
          else if (url.includes('uol.com.br')) source = 'UOL';
          else if (url.includes('r7.com')) source = 'R7';
          else if (url.includes('band.uol.com.br')) source = 'Band';

          // Salvar artigo
          const { data: article, error: articleError } = await supabase
            .from('news_articles')
            .insert({
              title: title.length > 10 ? title : `Notícia sobre ${query}`,
              url: url,
              content: newsContent.substring(
                Math.max(0, newsContent.indexOf(url) - 200),
                Math.min(newsContent.length, newsContent.indexOf(url) + 500)
              ),
              author: source,
              published_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (articleError) {
            console.error('Erro ao salvar artigo:', articleError);
            continue;
          }

          console.log('Artigo salvo:', article.title);

          // Analisar com OpenAI
          const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: `Você é um analista especializado em gestão municipal de São Paulo. Analise a notícia e forneça:
1. Sentimento (positivo/negativo/neutro)
2. Relevância para gestão municipal (0-10)
3. Nível de urgência (baixo/médio/alto)
4. Se menciona o prefeito ou cidade
5. Potencial de crise
6. Palavras-chave (máximo 5)
7. Resumo executivo
8. Análise de impacto
9. Ação recomendada

Responda em formato JSON válido.`
                },
                {
                  role: 'user',
                  content: `Título: ${article.title}\nURL: ${article.url}\nConteúdo: ${article.content}`
                }
              ],
              temperature: 0.3,
            }),
          });

          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            let analysis;
            
            try {
              analysis = JSON.parse(analysisData.choices[0].message.content);
            } catch {
              analysis = {
                sentimento: 'neutro',
                relevancia: 5,
                urgencia: 'medio',
                menciona_prefeito: false,
                menciona_cidade: true,
                potencial_crise: false,
                palavras_chave: ['São Paulo'],
                resumo: analysisData.choices[0].message.content.substring(0, 200),
                impacto: 'Análise em andamento',
                acao_recomendada: 'Monitorar desenvolvimentos'
              };
            }

            // Salvar análise
            const { data: savedAnalysis, error: analysisError } = await supabase
              .from('news_analysis')
              .insert({
                article_id: article.id,
                sentiment_score: analysis.sentimento === 'positivo' ? 0.7 : analysis.sentimento === 'negativo' ? -0.7 : 0,
                relevance_score: analysis.relevancia || 5,
                urgency_level: analysis.urgencia || 'medium',
                mentions_mayor: analysis.menciona_prefeito || false,
                mentions_city: analysis.menciona_cidade || true,
                crisis_potential: analysis.potencial_crise || false,
                keywords: analysis.palavras_chave || ['São Paulo'],
                summary: analysis.resumo || 'Resumo não disponível',
                impact_analysis: analysis.impacto || 'Análise em andamento',
                recommended_action: analysis.acao_recomendada || 'Monitorar'
              })
              .select()
              .single();

            if (analysisError) {
              console.error('Erro ao salvar análise:', analysisError);
            } else {
              console.log('Análise salva para:', article.title);

              // Criar alerta se necessário
              if (analysis.urgencia === 'alto' || analysis.potencial_crise) {
                await supabase
                  .from('news_alerts')
                  .insert({
                    article_id: article.id,
                    alert_type: analysis.potencial_crise ? 'crisis' : 'urgent',
                    title: `Alerta: ${article.title}`,
                    message: analysis.resumo || 'Notícia requer atenção imediata',
                    severity: analysis.urgencia === 'alto' ? 'high' : 'medium'
                  });
              }
            }
          }

          processedArticles.push({
            title: article.title,
            url: article.url,
            source: source
          });

        } catch (error) {
          console.error('Erro ao processar URL:', url, error);
        }
      }

      // Pequena pausa entre queries
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processadas ${processedArticles.length} notícias em tempo real`,
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