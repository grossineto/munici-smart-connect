import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TrendingUp, Eye, Bell, RefreshCw, ExternalLink, Target, Users, Zap, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnalysisModal } from "@/components/AnalysisModal";
import { SummaryModal } from "@/components/SummaryModal";

export default function NewsMonitoring() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryType, setSummaryType] = useState<'critical' | 'pending' | 'analyses' | 'sources'>('critical');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    setupRealtimeSubscription();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading news data...');
      
      // Buscar alertas com dados dos artigos
      const { data: alertsRaw, error: alertsError } = await supabase
        .from('news_alerts')
        .select(`
          *,
          news_articles!inner (
            title,
            url,
            published_at,
            news_sources (name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('Alerts raw:', alertsRaw);
      console.log('Alerts error:', alertsError);

      // Buscar análises com dados dos artigos  
      const { data: analysesRaw, error: analysesError } = await supabase
        .from('news_analysis')
        .select(`
          *,
          news_articles!inner (
            title,
            url,
            published_at,
            author
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      console.log('Analyses raw:', analysesRaw);
      console.log('Analyses error:', analysesError);

      if (alertsError) {
        console.error('Error loading alerts:', alertsError);
      } else {
        // Transformar dados para o formato esperado
        const alertsData = alertsRaw?.map(alert => ({
          ...alert,
          news_articles: alert.news_articles
        })) || [];
        setAlerts(alertsData);
      }

      if (analysesError) {
        console.error('Error loading analyses:', analysesError);
      } else {
        // Transformar dados para o formato esperado
        const analysesData = analysesRaw?.map(analysis => ({
          ...analysis,
          news_articles: analysis.news_articles
        })) || [];
        setAnalyses(analysesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de monitoramento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('news-monitoring')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news_alerts' }, () => {
        loadData();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const runPerplexityNews = async () => {
    setCrawling(true);
    try {
      console.log('Starting Perplexity news collection...');
      const { data, error } = await supabase.functions.invoke('perplexity-news-collector');
      
      console.log('Perplexity news response:', { data, error });
      
      if (error) {
        console.error('Perplexity news error:', error);
        throw error;
      }
      
      toast({ 
        title: "Notícias Coletadas", 
        description: `Coletadas ${data?.articles?.length || 0} notícias em tempo real dos principais portais brasileiros` 
      });
      
      console.log('Reloading data in 3 seconds...');
      setTimeout(() => {
        console.log('Reloading data now...');
        loadData();
      }, 3000);
    } catch (error) {
      console.error('Perplexity news failed:', error);
      toast({ title: "Erro", description: "Erro ao coletar notícias em tempo real", variant: "destructive" });
    } finally {
      setCrawling(false);
    }
  };

  console.log('Current state:', { alerts: alerts.length, analyses: analyses.length, loading });

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento de Notícias</h1>
          <p className="text-muted-foreground">Acompanhe notícias relevantes e alertas em tempo real</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runPerplexityNews} disabled={crawling} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <RefreshCw className={`h-4 w-4 ${crawling ? 'animate-spin' : ''}`} />
            {crawling ? 'Coletando...' : 'Coletar Notícias'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => {
            setSummaryType('critical');
            setSummaryModalOpen(true);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {criticalAlerts.length > 0 ? 'Requerem ação imediata' : 'Nenhuma situação crítica'}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => {
            setSummaryType('pending');
            setSummaryModalOpen(true);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Pendentes</CardTitle>
            <Bell className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unacknowledgedAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {unacknowledgedAlerts.length > 0 ? 'Aguardando verificação' : 'Todos verificados'}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => {
            setSummaryType('analyses');
            setSummaryModalOpen(true);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análises Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analyses.filter(a => a.mentions_mayor).length} mencionam Ricardo Nunes
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => {
            setSummaryType('sources');
            setSummaryModalOpen(true);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fontes Ativas</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[...new Set(analyses.map(a => a.news_articles?.author).filter(Boolean))].length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Portais monitorados em tempo real
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard Visual</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="analysis">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          {/* Dashboard Visual Redesenhado */}
          <div className="space-y-6">
            {/* Resumo Visual para o Prefeito */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <TrendingUp className="h-6 w-6" />
                    Notícias Positivas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700">
                    {analyses.filter(a => a.sentiment_score > 0.3).length}
                  </div>
                  <p className="text-sm text-green-600 mt-1">Impacto favorável na opinião pública</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-6 w-6" />
                    Notícias Negativas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-700">
                    {analyses.filter(a => a.sentiment_score < -0.3).length}
                  </div>
                  <p className="text-sm text-red-600 mt-1">Requerem atenção da gestão</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Target className="h-6 w-6" />
                    Menções ao Prefeito
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-700">
                    {analyses.filter(a => a.mentions_mayor).length}
                  </div>
                  <p className="text-sm text-purple-600 mt-1">Impacto direto na gestão</p>
                </CardContent>
              </Card>
            </div>

            {/* Feed Visual de Notícias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Globe className="h-6 w-6 text-blue-600" />
                  Painel de Opinião Pública em Tempo Real
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">São Paulo</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">Clique em qualquer notícia para ver análise completa</p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {analyses.length === 0 ? (
                    <div className="text-center py-12">
                      <Globe className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma notícia encontrada</h3>
                      <p className="text-sm text-muted-foreground mb-6">Clique em "Coletar Notícias" para buscar notícias atualizadas dos principais portais brasileiros</p>
                      <Button onClick={runPerplexityNews} disabled={crawling} className="bg-gradient-to-r from-blue-600 to-purple-600">
                        <Zap className="h-4 w-4 mr-2" />
                        {crawling ? 'Coletando...' : 'Coletar Notícias'}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {analyses.slice(0, 12).map((analysis) => (
                        <div 
                          key={analysis.id} 
                          className="group border-2 rounded-xl p-6 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-blue-50 hover:to-purple-50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-[1.02]"
                          onClick={() => {
                            setSelectedAnalysis(analysis);
                            setAnalysisModalOpen(true);
                          }}
                        >
                          {/* Header com Badges */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="bg-white border-blue-200 text-blue-800 font-semibold px-3 py-1">
                                📰 {analysis.news_articles?.author || 'Portal de Notícias'}
                              </Badge>
                              {/* Data de Publicação */}
                              <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700 px-3 py-1">
                                🕐 {analysis.news_articles?.published_at 
                                  ? new Date(analysis.news_articles.published_at).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit', 
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'Data não disponível'
                                }
                              </Badge>
                              <Badge 
                                variant={analysis.sentiment_score > 0.3 ? 'default' : analysis.sentiment_score < -0.3 ? 'destructive' : 'secondary'}
                                className="px-3 py-1 text-sm font-bold"
                              >
                                {analysis.sentiment_score > 0.3 ? '😊 POSITIVA' : 
                                 analysis.sentiment_score < -0.3 ? '😞 NEGATIVA' : '😐 NEUTRA'}
                              </Badge>
                              {(analysis.urgency_level === 'high' || analysis.urgency_level === 'critical') && (
                                <Badge variant="destructive" className="animate-pulse px-3 py-1 font-bold">
                                  🚨 {analysis.urgency_level === 'critical' ? 'CRÍTICA' : 'URGENTE'}
                                </Badge>
                              )}
                              {analysis.mentions_mayor && (
                                <Badge className="bg-purple-500 hover:bg-purple-600 px-3 py-1 font-bold">
                                  👨‍💼 PREFEITO
                                </Badge>
                              )}
                              {analysis.crisis_potential && (
                                <Badge variant="destructive" className="animate-bounce px-3 py-1 font-bold">
                                  ⚠️ POTENCIAL DE CRISE
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (analysis.news_articles?.url) {
                                    window.open(analysis.news_articles.url, '_blank');
                                  }
                                }}
                                className="opacity-70 group-hover:opacity-100 transition-opacity"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAnalysis(analysis);
                                  setAnalysisModalOpen(true);
                                }}
                                className="opacity-70 group-hover:opacity-100 transition-opacity"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Analisar
                              </Button>
                            </div>
                          </div>

                          {/* Título da Notícia */}
                          <h2 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-800 transition-colors">
                            {analysis.news_articles?.title}
                          </h2>

                          {/* Resumo */}
                          <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                            {analysis.summary}
                          </p>

                          {/* Ação Recomendada (destaque visual) */}
                          {analysis.recommended_action && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="h-4 w-4 text-yellow-600" />
                                <span className="font-semibold text-yellow-800">Ação Recomendada para a Gestão:</span>
                              </div>
                              <p className="text-yellow-700 font-medium">{analysis.recommended_action}</p>
                            </div>
                          )}

                          {/* Footer com Métricas */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Relevância: {Math.round((analysis.relevance_score || 0) * 10)}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-purple-500" />
                                <span className="font-medium">Impacto: {analysis.sentiment_score > 0 ? 'Positivo' : analysis.sentiment_score < 0 ? 'Negativo' : 'Neutro'}</span>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader><CardTitle>Alertas Recentes</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {alerts.length === 0 ? (
                  <p className="text-center text-muted-foreground">Nenhum alerta encontrado</p>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'high' ? 'default' : 'secondary'}>
                              {alert.severity === 'critical' ? 'CRÍTICO' : alert.severity === 'high' ? 'ALTO' : 'MÉDIO'}
                            </Badge>
                            {alert.news_articles?.news_sources?.name && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {alert.news_articles.news_sources.name}
                              </Badge>
                            )}
                          </div>
                          {alert.news_articles?.url && (
                            <Button size="sm" variant="ghost" onClick={() => window.open(alert.news_articles.url, '_blank')}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                        {alert.news_articles?.title && (
                          <p className="text-sm font-medium text-blue-600 mb-2">{alert.news_articles.title}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader><CardTitle>Análises Recentes</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {analyses.length === 0 ? (
                  <p className="text-center text-muted-foreground">Nenhuma análise encontrada</p>
                ) : (
                  <div className="space-y-4">
                    {analyses.map((analysis) => (
                      <div key={analysis.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={
                              analysis.sentiment_score > 0.3 ? 'default' : 
                              analysis.sentiment_score < -0.3 ? 'destructive' : 'secondary'
                            }>
                              {analysis.sentiment_score > 0.3 ? '✅ POSITIVA' : 
                               analysis.sentiment_score < -0.3 ? '❌ NEGATIVA' : '⚪ NEUTRA'}
                            </Badge>
                            <Badge variant="outline">
                              {analysis.urgency_level === 'critical' ? 'CRÍTICA' :
                               analysis.urgency_level === 'high' ? 'ALTA' :
                               analysis.urgency_level === 'medium' ? 'MÉDIA' : 'BAIXA'}
                            </Badge>
                            {analysis.news_articles?.news_sources?.name && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {analysis.news_articles.news_sources.name}
                              </Badge>
                            )}
                            {analysis.mentions_mayor && <Badge className="bg-purple-100 text-purple-700">Menciona Prefeito</Badge>}
                            {analysis.crisis_potential && <Badge variant="destructive">🚨 Potencial de Crise</Badge>}
                          </div>
                          {analysis.news_articles?.url && (
                            <Button size="sm" variant="ghost" onClick={() => window.open(analysis.news_articles.url, '_blank')}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-2">{analysis.news_articles?.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{analysis.summary}</p>
                        
                        {analysis.impact_analysis && (
                          <div className="mb-2">
                            <strong className="text-sm">Impacto:</strong>
                            <p className="text-sm text-gray-600">{analysis.impact_analysis}</p>
                          </div>
                        )}
                        
                        {analysis.recommended_action && (
                          <div className="mb-2 p-2 bg-yellow-50 rounded">
                            <strong className="text-sm text-yellow-800">Ação Recomendada:</strong>
                            <p className="text-sm text-yellow-700">{analysis.recommended_action}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                          <span>Relevância: {Math.round((analysis.relevance_score || 0) * 100)}%</span>
                          <span>{formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: ptBR })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <AnalysisModal 
        analysis={selectedAnalysis}
        isOpen={analysisModalOpen}
        onClose={() => {
          setAnalysisModalOpen(false);
          setSelectedAnalysis(null);
        }}
      />
      
      <SummaryModal 
        type={summaryType}
        data={summaryType === 'critical' ? criticalAlerts : 
              summaryType === 'pending' ? unacknowledgedAlerts : 
              summaryType === 'analyses' ? analyses : analyses}
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
      />
    </div>
  );
}