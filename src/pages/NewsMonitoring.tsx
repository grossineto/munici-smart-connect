import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Eye, TrendingUp, Clock, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: string;
  region: string;
  is_active: boolean;
}

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  url: string;
  published_at: string;
  source_name: string;
  urgency_score: number;
  sentiment_score: number;
  impact_score: number;
  keywords: string[];
  summary: string;
}

interface NewsAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  article_count: number;
  created_at: string;
}

export default function NewsMonitoring() {
  const { toast } = useToast();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [alerts, setAlerts] = useState<NewsAlert[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load articles with analysis
      const { data: articlesData, error: articlesError } = await supabase
        .from('news_articles')
        .select(`
          *,
          news_sources!inner(name),
          news_analysis(
            urgency_score,
            sentiment_score,
            impact_score,
            keywords,
            summary
          )
        `)
        .order('published_at', { ascending: false })
        .limit(50);

      if (articlesError) throw articlesError;

      // Load sources
      const { data: sourcesData, error: sourcesError } = await supabase
        .from('news_sources')
        .select('*')
        .order('name');

      if (sourcesError) throw sourcesError;

      // Load recent alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('news_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;

      // Load monitored keywords
      const { data: keywordsData, error: keywordsError } = await supabase
        .from('monitored_keywords')
        .select('keyword')
        .eq('is_active', true);

      if (keywordsError) throw keywordsError;

      setArticles(articlesData || []);
      setSources(sourcesData || []);
      setAlerts(alertsData || []);
      setKeywords(keywordsData?.map(k => k.keyword) || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do monitoramento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startNewsCollection = async () => {
    try {
      toast({
        title: "Coletando notícias",
        description: "Iniciando coleta de notícias...",
      });

      const { data, error } = await supabase.functions.invoke('collect-news');

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Coleta de notícias iniciada com sucesso",
      });

      loadData();
    } catch (error) {
      console.error('Error starting collection:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar coleta de notícias",
        variant: "destructive",
      });
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;

    try {
      const { error } = await supabase
        .from('monitored_keywords')
        .insert({
          keyword: newKeyword.trim(),
          category: 'custom',
          is_active: true
        });

      if (error) throw error;

      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
      
      toast({
        title: "Sucesso",
        description: "Palavra-chave adicionada com sucesso",
      });
    } catch (error) {
      console.error('Error adding keyword:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar palavra-chave",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'default';
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 8) return 'destructive';
    if (score >= 6) return 'secondary';
    if (score >= 4) return 'outline';
    return 'default';
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchTerm === "" || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUrgency = urgencyFilter === "all" ||
      (urgencyFilter === "high" && (article.news_analysis?.[0]?.urgency_score || 0) >= 7) ||
      (urgencyFilter === "medium" && (article.news_analysis?.[0]?.urgency_score || 0) >= 4 && (article.news_analysis?.[0]?.urgency_score || 0) < 7) ||
      (urgencyFilter === "low" && (article.news_analysis?.[0]?.urgency_score || 0) < 4);

    return matchesSearch && matchesUrgency;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Monitoramento de Notícias</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Monitoramento de Notícias</h1>
        <Button onClick={startNewsCollection} className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Coletar Notícias
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Artigos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{alerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fontes Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sources.filter(s => s.is_active).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Palavras-chave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keywords.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="articles">Artigos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="sources">Fontes</TabsTrigger>
          <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Buscar artigos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por urgência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="high">Alta urgência</SelectItem>
                <SelectItem value="medium">Média urgência</SelectItem>
                <SelectItem value="low">Baixa urgência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredArticles.map((article) => {
              const analysis = article.news_analysis?.[0];
              return (
                <Card key={article.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <span>{article.source_name}</span>
                          <Clock className="h-4 w-4" />
                          <span>{new Date(article.published_at).toLocaleString('pt-BR')}</span>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {analysis && (
                          <Badge variant={getUrgencyColor(analysis.urgency_score)}>
                            Urgência: {analysis.urgency_score}/10
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {analysis?.summary && (
                      <p className="text-muted-foreground mb-3">{analysis.summary}</p>
                    )}
                    {analysis?.keywords && analysis.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {analysis.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        Ver artigo completo
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle>{alert.title}</CardTitle>
                  <Badge variant={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
                <CardDescription>
                  {new Date(alert.created_at).toLocaleString('pt-BR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>{alert.description}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {alert.article_count} artigos relacionados
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((source) => (
              <Card key={source.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{source.name}</CardTitle>
                  <CardDescription>{source.region}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant={source.is_active ? "default" : "secondary"}>
                      {source.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                    <Badge variant="outline">{source.type}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Palavra-chave</CardTitle>
              <CardDescription>
                Monitore temas específicos nas notícias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Nova palavra-chave..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                />
                <Button onClick={addKeyword}>Adicionar</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Palavras-chave Monitoradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}