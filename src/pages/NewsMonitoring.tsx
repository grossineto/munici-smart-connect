import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TrendingUp, Eye, Bell, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function NewsMonitoring() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
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

  const runNewsCrawler = async () => {
    setCrawling(true);
    try {
      console.log('Starting real news collection...');
      const { data, error } = await supabase.functions.invoke('real-news-collector');
      
      console.log('Real news collection response:', { data, error });
      
      if (error) {
        console.error('Real news collection error:', error);
        throw error;
      }
      
      toast({ 
        title: "Notícias Coletadas", 
        description: `Coletadas ${data?.processed_articles || 0} notícias reais dos principais portais` 
      });
      
      console.log('Reloading data in 3 seconds...');
      setTimeout(() => {
        console.log('Reloading data now...');
        loadData();
      }, 3000);
    } catch (error) {
      console.error('Real news collection failed:', error);
      toast({ title: "Erro", description: "Erro ao coletar notícias reais", variant: "destructive" });
    } finally {
      setCrawling(false);
    }
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
        title: "Notícias em Tempo Real", 
        description: `Coletadas ${data?.articles?.length || 0} notícias em tempo real via Perplexity` 
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

  const runTestAnalysis = async () => {
    setCrawling(true);
    try {
      console.log('Starting test analysis...');
      const { data, error } = await supabase.functions.invoke('test-news-analysis');
      
      console.log('Test analysis response:', { data, error });
      
      if (error) {
        console.error('Test analysis error:', error);
        throw error;
      }
      
      toast({ 
        title: "Teste Executado", 
        description: `Processados ${data?.processed_articles || 0} artigos de teste com palavras-chave específicas` 
      });
      
      console.log('Reloading data in 3 seconds...');
      setTimeout(() => {
        console.log('Reloading data now...');
        loadData();
      }, 3000);
    } catch (error) {
      console.error('Test analysis failed:', error);
      toast({ title: "Erro", description: "Erro ao executar teste", variant: "destructive" });
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
          <Button onClick={runTestAnalysis} disabled={crawling} variant="outline" className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${crawling ? 'animate-spin' : ''}`} />
            {crawling ? 'Testando...' : 'Teste São Paulo'}
          </Button>
          <Button onClick={runNewsCrawler} disabled={crawling} variant="outline" className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${crawling ? 'animate-spin' : ''}`} />
            {crawling ? 'Coletando...' : 'Coletar Notícias Reais'}
          </Button>
          <Button onClick={runPerplexityNews} disabled={crawling} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <RefreshCw className={`h-4 w-4 ${crawling ? 'animate-spin' : ''}`} />
            {crawling ? 'Coletando...' : 'Tempo Real (Perplexity)'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Pendentes</CardTitle>
            <Bell className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unacknowledgedAlerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análises</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fontes Ativas</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notícias Recentes */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Últimas Notícias de São Paulo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {analyses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">Nenhuma notícia encontrada</p>
                      <p className="text-sm text-muted-foreground">Clique em "Tempo Real (Perplexity)" para buscar notícias recentes</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {analyses.slice(0, 10).map((analysis) => (
                        <div key={analysis.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 font-semibold">
                                  {analysis.news_articles?.author || 'Fonte'}
                                </Badge>
                                <Badge variant={
                                  analysis.sentiment_score > 0.3 ? 'default' : 
                                  analysis.sentiment_score < -0.3 ? 'destructive' : 'secondary'
                                } className="text-xs">
                                  {analysis.sentiment_score > 0.3 ? '😊 POSITIVA' : 
                                   analysis.sentiment_score < -0.3 ? '😞 NEGATIVA' : '😐 NEUTRA'}
                                </Badge>
                                {analysis.urgency_level === 'high' && (
                                  <Badge variant="destructive" className="animate-pulse">🚨 URGENTE</Badge>
                                )}
                                {analysis.mentions_mayor && (
                                  <Badge className="bg-purple-100 text-purple-700">👨‍💼 Prefeito</Badge>
                                )}
                                {analysis.crisis_potential && (
                                  <Badge variant="destructive" className="animate-bounce">⚠️ CRISE</Badge>
                                )}
                              </div>
                              <h3 className="font-bold text-lg mb-2 line-clamp-2">{analysis.news_articles?.title}</h3>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{analysis.summary}</p>
                              
                              {analysis.recommended_action && (
                                <div className="mb-3 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded">
                                  <p className="text-sm font-semibold text-yellow-800">Ação Recomendada:</p>
                                  <p className="text-sm text-yellow-700">{analysis.recommended_action}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  📊 Relevância: {Math.round((analysis.relevance_score || 0) * 10)}%
                                </span>
                                <span>{formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: ptBR })}</span>
                              </div>
                            </div>
                            
                            {analysis.news_articles?.url && (
                              <Button 
                                size="sm" 
                                onClick={() => window.open(analysis.news_articles.url, '_blank')}
                                className="ml-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
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
    </div>
  );
}