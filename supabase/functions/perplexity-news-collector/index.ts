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
  console.log('🚀 INICIANDO COLETA PERSONALIZADA DE NOTÍCIAS');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ler parâmetros do corpo da requisição
    const body = await req.json().catch(() => ({}));
    const mayor = body.mayor;
    
    if (mayor) {
      console.log(`📊 COLETA PERSONALIZADA PARA: ${mayor.mayorName} - ${mayor.cityName}/${mayor.state}`);
    } else {
      console.log('📊 COLETA PADRÃO PARA: Ricardo Nunes - São Paulo/SP');
    }
    
    console.log('✅ Iniciando coleta de notícias...');
    
    const processedArticles = [];
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 🎯 Queries dinâmicas baseadas no prefeito selecionado com FONTES REGIONAIS
    let todayQueries;
    let regionalSources;
    
    if (mayor) {
      // Definir fontes regionais específicas por estado
      const stateSources = {
        'SP': 'G1 São Paulo, Folha, Estadão, UOL São Paulo, Terra São Paulo, R7 São Paulo, CNN Brasil',
        'RJ': 'G1 Rio, O Globo, Extra, UOL Rio, O Dia, Jornal do Brasil, CNN Brasil',
        'MG': 'G1 Minas, Estado de Minas, O Tempo, Hoje em Dia, Super Notícia, UOL Minas',
        'RS': 'G1 RS, Zero Hora, Correio do Povo, Jornal do Comércio, GZH',
        'PE': 'G1 Pernambuco, Diário de Pernambuco, Folha de Pernambuco, JC Online',
        'BA': 'G1 Bahia, Correio, A Tarde, Metro 1, Bahia Notícias',
        'PR': 'G1 Paraná, Gazeta do Povo, Bem Paraná, RPC, Banda B',
        'CE': 'G1 Ceará, Diário do Nordeste, O Povo, Tribuna do Ceará',
        'SC': 'G1 Santa Catarina, NSC Total, Diário Catarinense, ND+',
        'GO': 'G1 Goiás, O Popular, Diário de Goiás, Mais Goiás',
        'ES': 'G1 Espírito Santo, A Gazeta, Aqui Notícias, Folha Vitória',
        'DF': 'G1 DF, Correio Braziliense, Metrópoles, Jornal de Brasília',
        'AM': 'G1 Amazonas, A Crítica, Em Tempo, D24AM',
        'PA': 'G1 Pará, Diário do Pará, O Liberal, DOL',
        'MA': 'G1 Maranhão, O Imparcial, O Estado do Maranhão',
        'MT': 'G1 Mato Grosso, Gazeta Digital, RDNEWS, SóNotícias',
        'MS': 'G1 MS, Campo Grande News, Correio do Estado',
        'AL': 'G1 Alagoas, Gazeta de Alagoas, TNH1',
        'SE': 'G1 Sergipe, Cinform, Fan F1',
        'PB': 'G1 Paraíba, Correio da Paraíba, Paraíba Online',
        'RN': 'G1 RN, Tribuna do Norte, Novo Jornal',
        'PI': 'G1 Piauí, Cidade Verde, O Dia PI',
        'AC': 'G1 Acre, Ac24horas, ContilNet',
        'RO': 'G1 Rondônia, Rondônia Ao Vivo, Folha do Estado',
        'RR': 'G1 Roraima, Folha de Boa Vista',
        'AP': 'G1 Amapá, SelesNafes.com',
        'TO': 'G1 Tocantins, Jornal do Tocantins'
      };

      regionalSources = stateSources[mayor.state] || 'G1, Folha, Estadão, UOL, CNN Brasil';

      todayQueries = [
        `${mayor.mayorName} prefeito ${mayor.cityName} ${mayor.state} notícias hoje ${today}`,
        `${mayor.cityName} ${mayor.state} prefeitura gestão municipal hoje ${today}`,
        `${mayor.cityName} ${mayor.state} transporte público problemas hoje ${today}`,
        `${mayor.cityName} ${mayor.state} saúde hospitais notícias hoje ${today}`,
        `${mayor.cityName} ${mayor.state} segurança criminalidade hoje ${today}`,
        `${mayor.cityName} ${mayor.state} educação escolas hoje ${today}`,
        `${mayor.cityName} ${mayor.state} infraestrutura obras hoje ${today}`
      ];
    } else {
      // Queries padrão para São Paulo
      regionalSources = 'G1 São Paulo, Folha, Estadão, UOL São Paulo, Terra São Paulo, R7 São Paulo, CNN Brasil';
      todayQueries = [
        `Ricardo Nunes prefeito São Paulo notícias hoje ${today}`,
        `São Paulo transporte público problemas hoje ${today}`,
        `São Paulo saúde hospitais notícias hoje ${today}`,
        `São Paulo segurança criminalidade hoje ${today}`,
        `São Paulo educação escolas hoje ${today}`
      ];
    }

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
            model: 'sonar-pro',
            messages: [
              {
                role: 'system',
                content: 'Você é um especialista em jornalismo brasileiro. Encontre notícias REAIS e ATUAIS dos principais portais.'
              },
              {
                role: 'user',
                content: `Encontre 2 notícias ATUAIS de hoje (${today}) sobre "${query}" dos portais brasileiros.
                
                IMPORTANTE: Quero notícias de HOJE, mesmo que similares já existam.
                
                FONTES PRIORITÁRIAS: ${regionalSources}
                FONTES NACIONAIS: G1, Folha, Estadão, UOL, R7, CNN Brasil, Metrópoles, Band
                
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

            // OpenAI: Análise PERSONALIZADA
            console.log('🤖 Gerando análise personalizada...');
            
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
                    content: mayor 
                      ? `Você é o consultor sênior do prefeito ${mayor.mayorName} de ${mayor.cityName}/${mayor.state}. 
                      
                      CONTEXTO:
                      - ${mayor.mayorName} (${mayor.party}) governa ${mayor.cityName} no estado ${mayor.state}
                      - Principais desafios municipais: transporte, saúde, educação, segurança
                      - Próximas eleições municipais são importantes
                      - Mídia local e nacional influencia a opinião pública
                      
                      FORNEÇA ANÁLISE ESTRATÉGICA COMPLETA para o gabinete.`
                      : `Você é o consultor sênior do prefeito Ricardo Nunes de São Paulo. 
                      
                      CONTEXTO:
                      - Ricardo Nunes governa SP (12M habitantes) desde 2021
                      - Principais desafios: transporte, saúde, educação, segurança
                      - Próximas eleições são importantes
                      - Mídia paulista influencia muito a opinião pública
                      
                      FORNEÇA ANÁLISE ESTRATÉGICA COMPLETA para o gabinete.`
                  },
                  {
                    role: 'user',
                    content: (mayor
                      ? `Analise esta notícia de hoje para o prefeito ${mayor.mayorName} de ${mayor.cityName}/${mayor.state}:`
                      : `Analise esta notícia de hoje para o prefeito Ricardo Nunes:`) + `
                    
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
                      "public_sentiment_prediction": "como os cidadãos reagirão a esta notícia",
                      "communication_strategy": "estratégia de comunicação para o gabinete do prefeito",
                      "risk_assessment": "análise de riscos e como mitigá-los",
                      "political_opportunity": "oportunidades políticas ou 'nenhuma'",
                      "citizen_impact": "como esta notícia afeta a vida dos cidadãos",
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
              
              // 🚨 FALLBACK: Criar análise básica sem OpenAI
              console.log('⚡ Criando análise básica sem OpenAI...');
              const { error: analysisError } = await supabase
                .from('news_analysis')
                .insert({
                  article_id: article.id,
                  sentiment_score: 0,
                  urgency_level: 'medium',
                  relevance_score: 5,
                  mentions_mayor: title.toLowerCase().includes(mayor?.mayorName?.toLowerCase() || ''),
                  mentions_city: true,
                  crisis_potential: false,
                  keywords: [mayor?.cityName || 'são paulo', mayor?.mayorName || 'prefeito'],
                  summary: `Notícia coletada: ${title.substring(0, 100)}...`,
                  impact_analysis: `Notícia sobre ${mayor?.cityName || 'São Paulo'} que pode impactar a gestão municipal. Requer análise mais detalhada.`,
                  recommended_action: 'Monitorar desenvolvimento da situação',
                  public_sentiment_prediction: 'Aguardando análise detalhada',
                  communication_strategy: 'Preparar resposta baseada no desenvolvimento',
                  risk_assessment: 'Risco moderado - monitorar',
                  related_municipal_areas: ['Gabinete do Prefeito'],
                  media_monitoring_focus: 'Acompanhar repercussão',
                  citizen_impact: 'Impacto a ser avaliado',
                  political_opportunity: 'Aguardando análise'
                });

              if (analysisError) {
                console.error('❌ Erro ao inserir análise básica:', analysisError);
              } else {
                console.log('✅ ANÁLISE BÁSICA INSERIDA (sem OpenAI)');
                
                processedArticles.push({
                  title,
                  url: uniqueUrl,
                  source,
                  analysis: `Análise básica: ${title.substring(0, 50)}...`,
                  urgency: 'medium',
                  relevance: 5
                });
              }
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
                  keywords: analysis.keywords || [mayor?.cityName || 'são paulo'],
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
                console.log('✅ ANÁLISE PERSONALIZADA INSERIDA COM SUCESSO!');
                
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

    const targetInfo = mayor 
      ? `${mayor.mayorName} - ${mayor.cityName}/${mayor.state}` 
      : 'Ricardo Nunes - São Paulo/SP';

    console.log(`🎉 COLETA CONCLUÍDA: ${processedArticles.length} notícias processadas para ${targetInfo}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Coleta personalizada: ${processedArticles.length} notícias sobre ${targetInfo} com análises elaboradas`,
        articles: processedArticles,
        target: targetInfo,
        date: today,
        debug: 'Coleta personalizada executada com sucesso'
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