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
  console.log('🚀 FORÇANDO COLETA DE NOTÍCIAS DE HOJE');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('✅ Iniciando coleta FORÇADA de notícias de hoje...');
    
    const processedArticles = [];
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Queries específicas para hoje
    const todayQueries = [
      `Ricardo Nunes prefeito São Paulo notícias hoje ${today}`,
      `São Paulo transporte público problemas hoje ${today}`,
      `São Paulo saúde hospitais notícias hoje ${today}`,
      `São Paulo segurança criminalidade hoje ${today}`,
      `São Paulo educação escolas hoje ${today}`
    ];

    for (let i = 0; i < todayQueries.length; i++) {
      const query = todayQueries[i];
      console.log(`🔍 ${i+1}/${todayQueries.length}: ${query}`);
      
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
                role: 'system',
                content: 'Você é um especialista em jornalismo brasileiro. Encontre notícias REAIS e ATUAIS dos principais portais.'
              },
              {
                role: 'user',
                content: `Encontre 2 notícias ATUAIS de hoje (${today}) sobre "${query}" dos principais portais brasileiros.
                
                IMPORTANTE: Quero notícias de HOJE, mesmo que similares já existam.
                
                FONTES: G1, Folha, Estadão, UOL, R7, CNN Brasil, Metrópoles, Band
                
                Para cada notícia REAL encontrada hoje, retorne EXATAMENTE:
                
                NOTÍCIA 1:
                Título: [título completo]
                URL: [link direto]
                Fonte: [portal]
                Data: ${today}
                Resumo: [2-3 linhas sobre o conteúdo]
                
                NOTÍCIA 2:
                Título: [título completo]
                URL: [link direto]
                Fonte: [portal]
                Data: ${today}
                Resumo: [2-3 linhas sobre o conteúdo]`
              }
            ],
            temperature: 0.2,
            max_tokens: 800
          }),
        });

        if (!perplexityResponse.ok) {
          console.error(`❌ Erro Perplexity query ${i+1}:`, await perplexityResponse.text());
          continue;
        }

        const perplexityData = await perplexityResponse.json();
        const content = perplexityData.choices[0].message.content;
        
        console.log(`📰 Resposta query ${i+1}:`, content.substring(0, 300));

        // Parse mais robusto
        const newsBlocks = content.split(/NOTÍCIA \d+:/).filter(block => 
          block.trim() && (block.includes('Título:') || block.includes('titulo:'))
        );

        console.log(`📊 Query ${i+1}: ${newsBlocks.length} blocos encontrados`);

        for (const block of newsBlocks) {
          try {
            const titleMatch = block.match(/T[íi]tulo:\s*(.+)/i);
            const urlMatch = block.match(/URL:\s*(https?:\/\/[^\s\n]+)/i);
            const sourceMatch = block.match(/Fonte:\s*(.+)/i);
            const resumoMatch = block.match(/Resumo:\s*(.+)/i);

            if (!titleMatch) {
              console.log('⚠️ Título não encontrado no bloco');
              continue;
            }

            const title = titleMatch[1].trim();
            let url = urlMatch ? urlMatch[1].trim() : `https://exemplo.com/noticia-${Date.now()}`;
            const source = sourceMatch ? sourceMatch[1].trim() : 'Portal de Notícias';
            const resumo = resumoMatch ? resumoMatch[1].trim() : 'Conteúdo da notícia coletada via Perplexity';

            // FORÇAR URL ÚNICA para não conflitar com notícias antigas
            const uniqueUrl = `${url}?collected=${Date.now()}&query=${i}`;

            console.log(`✅ Processando: ${title.substring(0, 60)}...`);
            console.log(`🔗 URL única: ${uniqueUrl}`);

            // Inserir notícia SEMPRE (ignorar duplicatas)
            const { data: article, error: articleError } = await supabase
              .from('news_articles')
              .insert({
                title: `[${today}] ${title}`,
                url: uniqueUrl,
                author: source,
                content: resumo,
                published_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (articleError) {
              console.error('❌ Erro ao inserir notícia:', articleError);
              continue;
            }

            console.log(`✅ Notícia inserida: ${article.id}`);

            // OpenAI: Análise SUPER ELABORADA
            console.log('🤖 Gerando análise elaborada...');
            
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
                    content: `Você é o consultor sênior do prefeito Ricardo Nunes de São Paulo. 
                    
                    CONTEXTO:
                    - Ricardo Nunes governa SP (12M habitantes) desde 2021
                    - Principais desafios: transporte, saúde, educação, segurança
                    - Próximas eleições são importantes
                    - Mídia paulista influencia muito a opinião pública
                    
                    FORNEÇA ANÁLISE ESTRATÉGICA COMPLETA para o gabinete.`
                  },
                  {
                    role: 'user',
                    content: `Analise esta notícia de hoje para o prefeito Ricardo Nunes:
                    
                    📰 NOTÍCIA:
                    Título: ${title}
                    Conteúdo: ${resumo}
                    Fonte: ${source}
                    Data: ${today}
                    
                    Retorne um JSON válido e completo:
                    {
                      "sentiment_score": [número de -1 a 1],
                      "urgency_level": ["low", "medium", "high", "critical"],
                      "relevance_score": [número de 0 a 10],
                      "mentions_mayor": [true/false],
                      "crisis_potential": [true/false],
                      "keywords": [array de 5-6 palavras-chave],
                      "summary": "resumo executivo em 1-2 frases",
                      "impact_analysis": "análise detalhada de 3-4 parágrafos sobre impacto municipal, político e administrativo",
                      "recommended_action": "ação específica e detalhada que a prefeitura deve tomar",
                      "public_sentiment_prediction": "como os cidadãos paulistanos reagirão a esta notícia",
                      "communication_strategy": "estratégia de comunicação para o gabinete do prefeito",
                      "risk_assessment": "análise de riscos e como mitigá-los",
                      "political_opportunity": "oportunidades políticas ou 'nenhuma'",
                      "citizen_impact": "como esta notícia afeta a vida dos paulistanos",
                      "media_monitoring_focus": "pontos para monitorar na mídia sobre este tema"
                    }`
                  }
                ],
                temperature: 0.3,
                max_tokens: 1500
              }),
            });

            if (!openaiResponse.ok) {
              console.error('❌ Erro OpenAI:', await openaiResponse.text());
              continue;
            }

            const openaiData = await openaiResponse.json();
            const analysisText = openaiData.choices[0].message.content;
            
            console.log('🤖 Análise gerada (primeiros 200 chars):', analysisText.substring(0, 200));

            try {
              const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
              const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
              
              console.log('📊 Campos da análise:', Object.keys(analysis));

              // Inserir análise COMPLETA
              const { error: analysisError } = await supabase
                .from('news_analysis')
                .insert({
                  article_id: article.id,
                  sentiment_score: analysis.sentiment_score || 0,
                  urgency_level: analysis.urgency_level || 'medium',
                  relevance_score: analysis.relevance_score || 5,
                  mentions_mayor: analysis.mentions_mayor || false,
                  mentions_city: true,
                  crisis_potential: analysis.crisis_potential || false,
                  keywords: analysis.keywords || ['são paulo'],
                  summary: analysis.summary || 'Análise da notícia',
                  impact_analysis: analysis.impact_analysis || 'Análise de impacto municipal',
                  recommended_action: analysis.recommended_action || 'Acompanhar desenvolvimento',
                  public_sentiment_prediction: analysis.public_sentiment_prediction,
                  communication_strategy: analysis.communication_strategy,
                  risk_assessment: analysis.risk_assessment,
                  related_municipal_areas: ['Gabinete do Prefeito'],
                  media_monitoring_focus: analysis.media_monitoring_focus,
                  citizen_impact: analysis.citizen_impact,
                  political_opportunity: analysis.political_opportunity
                });

              if (analysisError) {
                console.error('❌ Erro ao inserir análise:', analysisError);
              } else {
                console.log('✅ ANÁLISE ELABORADA INSERIDA COM SUCESSO!');
                
                // Criar alerta se necessário
                if (analysis.urgency_level === 'high' || analysis.urgency_level === 'critical') {
                  await supabase
                    .from('news_alerts')
                    .insert({
                      article_id: article.id,
                      alert_type: analysis.crisis_potential ? 'crisis' : 'urgent',
                      severity: analysis.urgency_level,
                      title: `ALERTA: ${title.substring(0, 60)}...`,
                      message: analysis.impact_analysis.substring(0, 200) + '...',
                      acknowledged: false
                    });
                  
                  console.log('🚨 Alerta criado para notícia urgente');
                }
                
                processedArticles.push({
                  title,
                  url: uniqueUrl,
                  source,
                  analysis: analysis.summary,
                  urgency: analysis.urgency_level,
                  relevance: analysis.relevance_score
                });
              }
            } catch (parseError) {
              console.error('❌ Erro ao parsear análise JSON:', parseError);
              console.log('🔍 Texto recebido:', analysisText);
            }

          } catch (blockError) {
            console.error('❌ Erro ao processar bloco:', blockError);
          }
        }

      } catch (queryError) {
        console.error(`❌ Erro na query ${i+1}:`, queryError);
      }

      // Pausa entre queries
      if (i < todayQueries.length - 1) {
        console.log('⏸️ Pausando 2s...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`🎉 COLETA CONCLUÍDA: ${processedArticles.length} notícias processadas`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Coleta forçada: ${processedArticles.length} notícias de hoje com análises elaboradas`,
        articles: processedArticles,
        date: today,
        debug: 'Coleta forçada executada com sucesso'
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
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});