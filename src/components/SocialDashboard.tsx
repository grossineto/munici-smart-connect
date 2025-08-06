
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Users, Heart, AlertTriangle, RefreshCw } from "lucide-react";
import { SocialMentionCard } from "./SocialMentionCard";
import { useSocialMentions, useSocialStats } from "@/hooks/useSocialMonitor";
import { Skeleton } from "@/components/ui/skeleton";

export function SocialDashboard() {
  const [selectedPolitician, setSelectedPolitician] = useState<string>("all");
  const [timeframe, setTimeframe] = useState("7d");
  
  const { data: mentions = [], isLoading: mentionsLoading } = useSocialMentions(
    selectedPolitician === "all" ? undefined : selectedPolitician
  );
  const { data: stats, isLoading: statsLoading } = useSocialStats(
    selectedPolitician === "all" ? undefined : selectedPolitician, 
    timeframe
  );

  const politicians = [
    "João Dória",
    "Rodrigo Garcia", 
    "Fernando Haddad",
    "Bruno Covas",
    "Ricardo Nunes"
  ];

  const platforms = [
    { id: "all", name: "Todas", icon: "📱" },
    { id: "twitter", name: "Twitter", icon: "𝕏" },
    { id: "instagram", name: "Instagram", icon: "📷" },
    { id: "facebook", name: "Facebook", icon: "👤" },
    { id: "tiktok", name: "TikTok", icon: "🎵" }
  ];

  const timeframes = [
    { value: "24h", label: "Últimas 24h" },
    { value: "7d", label: "Últimos 7 dias" },
    { value: "30d", label: "Últimos 30 dias" }
  ];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoramento de Redes Sociais</h2>
          <p className="text-muted-foreground">
            Acompanhe menções e posts de políticos em tempo real
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPolitician} onValueChange={setSelectedPolitician}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os políticos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os políticos</SelectItem>
              {politicians.map(politician => (
                <SelectItem key={politician} value={politician}>
                  {politician}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map(tf => (
                <SelectItem key={tf.value} value={tf.value}>
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Menções</p>
                <p className="text-2xl font-bold">{stats?.totalMentions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Heart className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Engajamento Total</p>
                <p className="text-2xl font-bold">
                  {stats?.engagementTotal ? (stats.engagementTotal >= 1000 ? 
                    `${(stats.engagementTotal / 1000).toFixed(1)}K` : 
                    stats.engagementTotal) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Users className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sentimento Positivo</p>
                <p className="text-2xl font-bold text-success">
                  {stats?.positiveCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sentimento Negativo</p>
                <p className="text-2xl font-bold text-destructive">
                  {stats?.negativeCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs por plataforma */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-md">
          {platforms.map(platform => (
            <TabsTrigger key={platform.id} value={platform.id} className="text-sm">
              <span className="mr-1">{platform.icon}</span>
              {platform.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {platforms.map(platform => (
          <TabsContent key={platform.id} value={platform.id} className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>{platform.icon}</span>
                    Menções no {platform.name}
                    {platform.id !== "all" && stats?.platformBreakdown[platform.id] && (
                      <Badge variant="secondary">
                        {stats.platformBreakdown[platform.id]}
                      </Badge>
                    )}
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {mentionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : mentions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma menção encontrada para este período</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mentions
                      .filter(mention => platform.id === "all" || mention.platform === platform.id)
                      .map(mention => (
                        <SocialMentionCard key={mention.id} mention={mention} />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
