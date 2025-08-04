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
    console.log('🚀 Iniciando Coleta Inteligente de Notícias - Sistema Maximizado');

    const processedArticles = [];

    // FASE 1: PERPLEXITY PARA DESCOBERTA AVANÇADA DE NOTÍCIAS
    const advancedTopics = [
      {
        query: "Ricardo Nunes prefeito São Paulo decisões política gestão municipal últimas 48 horas",
        priority: "critical",
        category: "gestao_municipal"
      },
      {
        query: "São Paulo transporte público metrô CPTM EMTU problemas greve obras últimas notícias",
        priority: "high", 
        category: "transporte"
      },
      {
        query: "São Paulo saúde pública hospitais UBS AMA atendimento falta médicos sistema",
        priority: "high",
        category: "saude"
      },
      {
        query: "São Paulo educação escolas municipais ensino infraestrutura professores",
        priority: "medium",
        category: "educacao"
      },
      {
        query: "São Paulo segurança pública criminalidade violência centro cidade polícia",
        priority: "high",
        category: "seguranca"
      },
      {
        query: "São Paulo habitação moradia popular ocupações COHAB déficit habitacional",
        priority: "medium",
        category: "habitacao"
      },
      {
        query: "São Paulo zeladoria limpeza urbana coleta lixo manutenção vias públicas",
        priority: "medium",
        category: "zeladoria"
      },
      {
        query: "São Paulo economia emprego desemprego desenvolvimento urbano investimentos",
        priority: "medium",
        category: "economia"
      }
    ];

    for (const topic of advancedTopics) {
      console.log(`🔍 Buscando: ${topic.category} (${topic.priority})`);
      
      // PERPLEXITY: Busca especializada por categoria
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online', // Modelo mais poderoso
          messages: [
            {
              role: 'system',
              content: `Você é um especialista em jornalismo político brasileiro focado em gestão municipal de São Paulo. 
              Encontre notícias relevantes dos principais portais brasileiros que possam impactar a gestão municipal.`
            },
            {
              role: 'user',
              content: `Encontre 3-5 notícias recentes sobre "${topic.query}" dos últimos 2-3 dias.
              
              FOQUE EM: G1, Folha de S.Paulo, Estadão, UOL, R7, CNN Brasil, Metrópoles, Band
              
              Para cada notícia REAL encontrada, retorne EXATAMENTE neste formato:
              
              [NOTICIA]
              Título: [título completo da notícia]
              URL: [link direto e completo]
              Fonte: [nome do portal/veículo]
              Data: [data de publicação]
              Resumo: [resumo de 2-3 linhas explicando o impacto municipal]
              [/NOTICIA]
              
              IMPORTANTE: Apenas notícias REAIS que existem nos sites mencionados.`
            }
          ],
          temperature: 0.2,
          max_tokens: 1500
        }),
      });

      if (!perplexityResponse.ok) {
        console.error(`❌ Erro Perplexity para ${topic.category}:`, await perplexityResponse.text());
        continue;
      }

      const perplexityData = await perplexityResponse.json();
      const content = perplexityData.choices[0].message.content;
      
      console.log(`📰 Resposta ${topic.category}:`, content.substring(0, 200));

      // Parse mais robusto das notícias
      const newsBlocks = content.split('[NOTICIA]').filter(block => 
        block.includes('[/NOTICIA]') && block.includes('Título:') && block.includes('URL:')
      );

      console.log(`📊 ${topic.category}: ${newsBlocks.length} notícias encontradas`);

      for (const block of newsBlocks) {
        try {
          const cleanBlock = block.replace('[/NOTICIA]', '');
          
          const titleMatch = cleanBlock.match(/Título:\s*(.+)/i);
          const urlMatch = cleanBlock.match(/URL:\s*(https?:\/\/[^\s\n]+)/i);
          const sourceMatch = cleanBlock.match(/Fonte:\s*(.+)/i);
          const dateMatch = cleanBlock.match(/Data:\s*(.+)/i);
          const resumoMatch = cleanBlock.match(/Resumo:\s*(.+)/i);

          if (!titleMatch || !urlMatch) {
            console.log(`⚠️ ${topic.category}: Notícia incompleta`);
            continue;
          }

          const title = titleMatch[1].trim();
          const url = urlMatch[1].trim();
          const source = sourceMatch ? sourceMatch[1].trim() : 'Portal de Notícias';
          const resumo = resumoMatch ? resumoMatch[1].trim() : '';

          console.log(`✅ Processando: ${title.substring(0, 50)}...`);

          // Verificar se já existe
          const { data: existing } = await supabase
            .from('news_articles')
            .select('id')
            .eq('url', url)
            .maybeSingle();

          if (existing) {
            console.log('📝 Notícia já existe, pulando');
            continue;
          }

          // Inserir notícia
          const { data: article, error: articleError } = await supabase
            .from('news_articles')
            .insert({
              title,
              url,
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

          // OPENAI: Análise Especializada para Gestão Municipal
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
                  content: `Você é um consultor sênior em gestão pública especializado na Prefeitura de São Paulo.
                  
                  CONTEXTO: Ricardo Nunes é o prefeito e precisa de análises práticas para:
                  - Tomar decisões informadas
                  - Antecipar crises
                  - Identificar oportunidades políticas
                  - Gerenciar serviços públicos
                  - Comunicação estratégica
                  
                  CATEGORIAS: ${topic.category}
                  PRIORIDADE: ${topic.priority}`
                },
                {
                  role: 'user',
                  content: `Analise esta notícia para o gabinete do prefeito:
                  
                  TÍTULO: ${title}
                  CONTEÚDO: ${resumo}
                  FONTE: ${source}
                  CATEGORIA: ${topic.category}
                  
                  Retorne um JSON válido:
                  {
                    "sentiment_score": [número de -1 a 1, onde -1=muito negativo, 0=neutro, 1=muito positivo],
                    "urgency_level": ["low", "medium", "high", "critical"],
                    "relevance_score": [número de 0 a 10, onde 10=extremamente relevante],
                    "mentions_mayor": [true se menciona Ricardo Nunes diretamente],
                    "crisis_potential": [true se pode virar crise],
                    "keywords": [array de 3-5 palavras-chave principais],
                    "summary": "resumo executivo em 1 frase",
                    "impact_analysis": "análise do impacto específico para a gestão municipal",
                    "recommended_action": "ação prática recomendada para a prefeitura",
                    "political_opportunity": "oportunidade política identificada ou 'nenhuma'",
                    "public_sentiment": "como o público provavelmente reagirá"
                  }`
                }
              ],
              temperature: 0.3,
              max_tokens: 1000
            }),
          });

          if (!openaiResponse.ok) {
            console.error('❌ Erro OpenAI:', await openaiResponse.text());
            continue;
          }

          const openaiData = await openaiResponse.json();
          let analysis;
          
          try {
            const analysisText = openaiData.choices[0].message.content;
            // Extrair JSON do texto se necessário
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            analysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
          } catch (e) {
            console.error('❌ Erro ao parsear análise JSON:', e);
            continue;
          }

          // Inserir análise enriquecida
          const { error: analysisError } = await supabase
            .from('news_analysis')
            .insert({
              article_id: article.id,
              sentiment_score: analysis.sentiment_score,
              urgency_level: analysis.urgency_level,
              relevance_score: analysis.relevance_score,
              mentions_mayor: analysis.mentions_mayor,
              mentions_city: true,
              crisis_potential: analysis.crisis_potential,
              keywords: analysis.keywords,
              summary: analysis.summary,
              impact_analysis: analysis.impact_analysis,
              recommended_action: analysis.recommended_action
            });

          if (analysisError) {
            console.error('❌ Erro ao inserir análise:', analysisError);
            continue;
          }

          // Sistema de Alertas Inteligente
          let shouldCreateAlert = false;
          let alertType = 'info';
          let alertSeverity = 'low';
          let alertMessage = analysis.impact_analysis;

          if (analysis.urgency_level === 'critical' || analysis.crisis_potential) {
            shouldCreateAlert = true;
            alertType = 'crisis';
            alertSeverity = 'critical';
            alertMessage = `🚨 CRISE POTENCIAL: ${analysis.impact_analysis}`;
          } else if (analysis.urgency_level === 'high' || analysis.relevance_score >= 8) {
            shouldCreateAlert = true;
            alertType = 'urgent';
            alertSeverity = 'high';
            alertMessage = `⚠️ ATENÇÃO URGENTE: ${analysis.impact_analysis}`;
          } else if (analysis.mentions_mayor && analysis.sentiment_score < -0.5) {
            shouldCreateAlert = true;
            alertType = 'political';
            alertSeverity = 'medium';
            alertMessage = `👤 MENÇÃO NEGATIVA AO PREFEITO: ${analysis.impact_analysis}`;
          }

          if (shouldCreateAlert) {
            await supabase
              .from('news_alerts')
              .insert({
                article_id: article.id,
                alert_type: alertType,
                severity: alertSeverity,
                title: `${alertType.toUpperCase()}: ${title.substring(0, 60)}...`,
                message: alertMessage,
                acknowledged: false
              });

            console.log(`🚨 Alerta ${alertSeverity} criado: ${alertType}`);
          }

          processedArticles.push({
            title,
            url,
            source,
            category: topic.category,
            priority: topic.priority,
            analysis: analysis.summary,
            urgency: analysis.urgency_level,
            relevance: analysis.relevance_score
          });

          console.log(`✅ ${topic.category}: Notícia processada com sucesso`);

        } catch (error) {
          console.error(`❌ Erro ao processar notícia de ${topic.category}:`, error);
          continue;
        }
      }

      // Pausa inteligente entre categorias
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    console.log(`🎉 COLETA FINALIZADA: ${processedArticles.length} notícias processadas`);
    
    // Estatísticas da coleta
    const stats = {
      total: processedArticles.length,
      porCategoria: {},
      porPrioridade: {},
      urgentes: processedArticles.filter(a => a.urgency === 'high' || a.urgency === 'critical').length,
      altaRelevancia: processedArticles.filter(a => a.relevance >= 8).length
    };

    advancedTopics.forEach(topic => {
      const count = processedArticles.filter(a => a.category === topic.category).length;
      stats.porCategoria[topic.category] = count;
      
      const priorityCount = processedArticles.filter(a => a.priority === topic.priority).length;
      stats.porPrioridade[topic.priority] = (stats.porPrioridade[topic.priority] || 0) + priorityCount;
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sistema maximizado: ${processedArticles.length} notícias analisadas com IA`,
        articles: processedArticles,
        statistics: stats,
        capabilities: {
          perplexity: "Busca avançada em tempo real",
          openai: "Análise estratégica para gestão",
          alerts: "Sistema de alertas inteligente",
          categories: "8 categorias municipais"
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
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