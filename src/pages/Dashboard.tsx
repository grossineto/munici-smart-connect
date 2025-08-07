
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Newspaper, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePoliticians } from "@/contexts/PoliticiansContext";
import { PoliticianMiniDashboard } from "@/components/PoliticianMiniDashboard";
import { NewsSummaryCards } from "@/components/NewsSummaryCards";
import { TrendingTopics } from "@/components/TrendingTopics";
import { WeeklyComparisonCard } from "@/components/WeeklyComparisonCard";
import { CrisisAlertsCard } from "@/components/CrisisAlertsCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { politicians, getActivePoliticians } = usePoliticians();

  // Prefeitos(as) primeiro
  const mayorCandidates = useMemo(
    () => politicians.filter((p) => (p.cargo || "").toLowerCase().includes("prefeit")),
    [politicians]
  );

  const defaultId = useMemo(() => {
    return (
      mayorCandidates[0]?.id ||
      getActivePoliticians("social")[0]?.id ||
      politicians[0]?.id ||
      ""
    );
  }, [mayorCandidates, getActivePoliticians, politicians]);

  const [selectedId, setSelectedId] = useState<string>(defaultId);
  const selected = useMemo(() => politicians.find((p) => p.id === selectedId), [politicians, selectedId]);

  useEffect(() => {
    // SEO: title + meta description + canonical
    document.title = `Dashboard - ${selected?.nome || "BR.I.A.N."}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", `Painel do prefeito ${selected?.nome || ""}: notícias, redes e Omnichannel.`);
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link!.setAttribute("href", window.location.href);
  }, [selected?.nome]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitorando: {selected?.nome} {selected ? `• ${selected.cidade} - ${selected.uf}` : ""}
        </p>
      </header>

      {/* Seletor de Prefeito */}
      <section className="grid gap-3 md:grid-cols-2 items-end">
        <div>
          <label className="block text-sm text-muted-foreground mb-2">Selecionar prefeito(a)</label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha o prefeito" />
            </SelectTrigger>
            <SelectContent>
              {mayorCandidates.length > 0 ? (
                mayorCandidates.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome} • {p.cidade}/{p.uf}</SelectItem>
                ))
              ) : (
                politicians.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome} • {p.cidade}/{p.uf}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Visão rápida (Social) */}
      {selected && (
        <>
          <section>
            <PoliticianMiniDashboard politicianName={selected.nome} />
          </section>
          <section className="mt-4">
            <NewsSummaryCards politicianName={selected.nome} city={selected.cidade} uf={selected.uf} />
          </section>
          <section className="mt-4 grid gap-4 md:grid-cols-3">
            <CrisisAlertsCard />
            <WeeklyComparisonCard politicianName={selected.nome} />
            <div className="md:col-span-3">
              <TrendingTopics selectedPolitician={selected.nome} timeframe="24h" />
            </div>
          </section>
        </>
      )}

      {/* Blocos de Notícias e Omnichannel */}
      <main className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Monitoramento de Notícias</CardTitle>
                <CardDescription>Resumo e análises sobre {selected?.nome}</CardDescription>
              </div>
              <Newspaper className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Integração ativa com coleta de notícias. Acesse a visualização detalhada para ver matérias, veículos e sentimento.
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate("/news-monitoring")}>Ver notícias</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Omnichannel</CardTitle>
                <CardDescription>Atendimento automatizado por IA (white label)</CardDescription>
              </div>
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Preparado para integrar com a plataforma de IA. Esta área consolidará conversas e indicadores por canal para {selected?.nome}.
            </p>
            <Button className="w-full" onClick={() => navigate("/whatsapp")}>Abrir Omnichannel</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
