import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, MessageCircle, Clock, X, Bell, BellOff, Eye } from 'lucide-react';
import { useSocialMentions } from '@/hooks/useSocialMonitor';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AlertData {
  id: string;
  type: 'spike' | 'negative_trend' | 'high_engagement' | 'sentiment_shift';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  politician?: string;
  data?: any;
  acknowledged?: boolean;
}

interface AlertsPanelProps {
  selectedPolitician?: string;
  className?: string;
}

export function AlertsPanel({ selectedPolitician, className = "" }: AlertsPanelProps) {
  const { data: mentions = [] } = useSocialMentions(
    selectedPolitician === "all" ? undefined : selectedPolitician
  );
  
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const generatedAlerts = generateAutomaticAlerts();
    setAlerts(generatedAlerts);
  }, [mentions.length]); // Usar length para evitar loop infinito

  const generateAutomaticAlerts = (): AlertData[] => {
    const alerts: AlertData[] = [];
    const now = new Date();
    
    // Analisar últimas 24h vs 24h anteriores
    const last24h = mentions.filter(m => 
      new Date(m.timestamp) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
    );
    const previous24h = mentions.filter(m => {
      const mentionTime = new Date(m.timestamp);
      return mentionTime <= new Date(now.getTime() - 24 * 60 * 60 * 1000) &&
             mentionTime > new Date(now.getTime() - 48 * 60 * 60 * 1000);
    });

    // 1. Detectar picos de atividade
    if (last24h.length > previous24h.length * 1.5 && last24h.length > 5) {
      alerts.push({
        id: 'spike-' + Date.now(),
        type: 'spike',
        title: 'Pico de Atividade Detectado',
        message: `Aumento de ${Math.round(((last24h.length - previous24h.length) / previous24h.length) * 100)}% nas menções nas últimas 24h`,
        severity: last24h.length > previous24h.length * 2 ? 'high' : 'medium',
        timestamp: now.toISOString(),
        data: { current: last24h.length, previous: previous24h.length }
      });
    }

    // 2. Detectar tendência negativa
    const negativeRecent = last24h.filter(m => m.sentiment === 'negative').length;
    const negativeRatio = negativeRecent / last24h.length;
    
    if (negativeRatio > 0.6 && last24h.length > 3) {
      alerts.push({
        id: 'negative-' + Date.now(),
        type: 'negative_trend',
        title: 'Alta Concentração de Sentimento Negativo',
        message: `${Math.round(negativeRatio * 100)}% das menções recentes são negativas`,
        severity: negativeRatio > 0.8 ? 'critical' : 'high',
        timestamp: now.toISOString(),
        data: { ratio: negativeRatio, count: negativeRecent }
      });
    }

    // 3. Detectar alto engajamento
    const highEngagementMentions = last24h.filter(m => m.engagement_score > 100);
    if (highEngagementMentions.length > 0) {
      const maxEngagement = Math.max(...highEngagementMentions.map(m => m.engagement_score));
      alerts.push({
        id: 'engagement-' + Date.now(),
        type: 'high_engagement',
        title: 'Menção com Alto Engajamento',
        message: `Detectada menção viral com ${maxEngagement} interações`,
        severity: maxEngagement > 500 ? 'high' : 'medium',
        timestamp: now.toISOString(),
        data: { maxEngagement, count: highEngagementMentions.length }
      });
    }

    // 4. Detectar mudança brusca de sentimento
    if (mentions.length > 10) {
      const recentSentiments = last24h.map(m => m.sentiment);
      const previousSentiments = previous24h.map(m => m.sentiment);
      
      const recentPositive = recentSentiments.filter(s => s === 'positive').length / recentSentiments.length;
      const previousPositive = previousSentiments.filter(s => s === 'positive').length / (previousSentiments.length || 1);
      
      const sentimentChange = Math.abs(recentPositive - previousPositive);
      
      if (sentimentChange > 0.3) {
        alerts.push({
          id: 'sentiment-shift-' + Date.now(),
          type: 'sentiment_shift',
          title: 'Mudança Significativa no Sentimento',
          message: `Sentimento mudou ${recentPositive > previousPositive ? 'positivamente' : 'negativamente'} em ${Math.round(sentimentChange * 100)}%`,
          severity: sentimentChange > 0.5 ? 'high' : 'medium',
          timestamp: now.toISOString(),
          data: { change: sentimentChange, direction: recentPositive > previousPositive ? 'positive' : 'negative' }
        });
      }
    }

    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-900';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-900';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-900';
      default: return 'border-blue-500 bg-blue-50 text-blue-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'medium': return <MessageCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const removeAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const displayAlerts = showAll ? alerts : activeAlerts.slice(0, 5);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Alertas e Monitoramento
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activeAlerts.length} ativo{activeAlerts.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {showAll ? 'Ocultar resolvidos' : 'Ver todos'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {displayAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum alerta ativo no momento</p>
            <p className="text-sm">O sistema está monitorando em tempo real</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAlerts.map((alert) => (
              <Alert key={alert.id} className={`${getSeverityColor(alert.severity)} ${alert.acknowledged ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity.toUpperCase()}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge variant="secondary" className="text-xs">
                            Resolvido
                          </Badge>
                        )}
                      </div>
                      <AlertDescription className="text-sm">
                        {alert.message}
                      </AlertDescription>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(alert.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!alert.acknowledged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAlert(alert.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}