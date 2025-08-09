import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useSocialMentions } from '@/hooks/useSocialMonitor';
import { chartTheme } from '@/lib/chartTheme';

interface SentimentLineChartProps {
  selectedPolitician?: string;
  timeframe?: string;
  className?: string;
}

export function SentimentLineChart({ 
  selectedPolitician, 
  timeframe = "7d",
  className = ""
}: SentimentLineChartProps) {
  const { data: mentions = [] } = useSocialMentions(
    selectedPolitician === "all" ? undefined : selectedPolitician
  );

  // Processar dados para o gráfico
  const processChartData = () => {
    const days = timeframe === "24h" ? 1 : timeframe === "7d" ? 7 : 30;
    const dataMap = new Map();

    // Inicializar dados para os últimos N dias
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      dataMap.set(dateKey, {
        date: dateKey,
        dateLabel: date.toLocaleDateString('pt-BR', { 
          month: 'short', 
          day: 'numeric' 
        }),
        positive: 0,
        negative: 0,
        neutral: 0,
        total: 0
      });
    }

    // Processar menções
    mentions.forEach(mention => {
      const dateKey = mention.timestamp.split('T')[0];
      if (dataMap.has(dateKey)) {
        const dayData = dataMap.get(dateKey);
        dayData[mention.sentiment]++;
        dayData.total++;
      }
    });

    return Array.from(dataMap.values());
  };

  const chartData = processChartData();

  // Calcular tendências
  const calculateTrend = (sentiment: 'positive' | 'negative' | 'neutral') => {
    if (chartData.length < 2) return { value: 0, direction: 'stable' };
    
    const recent = chartData.slice(-3);
    const older = chartData.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, day) => sum + day[sentiment], 0) / recent.length;
    const olderAvg = older.reduce((sum, day) => sum + day[sentiment], 0) / older.length || 1;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    return {
      value: Math.abs(change),
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable'
    };
  };

  const trends = {
    positive: calculateTrend('positive'),
    negative: calculateTrend('negative'),
    neutral: calculateTrend('neutral')
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{data.dateLabel}</p>
          <div className="space-y-1">
            <p className="text-sm text-success">
              Positivo: <span className="font-medium">{data.positive}</span>
            </p>
            <p className="text-sm text-destructive">
              Negativo: <span className="font-medium">{data.negative}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Neutro: <span className="font-medium">{data.neutral}</span>
            </p>
            <hr className="my-1" />
            <p className="text-sm font-medium">
              Total: {data.total}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const TrendIcon = ({ direction }: { direction: string }) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-success" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-destructive" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Análise de Sentimento ao Longo do Tempo
          </CardTitle>
          
          {/* Indicadores de Tendência */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <TrendIcon direction={trends.positive.direction} />
              <span className="text-xs text-success">
                Positivo {trends.positive.value.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrendIcon direction={trends.negative.direction} />
              <span className="text-xs text-destructive">
                Negativo {trends.negative.value.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} className="opacity-30" />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 12, fill: chartTheme.axis.tick }}
                tickLine={false}
                axisLine={{ stroke: chartTheme.axis.stroke }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: chartTheme.axis.tick }}
                tickLine={false}
                axisLine={{ stroke: chartTheme.axis.stroke }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
              />
              <Line 
                type="monotone" 
                dataKey="positive" 
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--success))', strokeWidth: 2 }}
                name="Positivo"
              />
              <Line 
                type="monotone" 
                dataKey="negative" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--destructive))', strokeWidth: 2 }}
                name="Negativo"
              />
              <Line 
                type="monotone" 
                dataKey="neutral" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 }}
                name="Neutro"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Resumo Estatístico */}
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {chartData.reduce((sum, day) => sum + day.positive, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Menções Positivas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {chartData.reduce((sum, day) => sum + day.negative, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Menções Negativas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {chartData.reduce((sum, day) => sum + day.neutral, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Menções Neutras</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}