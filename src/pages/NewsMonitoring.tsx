import React, { useState, useEffect } from 'react';
import { Bell, Search, Eye, BarChart3, MapPin, User, ChevronDown, ChevronUp, Brain, AlertTriangle, TrendingUp, Clock, Calendar, Filter, ExternalLink, Globe, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisModal } from "@/components/AnalysisModal";
import { SummaryModal } from "@/components/SummaryModal";

function NewsMonitoring() {
  const { toast } = useToast();
  
  // Estados principais
  const [alerts, setAlerts] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryType, setSummaryType] = useState<'analyses' | 'pending' | 'critical' | 'sources'>('analyses');
  
  // Estados para pesquisa de cidades
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showOtherCities, setShowOtherCities] = useState(false);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedMayor, setSelectedMayor] = useState<any>(null);

  // Função para carregar dados gerais
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando dados gerais...');

      // Carregar alertas
      const { data: alertsData, error: alertsError } = await supabase
        .from('news_alerts' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (alertsError) {
        console.error('Erro ao carregar alertas:', alertsError);
      } else {
        setAlerts(alertsData || []);
        console.log(`📊 Alertas carregados: ${alertsData?.length || 0}`);
      }

      // Carregar análises
      const { data: analysesData, error: analysesError } = await supabase
        .from('news_analysis' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (analysesError) {
        console.error('Erro ao carregar análises:', analysesError);
      } else {
        setAnalyses(analysesData || []);
        console.log(`📊 Análises carregadas: ${analysesData?.length || 0}`);
      }

      console.log('Current state:', {
        alerts: alertsData?.length || 0,
        analyses: analysesData?.length || 0,
        loading: false
      });

    } catch (error) {
      console.error('Erro geral ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar dados filtrados por prefeito
  const loadDataForMayor = async (mayor: any) => {
    try {
      console.log(`🔍 Carregando dados para: ${mayor.nome} - ${mayor.cidade}/${mayor.estado}`);
      
      // Carregar alertas filtrados com campos corretos
      const { data: alertsData, error: alertsError } = await supabase
        .from('news_alerts')
        .select('*')
        .or(`content.ilike.%${mayor.nome}%,content.ilike.%${mayor.cidade}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (alertsError) {
        console.error('Erro ao carregar alertas filtrados:', alertsError);
      } else {
        setAlerts(alertsData || []);
      }

      // Carregar análises filtradas com campos corretos
      const { data: analysesData, error: analysesError } = await supabase
        .from('news_analysis')
        .select(`
          *,
          news_articles (
            id,
            title,
            content,
            author,
            source,
            url,
            published_at
          )
        `)
        .or(`executive_summary.ilike.%${mayor.nome}%,impact_analysis.ilike.%${mayor.cidade}%,keywords.ilike.%${mayor.nome}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (analysesError) {
        console.error('Erro ao carregar análises filtradas:', analysesError);
      } else {
        setAnalyses(analysesData || []);
      }

    } catch (error) {
      console.error('Erro geral ao carregar dados:', error);
    }
  };

  // Configurar subscription em tempo real
  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('news-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_alerts'
        },
        (payload) => {
          console.log('🚨 Novo alerta recebido:', payload);
          if (selectedMayor) {
            loadDataForMayor(selectedMayor);
          } else {
            loadData();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_analysis'
        },
        (payload) => {
          console.log('🧠 Nova análise recebida:', payload);
          if (selectedMayor) {
            loadDataForMayor(selectedMayor);
          } else {
            loadData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Carregar dados iniciais e configurar subscription
  useEffect(() => {
    loadData();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, []);

  // Função para buscar cidades na API do IBGE
  const searchCities = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const formattedResults = data.slice(0, 10).map((city: any) => ({
          id: city.id,
          nome: city.nome,
          uf: city.microrregiao?.mesorregiao?.UF?.sigla || city.UF?.sigla
        }));
        setSearchResults(formattedResults);
      }
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Dados dos prefeitos (base de dados local)
  const mayorData: Record<string, any> = {
    "São Paulo": { nome: "Ricardo Nunes", partido: "MDB", mandato: "2021-2024", cidade: "São Paulo", uf: "SP" },
    "Rio de Janeiro": { nome: "Eduardo Paes", partido: "PSD", mandato: "2021-2024", cidade: "Rio de Janeiro", uf: "RJ" },
    "Belo Horizonte": { nome: "Fuad Noman", partido: "PSD", mandato: "2021-2024", cidade: "Belo Horizonte", uf: "MG" },
    "Curitiba": { nome: "Rafael Greca", partido: "PMN", mandato: "2017-2024", cidade: "Curitiba", uf: "PR" },
    "Recife": { nome: "João Campos", partido: "PSB", mandato: "2021-2024", cidade: "Recife", uf: "PE" },
    "Porto Alegre": { nome: "Sebastião Melo", partido: "MDB", mandato: "2021-2024", cidade: "Porto Alegre", uf: "RS" },
    "Salvador": { nome: "Bruno Reis", partido: "União Brasil", mandato: "2021-2024", cidade: "Salvador", uf: "BA" },
    "Fortaleza": { nome: "José Sarto", partido: "PDT", mandato: "2021-2024", cidade: "Fortaleza", uf: "CE" },
    "Brasília": { nome: "Ibaneis Rocha", partido: "MDB", mandato: "2019-2026", cidade: "Brasília", uf: "DF" },
    "Manaus": { nome: "David Almeida", partido: "Avante", mandato: "2021-2024", cidade: "Manaus", uf: "AM" }
  };

  // Correção de estados para algumas cidades
  const cityToState: Record<string, string> = {
    "Recife": "PE",
    "São Paulo": "SP",
    "Rio de Janeiro": "RJ"
  };

  // Função para selecionar cidade
  const selectCity = async (city: any) => {
    console.log('🏙️ Cidade selecionada:', city.nome);
    setSelectedCity(city);
    setSearchQuery('');
    setSearchResults([]);
    setShowOtherCities(false);

    // Buscar prefeito correspondente
    console.log('📋 Buscando prefeito para:', city.nome);
    console.log('🗂️ Cidades disponíveis na base:', Object.keys(mayorData));
    
    const mayor = mayorData[city.nome];
    if (mayor) {
      console.log('✅ Prefeito encontrado:', mayor.nome);
      
      // Corrigir estado se necessário
      const correctedState = cityToState[city.nome] || city.uf;
      if (correctedState !== city.uf) {
        console.log(`🗺️ Estado corrigido: ${city.nome} -> ${correctedState}`);
      }
      
      const mayorWithCorrectState = {
        ...mayor,
        uf: correctedState
      };
      
      setSelectedMayor(mayorWithCorrectState);
      
      // Automaticamente iniciar coleta para o prefeito selecionado
      console.log('🚀 Iniciando coleta automática para:', mayor.nome);
      await runPerplexityNewsForMayor(mayorWithCorrectState);
      
      // Carregar dados filtrados
      await loadDataForMayor(mayorWithCorrectState);
      
      toast({
        title: "Cidade Selecionada ✅",
        description: `Monitoramento ativo para ${mayor.nome} em ${city.nome}/${correctedState}`,
      });
    } else {
      console.log('❌ Prefeito não encontrado para:', city.nome);
      toast({
        title: "Prefeito não encontrado",
        description: `Não temos dados do prefeito de ${city.nome} em nossa base.`,
        variant: "destructive",
      });
    }
  };

  // Função para executar coleta de notícias
  const runPerplexityNews = async () => {
    console.log('Starting Perplexity news collection...');
    
    try {
      setIsCollecting(true);
      
      const { data, error } = await supabase.functions.invoke('perplexity-news-collector', {
        body: { 
          mayor: selectedMayor ? {
            mayorName: selectedMayor.nome,
            cityName: selectedMayor.cidade,
            state: selectedMayor.uf
          } : null
        },
      });
      
      console.log('Perplexity news response:', { data, error });
      
      if (error) {
        console.error('Perplexity news error:', error);
        toast({
          title: "Erro na coleta de notícias",
          description: "Não foi possível coletar novas notícias. Verifique as configurações da API.",
          variant: "destructive",
        });
        return;
      }
      
      if (data && data.success) {
        toast({
          title: "Coleta Concluída ✅",
          description: `${data.processed_articles || 0} artigos processados e analisados com sucesso`,
        });
        
        // Recarregar dados após coleta
        setTimeout(() => {
          if (selectedMayor) {
            loadDataForMayor(selectedMayor);
          } else {
            loadData();
          }
        }, 3000);
      } else {
        toast({
          title: "Coleta Parcial ⚠️",
          description: "Algumas análises podem não ter sido processadas completamente",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Perplexity news failed:', error);
      toast({
        title: "Erro na coleta",
        description: "Falha na comunicação com o serviço de notícias. Verifique sua conexão.",
        variant: "destructive",
      });
    } finally {
      setIsCollecting(false);
    }
  };

  // Função para executar coleta para prefeito específico
  const runPerplexityNewsForMayor = async (mayor: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('perplexity-news-collector', {
        body: { 
          mayor: {
            mayorName: mayor.nome,
            cityName: mayor.cidade,
            state: mayor.uf
          }
        },
      });
      
      console.log('Perplexity news response:', { data, error });
      
      if (error) {
        console.error('Perplexity news error:', error);
        return;
      }
    } catch (error) {
      console.error('Perplexity news failed:', error);
    }
  };

  // Cidades principais para seleção rápida
  const mainCities = [
    { nome: "São Paulo", uf: "SP" },
    { nome: "Rio de Janeiro", uf: "RJ" },
    { nome: "Belo Horizonte", uf: "MG" },
    { nome: "Curitiba", uf: "PR" },
    { nome: "Recife", uf: "PE" },
    { nome: "Porto Alegre", uf: "RS" },
    { nome: "Salvador", uf: "BA" },
    { nome: "Fortaleza", uf: "CE" },
    { nome: "Brasília", uf: "DF" },
    { nome: "Manaus", uf: "AM" }
  ];

  // Funções para abrir modais de resumo
  const openSummaryModal = (type: 'analyses' | 'pending' | 'critical' | 'sources', data: any) => {
    setSummaryType(type);
    setSummaryData(data);
    setShowSummaryModal(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando monitoramento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento de Notícias</h1>
          <p className="text-gray-600">
            {selectedMayor 
              ? `Monitorando ${selectedMayor.nome} - ${selectedMayor.cidade}/${selectedMayor.uf}`
              : 'Monitoramento geral de notícias e análises'
            }
          </p>
        </div>
        <Button onClick={runPerplexityNews} disabled={isCollecting} className="gap-2">
          {isCollecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Coletando...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Coletar Notícias
            </>
          )}
        </Button>
      </div>

      {/* Seleção de Cidade/Prefeito */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Seleção de Cidade e Prefeito
            </h2>
            
            <div className="space-y-4">
              {/* Cidades Principais */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Cidades Principais</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {mainCities.map((city) => {
                    const hasData = mayorData[city.nome];
                    return (
                      <Button
                        key={`${city.nome}-${city.uf}`}
                        variant="outline"
                        size="sm"
                        onClick={() => selectCity(city)}
                        disabled={!hasData}
                        className={`text-left justify-start h-auto p-3 ${
                          hasData 
                            ? 'hover:bg-green-50 border-green-200 text-green-800' 
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{city.nome}</span>
                          <span className="text-xs text-gray-500">{city.uf}</span>
                          {hasData && <span className="text-xs text-green-600">✓ Disponível</span>}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Busca Manual */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOtherCities(!showOtherCities)}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    {showOtherCities ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {showOtherCities ? 'Fechar' : 'Selecionar Cidade'}
                  </Button>
                </div>

                {showOtherCities && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        placeholder="Digite o nome da cidade..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          searchCities(e.target.value);
                        }}
                        className="w-full"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                    </div>

                    {searchResults.length > 0 && (
                      <div className="border rounded-lg max-h-48 overflow-y-auto">
                        {searchResults.map((city) => {
                          const hasData = mayorData[city.nome];
                          return (
                            <div
                              key={`${city.id}-${city.nome}`}
                              onClick={() => hasData && selectCity(city)}
                              className={`px-4 py-2 cursor-pointer flex items-center gap-2 ${
                                hasData 
                                  ? 'hover:bg-green-50 border-l-4 border-green-400' 
                                  : 'hover:bg-gray-50 opacity-60'
                              }`}
                            >
                              <MapPin className={`h-4 w-4 ${hasData ? 'text-green-500' : 'text-gray-400'}`} />
                              <span className="font-medium">{city.nome}</span>
                              <span className="text-sm text-gray-500">- {city.uf}</span>
                              {hasData && <Badge variant="outline" className="ml-auto text-xs bg-green-50 text-green-700">✓ Disponível</Badge>}
                              {!hasData && <span className="ml-auto text-xs text-red-500">Não disponível</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">💡 Use o seletor acima para cidades principais</p>
            </div>
          </div>
          
          {/* Prefeito Selecionado */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Prefeito Selecionado</Label>
            {selectedMayor ? (
              <div className="p-4 bg-white border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-800">{selectedMayor.nome}</p>
                    <p className="text-sm text-green-600">{selectedMayor.partido} • {selectedMayor.cidade}/{selectedMayor.uf}</p>
                    <p className="text-xs text-gray-500">Mandato: {selectedMayor.mandato}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedMayor(null);
                      setSelectedCity(null);
                      loadData(); // Recarregar dados gerais
                      toast({
                        title: "Filtro Removido",
                        description: "Voltando para monitoramento geral",
                      });
                    }}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    Limpar Filtro
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-600">Nenhum prefeito selecionado</p>
                <p className="text-xs text-gray-500">Selecione uma cidade para filtrar as notícias</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
              onClick={() => openSummaryModal('critical', alerts.filter(a => a.urgency_level === 'critical'))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(alert => alert.urgency_level === 'critical').length}
            </div>
            <p className="text-xs text-gray-600">Requerem atenção imediata</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openSummaryModal('pending', alerts.filter(a => a.status === 'pending'))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {alerts.filter(alert => alert.status === 'pending').length}
            </div>
            <p className="text-xs text-gray-600">Aguardando análise</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openSummaryModal('analyses', analyses.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análises Hoje</CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analyses.filter(analysis => new Date(analysis.created_at).toDateString() === new Date().toDateString()).length}
            </div>
            <p className="text-xs text-gray-600">Processadas com IA</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openSummaryModal('sources', [])}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fontes Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">12</div>
            <p className="text-xs text-gray-600">Monitoramento ativo</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs do Dashboard */}
      <div className="space-y-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="alerts" 
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Alertas ({alerts.length})
            </TabsTrigger>
            <TabsTrigger 
              value="analyses" 
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              Análises ({analyses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sentimento das Notícias */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Sentimento das Notícias</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Positivo</span>
                    <span className="text-sm font-medium">
                      {analyses.filter(a => a.sentiment_score > 0.2).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Neutro</span>
                    <span className="text-sm font-medium">
                      {analyses.filter(a => a.sentiment_score >= -0.2 && a.sentiment_score <= 0.2).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Negativo</span>
                    <span className="text-sm font-medium">
                      {analyses.filter(a => a.sentiment_score < -0.2).length}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Menções do Prefeito */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Menções do Prefeito</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Menções Diretas</span>
                    <span className="text-sm font-medium">
                      {analyses.filter(a => a.mentions_mayor).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Alta Relevância</span>
                    <span className="text-sm font-medium">
                      {analyses.filter(a => a.relevance_score >= 8).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Potencial de Crise</span>
                    <span className="text-sm font-medium">
                      {analyses.filter(a => a.crisis_potential).length}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Feed de Análises Recentes */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Análises Recentes</h3>
              <div className="space-y-4">
                {analyses.slice(0, 5).map((analysis) => (
                  <div key={analysis.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2">{analysis.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{analysis.source} • {new Date(analysis.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={
                          analysis.urgency_level === 'critical' ? 'destructive' :
                          analysis.urgency_level === 'high' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {analysis.urgency_level === 'critical' ? 'Crítico' :
                           analysis.urgency_level === 'high' ? 'Alto' : 'Médio'}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedAnalysis(analysis);
                            setShowAnalysisModal(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="grid gap-4">
              {alerts.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <AlertTriangle className="h-12 w-12 text-gray-400" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Nenhum alerta encontrado</h3>
                      <p className="text-gray-600 mb-4">Inicie a coleta de notícias para gerar alertas automáticos</p>
                      <Button onClick={runPerplexityNews} className="gap-2">
                        <Search className="h-4 w-4" />
                        Iniciar Coleta
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                alerts.map((alert) => (
                  <Card key={alert.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{alert.title}</h3>
                        <p className="text-gray-700 mb-3">{alert.description}</p>
                      </div>
                      <Badge variant={
                        alert.urgency_level === 'critical' ? 'destructive' :
                        alert.urgency_level === 'high' ? 'secondary' : 'outline'
                      }>
                        {alert.urgency_level === 'critical' ? '🚨 Crítico' :
                         alert.urgency_level === 'high' ? '⚠️ Alto' : '📊 Médio'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>📅 {new Date(alert.created_at).toLocaleDateString('pt-BR')}</span>
                      <span>🔗 {alert.source || 'Fonte automática'}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analyses" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-purple-600" />
                <div>
                  <h2 className="text-xl font-bold">Análises Inteligentes</h2>
                  <p className="text-sm text-gray-600">
                    Análises detalhadas com IA sobre o impacto das notícias
                  </p>
                </div>
              </div>
              {analyses.length > 0 && (
                <Button 
                  onClick={runPerplexityNews} 
                  disabled={isCollecting}
                  className="gap-2"
                >
                  {isCollecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Coletando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Nova Coleta
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <div className="grid gap-4">
              {loading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                        <div className="h-16 bg-gray-200 rounded mb-4"></div>
                        <div className="flex gap-4">
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : analyses.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                      <Brain className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="max-w-md">
                      <h3 className="text-xl font-semibold mb-2">Nenhuma análise disponível</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {selectedMayor 
                          ? `Inicie a coleta de notícias para ${selectedMayor.nome} para gerar análises inteligentes com IA`
                          : 'Selecione uma cidade e inicie a coleta de notícias para gerar análises inteligentes com IA'
                        }
                      </p>
                      <Button 
                        onClick={runPerplexityNews} 
                        disabled={isCollecting}
                        size="lg" 
                        className="gap-2"
                      >
                        {isCollecting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Coletando e Analisando...
                          </>
                        ) : (
                          <>
                            <Search className="h-5 w-5" />
                            Iniciar Coleta e Análise
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <Card 
                      key={analysis.id} 
                      className="group p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-l-gray-200 hover:border-l-purple-500 bg-gradient-to-r from-white to-gray-50/30 hover:from-purple-50/20 hover:to-purple-100/30"
                      onClick={() => {
                        setSelectedAnalysis(analysis);
                        setShowAnalysisModal(true);
                      }}
                    >
                      {/* Header com título e badges */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2">
                              {analysis.title || analysis.news_articles?.title || 'Análise sem título'}
                            </h3>
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                          </div>
                          
                          {/* Preview do conteúdo */}
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                              {analysis.executive_summary || analysis.summary || analysis.impact_analysis || 'Preview da análise não disponível...'}
                            </p>
                          </div>

                          {/* Metadados */}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {analysis.news_articles?.author || analysis.author || 'Autor não informado'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {analysis.news_articles?.source || analysis.source || 'Fonte não informada'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(analysis.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        {/* Badges laterais */}
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Badge variant={
                            analysis.urgency_level === 'critical' ? 'destructive' :
                            analysis.urgency_level === 'high' ? 'secondary' : 'outline'
                          } className="text-xs font-medium">
                            {analysis.urgency_level === 'critical' ? '🚨 Crítico' :
                             analysis.urgency_level === 'high' ? '⚠️ Alto' :
                             analysis.urgency_level === 'medium' ? '📊 Médio' : '📝 Baixo'}
                          </Badge>
                          
                          {analysis.mentions_mayor && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              👤 Menciona Prefeito
                            </Badge>
                          )}
                          
                          {analysis.crisis_potential && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              🔥 Potencial de Crise
                            </Badge>
                          )}

                          {(analysis.relevance_score || 0) >= 8 && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              ⭐ Alta Relevância
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Métricas compactas */}
                      <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-white/70 rounded-lg border border-gray-100">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {analysis.sentiment_score !== null && analysis.sentiment_score !== undefined 
                              ? (analysis.sentiment_score >= 0 ? '+' : '') + (analysis.sentiment_score * 100).toFixed(0) + '%'
                              : 'N/A'
                            }
                          </div>
                          <div className="text-xs text-gray-500">Sentimento</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {analysis.relevance_score || 'N/A'}/10
                          </div>
                          <div className="text-xs text-gray-500">Relevância</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {analysis.crisis_potential ? '🔥' : '✅'}
                          </div>
                          <div className="text-xs text-gray-500">Crise</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {analysis.keywords && typeof analysis.keywords === 'string' ? analysis.keywords.split(',').length : 0}
                          </div>
                          <div className="text-xs text-gray-500">Temas</div>
                        </div>
                      </div>

                      {/* Keywords principais */}
                      {analysis.keywords && typeof analysis.keywords === 'string' && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {analysis.keywords.split(',').slice(0, 4).map((keyword, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-1 bg-purple-100/80 text-purple-700 text-xs rounded-full font-medium"
                            >
                              {keyword.trim()}
                            </span>
                          ))}
                          {analysis.keywords.split(',').length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{analysis.keywords.split(',').length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Ação recomendada destacada */}
                      {analysis.recommended_action && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <div className="text-yellow-600 mt-0.5">💡</div>
                            <div>
                              <div className="text-xs font-semibold text-yellow-800 mb-1">Ação Recomendada</div>
                              <div className="text-xs text-yellow-700 line-clamp-2">{analysis.recommended_action}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Footer com call-to-action */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>Clique para ver análise completa</span>
                        <div className="flex items-center gap-1 text-purple-600 font-medium">
                          Ver detalhes <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modais */}
      <AnalysisModal 
        analysis={selectedAnalysis} 
        isOpen={showAnalysisModal} 
        onClose={() => setShowAnalysisModal(false)} 
      />

      <SummaryModal 
        type={summaryType}
        data={summaryData}
        isOpen={showSummaryModal} 
        onClose={() => setShowSummaryModal(false)} 
      />
    </div>
  );
}

export default NewsMonitoring;