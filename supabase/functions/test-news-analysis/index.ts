import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Testing news analysis with sample articles...');

    // Sample articles for testing
    const testArticles = [
      {
        title: "Prefeito de São Paulo Ricardo Nunes anuncia nova linha de metrô para zona sul",
        content: "O prefeito de São Paulo, Ricardo Nunes, anunciou hoje o início das obras da nova linha de metrô que ligará a zona sul ao centro da cidade. O projeto prevê investimento de R$ 8 bilhões e deve ser concluído em 5 anos. 'Esta é uma obra fundamental para melhorar a mobilidade urbana dos paulistanos', disse o prefeito durante evento na Prefeitura de São Paulo. A obra beneficiará mais de 2 milhões de pessoas.",
        url: "https://test.com/sp-article1"
      },
      {
        title: "Crise na saúde: São Paulo enfrenta falta de médicos em UBS da periferia",
        content: "Moradores da zona leste de São Paulo denunciam a falta de médicos em várias Unidades Básicas de Saúde. A situação tem gerado críticas à gestão do prefeito Ricardo Nunes. O vereador Carlos Santos afirmou que 'a prefeitura está negligenciando a saúde da população mais vulnerável'. Manifestantes se reuniram em frente à Prefeitura pedindo soluções urgentes. A gestão Ricardo Nunes ainda não apresentou um plano para resolver a crise.",
        url: "https://test.com/sp-article2"
      },
      {
        title: "São Paulo lidera ranking de cidades mais inovadoras do Brasil",
        content: "A cidade de São Paulo conquistou o primeiro lugar no ranking nacional de inovação urbana, segundo estudo divulgado hoje. O resultado é atribuído às políticas de digitalização e modernização implementadas pela atual gestão. O prefeito Ricardo Nunes comemorou o resultado: 'São Paulo está se consolidando como a capital da inovação no país'. A prefeitura de São Paulo investiu R$ 500 milhões em tecnologia nos últimos dois anos.",
        url: "https://test.com/sp-article3"
      }
    ];

    const results = [];

    // Get first news source for testing
    const { data: sources } = await supabase
      .from('news_sources')
      .select('*')
      .limit(1);

    const testSource = sources?.[0];
    if (!testSource) {
      throw new Error('No news source found for testing');
    }

    for (const testArticle of testArticles) {
      try {
        // First check if article already exists
        const { data: existingArticle } = await supabase
          .from('news_articles')
          .select('id')
          .eq('url', testArticle.url)
          .maybeSingle();

        let savedArticle;
        if (existingArticle) {
          console.log(`Article already exists: ${testArticle.title}`);
          savedArticle = existingArticle;
        } else {
          // Save new test article to database
          const { data: newArticle, error: insertError } = await supabase
            .from('news_articles')
            .insert({
              source_id: testSource.id,
              title: testArticle.title,
              content: testArticle.content,
              url: testArticle.url,
              published_at: new Date().toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error saving test article:', insertError);
            continue;
          }
          savedArticle = newArticle;
          console.log(`Saved new test article: ${testArticle.title}`);
        }

        // Analyze with AI
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
                content: `Você é um analista especializado em monitoramento de notícias para gestão pública municipal de São Paulo. 
                Analise a notícia procurando especificamente por menções a:
                - "prefeito de são paulo", "Ricardo Nunes", "prefeito ricardo nunes", "prefeitura de são paulo"
                - Palavras relacionadas à gestão municipal, políticas públicas
                - Situações que possam afetar a imagem do prefeito ou da prefeitura
                
                Retorne APENAS um JSON válido com esta estrutura:
                {
                  "sentiment_score": number(-1 a 1),
                  "urgency_level": "low|medium|high|critical",
                  "relevance_score": number(0 a 1),
                  "keywords": ["palavra1", "palavra2"],
                  "summary": "resumo em até 150 caracteres",
                  "impact_analysis": "análise do impacto para a gestão municipal",
                  "recommended_action": "ação recomendada",
                  "mentions_mayor": boolean,
                  "mentions_city": boolean,
                  "crisis_potential": boolean
                }`
              },
              {
                role: 'user',
                content: `Título: ${testArticle.title}\n\nConteúdo: ${testArticle.content}`
              }
            ],
            temperature: 0.3,
            max_tokens: 1000
          }),
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          const analysisText = analysisData.choices[0]?.message?.content;
          
          console.log(`AI Response for ${testArticle.title}:`, analysisText);
          
          try {
            const analysis = JSON.parse(analysisText);
            
            // Check if analysis already exists
            const { data: existingAnalysis } = await supabase
              .from('news_analysis')
              .select('id')
              .eq('article_id', savedArticle.id)
              .maybeSingle();

            if (!existingAnalysis) {
              // Save analysis
              const { error: analysisError } = await supabase
                .from('news_analysis')
                .insert({
                  article_id: savedArticle.id,
                  ...analysis
                });

              if (analysisError) {
                console.error('Error saving analysis:', analysisError);
              } else {
                console.log(`Analysis saved for: ${testArticle.title}`);
              }
            } else {
              console.log(`Analysis already exists for: ${testArticle.title}`);
            }

            // Create alert if high urgency or crisis potential
            if (analysis.urgency_level === 'high' || analysis.urgency_level === 'critical' || analysis.crisis_potential) {
              const { data: existingAlert } = await supabase
                .from('news_alerts')
                .select('id')
                .eq('article_id', savedArticle.id)
                .maybeSingle();

              if (!existingAlert) {
                const { error: alertError } = await supabase
                  .from('news_alerts')
                  .insert({
                    article_id: savedArticle.id,
                    alert_type: analysis.crisis_potential ? 'crisis' : 'mention',
                    severity: analysis.urgency_level,
                    title: `Alerta: ${testArticle.title}`,
                    message: analysis.summary
                  });

                if (alertError) {
                  console.error('Error creating alert:', alertError);
                } else {
                  console.log(`Alert created for: ${testArticle.title}`);
                }
              }
            }
            results.push({
              article: testArticle.title,
              analysis: analysis,
              alert_created: analysis.urgency_level === 'high' || analysis.urgency_level === 'critical' || analysis.crisis_potential
            });

            console.log(`Analysis completed for: ${testArticle.title}`);
            console.log(`Urgency: ${analysis.urgency_level}, Mentions Mayor: ${analysis.mentions_mayor}, Sentiment: ${analysis.sentiment_score}`);

          } catch (parseError) {
            console.error('Error parsing AI analysis:', parseError);
            console.error('Raw AI response:', analysisText);
          }
        } else {
          console.error(`AI Analysis failed for ${testArticle.title}:`, analysisResponse.status, analysisResponse.statusText);
        }

        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (articleError) {
        console.error(`Error processing test article: ${testArticle.title}`, articleError);
      }
    }

    console.log(`Test completed. Processed ${results.length} articles`);

    return new Response(JSON.stringify({
      success: true,
      processed_articles: results.length,
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in test analysis:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});