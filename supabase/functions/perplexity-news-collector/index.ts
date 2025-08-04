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
    console.log('🔍 Buscando notícias reais sobre São Paulo...');

    const processedArticles = [];

    // Queries específicas para São Paulo e gestão municipal - expandidas para mais cobertura
    const queries = [
      "São Paulo prefeito Ricardo Nunes notícias hoje última hora",
      "prefeitura São Paulo políticas públicas Ricardo Nunes decisões",
      "São Paulo transporte público metrô CPTM EMTU problemas",
      "São Paulo saúde pública hospitais UBS Ricardo Nunes",
      "São Paulo educação escolas municipais ensino Ricardo Nunes",
      "São Paulo segurança pública criminalidade violência centro",
      "São Paulo habitação moradia popular COHAB Ricardo Nunes"
    ];

    for (const query of queries) {
      console.log(`📰 Procurando: ${query}`);
      
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
              content: `Encontre 3 notícias recentes sobre "${query}" dos últimos 2 dias. 
              
              Retorne APENAS notícias reais de sites brasileiros como G1, Folha, Estadão, UOL, R7, CNN Brasil.
              
              Para cada notícia, forneça:
              - Título exato
              - URL completa e funcional
              - Fonte/veículo
              - Resumo do conteúdo
              - Data e hora EXATA de publicação da notícia no site original
              
              Formato:
              NOTÍCIA 1:
              Título: [título]
              URL: [link]
              Fonte: [veículo]
              Data: [data completa: DD/MM/AAAA HH:MM]
              Resumo: [conteúdo]
              
              NOTÍCIA 2:
              Título: [título]
              URL: [link]
              Fonte: [veículo]  
              Data: [data completa: DD/MM/AAAA HH:MM]
              Resumo: [conteúdo]`
            }
          ],
          temperature: 0.1,
          max_tokens: 1500
        }),
      });

      if (!perplexityResponse.ok) {
        console.error('❌ Erro Perplexity:', await perplexityResponse.text());
        continue;
      }

      const data = await perplexityResponse.json();
      const content = data.choices[0].message.content;
      console.log('📄 Conteúdo recebido:', content.substring(0, 300));

      // Extrair notícias do formato estruturado
      const newsBlocks = content.split(/NOTÍCIA \d+:|---/).filter(block => block.trim());
      
      for (const block of newsBlocks) {
        if (!block.trim()) continue;
        
        const titleMatch = block.match(/Título:\s*(.+)/i);
        const urlMatch = block.match(/URL:\s*(https?:\/\/[^\s\n]+)/i);
        const sourceMatch = block.match(/Fonte:\s*(.+)/i);
        const dataMatch = block.match(/Data:\s*(.+)/i);
        const resumoMatch = block.match(/Resumo:\s*(.+)/i);
        
        if (!titleMatch || !urlMatch) {
          console.log('⚠️ Notícia incompleta, pulando');
          continue;
        }

        const title = titleMatch[1].trim();
        const url = urlMatch[1].trim();
        const source = sourceMatch ? sourceMatch[1].trim() : 'Portal de Notícias';
        const dateStr = dataMatch ? dataMatch[1].trim() : null;
        const content = resumoMatch ? resumoMatch[1].trim() : 'Conteúdo via Perplexity';

        // Processar data de publicação
        let publishedAt = new Date();
        if (dateStr) {
          try {
            // Tentar converter formato DD/MM/AAAA HH:MM
            const [datePart, timePart] = dateStr.split(' ');
            if (datePart && datePart.includes('/')) {
              const [day, month, year] = datePart.split('/');
              const [hour, minute] = timePart ? timePart.split(':') : ['12', '00'];
              publishedAt = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
            }
          } catch (e) {
            console.log('⚠️ Erro ao processar data, usando atual');
          }
        }

        console.log(`✅ Processando: ${title.substring(0, 50)}...`);
        console.log(`🔗 URL: ${url}`);
        console.log(`📅 Data: ${publishedAt.toLocaleString('pt-BR')}`);

        // Verificar se já existe
        const { data: existing } = await supabase
          .from('news_articles')
          .select('id')
          .eq('url', url)
          .single();

        if (existing) {
          console.log('📋 Artigo já existe');
          continue;
        }

        // Salvar artigo com data real de publicação
        const { data: article, error: articleError } = await supabase
          .from('news_articles')
          .insert({
            title,
            url,
            content,
            author: source,
            published_at: publishedAt.toISOString(),
          })
          .select()
          .single();

        if (articleError) {
          console.error('❌ Erro ao salvar:', articleError);
          continue;
        }

        // Análise com OpenAI
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
                content: `Você é um analista de opinião pública especializado em gestão municipal de São Paulo. 

Analise esta notícia e retorne um JSON com:
{
  "sentiment": "positivo|negativo|neutro",
  "sentiment_score": -1 a 1,
  "relevance": 1 a 10,
  "urgency": "baixo|medio|alto|critico",
  "mentions_mayor": true/false,
  "mentions_city": true/false,
  "crisis_potential": true/false,
  "keywords": ["palavra1", "palavra2"],
  "summary": "resumo executivo",
  "impact_analysis": "análise detalhada do impacto",
  "recommended_action": "ação recomendada para gestão",
  "public_opinion_impact": "impacto na opinião pública",
  "media_attention_level": "baixo|medio|alto",
  "stakeholders_affected": ["grupo1", "grupo2"]
}`
              },
              {
                role: 'user',
                content: `Título: ${title}\nConteúdo: ${content}\nFonte: ${source}`
              }
            ],
            temperature: 0.2,
          }),
        });

        let analysis = {
          sentiment: 'neutro',
          sentiment_score: 0,
          relevance: 5,
          urgency: 'medio',
          mentions_mayor: false,
          mentions_city: true,
          crisis_potential: false,
          keywords: ['São Paulo'],
          summary: content.substring(0, 200),
          impact_analysis: 'Análise em processamento',
          recommended_action: 'Monitorar desenvolvimento',
          public_opinion_impact: 'Impacto moderado na opinião pública',
          media_attention_level: 'medio',
          stakeholders_affected: ['Cidadãos', 'Gestão Municipal']
        };

        if (analysisResponse.ok) {
          try {
            const analysisData = await analysisResponse.json();
            const aiAnalysis = JSON.parse(analysisData.choices[0].message.content);
            analysis = { ...analysis, ...aiAnalysis };
          } catch (e) {
            console.log('⚠️ Usando análise padrão');
          }
        }

        // Salvar análise
        const { error: analysisError } = await supabase
          .from('news_analysis')
          .insert({
            article_id: article.id,
            sentiment_score: analysis.sentiment_score,
            relevance_score: analysis.relevance,
            urgency_level: analysis.urgency,
            mentions_mayor: analysis.mentions_mayor,
            mentions_city: analysis.mentions_city,
            crisis_potential: analysis.crisis_potential,
            keywords: analysis.keywords,
            summary: analysis.summary,
            impact_analysis: analysis.impact_analysis,
            recommended_action: analysis.recommended_action
          });

        if (!analysisError) {
          console.log('💾 Análise salva');
          
          // Criar alerta se necessário
          if (analysis.urgency === 'alto' || analysis.urgency === 'critico' || analysis.crisis_potential) {
            await supabase
              .from('news_alerts')
              .insert({
                article_id: article.id,
                alert_type: analysis.crisis_potential ? 'crisis' : 'urgent',
                title: `🚨 ${analysis.urgency.toUpperCase()}: ${title}`,
                message: analysis.summary,
                severity: analysis.urgency === 'critico' ? 'critical' : 'high'
              });
          }
        }

        processedArticles.push({
          title,
          url,
          source
        });
      }

      // Pausa entre queries
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`✅ Processadas ${processedArticles.length} notícias reais`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Coletadas ${processedArticles.length} notícias reais de fontes brasileiras`,
        articles: processedArticles
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
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