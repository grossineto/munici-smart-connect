import React, { useState, useEffect } from 'react';
import { Bell, Search, Eye, BarChart3, MapPin, User, ChevronDown, ChevronUp, Brain, AlertTriangle, TrendingUp, Clock, Calendar, Filter, ExternalLink, Globe, Loader2, ArrowRight, X, CheckCircle, AlertCircle } from "lucide-react";
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
  const [filteredAnalyses, setFilteredAnalyses] = useState<any[]>([]);
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

  // Estados dos filtros de análise
  const [analysisFilters, setAnalysisFilters] = useState({
    cityFilter: '',
    mayorFilter: '',
    urgencyFilter: 'all',
    mentionsMayor: false,
    crisisPotential: false
  });
  const [showFilters, setShowFilters] = useState(false);

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
      setLoading(true);
      console.log(`🔍 Carregando dados FILTRADOS para: ${mayor.nome} - ${mayor.cidade}/${mayor.uf}`);
      
      // Filtros corrigidos para alertas - usando sintaxe correta do Supabase
      const { data: alertsData, error: alertsError } = await supabase
        .from('news_alerts')
        .select(`
          *,
          news_articles!inner (
            id,
            title,
            content,
            author,
            url,
            published_at
          )
        `)
        .or(`title.ilike.%${mayor.nome}%,title.ilike.%${mayor.cidade}%,message.ilike.%${mayor.nome}%,message.ilike.%${mayor.cidade}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (alertsError) {
        console.error('Erro ao carregar alertas filtrados:', alertsError);
        // Fallback: buscar alertas sem join se der erro
        const { data: fallbackAlerts } = await supabase
          .from('news_alerts')
          .select('*')
          .or(`title.ilike.%${mayor.nome}%,title.ilike.%${mayor.cidade}%,message.ilike.%${mayor.nome}%,message.ilike.%${mayor.cidade}%`)
          .order('created_at', { ascending: false })
          .limit(20);
        setAlerts(fallbackAlerts || []);
      } else {
        console.log(`📊 Alertas filtrados carregados: ${alertsData?.length || 0}`);
        setAlerts(alertsData || []);
      }

      // Filtros corrigidos para análises - usando sintaxe correta do Supabase
      const { data: analysesData, error: analysesError } = await supabase
        .from('news_analysis')
        .select(`
          *,
          news_articles!inner (
            id,
            title,
            content,
            author,
            url,
            published_at
          )
        `)
        .or(`summary.ilike.%${mayor.nome}%,summary.ilike.%${mayor.cidade}%,impact_analysis.ilike.%${mayor.nome}%,impact_analysis.ilike.%${mayor.cidade}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (analysesError) {
        console.error('Erro ao carregar análises filtradas:', analysesError);
        // Fallback: buscar análises sem join se der erro
        const { data: fallbackAnalyses } = await supabase
          .from('news_analysis')
          .select('*')
          .or(`summary.ilike.%${mayor.nome}%,summary.ilike.%${mayor.cidade}%,impact_analysis.ilike.%${mayor.nome}%,impact_analysis.ilike.%${mayor.cidade}%`)
          .order('created_at', { ascending: false })
          .limit(20);
        setAnalyses(fallbackAnalyses || []);
      } else {
        console.log(`📊 Análises filtradas carregadas: ${analysesData?.length || 0}`);
        setAnalyses(analysesData || []);
      }

    } catch (error) {
      console.error('Erro geral ao carregar dados filtrados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados filtrados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    if (selectedMayor) {
      console.log('🔄 Recarregando dados filtrados para:', selectedMayor.nome);
      loadDataForMayor(selectedMayor);
    } else {
      console.log('🔄 Carregando dados gerais...');
      loadData();
    }
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [selectedMayor]); // Adicionar selectedMayor como dependência

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
        uf: correctedState,
        estado: correctedState,
        cidade: city.nome
      };
      
      setSelectedMayor(mayorWithCorrectState);
      
      console.log('🚀 Iniciando coleta automática para:', mayor.nome);
      console.log('📍 Dados completos do prefeito:', mayorWithCorrectState);
      
      // Carregar dados filtrados primeiro (mais rápido)
      await loadDataForMayor(mayorWithCorrectState);
      
      // Depois tentar coleta automática (pode falhar, mas não bloqueia)
      try {
        await runPerplexityNewsForMayor(mayorWithCorrectState);
      } catch (collectError) {
        console.warn('⚠️ Coleta automática falhou, mas dados filtrados foram carregados:', collectError);
      }
      
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
      console.log('🚀 Iniciando coleta para prefeito:', mayor);
      
      const { data, error } = await supabase.functions.invoke('perplexity-news-collector', {
        body: { 
          mayor: {
            nome: mayor.nome,
            cidade: mayor.cidade,
            uf: mayor.uf,
            mayorName: mayor.nome,  // Compatibilidade
            cityName: mayor.cidade, // Compatibilidade
            state: mayor.uf        // Compatibilidade
          }
        },
      });
      
      console.log('Perplexity news response:', { data, error });
      
      if (error) {
        console.error('Perplexity news error:', error);
        return;
      }
      
      if (data?.success) {
        console.log('✅ Coleta concluída:', data.message);
        toast({
          title: "Coleta Concluída ✅",
          description: data.message,
        });
      }
    } catch (error) {
      console.error('Perplexity news failed:', error);
    }
  };
  
  // Função para aplicar filtros nas análises
  const applyAnalysisFilters = () => {
    let filtered = [...analyses];

    if (analysisFilters.cityFilter) {
      filtered = filtered.filter(analysis => 
        analysis.news_articles?.title?.toLowerCase().includes(analysisFilters.cityFilter.toLowerCase()) ||
        analysis.impact_analysis?.toLowerCase().includes(analysisFilters.cityFilter.toLowerCase()) ||
        analysis.executive_summary?.toLowerCase().includes(analysisFilters.cityFilter.toLowerCase())
      );
    }

    if (analysisFilters.mayorFilter) {
      filtered = filtered.filter(analysis => 
        analysis.news_articles?.title?.toLowerCase().includes(analysisFilters.mayorFilter.toLowerCase()) ||
        analysis.impact_analysis?.toLowerCase().includes(analysisFilters.mayorFilter.toLowerCase()) ||
        analysis.executive_summary?.toLowerCase().includes(analysisFilters.mayorFilter.toLowerCase())
      );
    }

    if (analysisFilters.urgencyFilter && analysisFilters.urgencyFilter !== 'all') {
      filtered = filtered.filter(analysis => analysis.urgency_level === analysisFilters.urgencyFilter);
    }

    if (analysisFilters.mentionsMayor) {
      filtered = filtered.filter(analysis => analysis.mentions_mayor === true);
    }

    if (analysisFilters.crisisPotential) {
      filtered = filtered.filter(analysis => analysis.crisis_potential === true);
    }

    setFilteredAnalyses(filtered);
  };

  // Função para limpar filtros
  const clearAnalysisFilters = () => {
    setAnalysisFilters({
      cityFilter: '',
      mayorFilter: '',
      urgencyFilter: 'all',
      mentionsMayor: false,
      crisisPotential: false
    });
  };

  // Efeito para aplicar filtros quando mudarem
  useEffect(() => {
    applyAnalysisFilters();
  }, [analyses, analysisFilters]);

  // Efeito para inicializar análises filtradas
  useEffect(() => {
    setFilteredAnalyses(analyses);
  }, [analyses]);
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

      {/* Banner de Filtro Ativo */}
      {selectedMayor && (
        <Card className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 border-blue-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-blue-800">
                  📊 Dashboard Filtrado - {selectedMayor.nome}
                </p>
                <p className="text-sm text-blue-600">
                  Exibindo apenas dados de {selectedMayor.cidade}/{selectedMayor.uf} • {analyses.length} análises • {alerts.length} alertas
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              🎯 Modo Focado
            </Badge>
          </div>
        </Card>
      )}

      {/* Seleção de Cidade/Prefeito */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-blue-800">
              <MapPin className="h-5 w-5 text-blue-600" />
              Seleção de Cidade e Prefeito
            </h2>
            
            {/* Seletor Unificado Elegante */}
            <div className="space-y-4">
              <div className="relative">
                <Label className="text-sm font-medium text-blue-700 mb-3 block">
                  Buscar Cidade ou Prefeito
                </Label>
                
                {/* Campo de Busca Principal */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-500" />
                  </div>
                  <Input
                    placeholder="Digite o nome da cidade ou prefeito..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchCities(e.target.value);
                      setShowOtherCities(e.target.value.length > 0);
                    }}
                    className="pl-10 pr-4 h-12 text-base border-blue-300 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Sugestões Rápidas - Cidades Principais */}
              {!searchQuery && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-600">Cidades Principais</Label>
                  <div className="flex flex-wrap gap-2">
                    {mainCities.map((city) => {
                      const hasData = mayorData[city.nome];
                      return (
                        <Button
                          key={`${city.nome}-${city.uf}`}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            selectCity(city);
                            setSearchQuery('');
                          }}
                          disabled={!hasData}
                          className={`transition-all duration-200 ${
                            hasData 
                              ? 'hover:bg-blue-100 border-blue-300 text-blue-700 hover:scale-105 shadow-sm' 
                              : 'opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <span className="font-medium">{city.nome}</span>
                          <span className="text-xs ml-1 opacity-75">{city.uf}</span>
                          {hasData && <span className="text-xs ml-1">✨</span>}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resultados da Busca */}
              {searchQuery && searchResults.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm border border-blue-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs text-blue-600 font-medium mb-2 px-2">
                      {searchResults.length} cidade(s) encontrada(s)
                    </div>
                    {searchResults.map((city) => {
                      const hasData = mayorData[city.nome];
                      return (
                        <div
                          key={`${city.id}-${city.nome}`}
                          onClick={() => {
                            if (hasData) {
                              selectCity(city);
                              setSearchQuery('');
                              setShowOtherCities(false);
                            }
                          }}
                          className={`px-3 py-3 m-1 rounded-lg cursor-pointer transition-all duration-200 ${
                            hasData 
                              ? 'hover:bg-blue-50 hover:shadow-md border border-transparent hover:border-blue-200' 
                              : 'hover:bg-gray-50 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              hasData ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <MapPin className={`h-4 w-4 ${hasData ? 'text-blue-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{city.nome}</span>
                                <span className="text-sm text-gray-500">• {city.uf}</span>
                              </div>
                              {hasData && mayorData[city.nome] && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Prefeito: {mayorData[city.nome].nome} ({mayorData[city.nome].partido})
                                </div>
                              )}
                            </div>
                            {hasData ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                <span className="text-xs">✓ Disponível</span>
                              </Badge>
                            ) : (
                              <span className="text-xs text-red-500">Não disponível</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Estado Vazio para Busca */}
              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma cidade encontrada</p>
                  <p className="text-xs">Tente buscar por outro termo</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Prefeito Selecionado - Mantido como está pois o usuário gostou */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-blue-700">Prefeito Selecionado</Label>
            {selectedMayor ? (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-800 text-lg">{selectedMayor.nome}</p>
                    <p className="text-sm text-green-600 font-medium">{selectedMayor.partido} • {selectedMayor.cidade}/{selectedMayor.uf}</p>
                    <p className="text-xs text-gray-600 mt-1">Mandato: {selectedMayor.mandato}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedMayor(null);
                      setSelectedCity(null);
                      setSearchQuery('');
                      loadData();
                      toast({
                        title: "Filtro Removido",
                        description: "Voltando para monitoramento geral",
                      });
                    }}
                    className="text-green-700 border-green-400 hover:bg-green-100 transition-all duration-200 hover:scale-105"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Nenhum prefeito selecionado</p>
                <p className="text-xs text-gray-500 mt-1">Use o campo de busca acima para filtrar notícias por cidade</p>
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
                <h3 className="text-lg font-semibold mb-4">
                  {selectedMayor ? `Sentimento das Notícias - ${selectedMayor.cidade}` : 'Sentimento das Notícias'}
                </h3>
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
                <h3 className="text-lg font-semibold mb-4">
                  {selectedMayor ? `Menções - ${selectedMayor.nome}` : 'Menções do Prefeito'}
                </h3>
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
            <Card className="p-6 bg-gradient-to-br from-white to-gray-50/30">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">
                  {selectedMayor ? `Análises Recentes - ${selectedMayor.cidade}` : 'Análises Recentes'}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {analyses.length} {selectedMayor ? 'filtradas' : 'total'}
                </Badge>
              </div>
              
              {analyses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Nenhuma análise disponível ainda</p>
                  <p className="text-xs">Inicie a coleta para gerar análises inteligentes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyses.slice(0, 5).map((analysis) => (
                    <div 
                      key={analysis.id} 
                      className="group border-l-4 border-purple-400 hover:border-purple-600 pl-4 py-3 bg-white/70 rounded-r-lg hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => {
                        setSelectedAnalysis(analysis);
                        setShowAnalysisModal(true);
                      }}
                    >
                      {/* Header com localização */}
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-semibold text-purple-700">
                          {selectedMayor ? `${selectedMayor.nome} - ${selectedMayor.cidade}/${selectedMayor.estado}` : 'Localização não identificada'}
                        </span>
                        {analysis.mentions_mayor && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            👤 Prefeito
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-3">
                          {/* Título */}
                          <h4 className="font-medium text-sm line-clamp-2 text-gray-900 group-hover:text-purple-700 transition-colors mb-2">
                            {analysis.news_articles?.title || analysis.title || 'Análise sem título'}
                          </h4>
                          
                          {/* Preview do conteúdo */}
                          <div className="space-y-2">
                            {analysis.executive_summary && (
                              <div className="bg-purple-50/70 p-2 rounded text-xs">
                                <div className="font-semibold text-purple-800 mb-1 flex items-center gap-1">
                                  <Brain className="h-2 w-2" />
                                  Resumo Executivo
                                </div>
                                <p className="text-purple-700 line-clamp-2 leading-relaxed">
                                  {analysis.executive_summary}
                                </p>
                              </div>
                            )}
                            
                            {analysis.impact_analysis && (
                              <div className="bg-blue-50/70 p-2 rounded text-xs">
                                <div className="font-semibold text-blue-800 mb-1 flex items-center gap-1">
                                  <TrendingUp className="h-2 w-2" />
                                  Impacto
                                </div>
                                <p className="text-blue-700 line-clamp-1 leading-relaxed">
                                  {analysis.impact_analysis}
                                </p>
                              </div>
                            )}
                            
                            {analysis.recommended_action && (
                              <div className="bg-yellow-50/70 p-2 rounded text-xs">
                                <div className="font-semibold text-yellow-800 mb-1 flex items-center gap-1">
                                  <span className="text-yellow-600">💡</span>
                                  Ação Recomendada
                                </div>
                                <p className="text-yellow-700 line-clamp-1 leading-relaxed">
                                  {analysis.recommended_action}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Métricas compactas */}
                          <div className="flex items-center gap-3 mt-3 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-gray-600">Sentimento: </span>
                              <span className="font-medium text-blue-600">
                                {analysis.sentiment_score !== null && analysis.sentiment_score !== undefined 
                                  ? (analysis.sentiment_score >= 0 ? '+' : '') + (analysis.sentiment_score * 100).toFixed(0) + '%'
                                  : 'N/A'
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-gray-600">Relevância: </span>
                              <span className="font-medium text-green-600">{analysis.relevance_score || 'N/A'}/10</span>
                            </div>
                          </div>

                          {/* Metadados */}
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                            <span className="flex items-center gap-1">
                              <User className="h-2 w-2" />
                              {analysis.news_articles?.author || analysis.author || 'Autor não informado'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-2 w-2" />
                              {analysis.news_articles?.source || analysis.source || 'Fonte não informada'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-2 w-2" />
                              {new Date(analysis.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        {/* Badges e ações */}
                        <div className="flex flex-col gap-2 items-end">
                          <Badge variant={
                            analysis.urgency_level === 'critical' ? 'destructive' :
                            analysis.urgency_level === 'high' ? 'secondary' : 'outline'
                          } className="text-xs">
                            {analysis.urgency_level === 'critical' ? '🚨 Crítico' :
                             analysis.urgency_level === 'high' ? '⚠️ Alto' : 
                             analysis.urgency_level === 'medium' ? '📊 Médio' : '📝 Baixo'}
                          </Badge>
                          
                          {analysis.crisis_potential && (
                            <Badge variant="destructive" className="text-xs">
                              🔥 Crise
                            </Badge>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0 group-hover:bg-purple-50 group-hover:border-purple-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAnalysis(analysis);
                              setShowAnalysisModal(true);
                            }}
                          >
                            <Eye className="h-3 w-3 group-hover:text-purple-600" />
                          </Button>
                        </div>
                      </div>

                      {/* Footer com call-to-action */}
                      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
                        <span>Clique para análise completa</span>
                        <ArrowRight className="h-3 w-3 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                  
                  {analyses.length > 5 && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-center">
                        Mostrando 5 de {analyses.length} análises • Vá para a aba "Análises" para ver todas
                      </p>
                    </div>
                  )}
                </div>
              )}
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
            {/* Filtros das análises */}
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-purple-600" />
                  <h3 className="font-semibold text-purple-800">Filtros de Análise</h3>
                  <Badge variant="outline" className="text-xs">
                    {filteredAnalyses.length} de {analyses.length}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-1"
                  >
                    <Filter className="h-3 w-3" />
                    {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                    {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                  {(analysisFilters.cityFilter || analysisFilters.mayorFilter || (analysisFilters.urgencyFilter && analysisFilters.urgencyFilter !== 'all') || analysisFilters.mentionsMayor || analysisFilters.crisisPotential) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAnalysisFilters}
                      className="gap-1 text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                      Limpar
                    </Button>
                  )}
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-purple-200">
                  {/* Filtro por cidade */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-purple-700">Cidade</Label>
                    <Input
                      placeholder="Ex: São Paulo, Rio de Janeiro..."
                      value={analysisFilters.cityFilter}
                      onChange={(e) => setAnalysisFilters(prev => ({ ...prev, cityFilter: e.target.value }))}
                      className="text-sm"
                    />
                  </div>

                  {/* Filtro por prefeito */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-purple-700">Prefeito</Label>
                    <Input
                      placeholder="Ex: João Silva, Maria Santos..."
                      value={analysisFilters.mayorFilter}
                      onChange={(e) => setAnalysisFilters(prev => ({ ...prev, mayorFilter: e.target.value }))}
                      className="text-sm"
                    />
                  </div>

                    {/* Filtro por urgência */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-purple-700">Urgência</Label>
                      <Select 
                        value={analysisFilters.urgencyFilter} 
                        onValueChange={(value) => setAnalysisFilters(prev => ({ ...prev, urgencyFilter: value === 'all' ? '' : value }))}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Selecionar urgência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="critical">🚨 Crítico</SelectItem>
                          <SelectItem value="high">⚠️ Alto</SelectItem>
                          <SelectItem value="medium">📊 Médio</SelectItem>
                          <SelectItem value="low">📝 Baixo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  {/* Filtros booleanos */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-purple-700">Filtros Especiais</Label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={analysisFilters.mentionsMayor}
                          onChange={(e) => setAnalysisFilters(prev => ({ ...prev, mentionsMayor: e.target.checked }))}
                          className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span>👤 Menciona Prefeito</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={analysisFilters.crisisPotential}
                          onChange={(e) => setAnalysisFilters(prev => ({ ...prev, crisisPotential: e.target.checked }))}
                          className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span>🔥 Potencial de Crise</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-purple-600" />
                <div>
                  <h2 className="text-xl font-bold">Análises Inteligentes</h2>
                  <p className="text-sm text-gray-600">
                    {filteredAnalyses.length > 0 ? 
                      `${filteredAnalyses.length} análise${filteredAnalyses.length > 1 ? 's' : ''} encontrada${filteredAnalyses.length > 1 ? 's' : ''}` :
                      'Nenhuma análise encontrada com os filtros aplicados'
                    }
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
              ) : filteredAnalyses.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                      <Brain className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="max-w-md">
                      <h3 className="text-xl font-semibold mb-2">
                        {analyses.length === 0 ? 'Nenhuma análise disponível' : 'Nenhuma análise encontrada'}
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {analyses.length === 0 ? (
                          selectedMayor 
                            ? `Inicie a coleta de notícias para ${selectedMayor.nome} para gerar análises inteligentes com IA`
                            : 'Selecione uma cidade e inicie a coleta de notícias para gerar análises inteligentes com IA'
                        ) : (
                          'Nenhuma análise corresponde aos filtros aplicados. Tente ajustar os critérios de busca.'
                        )}
                      </p>
                      {analyses.length === 0 && (
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
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredAnalyses.map((analysis) => (
                    <Card 
                      key={analysis.id} 
                      className="group p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-l-gray-200 hover:border-l-purple-500 bg-gradient-to-r from-white to-gray-50/30 hover:from-purple-50/20 hover:to-purple-100/30"
                      onClick={() => {
                        setSelectedAnalysis(analysis);
                        setShowAnalysisModal(true);
                      }}
                    >
                      {/* Header com localização e badges */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {/* Localização - Prefeitura/Cidade */}
                          <div className="flex items-center gap-2 mb-3 text-sm">
                            <MapPin className="h-4 w-4 text-purple-600" />
                            <span className="font-semibold text-purple-700">
                              {selectedMayor ? `${selectedMayor.nome} - ${selectedMayor.cidade}/${selectedMayor.estado}` : 'Localização não identificada'}
                            </span>
                            {analysis.mentions_mayor && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 ml-2">
                                👤 Menciona Prefeito
                              </Badge>
                            )}
                          </div>

                          {/* Título da análise */}
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2">
                              {analysis.news_articles?.title || analysis.title || 'Análise sem título'}
                            </h3>
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                          </div>
                          
                          {/* Preview do conteúdo da análise */}
                          <div className="mb-4 p-4 bg-gray-50/70 rounded-lg border-l-2 border-purple-200">
                            <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              Resumo Executivo
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                              {analysis.executive_summary || analysis.summary || analysis.impact_analysis || 'Preview da análise não disponível. Clique para ver mais detalhes...'}
                            </p>
                          </div>

                          {/* Impacto e ações recomendadas */}
                          {analysis.impact_analysis && (
                            <div className="mb-3 p-3 bg-blue-50/70 rounded-lg border-l-2 border-blue-200">
                              <div className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Análise de Impacto
                              </div>
                              <p className="text-xs text-blue-700 line-clamp-2">{analysis.impact_analysis}</p>
                            </div>
                          )}

                          {/* Metadados da fonte */}
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
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 mb-4">
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
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>Clique para ver análise completa com todos os detalhes</span>
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