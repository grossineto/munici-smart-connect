import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

// Optional provider secrets/endpoints (configure if available)
const BNDES_API_BASE = Deno.env.get("BNDES_API_BASE");
const BNDES_API_KEY = Deno.env.get("BNDES_API_KEY");

const CAIXA_API_BASE = Deno.env.get("CAIXA_API_BASE");
const CAIXA_API_KEY = Deno.env.get("CAIXA_API_KEY");

const BB_API_BASE = Deno.env.get("BB_API_BASE");
const BB_API_KEY = Deno.env.get("BB_API_KEY");

// Types
interface NormalizedOpportunity {
  id: string;
  name: string;
  agency: string;
  value: string;
  deadline: string;
  area: string;
  link: string;
  score: number;
  summary: string;
  source: "perplexity" | "bndes" | "caixa" | "bb";
}

async function fetchPerplexity(idea: string, area?: string): Promise<NormalizedOpportunity[]> {
  if (!PERPLEXITY_API_KEY) {
    console.warn("PERPLEXITY_API_KEY ausente — pulando Perplexity");
    return [];
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
      search_domain_filter: [
        "gov.br",
        "bndes.gov.br",
        "portaldatransparencia.gov.br",
        "caixa.gov.br",
        "bb.com.br",
        "saude.gov.br",
        "mec.gov.br",
        "infraestrutura.gov.br",
        "mds.gov.br",
        "fazenda.gov.br",
        "planalto.gov.br",
      ],
      search_recency_filter: "year",
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Perplexity error:", resp.status, text);
    return [];
  }

  const data = await resp.json();
  const content: string = data?.choices?.[0]?.message?.content || "";

  const fenced = content.match(/```json[\s\S]*?```/i);
  const jsonText = fenced ? fenced[0].replace(/```json/i, "").replace(/```/g, "").trim() : content.trim();

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (_err) {
    console.warn("Falha parse JSON Perplexity; retornando vazio");
    parsed = { opportunities: [] };
  }

  const list = Array.isArray(parsed?.opportunities) ? parsed.opportunities : [];

  return list.map((it: any, idx: number) => ({
    id: it.id || `${Date.now()}-px-${idx}`,
    name: it.name || it.nome || it.titulo || "Oportunidade",
    agency: it.agency || it.orgao || it.instituicao || "Instituição",
    value: it.value || it.valor || "—",
    deadline: it.deadline || it.prazo || "",
    area: it.area || it.areaTag || (Array.isArray(it.tags) ? it.tags[0] : "Infraestrutura"),
    link: it.link || it.url || "",
    score: typeof it.score === "number" ? it.score : 0,
    summary: it.summary || it.resumo || "",
    source: "perplexity" as const,
  }));
}

// Provider adapters (placeholders) — implement real endpoints once available
async function fetchBNDES(idea: string, area?: string): Promise<NormalizedOpportunity[]> {
  if (!BNDES_API_BASE || !BNDES_API_KEY) {
    console.info("BNDES_API_BASE/BNDES_API_KEY ausentes — pulando BNDES");
    return [];
  }
  try {
    const url = `${BNDES_API_BASE}/oportunidades?query=${encodeURIComponent(idea)}${area ? `&area=${encodeURIComponent(area)}` : ""}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${BNDES_API_KEY}` } });
    if (!r.ok) throw new Error(`BNDES HTTP ${r.status}`);
    const data = await r.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.map((it: any, idx: number) => ({
      id: it.id?.toString?.() || `${Date.now()}-bd-${idx}`,
      name: it.name || it.title || "Linha BNDES",
      agency: it.agency || "BNDES",
      value: it.value || it.amount || "—",
      deadline: it.deadline || it.due_date || "",
      area: it.area || it.category || "Infraestrutura",
      link: it.link || it.url || "",
      score: typeof it.score === "number" ? it.score : 0,
      summary: it.summary || it.description || "",
      source: "bndes" as const,
    }));
  } catch (e) {
    console.error("Erro BNDES:", e);
    return [];
  }
}

