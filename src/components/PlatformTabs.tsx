import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Twitter, Instagram, Facebook, Music, RefreshCw, Users } from "lucide-react";
import { SocialMentionCard } from "./SocialMentionCard";
import { useSocialMentions, useSocialStats } from "@/hooks/useSocialMonitor";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
interface PlatformTabsProps {
  selectedPolitician?: string;
  timeframe?: string;
  onRefresh?: () => void;
  className?: string;
}

export function PlatformTabs({ 
  selectedPolitician, 
  timeframe = "7d", 
  onRefresh,
  className = "" 
}: PlatformTabsProps) {
  const { data: mentions = [], isLoading: mentionsLoading } = useSocialMentions(
    selectedPolitician === "all" ? undefined : selectedPolitician
  );
  const { data: stats } = useSocialStats(
    selectedPolitician === "all" ? undefined : selectedPolitician, 
    timeframe
  );

  const [typeFilter, setTypeFilter] = useState<'all' | 'post' | 'mention'>('all');

  const platforms = [
    { 
      id: "all", 
      name: "Todas", 
      icon: Users, 
      color: "hsl(var(--primary))",
      bgColor: "bg-primary/10",
      textColor: "text-primary"
    },
    { 
      id: "twitter", 
      name: "Twitter", 
      icon: Twitter, 
      color: "hsl(203 89% 53%)",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-600"
    },
    { 
      id: "instagram", 
      name: "Instagram", 
      icon: Instagram, 
      color: "hsl(320 100% 50%)",
      bgColor: "bg-pink-500/10",
      textColor: "text-pink-600"
    },
    { 
      id: "facebook", 
      name: "Facebook", 
      icon: Facebook, 
      color: "hsl(221 83% 53%)",
      bgColor: "bg-blue-600/10",
      textColor: "text-blue-700"
    },
    { 
      id: "tiktok", 
      name: "TikTok", 
      icon: Music, 
      color: "hsl(0 0% 0%)",
      bgColor: "bg-gray-900/10",
      textColor: "text-gray-900"
    }
  ];

  return (
    <div className={className}>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto mb-6 h-12">
          {platforms.map(platform => {
            const IconComponent = platform.icon;
            const count = platform.id === "all" 
              ? stats?.totalMentions || 0
              : stats?.platformBreakdown?.[platform.id] || 0;
            
            return (
              <TabsTrigger 
                key={platform.id} 
                value={platform.id} 
                className="flex flex-col gap-1 p-2 data-[state=active]:bg-background"
              >
                <div className="flex items-center gap-2">
                  <IconComponent 
                    className="h-4 w-4" 
                    style={{ color: platform.color }}
                  />
                  <span className="text-sm font-medium">{platform.name}</span>
                </div>
                {count > 0 && (
                  <Badge variant="secondary" className="text-xs h-4">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {platforms.map(platform => {
          const IconComponent = platform.icon;
          let filteredMentions = platform.id === "all" 
            ? mentions 
            : mentions.filter(mention => mention.platform === platform.id);
          if (typeFilter !== 'all') {
            filteredMentions = filteredMentions.filter(m => 
              typeFilter === 'post' ? m.mention_type === 'post' : m.mention_type === 'mention'
            );
          }
          const count = filteredMentions.length;

          return (
            <TabsContent key={platform.id} value={platform.id} className="mt-0">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${platform.bgColor}`}>
                        <IconComponent 
                          className={`h-5 w-5 ${platform.textColor}`}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          Menções no {platform.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {count === 0 ? 'Nenhuma menção encontrada' : `${count} menções encontradas`}
                        </p>
                      </div>
                      {count > 0 && (
                        <Badge variant="outline" className="ml-2">
                          {count}
                        </Badge>
                      )}
                    </CardTitle>
                    
                    <div className="flex items-center gap-2">
                      <ToggleGroup
                        type="single"
                        value={typeFilter}
                        onValueChange={(v) => v && setTypeFilter(v as 'all' | 'post' | 'mention')}
                        className="mr-2"
                      >
                        <ToggleGroupItem value="all" aria-label="Todos">Todos</ToggleGroupItem>
                        <ToggleGroupItem value="post" aria-label="Do político">Do político</ToggleGroupItem>
                        <ToggleGroupItem value="mention" aria-label="Menções">Menções</ToggleGroupItem>
                      </ToggleGroup>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={onRefresh}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Atualizar
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {mentionsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : filteredMentions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${platform.bgColor} flex items-center justify-center`}>
                        <IconComponent className={`h-8 w-8 ${platform.textColor} opacity-50`} />
                      </div>
                      <h4 className="text-lg font-medium mb-2">
                        Nenhuma menção encontrada
                      </h4>
                      <p className="text-muted-foreground mb-4">
                        Não há menções para este período no {platform.name}
                      </p>
                      <Button variant="outline" onClick={onRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tentar novamente
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredMentions.map(mention => (
                        <SocialMentionCard 
                          key={mention.id} 
                          mention={mention}
                          showPlatformBadge={platform.id === "all"}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}