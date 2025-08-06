import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurado');
    }

    console.log('Iniciando análise de sentimento...');

    // Buscar menções com sentimento neutro (não analisadas)
    const { data: mentions, error: fetchError } = await supabase
      .from('social_mentions')
      .select('*')
      .eq('sentiment', 'neutral')
      .order('created_at', { ascending: false })
      .limit(20);

    if (fetchError) {
      throw fetchError;
    }

    if (!mentions || mentions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma menção pendente de análise' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analisando ${mentions.length} menções...`);

    for (const mention of mentions) {
      try {
        const prompt = `
Você é um analista político especializado. Analise o seguinte post de rede social e classifique:

1. Polaridade: Positiva, Negativa ou Neutra (em relação ao político mencionado)
2. Emoção: Raiva, Medo, Alegria, Confiança ou Neutra
3. Tópico: Qual o principal assunto abordado?

Político mencionado: ${mention.politician_name}
Post: "${mention.content}"

Responda APENAS com um JSON no formato:
{
  "polaridade": "positiva|negativa|neutra",
  "emocao": "raiva|medo|alegria|confianca|neutra", 
  "topico": "assunto principal"
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: 'Você é um analista político que sempre responde com JSON válido.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 200,
          }),
        });

        if (!response.ok) {
          console.error(`Erro na API OpenAI: ${response.status}`);
          continue;
        }

        const aiResponse: OpenAIResponse = await response.json();
        const analysisText = aiResponse.choices[0]?.message?.content;

        if (!analysisText) {
          console.error('Resposta vazia da OpenAI');
          continue;
        }

        // Parse do JSON da resposta
        let analysis;
        try {
          analysis = JSON.parse(analysisText);
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta IA:', analysisText);
          continue;
        }

        // Mapear polaridade para o campo sentiment
        const sentimentMap: Record<string, string> = {
          'positiva': 'positive',
          'negativa': 'negative', 
          'neutra': 'neutral'
        };

        const sentiment = sentimentMap[analysis.polaridade] || 'neutral';

        // Atualizar menção com análise
        const { error: updateError } = await supabase
          .from('social_mentions')
          .update({
            sentiment,
            raw_data: {
              ...mention.raw_data,
              ai_analysis: {
                polaridade: analysis.polaridade,
                emocao: analysis.emocao,
                topico: analysis.topico,
                analyzed_at: new Date().toISOString()
              }
            }
          })
          .eq('id', mention.id);

        if (updateError) {
          console.error('Erro ao atualizar menção:', updateError);
        } else {
          console.log(`Análise concluída para menção ${mention.id}: ${sentiment}`);
        }

        // Delay para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Erro ao analisar menção ${mention.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Análise de sentimento concluída para ${mentions.length} menções` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função analyze-social-sentiment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});