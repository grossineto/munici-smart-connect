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
    console.log('🚀 Iniciando coleta inteligente de notícias para gestão municipal...');

    const processedArticles = [];

    // Temas específicos para gestão municipal de São Paulo
    const municipalTopics = [
      "transporte público São Paulo metrô CPTM problemas",
      "saúde pública São Paulo hospitais UBS atendimento",
      "educação escolas municipais São Paulo infraestrutura",
      "segurança São Paulo criminalidade centro violência",
      "habitação moradia popular São Paulo ocupações",
      "zeladoria São Paulo limpeza urbana manutenção",
      "trânsito São Paulo obras viárias marginais",
      "Ricardo Nunes prefeito São Paulo decisões políticas"
    ];

    for (const topic of municipalTopics) {
      console.log(`🔍 Buscando: ${topic}`);
      
      // 1. PERPLEXITY: Encontrar notícias relevantes
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
              content: `Encontre notícias dos últimos 3 dias sobre "${topic}" em sites brasileiros.
              
              Liste apenas notícias que podem impactar a gestão municipal de São Paulo.
              
              Para cada notícia válida, retorne EXATAMENTE neste formato:
              ---
              TÍTULO: [título completo]
              URL: [link completo]
              FONTE: [nome do veículo]
              RESUMO: [resumo de 2-3 linhas do conteúdo]
              ---`
            }
          ],
          temperature: 0.2,
          max_tokens: 1000
        }),
      });

      if (!perplexityResponse.ok) {
        console.error('❌ Erro Perplexity:', await perplexityResponse.text());
        continue;
      }

      const perplexityData = await perplexityResponse.json();
      const content = perplexityData.choices[0].message.content;
      
      console.log('📰 Resposta Perplexity:', content.substring(0, 200));

      // Extrair notícias usando o separador ---
      const newsBlocks = content.split('---').filter(block => 
        block.includes('TÍTULO:') && block.includes('URL:')
      );

      console.log(`📊 Encontradas ${newsBlocks.length} notícias para análise`);

      for (const block of newsBlocks) {
        try {
          const titleMatch = block.match(/TÍTULO:\s*(.+)/i);
          const urlMatch = block.match(/URL:\s*(https?:\/\/[^\s\n]+)/i);
          const sourceMatch = block.match(/FONTE:\s*(.+)/i);
          const resumoMatch = block.match(/RESUMO:\s*(.+)/i);

          if (!titleMatch || !urlMatch) {
            console.log('⚠️ Notícia incompleta, pulando');
            continue;
          }

          const title = titleMatch[1].trim();
          const url = urlMatch[1].trim();
          const source = sourceMatch ? sourceMatch[1].trim() : 'Portal de Notícias';
          const content = resumoMatch ? resumoMatch[1].trim() : '';

          console.log(`✅ Processando: ${title.substring(0, 50)}...`);

          // Verificar se já existe
          const { data: existing } = await supabase
            .from('news_articles')
            .select('id')
            .eq('url', url)
            .single();

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
              content,
              published_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (articleError) {
            console.error('❌ Erro ao inserir notícia:', articleError);
            continue;
          }

          // 2. OPENAI: Análise específica para gestão municipal
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
                  content: `Você é um analista especializado em gestão municipal para o prefeito Ricardo Nunes de São Paulo. 
                  
                  Analise notícias considerando:
                  - Impacto na gestão municipal
                  - Urgência para ação da prefeitura
                  - Sentimento público
                  - Potencial de crise
                  - Oportunidades políticas
                  - Zeladoria e serviços públicos`
                },
                {
                  role: 'user',
                  content: `Analise esta notícia:
                  
                  TÍTULO: ${title}
                  CONTEÚDO: ${content}
                  FONTE: ${source}
                  
                  Retorne um JSON com:
                  {
                    "sentiment_score": [número de -1 a 1],
                    "urgency_level": ["low", "medium", "high", "critical"],
                    "relevance_score": [número de 0 a 10],
                    "mentions_mayor": [true/false],
                    "crisis_potential": [true/false],
                    "keywords": [array de palavras-chave],
                    "summary": "resumo em 1 frase",
                    "impact_analysis": "análise do impacto para a gestão municipal",
                    "recommended_action": "ação recomendada para a prefeitura"
                  }`
                }
              ],
              temperature: 0.3,
              max_tokens: 800
            }),
          });

          if (!openaiResponse.ok) {
            console.error('❌ Erro OpenAI:', await openaiResponse.text());
            continue;
          }

          const openaiData = await openaiResponse.json();
          let analysis;
          
          try {
            analysis = JSON.parse(openaiData.choices[0].message.content);
          } catch (e) {
            console.error('❌ Erro ao parsear análise JSON');
            continue;
          }

          // Inserir análise
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

          // Criar alerta se necessário
          if (analysis.urgency_level === 'high' || analysis.urgency_level === 'critical') {
            await supabase
              .from('news_alerts')
              .insert({
                article_id: article.id,
                alert_type: analysis.crisis_potential ? 'crisis' : 'urgent',
                severity: analysis.urgency_level === 'critical' ? 'critical' : 'high',
                title: `ALERTA: ${title.substring(0, 60)}...`,
                message: analysis.impact_analysis,
                acknowledged: false
              });

            console.log('🚨 Alerta criado para notícia urgente');
          }

          processedArticles.push({
            title,
            url,
            source,
            analysis: analysis.summary
          });

          console.log('✅ Notícia processada com sucesso');

        } catch (error) {
          console.error('❌ Erro ao processar notícia:', error);
          continue;
        }
      }

      // Pausa entre tópicos
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`🎉 Processadas ${processedArticles.length} notícias com análise municipal`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Coletadas e analisadas ${processedArticles.length} notícias relevantes para gestão municipal`,
        articles: processedArticles
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