import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Activity } from 'lucide-react';
import { useSocialMentions } from '@/hooks/useSocialMonitor';

interface MentionHeatmapProps {
  selectedPolitician?: string;
  timeframe?: string;
  className?: string;
}

interface HeatmapData {
  hour: number;
  day: string;
  count: number;
  intensity: number;
  sentiment: { positive: number; negative: number; neutral: number };
}

export function MentionHeatmap({ 
  selectedPolitician, 
  timeframe = "7d",
  className = ""
}: MentionHeatmapProps) {
  const { data: mentions = [] } = useSocialMentions(
    selectedPolitician === "all" ? undefined : selectedPolitician
  );

  const heatmapData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Inicializar grid
    const grid: HeatmapData[][] = days.map(day => 
      hours.map(hour => ({
        hour,
        day,
        count: 0,
        intensity: 0,
        sentiment: { positive: 0, negative: 0, neutral: 0 }
      }))
    );

    // Processar menções
    mentions.forEach(mention => {
      const date = new Date(mention.timestamp);
      const dayIndex = date.getDay();
      const hour = date.getHours();
      
      const cell = grid[dayIndex][hour];
      cell.count++;
      cell.sentiment[mention.sentiment as keyof typeof cell.sentiment]++;
    });

    // Calcular intensidade
    const maxCount = Math.max(...grid.flat().map(cell => cell.count));
    grid.forEach(dayRow => {
      dayRow.forEach(cell => {
        cell.intensity = maxCount > 0 ? (cell.count / maxCount) * 100 : 0;
      });
    });

    return { grid, maxCount, totalMentions: mentions.length };
  }, [mentions]);

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-muted/30';
    if (intensity < 25) return 'bg-primary/20';
    if (intensity < 50) return 'bg-primary/40';
    if (intensity < 75) return 'bg-primary/60';
    return 'bg-primary/80';
  };

  const getDominantSentiment = (sentiment: { positive: number; negative: number; neutral: number }) => {
    const { positive, negative, neutral } = sentiment;
    if (positive > negative && positive > neutral) return 'positive';
    if (negative > positive && negative > neutral) return 'negative';
    return 'neutral';
  };

  const getSentimentBorder = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'border-success border-2';
      case 'negative': return 'border-destructive border-2';
      default: return 'border-muted-foreground/30 border';
    }
  };

  // Calcular estatísticas por período
  const hourlyStats = useMemo(() => {
    const stats = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      total: 0,
      positive: 0,
      negative: 0,
      neutral: 0
    }));

    heatmapData.grid.forEach(dayRow => {
      dayRow.forEach((cell, hour) => {
        stats[hour].total += cell.count;
        stats[hour].positive += cell.sentiment.positive;
        stats[hour].negative += cell.sentiment.negative;
        stats[hour].neutral += cell.sentiment.neutral;
      });
    });

    return stats;
  }, [heatmapData]);

  const peakHours = hourlyStats
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Heatmap Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Mapa de Calor de Atividade
            </CardTitle>
            <Badge variant="secondary">
              {heatmapData.totalMentions} menções totais
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Legenda */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Menos atividade</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-muted/30 rounded"></div>
                  <div className="w-3 h-3 bg-primary/20 rounded"></div>
                  <div className="w-3 h-3 bg-primary/40 rounded"></div>
                  <div className="w-3 h-3 bg-primary/60 rounded"></div>
                  <div className="w-3 h-3 bg-primary/80 rounded"></div>
                </div>
                <span className="text-muted-foreground">Mais atividade</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary/40 border-success border-2 rounded"></div>
                  <span>Positivo</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary/40 border-destructive border-2 rounded"></div>
                  <span>Negativo</span>
                </div>
              </div>
            </div>

            {/* Grade do Heatmap */}
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Header com horas */}
                <div className="flex">
                  <div className="w-12 h-6"></div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="w-6 h-6 text-xs text-center text-muted-foreground">
                      {i}
                    </div>
                  ))}
                </div>

                {/* Linhas do heatmap */}
                {heatmapData.grid.map((dayRow, dayIndex) => (
                  <div key={dayIndex} className="flex items-center">
                    <div className="w-12 h-6 text-xs text-muted-foreground pr-2 text-right">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayIndex]}
                    </div>
                    {dayRow.map((cell, hourIndex) => {
                      const dominantSentiment = getDominantSentiment(cell.sentiment);
                      return (
                        <div
                          key={hourIndex}
                          className={`
                            w-6 h-6 m-px rounded cursor-pointer transition-all duration-200 hover:scale-110
                            ${getIntensityColor(cell.intensity)}
                            ${cell.count > 0 ? getSentimentBorder(dominantSentiment) : ''}
                          `}
                          title={`${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayIndex]} ${hourIndex}h: ${cell.count} menções`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas dos Horários de Pico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Horários de Pico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {peakHours.map((hour, index) => (
              <div key={hour.hour} className="p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="font-semibold">{hour.hour}:00h</span>
                  </div>
                  <Badge variant="outline">
                    {hour.total} menções
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-success">Positivo:</span>
                    <span className="font-medium">{hour.positive}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-destructive">Negativo:</span>
                    <span className="font-medium">{hour.negative}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Neutro:</span>
                    <span className="font-medium">{hour.neutral}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}