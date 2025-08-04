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
            news_sources (name)
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
          <Button onClick={runNewsCrawler} disabled={crawling} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${crawling ? 'animate-spin' : ''}`} />
            {crawling ? 'Coletando...' : 'Coletar Notícias Reais'}
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

      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="analysis">Análises</TabsTrigger>
        </TabsList>

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
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                              {alert.severity}
                            </Badge>
                            <h3 className="font-semibold mt-2">{alert.title}</h3>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                          {alert.news_articles?.url && (
                            <Button size="sm" variant="ghost" onClick={() => window.open(alert.news_articles.url, '_blank')}>
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
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="outline">{analysis.urgency_level}</Badge>
                            {analysis.mentions_mayor && <Badge className="ml-2">Menciona Prefeito</Badge>}
                            <h3 className="font-semibold mt-2">{analysis.news_articles?.title}</h3>
                            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Relevância: {Math.round((analysis.relevance_score || 0) * 100)}%
                            </p>
                          </div>
                          {analysis.news_articles?.url && (
                            <Button size="sm" variant="ghost" onClick={() => window.open(analysis.news_articles.url, '_blank')}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}