async function fetchCaixa(idea: string, area?: string): Promise<NormalizedOpportunity[]> {
  // Integração com o Portal da Transparência (genérica, sem filtrar por órgão)
  const PORTAL_API_BASE = CAIXA_API_BASE || "https://api.portaldatransparencia.gov.br/api-de-dados";
  const PORTAL_API_KEY = CAIXA_API_KEY;

  if (!PORTAL_API_KEY) {
    console.info("CAIXA_API_KEY (Portal da Transparência) ausente — pulando CAIXA");
    return [];
  }

  const headers = { "chave-api": PORTAL_API_KEY } as Record<string, string>;
  const qs = (params: Record<string, string | number | undefined>) =>
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");

  const req = async (path: string, params: Record<string, string | number | undefined>) => {
    const url = `${PORTAL_API_BASE}/${path}?${qs(params)}`;
    const r = await fetch(url, { headers });
    if (!r.ok) {
      const text = await r.text();
      console.error(`Portal da Transparência ${path} HTTP ${r.status}:`, text);
      return [];
    }
    try {
      return await r.json();
    } catch {
      return [];
    }
  };

  try {
    // Consultas prioritárias: licitações, convênios e contratos, buscando pelo objeto
    const [licitacoes, convenios, contratos] = await Promise.all([
      req("licitacoes", { pagina: 1, tamanhoPagina: 50, objeto: idea }),
      req("convenios", { pagina: 1, tamanhoPagina: 50, objeto: idea }),
      req("contratos", { pagina: 1, tamanhoPagina: 50, objeto: idea }),
    ]);

    const rawItems = [
      ...(Array.isArray(licitacoes) ? licitacoes : []),
      ...(Array.isArray(convenios) ? convenios : []),
      ...(Array.isArray(contratos) ? contratos : []),
    ];

    return rawItems.map((it: any, idx: number) => {
      const id = it.id?.toString?.() || it.codigo?.toString?.() || it.numeroAviso?.toString?.() || it.numeroConvenio?.toString?.() || it.numeroContrato?.toString?.() || `${Date.now()}-cx-${idx}`;
      const objeto = it.objeto || it.descricao || it.naturezaJuridica || it.assunto || "Registro no Portal da Transparência";
      const valor = it.valorEstimado || it.valorGlobal || it.valor || it.valorContrato || it.valorEmpenhado || "—";
      const prazo = it.dataAbertura || it.dataFinal || it.dataFimVigencia || it.dataPublicacao || it.dataInicioVigencia || "";
      const link = it.url || it.urlPortal || "https://www.portaldatransparencia.gov.br/";
      const agency = it.orgao?.nome || it.orgaoSuperiorNome || it.unidadeGestoraNome || "Portal da Transparência";

      return {
        id,
        name: String(objeto).slice(0, 140),
        agency,
        value: typeof valor === "number" ? `R$ ${valor.toLocaleString("pt-BR")}` : String(valor),
        deadline: prazo,
        area: area || (Array.isArray(it?.tags) ? it.tags[0] : "Infraestrutura"),
        link,
        score: 0,
        summary: String(objeto).slice(0, 200),
        source: "caixa" as const,
      };
    });
  } catch (e) {
    console.error("Erro CAIXA (Portal da Transparência):", e);
    return [];
  }
}

async function fetchBB(idea: string, area?: string): Promise<NormalizedOpportunity[]> {
  if (!BB_API_BASE || !BB_API_KEY) {
    console.info("BB_API_BASE/BB_API_KEY ausentes — pulando BB");
    return [];
  }
  try {
    const url = `${BB_API_BASE}/linhas-credito?query=${encodeURIComponent(idea)}${area ? `&area=${encodeURIComponent(area)}` : ""}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${BB_API_KEY}` } });
    if (!r.ok) throw new Error(`BB HTTP ${r.status}`);
    const data = await r.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.map((it: any, idx: number) => ({
      id: it.id?.toString?.() || `${Date.now()}-bb-${idx}`,
      name: it.name || it.title || "Linha BB",
      agency: it.agency || "Banco do Brasil",
      value: it.value || it.amount || "—",
      deadline: it.deadline || it.due_date || "",
      area: it.area || it.category || "Infraestrutura",
      link: it.link || it.url || "",
      score: typeof it.score === "number" ? it.score : 0,
      summary: it.summary || it.description || "",
      source: "bb" as const,
    }));
  } catch (e) {
    console.error("Erro BB:", e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, area, providers } = await req.json().catch(() => ({ idea: "", area: undefined, providers: undefined }));

    if (!idea || typeof idea !== "string") {
      return new Response(JSON.stringify({ error: "Parâmetro 'idea' é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selected: ("perplexity" | "bndes" | "caixa" | "bb")[] = Array.isArray(providers) && providers.length
      ? providers
      : ["perplexity"]; // padrão

    console.log("🔎 Buscando oportunidades:", { area, providers: selected });

    const tasks: Promise<NormalizedOpportunity[]>[] = [];
    if (selected.includes("perplexity")) tasks.push(fetchPerplexity(idea, area));
    if (selected.includes("bndes")) tasks.push(fetchBNDES(idea, area));
    if (selected.includes("caixa")) tasks.push(fetchCaixa(idea, area));
    if (selected.includes("bb")) tasks.push(fetchBB(idea, area));

    const results = (await Promise.all(tasks)).flat();

    // Simple de-dup by link+name
    const seen = new Set<string>();
    const unique = results.filter((r) => {
      const key = `${r.link}|${r.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return new Response(JSON.stringify({ opportunities: unique }), {
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