import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, ThumbsUp, ThumbsDown, Activity } from "lucide-react";

export interface NewsSummaryCardsProps {
  politicianName?: string;
  city?: string;
  uf?: string;
  timeframeDays?: number; // optional timeframe filter
  className?: string;
}

interface NewsAnalysisRow {
  id: string;
  sentiment_score: number | null;
  created_at: string;
  news_articles?: { id: string; title: string | null; published_at: string | null } | null;
}

export const NewsSummaryCards: React.FC<NewsSummaryCardsProps> = ({
  politicianName,
  city,
  uf,
  timeframeDays = 30,
  className,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [rows, setRows] = useState<NewsAnalysisRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const since = new Date();
        since.setDate(since.getDate() - timeframeDays);

        const hasFilters = Boolean(politicianName || city || uf);

        let query = supabase
          .from("news_analysis" as any)
          .select(
            `id, sentiment_score, created_at,
             news_articles!inner ( id, title, published_at )`
          )
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: false })
          .limit(120);

        if (hasFilters) {
          const name = politicianName || "";
          const cityName = city || "";
          // Filtra por menções no resumo/impacto; títulos via join já restringem a artigos
          query = query.or(
            `summary.ilike.%${name}%,summary.ilike.%${cityName}%,impact_analysis.ilike.%${name}%,impact_analysis.ilike.%${cityName}%`
          );
        }

        const { data, error } = await query;
        if (error) {
          console.error("Erro ao carregar resumo de notícias:", error);
          setRows([]);
          return;
        }
        setRows((data as unknown as NewsAnalysisRow[]) || []);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Recarrega ao mudar filtros/timeframe
  }, [politicianName, city, uf, timeframeDays]);

  const { total, positive, negative, neutral, avg } = useMemo(() => {
    const total = rows.length;
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    let sum = 0;

    rows.forEach((r) => {
      const s = typeof r.sentiment_score === "number" ? r.sentiment_score : 0;
      sum += s;
      if (s > 0.3) positive += 1;
      else if (s < -0.3) negative += 1;
      else neutral += 1;
    });

    return { total, positive, negative, neutral, avg: total ? sum / total : 0 };
  }, [rows]);

  const overall = avg > 0.15 ? "Positivo" : avg < -0.15 ? "Negativo" : "Neutro";
  const overallColor = overall === "Positivo" ? "text-green-600" : overall === "Negativo" ? "text-red-600" : "text-muted-foreground";

  if (loading) {
    return (
      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className || ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <section aria-label="Resumo de Notícias" className={className}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Notícias</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">Últimos {timeframeDays} dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notícias Positivas</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positive}</div>
            <p className="text-xs text-muted-foreground">Classificadas por score &gt; 0.3</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notícias Negativas</CardTitle>
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{negative}</div>
            <p className="text-xs text-muted-foreground">Classificadas por score &lt; -0.3</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sentimento Geral</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallColor}`}>{overall}</div>
            <p className="text-xs text-muted-foreground">Média: {avg.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
