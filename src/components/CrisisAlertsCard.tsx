import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface CrisisAlertsCardProps {
  timeframeDays?: number;
  className?: string;
}

export function CrisisAlertsCard({ timeframeDays = 7, className = "" }: CrisisAlertsCardProps) {
  const [activeAlerts, setActiveAlerts] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchAlerts() {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - timeframeDays);

      // Contar alertas de notícias não reconhecidos (ativos) no período
      const { count } = await supabase
        .from("news_alerts")
        .select("id", { count: "exact", head: true })
        .eq("acknowledged", false)
        .gte("created_at", since.toISOString());

      if (!isMounted) return;
      setActiveAlerts(count ?? 0);
      setLoading(false);
    }

    fetchAlerts();
    return () => {
      isMounted = false;
    };
  }, [timeframeDays]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Alertas Ativos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div>
            <div className="text-3xl font-semibold">{activeAlerts}</div>
            <div className="text-xs text-muted-foreground">Últimos {timeframeDays} dias</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
