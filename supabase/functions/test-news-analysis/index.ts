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
        title: "Prefeita de Bauru Suéllen Silva Rosim anuncia nova obra de infraestrutura",
        content: "A prefeita de Bauru, Suéllen Silva Rosim, anunciou hoje o início das obras de revitalização do centro da cidade. O projeto prevê investimento de R$ 50 milhões e deve ser concluído em 18 meses. 'Esta é uma obra importante para melhorar a qualidade de vida dos bauruenses', disse a prefeita durante coletiva de imprensa realizada na Prefeitura de Bauru.",
        url: "https://test.com/article1"
      },
      {
        title: "Moradores de Bauru reclamam de falta de água em bairros da periferia",
        content: "Moradores de vários bairros periféricos de Bauru estão há três dias sem água. A situação tem gerado protestos e críticas à gestão da prefeita Suéllen Rosim. O vereador João Silva criticou a falta de planejamento da prefeitura. 'É inadmissível que em pleno século XXI tenhamos famílias sem água', declarou. A prefeitura ainda não se manifestou sobre o problema.",
        url: "https://test.com/article2"
      },
      {
        title: "Bauru registra aumento na arrecadação de impostos no primeiro semestre",
        content: "A cidade de Bauru registrou crescimento de 15% na arrecadação de impostos no primeiro semestre deste ano, segundo dados da Secretaria de Finanças. O bom resultado é atribuído às políticas de modernização fiscal implementadas pela gestão atual. A prefeita Suéllen Silva Rosim comemorou os números e disse que os recursos serão aplicados em melhorias para a população.",
        url: "https://test.com/article3"
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
        // Save test article to database
        const { data: savedArticle, error: insertError } = await supabase
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

        console.log(`Saved test article: ${testArticle.title}`);

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
                content: `Você é um analista especializado em monitoramento de notícias para gestão pública municipal de Bauru. 
                Analise a notícia procurando especificamente por menções a:
                - "prefeita de bauru", "Suéllen Silva Rosim", "Suéllen Rosim", "prefeitura de bauru"
                - Palavras relacionadas à gestão municipal, políticas públicas
                - Situações que possam afetar a imagem da prefeita ou da prefeitura
                
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
          
          try {
            const analysis = JSON.parse(analysisText);
            
            // Save analysis
            await supabase
              .from('news_analysis')
              .insert({
                article_id: savedArticle.id,
                ...analysis
              });

            // Create alert if high urgency or crisis potential
            if (analysis.urgency_level === 'high' || analysis.urgency_level === 'critical' || analysis.crisis_potential) {
              await supabase
                .from('news_alerts')
                .insert({
                  article_id: savedArticle.id,
                  alert_type: analysis.crisis_potential ? 'crisis' : 'mention',
                  severity: analysis.urgency_level,
                  title: `Alerta: ${testArticle.title}`,
                  message: analysis.summary
                });
            }

            results.push({
              article: testArticle.title,
              analysis: analysis,
              alert_created: analysis.urgency_level === 'high' || analysis.urgency_level === 'critical' || analysis.crisis_potential
            });

            console.log(`Analysis completed for: ${testArticle.title}`);
            console.log(`Urgency: ${analysis.urgency_level}, Mentions Mayor: ${analysis.mentions_mayor}`);

          } catch (parseError) {
            console.error('Error parsing AI analysis:', parseError);
          }
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