import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WeeklyComparisonCardProps {
  politicianName: string;
  className?: string;
}

export function WeeklyComparisonCard({ politicianName, className = "" }: WeeklyComparisonCardProps) {
  const [currentWeekCount, setCurrentWeekCount] = useState<number | null>(null);
  const [previousWeekCount, setPreviousWeekCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchCounts() {
      setLoading(true);
      const now = new Date();
      const currentStart = new Date(now);
      currentStart.setDate(now.getDate() - 7);
      const previousStart = new Date(now);
      previousStart.setDate(now.getDate() - 14);

      const [currentRes, previousRes] = await Promise.all([
        supabase
          .from("social_mentions")
          .select("id", { count: "exact", head: true })
          .eq("politician_name", politicianName)
          .gte("timestamp", currentStart.toISOString())
          .lte("timestamp", now.toISOString()),
        supabase
          .from("social_mentions")
          .select("id", { count: "exact", head: true })
          .eq("politician_name", politicianName)
          .gte("timestamp", previousStart.toISOString())
          .lt("timestamp", currentStart.toISOString()),
      ]);

      if (!isMounted) return;

      setCurrentWeekCount(currentRes.count ?? 0);
      setPreviousWeekCount(previousRes.count ?? 0);
      setLoading(false);
    }

    fetchCounts();
    return () => {
      isMounted = false;
    };
  }, [politicianName]);

  const { deltaPct, trendIcon, trendColor } = useMemo(() => {
    const current = currentWeekCount ?? 0;
    const prev = previousWeekCount ?? 0;

    if (prev === 0 && current === 0) {
      return { deltaPct: 0, trendIcon: <Minus className="h-5 w-5 text-muted-foreground" />, trendColor: "text-muted-foreground" };
    }

    const change = prev === 0 ? 100 : ((current - prev) / prev) * 100;
    const pct = Math.round(change);

    if (pct > 0) {
      return { deltaPct: pct, trendIcon: <TrendingUp className="h-5 w-5 text-success" />, trendColor: "text-success" };
    }
    if (pct < 0) {
      return { deltaPct: pct, trendIcon: <TrendingDown className="h-5 w-5 text-destructive" />, trendColor: "text-destructive" };
    }
    return { deltaPct: 0, trendIcon: <Minus className="h-5 w-5 text-muted-foreground" />, trendColor: "text-muted-foreground" };
  }, [currentWeekCount, previousWeekCount]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Comparativo com Última Semana</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Menções (7 dias)</div>
              <div className="text-2xl font-semibold">{currentWeekCount}</div>
              <div className="text-xs text-muted-foreground">Semana anterior: {previousWeekCount}</div>
            </div>
            <div className="flex items-center gap-2">
              {trendIcon}
              <span className={`text-sm font-medium ${trendColor}`}>{deltaPct > 0 ? "+" : ""}{deltaPct}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
