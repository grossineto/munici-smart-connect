import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSocialMentions } from "@/hooks/useSocialMonitor";
import { TrendingUp, Heart, AlertTriangle, Twitter, Instagram, Facebook, Music, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface PoliticianMiniDashboardProps {
  politicianName: string;
}

export function PoliticianMiniDashboard({ politicianName }: PoliticianMiniDashboardProps) {
  // Buscar menções das últimas 24h
  const { data: mentions24h = [] } = useSocialMentions(politicianName, undefined, 100);
  
  // Buscar menções dos últimos 2 dias para comparação
  const { data: mentions48h = [] } = useSocialMentions(politicianName, undefined, 200);

  // Filtrar apenas menções das últimas 24h
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dayBeforeYesterday = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const recent24h = mentions24h.filter(m => new Date(m.timestamp) > yesterday);
  const previous24h = mentions48h.filter(m => 
    new Date(m.timestamp) > dayBeforeYesterday && new Date(m.timestamp) <= yesterday
  );

  // 1. Total de Menções nas Últimas 24h
  const totalMentions24h = recent24h.length;

  // 2. Engajamento Total
  const totalEngagement = recent24h.reduce((sum, mention) => sum + (mention.engagement_score || 0), 0);

  // 3. Sentimento Médio
  const sentimentCounts = recent24h.reduce((acc, mention) => {
    acc[mention.sentiment] = (acc[mention.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalSentimentMentions = Object.values(sentimentCounts).reduce((sum, count) => sum + count, 0);
  const positivePercentage = totalSentimentMentions > 0 ? (sentimentCounts.positive || 0) / totalSentimentMentions * 100 : 0;
  const negativePercentage = totalSentimentMentions > 0 ? (sentimentCounts.negative || 0) / totalSentimentMentions * 100 : 0;

  // 4. Alerta de Pico de Atividade
  const increasePercentage = previous24h.length > 0 
    ? ((totalMentions24h - previous24h.length) / previous24h.length) * 100 
    : totalMentions24h > 0 ? 100 : 0;
  
  const hasActivitySpike = increasePercentage > 50;

  // 5. Rede Social Mais Ativa
  const platformCounts = recent24h.reduce((acc, mention) => {
    acc[mention.platform] = (acc[mention.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topPlatform = Object.entries(platformCounts).sort(([,a], [,b]) => b - a)[0];
  const topPlatformPercentage = topPlatform && totalMentions24h > 0 
    ? (topPlatform[1] / totalMentions24h * 100).toFixed(0) 
    : 0;

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'twitter': return <Twitter className="h-4 w-4 text-blue-500" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'facebook': return <Facebook className="h-4 w-4 text-blue-600" />;
      case 'tiktok': return <Music className="h-4 w-4 text-gray-900" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (positive: number, negative: number) => {
    if (positive > negative * 1.5) return "text-green-600";
    if (negative > positive * 1.5) return "text-red-600";
    return "text-yellow-600";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total de Menções 24h */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Menções 24h
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMentions24h}</div>
          <p className="text-xs text-muted-foreground">
            {previous24h.length > 0 && (
              <span className={cn(
                increasePercentage > 0 ? "text-green-600" : increasePercentage < 0 ? "text-red-600" : "text-gray-600"
              )}>
                {increasePercentage > 0 ? "+" : ""}{increasePercentage.toFixed(0)}% vs ontem
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* 2. Engajamento Total */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Heart className="h-4 w-4" />
            Engajamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEngagement.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            likes + comentários + shares
          </p>
        </CardContent>
      </Card>

      {/* 3. Sentimento Médio */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Sentimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold", getSentimentColor(positivePercentage, negativePercentage))}>
            {positivePercentage.toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground">
            positivo ({negativePercentage.toFixed(0)}% negativo)
          </p>
        </CardContent>
      </Card>

      {/* 4. Alerta de Pico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <AlertTriangle className={cn("h-4 w-4", hasActivitySpike ? "text-orange-500" : "text-gray-400")} />
            Pico de Atividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasActivitySpike ? (
            <>
              <div className="text-2xl font-bold text-orange-600">ALERTA</div>
              <p className="text-xs text-orange-600">
                +{increasePercentage.toFixed(0)}% de atividade
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-green-600">Normal</div>
              <p className="text-xs text-muted-foreground">
                Atividade estável
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* 5. Rede Mais Ativa */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Rede Mais Ativa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPlatform ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                {getPlatformIcon(topPlatform[0])}
                <span className="text-lg font-bold capitalize">{topPlatform[0]}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {topPlatformPercentage}% das menções
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-400">-</div>
              <p className="text-xs text-muted-foreground">
                Sem dados
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}