import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, AlertTriangle, Bell, TrendingUp, Eye, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SummaryModalProps {
  type: 'critical' | 'pending' | 'analyses' | 'sources';
  data: any[];
  isOpen: boolean;
  onClose: () => void;
}

export function SummaryModal({ type, data, isOpen, onClose }: SummaryModalProps) {
  const getTitle = () => {
    switch (type) {
      case 'critical': return '🚨 Alertas Críticos - Ação Imediata Necessária';
      case 'pending': return '⏰ Alertas Pendentes - Aguardando Verificação';
      case 'analyses': return '📊 Resumo das Análises de Hoje';
      case 'sources': return '📰 Fontes Ativas Monitoradas';
      default: return 'Resumo';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'pending': return <Bell className="h-6 w-6 text-orange-600" />;
      case 'analyses': return <TrendingUp className="h-6 w-6 text-blue-600" />;
      case 'sources': return <Eye className="h-6 w-6 text-green-600" />;
    }
  };

  const renderCriticalAlerts = () => (
    <div className="space-y-4">
      {data.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-green-600">Nenhuma Situação Crítica</h3>
          <p className="text-sm text-muted-foreground">Todas as situações estão sob controle</p>
        </div>
      ) : (
        data.map((alert) => (
          <Card key={alert.id} className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="destructive" className="animate-pulse">CRÍTICO</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-red-800">{alert.title}</h3>
              <p className="text-sm text-red-700 mb-3">{alert.message}</p>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Ação Imediata Necessária</span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderPendingAlerts = () => (
    <div className="space-y-4">
      {data.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-green-600">Todos Verificados</h3>
          <p className="text-sm text-muted-foreground">Não há alertas pendentes de verificação</p>
        </div>
      ) : (
        data.map((alert) => (
          <Card key={alert.id} className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">PENDENTE</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-orange-800">{alert.title}</h3>
              <p className="text-sm text-orange-700 mb-3">{alert.message}</p>
              {alert.news_articles?.url && (
                <Button size="sm" variant="outline" onClick={() => window.open(alert.news_articles.url, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Ver Notícia
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderAnalysesSummary = () => {
    const positive = data.filter(a => a.sentiment_score > 0.3);
    const negative = data.filter(a => a.sentiment_score < -0.3);
    const mayorMentions = data.filter(a => a.mentions_mayor);
    const urgent = data.filter(a => a.urgency_level === 'high' || a.urgency_level === 'critical');

    return (
      <div className="space-y-6">
        {/* Resumo Executivo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{positive.length}</div>
              <p className="text-sm text-green-600">😊 Positivas</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{negative.length}</div>
              <p className="text-sm text-red-600">😞 Negativas</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">{mayorMentions.length}</div>
              <p className="text-sm text-purple-600">👨‍💼 Ricardo Nunes</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-700">{urgent.length}</div>
              <p className="text-sm text-orange-600">🚨 Urgentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Principais Temas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 Principais Temas Identificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgent.length > 0 && (
                <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded">
                  <h4 className="font-semibold text-red-800">🚨 Situações Urgentes:</h4>
                  <ul className="text-sm text-red-700 mt-1">
                    {urgent.slice(0, 3).map((analysis, index) => (
                      <li key={index}>• {analysis.news_articles?.title?.substring(0, 60)}... 
                        <span className="text-xs text-red-600 ml-2">({analysis.news_articles?.author || 'Fonte desconhecida'})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {mayorMentions.length > 0 && (
                <div className="p-3 bg-purple-50 border-l-4 border-purple-400 rounded">
                  <h4 className="font-semibold text-purple-800">👨‍💼 Menções ao Prefeito Ricardo Nunes:</h4>
                  <ul className="text-sm text-purple-700 mt-1">
                    {mayorMentions.slice(0, 3).map((analysis, index) => (
                      <li key={index}>• {analysis.news_articles?.title?.substring(0, 60)}... 
                        <span className="text-xs text-purple-600 ml-2">({analysis.news_articles?.author || 'Fonte desconhecida'})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {positive.length > 0 && (
                <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                  <h4 className="font-semibold text-green-800">😊 Notícias Positivas:</h4>
                  <ul className="text-sm text-green-700 mt-1">
                    {positive.slice(0, 3).map((analysis, index) => (
                      <li key={index}>• {analysis.news_articles?.title?.substring(0, 60)}... 
                        <span className="text-xs text-green-600 ml-2">({analysis.news_articles?.author || 'Fonte desconhecida'})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSourcesSummary = () => {
    // Fontes reais detectadas nas análises
    const realSources = [...new Set(data.map(a => a.news_articles?.author).filter(Boolean))];
    const sourceStats = realSources.map(source => ({
      name: source,
      count: data.filter(a => a.news_articles?.author === source).length,
      positive: data.filter(a => a.news_articles?.author === source && a.sentiment_score > 0.3).length,
      negative: data.filter(a => a.news_articles?.author === source && a.sentiment_score < -0.3).length
    }));

    // Fontes configuradas para monitoramento
    const monitoredSources = [
      "Folha de S.Paulo", "G1 São Paulo", "CNN Brasil", "UOL",
      "Estado de S.Paulo", "Portal R7", "Band.com.br", "Globo.com",
      "Metrópoles", "Brasil 247", "Poder360", "Agência Brasil",
      "Gazeta do Povo", "Terra", "iG São Paulo"
    ];

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-blue-600">{monitoredSources.length}</div>
          <p className="text-muted-foreground">Fontes monitoradas em tempo real</p>
          <p className="text-xs text-muted-foreground mt-1">{realSources.length} com notícias hoje</p>
        </div>

        {/* Fontes Configuradas para Monitoramento */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg text-blue-800 mb-3">📺 Principais Veículos Monitorados</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {monitoredSources.map((source, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${realSources.includes(source) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className={realSources.includes(source) ? 'text-green-700 font-medium' : 'text-gray-600'}>
                    {source}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Estatísticas das Fontes Ativas */}
        {sourceStats.length > 0 && sourceStats.map((source, index) => (
          <Card key={index} className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-green-800">📰 {source.name}</h3>
                <Badge variant="outline" className="bg-white text-green-700">{source.count} notícias</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">{source.positive}</div>
                  <p className="text-xs text-green-600">Positivas</p>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{source.negative}</div>
                  <p className="text-xs text-red-600">Negativas</p>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-600">{source.count - source.positive - source.negative}</div>
                  <p className="text-xs text-gray-600">Neutras</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'critical': return renderCriticalAlerts();
      case 'pending': return renderPendingAlerts();
      case 'analyses': return renderAnalysesSummary();
      case 'sources': return renderSourcesSummary();
      default: return <div>Conteúdo não encontrado</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          {renderContent()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}