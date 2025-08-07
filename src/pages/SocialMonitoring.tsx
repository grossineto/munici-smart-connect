
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Users, Download, Twitter, Instagram, Facebook, Music, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SearchPoliticianInput } from "@/components/SearchPoliticianInput";
import { SocialPoliticianCard } from "@/components/SocialPoliticianCard";
import { SocialMetricsGrid } from "@/components/SocialMetricsGrid";
import { PlatformTabs } from "@/components/PlatformTabs";
import { SentimentLineChart } from "@/components/SentimentLineChart";
import { TrendingTopics } from "@/components/TrendingTopics";
import { MentionHeatmap } from "@/components/MentionHeatmap";
import { AlertsPanel } from "@/components/AlertsPanel";
import { SocialTimeline } from "@/components/SocialTimeline";
import { ExportTools } from "@/components/ExportTools";
import { SocialMentionsList } from "@/components/SocialMentionsList";
import { PoliticianMiniDashboard } from "@/components/PoliticianMiniDashboard";

const SocialMonitoring = () => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [selectedPolitician, setSelectedPolitician] = useState<any>(null);
  const [monitoredPoliticians, setMonitoredPoliticians] = useState<any[]>([]);
  const [isLoadingPoliticians, setIsLoadingPoliticians] = useState(false);
  const [keywords, setKeywords] = useState<any[]>([]);

  // Base de políticos do sistema com palavras-chave específicas
  const politiciansFromNews = [
    {
      nome: "Ricardo Nunes",
      partido: "MDB", 
      cargo: "Prefeito",
      cidade: "São Paulo",
      uf: "SP",
      mandato: "2021-2024",
      newsCount: 56,
      keywords: [
        "Ricardo Nunes",
        "prefeito São Paulo",
        "prefeitura São Paulo", 
        "prefeito de SP",
        "gestão Ricardo Nunes",
        "cidade de São Paulo",
        "MDB São Paulo"
      ]
    },
    {
      nome: "Eduardo Paes",
      partido: "PSD",
      cargo: "Prefeito", 
      cidade: "Rio de Janeiro",
      uf: "RJ",
      mandato: "2021-2024",
      newsCount: 49,
      keywords: [
        "Eduardo Paes",
        "prefeito Rio",
        "prefeitura Rio de Janeiro",
        "prefeito do Rio", 
        "gestão Eduardo Paes",
        "cidade maravilhosa",
        "PSD Rio"
      ]
    },
    {
      nome: "João Campos",
      partido: "PSB",
      cargo: "Prefeito",
      cidade: "Recife", 
      uf: "PE",
      mandato: "2021-2024",
      newsCount: 22,
      keywords: [
        "João Campos",
        "prefeito Recife",
        "prefeitura Recife",
        "gestão João Campos",
        "cidade do Recife",
        "PSB Recife",
        "Pernambuco"
      ]
    },
    {
      nome: "Suéllen Rosim",
      partido: "PARTIDO VERDE",
      cargo: "Prefeita",
      cidade: "Bauru",
      uf: "SP", 
      mandato: "2021-2024",
      newsCount: 21,
      keywords: [
        "Suéllen Rosim",
        "prefeita Bauru",
        "prefeitura Bauru",
        "gestão Suéllen",
        "cidade de Bauru",
        "Partido Verde Bauru"
      ]
    },
    {
      nome: "Bruno Reis",
      partido: "UNIÃO BRASIL",
      cargo: "Prefeito",
      cidade: "Salvador",
      uf: "BA",
      mandato: "2021-2024", 
      newsCount: 17,
      keywords: [
        "Bruno Reis",
        "prefeito Salvador",
        "prefeitura Salvador",
        "gestão Bruno Reis",
        "cidade de Salvador",
        "União Brasil Salvador",
        "Bahia"
      ]
    },
    {
      nome: "Tarcísio Gomes de Freitas",
      partido: "REPUBLICANOS",
      cargo: "Governador",
      cidade: "São Paulo",
      uf: "SP",
      mandato: "2023-2026",
      newsCount: 8,
      keywords: [
        "Tarcísio Freitas",
        "Tarcísio Gomes",
        "governador São Paulo",
        "governo de SP",
        "gestão Tarcísio",
        "estado de São Paulo",
        "Republicanos SP"
      ]
    }
  ];

  // Carregar palavras-chave da base
  const loadKeywords = async () => {
    try {
      const { data, error } = await supabase
        .from('monitored_keywords')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true })
        .order('keyword', { ascending: true });
      
      if (error) throw error;
      setKeywords(data || []);
    } catch (error) {
      console.error('Erro ao carregar palavras-chave:', error);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadKeywords();
  }, []);

  // Função para importar todos os políticos das notícias
  const handleImportFromNews = () => {
    setIsLoadingPoliticians(true);
    
    const politiciansToAdd = politiciansFromNews.filter(newsPolitic => 
      !monitoredPoliticians.some(monitored => 
        monitored.nome === newsPolitic.nome && monitored.cidade === newsPolitic.cidade
      )
    );
    
    const importedPoliticians = politiciansToAdd.map(politician => ({
      ...politician,
      addedAt: new Date().toISOString(),
      isActive: true,
      source: 'news_system'
    }));
    
    setMonitoredPoliticians(prev => [...prev, ...importedPoliticians]);
    
    setTimeout(() => {
      setIsLoadingPoliticians(false);
      toast.success(`${importedPoliticians.length} políticos importados do sistema de notícias!`);
    }, 1000);
  };
  const handleSelectPolitician = (politician: any) => {
    console.log('🏛️ Político selecionado para monitoramento social:', politician);
    
    // Verificar se já está sendo monitorado
    const isAlreadyMonitored = monitoredPoliticians.some(p => 
      p.nome === politician.nome && p.cidade === politician.cidade
    );
    
    if (isAlreadyMonitored) {
      toast.error("Este político já está sendo monitorado!");
      return;
    }
    
    // Adicionar à lista de monitorados
    const newPolitician = {
      ...politician,
      addedAt: new Date().toISOString(),
      isActive: true
    };
    
    setMonitoredPoliticians(prev => [...prev, newPolitician]);
    setSelectedPolitician(politician);
    
    toast.success(`${politician.nome} adicionado ao monitoramento social!`);
  };

  // Função para remover político do monitoramento
  const handleRemovePolitician = (politician: any) => {
    setMonitoredPoliticians(prev => 
      prev.filter(p => !(p.nome === politician.nome && p.cidade === politician.cidade))
    );
    
    if (selectedPolitician?.nome === politician.nome && selectedPolitician?.cidade === politician.cidade) {
      setSelectedPolitician(null);
    }
    
    toast.success(`${politician.nome} removido do monitoramento!`);
  };

  // Função para coletar menções de todas as redes sociais
  const handleCollectMentions = async () => {
    if (monitoredPoliticians.length === 0) {
      toast.error("Adicione pelo menos um político para monitorar!");
      return;
    }

    setIsCollecting(true);
    try {
      // Preparar políticos com suas palavras-chave específicas
      const politiciansWithKeywords = monitoredPoliticians.map(p => ({
        name: p.nome,
        keywords: p.keywords || [p.nome] // usar palavras-chave específicas ou apenas o nome
      }));

      console.log('Iniciando coleta com políticos:', politiciansWithKeywords);

      const { data, error } = await supabase.functions.invoke('fetch-all-social-mentions', {
        body: { 
          politicians: politiciansWithKeywords,
          platforms: ['twitter', 'instagram', 'facebook', 'tiktok']
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Mostrar resultados detalhados
      console.log('Resultado da coleta:', data);
      const results = data.results || {};
      const successful = Object.keys(results).filter(platform => results[platform]?.success);
      const failed = Object.keys(results).filter(platform => !results[platform]?.success);
      
      if (successful.length > 0) {
        toast.success(`Coleta iniciada com sucesso! Plataformas: ${successful.join(', ')}`);
      }
      
      if (failed.length > 0) {
        const errors = failed.map(platform => `${platform}: ${results[platform]?.error || 'Erro desconhecido'}`);
        toast.error(`Falha em algumas plataformas: ${errors.join(', ')}`);
        console.error('Erros por plataforma:', errors);
      }
      
      // Aguardar um pouco e recarregar os dados
      setTimeout(() => {
        window.location.reload();
      }, 5000);
      
    } catch (error) {
      console.error('Erro ao coletar menções:', error);
      toast.error("Erro ao coletar menções. Verifique as configurações da API.");
    } finally {
      setIsCollecting(false);
    }
  };

  // Se nenhum político selecionado, mostrar view principal
  if (!selectedPolitician) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        {/* Header Principal */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Monitoramento de Redes Sociais
              </h1>
              <p className="text-muted-foreground">
                Acompanhe menções, sentimentos e engajamento em tempo real
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleCollectMentions}
                disabled={isCollecting || monitoredPoliticians.length === 0}
                className="flex items-center gap-2 px-6"
              >
                <RefreshCw className={`h-4 w-4 ${isCollecting ? 'animate-spin' : ''}`} />
                {isCollecting ? 'Coletando...' : 'Coletar Menções'}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Status das Plataformas - Simplificado */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Twitter className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Twitter</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-500" />
              <span className="text-sm">Instagram</span>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Facebook</span>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-gray-600" />
              <span className="text-sm">TikTok</span>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Selecionar Político */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Selecionar Político</h2>
            <p className="text-sm text-muted-foreground">Busque e selecione um político para monitorar</p>
          </div>
          
          <div className="max-w-md">
            <SearchPoliticianInput
              onSelectPolitician={handleSelectPolitician}
              placeholder="Buscar por nome..."
            />
          </div>
        </div>

        {/* Políticos Selecionados */}
        {monitoredPoliticians.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Políticos Selecionados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monitoredPoliticians.map((politician, index) => (
                 <div 
                   key={`${politician.nome}-${politician.cidade}-${index}`}
                   onClick={() => {
                     console.log('Político selecionado:', politician);
                     setSelectedPolitician(politician);
                   }}
                   className="cursor-pointer group bg-card rounded-lg border p-4 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">
                        {politician.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{politician.nome}</h4>
                      <p className="text-xs text-muted-foreground">{politician.cargo} • {politician.cidade}</p>
                    </div>
                    {selectedPolitician?.nome === politician.nome && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
              </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mini Dashboard do Político Selecionado */}
        {selectedPolitician && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Dashboard - {selectedPolitician.nome}</h3>
              <p className="text-sm text-muted-foreground">Métricas das últimas 24 horas</p>
            </div>
            <PoliticianMiniDashboard politicianName={selectedPolitician.nome} />
          </div>
        )}

        {/* Informações do Político (quando não há selecionado) */}
        {monitoredPoliticians.length > 0 && !selectedPolitician && (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Informações do Político</h3>
            <p className="text-muted-foreground text-sm">
              Selecione um político acima para ver as informações detalhadas e análises de menções.
            </p>
          </div>
        )}

        {/* Lista de Menções Recentes */}
        {selectedPolitician && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Menções Recentes - {selectedPolitician.nome}</h3>
            <SocialMentionsList 
              selectedPolitician={selectedPolitician.nome}
            />
          </div>
        )}
        
        {!selectedPolitician && monitoredPoliticians.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Menções Recentes</h3>
            <SocialMentionsList 
              selectedPolitician="all"
            />
          </div>
        )}
      </div>
    );
  }

  // View detalhada do político selecionado
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header Detalhado */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 p-6 border shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedPolitician(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Voltar
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">
                  {selectedPolitician.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {selectedPolitician.nome}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {selectedPolitician.cargo} • {selectedPolitician.cidade}, {selectedPolitician.uf} • {selectedPolitician.partido}
                </p>
                
                {/* Redes Ativas */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 rounded">
                    <Twitter className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">Ativo</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 bg-pink-500/10 rounded">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    <span className="text-xs text-pink-600 font-medium">Ativo</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 bg-blue-600/10 rounded">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-blue-700 font-medium">Ativo</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">TikTok</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleCollectMentions}
              disabled={isCollecting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isCollecting ? 'animate-spin' : ''}`} />
              {isCollecting ? 'Coletando...' : 'Atualizar'}
            </Button>
            
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Relatório
            </Button>
          </div>
        </div>
      </div>

      {/* Alertas de Destaque */}
      <AlertsPanel selectedPolitician={selectedPolitician.nome} />

      {/* Métricas do Político */}
      <SocialMetricsGrid 
        selectedPolitician={selectedPolitician.nome}
        timeframe="7d"
      />

      {/* Tabs por Rede Social */}
      <PlatformTabs 
        selectedPolitician={selectedPolitician.nome}
        timeframe="7d"
        onRefresh={() => window.location.reload()}
      />

      {/* Lista de Menções Recentes */}
      <SocialMentionsList 
        selectedPolitician={selectedPolitician.nome}
        className="col-span-full"
      />

      {/* Análises Avançadas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SentimentLineChart 
          selectedPolitician={selectedPolitician.nome}
          timeframe="7d"
        />
        
        <div className="space-y-6">
          <TrendingTopics 
            selectedPolitician={selectedPolitician.nome}
            timeframe="7d"
          />
        </div>
      </div>

      {/* Timeline e Heatmap */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SocialTimeline 
          selectedPolitician={selectedPolitician.nome}
          timeframe="7d"
        />
        
        <MentionHeatmap 
          selectedPolitician={selectedPolitician.nome}
          timeframe="7d"
        />
      </div>

      {/* Ferramentas de Exportação */}
      <ExportTools 
        selectedPolitician={selectedPolitician.nome}
        timeframe="7d"
      />
    </div>
  );
};

export default SocialMonitoring;
