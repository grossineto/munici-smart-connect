import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Star, TrendingUp, MessageCircle, Heart, AlertTriangle, ExternalLink } from 'lucide-react';
import { useSocialMentions } from '@/hooks/useSocialMonitor';

interface TimelineEvent {
  id: string;
  type: 'highlight' | 'alert' | 'milestone' | 'trend';
  title: string;
  description: string;
  timestamp: string;
  politician?: string;
  platform?: string;
  engagement?: number;
  sentiment?: string;
  url?: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

interface SocialTimelineProps {
  selectedPolitician?: string;
  timeframe?: string;
  className?: string;
}

export function SocialTimeline({ 
  selectedPolitician, 
  timeframe = "7d",
  className = ""
}: SocialTimelineProps) {
  const { data: mentions = [] } = useSocialMentions(
    selectedPolitician === "all" ? undefined : selectedPolitician
  );

  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // 1. Detectar menções com alto engajamento (destaques)
    const highEngagementMentions = mentions
      .filter(m => m.engagement_score > 50)
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, 10);

    highEngagementMentions.forEach((mention, index) => {
      events.push({
        id: `highlight-${mention.id}`,
        type: 'highlight',
        title: `Menção Viral - ${mention.politician_name}`,
        description: mention.content.substring(0, 120) + '...',
        timestamp: mention.timestamp,
        politician: mention.politician_name,
        platform: mention.platform,
        engagement: mention.engagement_score,
        sentiment: mention.sentiment,
        url: mention.url,
        importance: mention.engagement_score > 200 ? 'critical' : 
                   mention.engagement_score > 100 ? 'high' : 'medium'
      });
    });

    // 2. Detectar marcos (milestones)
    const dailyMentions = mentions.reduce((acc, mention) => {
      const date = mention.timestamp.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(dailyMentions)
      .filter(([_, count]) => count >= 10)
      .forEach(([date, count]) => {
        events.push({
          id: `milestone-${date}`,
          type: 'milestone',
          title: `Marco de Atividade Alcançado`,
          description: `${count} menções registradas em um dia`,
          timestamp: `${date}T12:00:00Z`,
          importance: count > 20 ? 'high' : 'medium'
        });
      });

    // 3. Detectar tendências de sentimento
    const sentimentByDay = mentions.reduce((acc, mention) => {
      const date = mention.timestamp.split('T')[0];
      if (!acc[date]) acc[date] = { positive: 0, negative: 0, neutral: 0, total: 0 };
      acc[date][mention.sentiment as keyof typeof acc[string]]++;
      acc[date].total++;
      return acc;
    }, {} as Record<string, { positive: number; negative: number; neutral: number; total: number }>);

    Object.entries(sentimentByDay)
      .filter(([_, data]) => data.total >= 5)
      .forEach(([date, data]) => {
        const negativeRatio = data.negative / data.total;
        const positiveRatio = data.positive / data.total;
        
        if (negativeRatio > 0.7) {
          events.push({
            id: `alert-negative-${date}`,
            type: 'alert',
            title: `Tendência Negativa Detectada`,
            description: `${Math.round(negativeRatio * 100)}% das menções foram negativas`,
            timestamp: `${date}T18:00:00Z`,
            importance: negativeRatio > 0.8 ? 'critical' : 'high'
          });
        } else if (positiveRatio > 0.7) {
          events.push({
            id: `trend-positive-${date}`,
            type: 'trend',
            title: `Tendência Positiva`,
            description: `${Math.round(positiveRatio * 100)}% das menções foram positivas`,
            timestamp: `${date}T18:00:00Z`,
            importance: 'medium'
          });
        }
      });

    // 4. Detectar picos de atividade
    const hourlyMentions = mentions.reduce((acc, mention) => {
      const hour = new Date(mention.timestamp).toISOString().slice(0, 13);
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(hourlyMentions)
      .filter(([_, count]) => count >= 5)
      .forEach(([hour, count]) => {
        events.push({
          id: `spike-${hour}`,
          type: 'trend',
          title: `Pico de Atividade`,
          description: `${count} menções em uma hora`,
          timestamp: `${hour}:30:00Z`,
          importance: count > 10 ? 'high' : 'medium'
        });
      });

    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }, [mentions]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'highlight': return <Star className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'milestone': return <TrendingUp className="h-4 w-4" />;
      case 'trend': return <MessageCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string, importance: string) => {
    if (importance === 'critical') return 'border-red-500 bg-red-50 text-red-900';
    if (importance === 'high') return 'border-orange-500 bg-orange-50 text-orange-900';
    
    switch (type) {
      case 'highlight': return 'border-yellow-500 bg-yellow-50 text-yellow-900';
      case 'alert': return 'border-red-500 bg-red-50 text-red-900';
      case 'milestone': return 'border-green-500 bg-green-50 text-green-900';
      case 'trend': return 'border-blue-500 bg-blue-50 text-blue-900';
      default: return 'border-gray-500 bg-gray-50 text-gray-900';
    }
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'critical': return <Badge variant="destructive" className="text-xs">CRÍTICO</Badge>;
      case 'high': return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">ALTO</Badge>;
      case 'medium': return <Badge variant="secondary" className="text-xs">MÉDIO</Badge>;
      default: return <Badge variant="outline" className="text-xs">BAIXO</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    } else {
      return 'Agora mesmo';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Timeline de Eventos
          <Badge variant="secondary">
            {timelineEvents.length} eventos
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {timelineEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum evento relevante detectado</p>
            <p className="text-sm">Aguardando atividade para análise</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {timelineEvents.map((event, index) => (
              <div key={event.id} className="relative">
                {/* Linha temporal */}
                {index < timelineEvents.length - 1 && (
                  <div className="absolute left-6 top-12 w-px h-8 bg-border"></div>
                )}
                
                <div className={`
                  flex items-start gap-4 p-4 rounded-lg border-l-4 
                  ${getEventColor(event.type, event.importance)}
                `}>
                  <div className="flex-shrink-0 p-2 rounded-full bg-background border">
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{event.title}</h4>
                      {getImportanceBadge(event.importance)}
                      {event.platform && (
                        <Badge variant="outline" className="text-xs">
                          {event.platform}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm mb-2">{event.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatTimestamp(event.timestamp)}</span>
                        {event.politician && (
                          <span>👤 {event.politician}</span>
                        )}
                        {event.engagement && (
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {event.engagement}
                          </div>
                        )}
                      </div>
                      
                      {event.url && (
                        <Button variant="ghost" size="sm" asChild className="h-6 w-6 p-0">
                          <a href={event.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}