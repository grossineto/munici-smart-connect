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
  console.log('🚀 FUNÇÃO CHAMADA - Iniciando teste');
  
  if (req.method === 'OPTIONS') {
    console.log('📋 Retornando CORS headers');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('✅ Iniciando coleta simplificada...');
    console.log('🔑 Verificando chaves API:', {
      perplexity: !!perplexityApiKey,
      openai: !!openaiApiKey,
      supabase: !!supabaseUrl
    });

    const processedArticles = [];

    // Teste direto com uma consulta simples
    console.log('📡 Fazendo teste Perplexity...');
    
    try {
      const testResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
              content: `Encontre 1 notícia recente sobre "Ricardo Nunes prefeito São Paulo" dos últimos 2 dias.
              
              Retorne EXATAMENTE neste formato:
              
              Título: [título da notícia]
              URL: [link completo]
              Fonte: [nome do portal]
              Resumo: [resumo em 2 linhas]`
            }
          ],
          temperature: 0.1,
          max_tokens: 300
        }),
      });

      console.log('📊 Status Perplexity:', testResponse.status);

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error('❌ Erro Perplexity:', errorText);
        throw new Error(`Perplexity falhou: ${errorText}`);
      }

      const perplexityData = await testResponse.json();
      const content = perplexityData.choices[0].message.content;
      
      console.log('📰 RESPOSTA COMPLETA PERPLEXITY:', content);

      // Parse simples
      const titleMatch = content.match(/Título:\s*(.+)/i);
      const urlMatch = content.match(/URL:\s*(https?:\/\/[^\s\n]+)/i);
      const sourceMatch = content.match(/Fonte:\s*(.+)/i);
      const resumoMatch = content.match(/Resumo:\s*(.+)/i);

      if (titleMatch && urlMatch) {
        const title = titleMatch[1].trim();
        const url = urlMatch[1].trim();
        const source = sourceMatch ? sourceMatch[1].trim() : 'Portal de Notícias';
        const resumo = resumoMatch ? resumoMatch[1].trim() : 'Resumo não disponível';

        console.log('✅ Notícia encontrada:', { title, url, source });

        // Verificar se já existe
        const { data: existing } = await supabase
          .from('news_articles')
          .select('id')
          .eq('url', url)
          .maybeSingle();

        if (existing) {
          console.log('📝 Notícia já existe, usando timestamp único');
          // Criar URL única para teste
          const uniqueUrl = `${url}?t=${Date.now()}`;
          
          // Inserir notícia com URL única
          const { data: article, error: articleError } = await supabase
            .from('news_articles')
            .insert({
              title: `${title} - TESTE ${new Date().toLocaleString('pt-BR')}`,
              url: uniqueUrl,
              author: source,
              content: resumo,
              published_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (articleError) {
            console.error('❌ Erro ao inserir notícia:', articleError);
          } else {
            console.log('✅ Notícia inserida:', article.id);

            // Teste OpenAI simples
            console.log('🤖 Testando OpenAI...');
            
            const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                    content: 'Você é um analista político especializado em São Paulo.'
                  },
                  {
                    role: 'user',
                    content: `Analise esta notícia para o prefeito Ricardo Nunes:
                    
                    Título: ${title}
                    Resumo: ${resumo}
                    
                    Retorne um JSON simples:
                    {
                      "sentiment_score": 0.5,
                      "urgency_level": "medium",
                      "relevance_score": 7,
                      "mentions_mayor": true,
                      "crisis_potential": false,
                      "keywords": ["ricardo", "nunes", "são paulo"],
                      "summary": "Resumo executivo em 1 frase",
                      "impact_analysis": "Análise detalhada do impacto municipal",
                      "recommended_action": "Ação recomendada",
                      "public_sentiment_prediction": "Como o público reagirá",
                      "communication_strategy": "Estratégia de comunicação",
                      "risk_assessment": "Avaliação de riscos",
                      "political_opportunity": "Oportunidade política",
                      "citizen_impact": "Impacto nos cidadãos",
                      "media_monitoring_focus": "Foco do monitoramento"
                    }`
                  }
                ],
                temperature: 0.2,
                max_tokens: 800
              }),
            });

            if (!openaiResponse.ok) {
              console.error('❌ Erro OpenAI:', await openaiResponse.text());
            } else {
              const openaiData = await openaiResponse.json();
              const analysisText = openaiData.choices[0].message.content;
              
              console.log('🤖 RESPOSTA OPENAI:', analysisText);
              
              try {
                const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
                const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
                
                console.log('📊 Análise parseada:', analysis);

                // Inserir análise completa
                const { error: analysisError } = await supabase
                  .from('news_analysis')
                  .insert({
                    article_id: article.id,
                    sentiment_score: analysis.sentiment_score || 0.5,
                    urgency_level: analysis.urgency_level || 'medium',
                    relevance_score: analysis.relevance_score || 7,
                    mentions_mayor: analysis.mentions_mayor || false,
                    mentions_city: true,
                    crisis_potential: analysis.crisis_potential || false,
                    keywords: analysis.keywords || ['teste'],
                    summary: analysis.summary || 'Análise teste',
                    impact_analysis: analysis.impact_analysis || 'Análise de impacto teste',
                    recommended_action: analysis.recommended_action || 'Ação teste',
                    public_sentiment_prediction: analysis.public_sentiment_prediction,
                    communication_strategy: analysis.communication_strategy,
                    risk_assessment: analysis.risk_assessment,
                    related_municipal_areas: ['Secretaria de Comunicação'],
                    media_monitoring_focus: analysis.media_monitoring_focus,
                    citizen_impact: analysis.citizen_impact,
                    political_opportunity: analysis.political_opportunity
                  });

                if (analysisError) {
                  console.error('❌ Erro ao inserir análise:', analysisError);
                } else {
                  console.log('✅ Análise inserida com sucesso!');
                  
                  processedArticles.push({
                    title,
                    url: uniqueUrl,
                    source,
                    analysis: analysis.summary
                  });
                }
              } catch (parseError) {
                console.error('❌ Erro ao parsear análise:', parseError);
              }
            }
          }
        } else {
          console.log('🆕 Notícia nova, processando...');
          // Processar normalmente se não existir
        }
      } else {
        console.log('❌ Não conseguiu extrair notícia da resposta Perplexity');
      }

    } catch (perplexityError) {
      console.error('❌ Falha total Perplexity:', perplexityError);
    }

    console.log('🎉 TESTE CONCLUÍDO');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Teste concluído - ${processedArticles.length} notícia processada`,
        articles: processedArticles,
        debug: 'Função executada com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        debug: 'Falha na execução'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});