import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Heart, Users, AlertTriangle, Twitter, Instagram, Facebook, Music } from "lucide-react";
import { useSocialStats } from "@/hooks/useSocialMonitor";

interface SocialMetricsGridProps {
  selectedPolitician?: string;
  timeframe?: string;
  className?: string;
}

export function SocialMetricsGrid({ 
  selectedPolitician, 
  timeframe = "7d",
  className = "" 
}: SocialMetricsGridProps) {
  const { data: stats, isLoading } = useSocialStats(
    selectedPolitician === "all" ? undefined : selectedPolitician, 
    timeframe
  );

  const metrics = [
    {
      title: "Total de Menções",
      value: stats?.totalMentions || 0,
      icon: TrendingUp,
      color: "primary",
      bgColor: "bg-primary/10",
      textColor: "text-primary",
      trend: "+12%",
      description: "Últimos 7 dias"
    },
    {
      title: "Engajamento Total",
      value: stats?.engagementTotal ? 
        (stats.engagementTotal >= 1000 ? 
          `${(stats.engagementTotal / 1000).toFixed(1)}K` : 
          stats.engagementTotal) : 0,
      icon: Heart,
      color: "accent",
      bgColor: "bg-pink-500/10",
      textColor: "text-pink-600",
      trend: "+8%",
      description: "Curtidas, comentários"
    },
    {
      title: "Sentimento Positivo",
      value: stats?.positiveCount || 0,
      icon: Users,
      color: "success",
      bgColor: "bg-success/10",
      textColor: "text-success",
      trend: "+5%",
      description: "Menções favoráveis"
    },
    {
      title: "Sentimento Negativo", 
      value: stats?.negativeCount || 0,
      icon: AlertTriangle,
      color: "destructive",
      bgColor: "bg-destructive/10",
      textColor: "text-destructive",
      trend: "-2%",
      description: "Requer atenção"
    }
  ];

  const platforms = [
    { 
      name: "Twitter", 
      icon: Twitter, 
      count: stats?.platformBreakdown?.twitter || 0,
      color: "hsl(203 89% 53%)"
    },
    { 
      name: "Instagram", 
      icon: Instagram, 
      count: stats?.platformBreakdown?.instagram || 0,
      color: "hsl(320 100% 50%)"
    },
    { 
      name: "Facebook", 
      icon: Facebook, 
      count: stats?.platformBreakdown?.facebook || 0,
      color: "hsl(221 83% 53%)"
    },
    { 
      name: "TikTok", 
      icon: Music, 
      count: stats?.platformBreakdown?.tiktok || 0,
      color: "hsl(0 0% 0%)"
    }
  ];

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-20"></div>
                  <div className="h-6 bg-muted rounded w-12"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-all duration-200 border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${metric.bgColor}`}>
                    <IconComponent className={`h-5 w-5 ${metric.textColor}`} />
                  </div>
                  <Badge 
                    variant={metric.trend.startsWith('+') ? "default" : "destructive"}
                    className="text-xs h-6"
                  >
                    {metric.trend}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">{metric.title}</p>
                  <p className="text-3xl font-bold tracking-tight">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status das Plataformas */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Status das Plataformas</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-sm text-muted-foreground">Todas conectadas</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {platforms.map((platform, index) => {
              const IconComponent = platform.icon;
              return (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg border">
                  <IconComponent 
                    className="h-4 w-4" 
                    style={{ color: platform.color }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{platform.name}</p>
                    <p className="text-xs text-muted-foreground">{platform.count} menções</p>
                  </div>
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}