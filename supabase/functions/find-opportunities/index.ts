import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, area } = await req.json().catch(() => ({ idea: "", area: undefined }));

    if (!idea || typeof idea !== "string") {
      return new Response(JSON.stringify({ error: "Parâmetro 'idea' é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!PERPLEXITY_API_KEY) {
      return new Response(JSON.stringify({
        error: "PERPLEXITY_API_KEY ausente nas secrets do Supabase",
        hint: "Defina a secret PERPLEXITY_API_KEY para ativar a busca em tempo real",
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const system =
      "Você é um consultor de captação de recursos para prefeituras do Brasil. Retorne apenas JSON válido.";

    const user = `Com base no projeto abaixo, encontre até 8 oportunidades (editais, programas, linhas de crédito) REAIS e ATUAIS.
- Priorize fontes oficiais: gov.br, Plataforma +Brasil (Siconv), ministérios, Caixa, Banco do Brasil, BNDES, bancos públicos, governos estaduais.
- Se possível, traga prazos de inscrição, valores e links oficiais.

Projeto: "${idea}"
Área prioritária: ${area || "(qualquer)"}

Responda APENAS com JSON válido, sem comentários:
{
  "opportunities": [
    {
      "id": "string (opcional)",
      "name": "nome do recurso/programa",
      "agency": "órgão/instituição responsável",
      "value": "faixa de valores, ex: R$ 500 mil - R$ 3 milhões",
      "deadline": "prazo no formato YYYY-MM-DD (se houver)",
      "area": "uma palavra-chave da área (Saúde, Educação, Infraestrutura, Meio Ambiente, Assistência Social)",
      "link": "URL oficial",
      "score": 0.0,
      "summary": "1-2 linhas explicando o foco"
    }
  ]
}`;

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1200,
        return_images: false,
        return_related_questions: false,
        frequency_penalty: 1,
        presence_penalty: 0,
        // leve viés para domínios oficiais
        search_domain_filter: [
          "gov.br",
          "bndes.gov.br",
          "caixa.gov.br",
          "bb.com.br",
          "saude.gov.br",
          "mec.gov.br",
          "infraestrutura.gov.br",
          "mds.gov.br",
          "fazenda.gov.br",
          "planalto.gov.br",
        ],
        search_recency_filter: "month",
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Perplexity error:", resp.status, text);
      return new Response(JSON.stringify({ error: "Falha ao consultar Perplexity" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content || "";

    const fenced = content.match(/```json[\s\S]*?```/i);
    const jsonText = fenced ? fenced[0].replace(/```json/i, "").replace(/```/g, "").trim() : content.trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (_err) {
      // fallback simples
      parsed = { opportunities: [] };
    }

    const list = Array.isArray(parsed?.opportunities) ? parsed.opportunities : [];

    // Normalizar campos mínimos esperados no frontend
    const normalized = list.map((it: any, idx: number) => ({
      id: it.id || `${Date.now()}-${idx}`,
      name: it.name || it.nome || it.titulo || "Oportunidade",
      agency: it.agency || it.orgao || it.instituicao || "Instituição",
      value: it.value || it.valor || "—",
      deadline: it.deadline || it.prazo || "",
      area: it.area || it.areaTag || (Array.isArray(it.tags) ? it.tags[0] : undefined) || "Infraestrutura",
      link: it.link || it.url || "",
      score: typeof it.score === "number" ? it.score : 0,
      summary: it.summary || it.resumo || "",
    }));

    return new Response(JSON.stringify({ opportunities: normalized }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("find-opportunities error:", error);
    return new Response(JSON.stringify({ error: "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});