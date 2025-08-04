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
  console.log('🚀 [INICIO] Função chamada!');
  
  if (req.method === 'OPTIONS') {
    console.log('📋 [CORS] Retornando headers CORS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [DEBUG] Iniciando teste básico...');
    console.log('🔑 [DEBUG] Verificando chaves:', {
      perplexity: !!perplexityApiKey ? 'OK' : 'FALTA',
      openai: !!openaiApiKey ? 'OK' : 'FALTA',
      supabase: !!supabaseUrl ? 'OK' : 'FALTA'
    });

    const processedArticles = [];

    // Teste 1: Inserir uma notícia simples
    console.log('📝 [TESTE] Tentando inserir notícia de teste...');
    
    const testTitle = `Teste de notícia - ${new Date().toLocaleString('pt-BR')}`;
    const testUrl = `https://teste.com/noticia-${Date.now()}`;
    
    const { data: testArticle, error: testError } = await supabase
      .from('news_articles')
      .insert({
        title: testTitle,
        url: testUrl,
        author: 'Teste Portal',
        content: 'Conteúdo de teste para verificar se a inserção funciona',
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ [ERRO] Falha ao inserir notícia de teste:', testError);
      throw new Error(`Erro no banco: ${testError.message}`);
    }

    console.log('✅ [SUCESSO] Notícia de teste inserida:', testArticle.id);

    // Teste 2: Chamada simples Perplexity
    console.log('🔍 [TESTE] Testando Perplexity...');
    
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
              content: 'Diga apenas: "Teste Perplexity funcionando"'
            }
          ],
          temperature: 0.1,
          max_tokens: 50
        }),
      });

      console.log('📊 [DEBUG] Status Perplexity:', perplexityResponse.status);

      if (!perplexityResponse.ok) {
        const errorText = await perplexityResponse.text();
        console.error('❌ [ERRO] Resposta Perplexity:', errorText);
        throw new Error(`Perplexity falhou: ${errorText}`);
      }

      const perplexityData = await perplexityResponse.json();
      console.log('✅ [SUCESSO] Perplexity respondeu:', perplexityData.choices[0].message.content);
      
    } catch (perplexityError) {
      console.error('❌ [ERRO] Falha Perplexity:', perplexityError);
    }

    // Teste 3: Chamada simples OpenAI
    console.log('🤖 [TESTE] Testando OpenAI...');
    
    try {
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
              role: 'user',
              content: 'Diga apenas: "Teste OpenAI funcionando"'
            }
          ],
          temperature: 0.1,
          max_tokens: 50
        }),
      });

      console.log('📊 [DEBUG] Status OpenAI:', openaiResponse.status);

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('❌ [ERRO] Resposta OpenAI:', errorText);
        throw new Error(`OpenAI falhou: ${errorText}`);
      }

      const openaiData = await openaiResponse.json();
      console.log('✅ [SUCESSO] OpenAI respondeu:', openaiData.choices[0].message.content);
      
    } catch (openaiError) {
      console.error('❌ [ERRO] Falha OpenAI:', openaiError);
    }

    // Inserir análise de teste
    console.log('📊 [TESTE] Inserindo análise de teste...');
    
    const { error: analysisError } = await supabase
      .from('news_analysis')
      .insert({
        article_id: testArticle.id,
        sentiment_score: 0.5,
        urgency_level: 'low',
        relevance_score: 5.0,
        mentions_mayor: false,
        mentions_city: true,
        crisis_potential: false,
        keywords: ['teste', 'noticia'],
        summary: 'Análise de teste funcionando',
        impact_analysis: 'Teste de impacto',
        recommended_action: 'Acompanhar teste'
      });

    if (analysisError) {
      console.error('❌ [ERRO] Falha ao inserir análise:', analysisError);
    } else {
      console.log('✅ [SUCESSO] Análise de teste inserida');
    }

    processedArticles.push({
      title: testTitle,
      url: testUrl,
      source: 'Teste Portal',
      analysis: 'Teste funcionando'
    });

    console.log('🎉 [FINAL] Teste concluído com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Teste concluído - ${processedArticles.length} notícia processada`,
        articles: processedArticles,
        debug: {
          perplexity: 'testado',
          openai: 'testado',
          database: 'testado'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ [ERRO GERAL]:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        debug: 'Falha durante execução'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});