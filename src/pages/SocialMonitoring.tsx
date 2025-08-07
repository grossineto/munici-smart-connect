
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Users, Download, Twitter, Instagram, Facebook, Music, TrendingUp, CheckCircle, Clock, AlertCircle, X } from "lucide-react";
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
  const [showDetailedView, setShowDetailedView] = useState(false);

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
      
      // Não recarregar a página - apenas atualizar estado se necessário
      
    } catch (error) {
      console.error('Erro ao coletar menções:', error);
      toast.error("Erro ao coletar menções. Verifique as configurações da API.");
    } finally {
      setIsCollecting(false);
    }
  };

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
          
          {selectedPolitician && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Exportar
            </Button>
          )}
        </div>

        {/* Status das Plataformas */}
        <div className="flex items-center gap-6 p-4 bg-muted/20 rounded-lg border">
          <div className="flex items-center gap-2">
            <Twitter className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Twitter</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center gap-2">
            <Instagram className="h-4 w-4 text-pink-500" />
            <span className="text-sm">Instagram</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Facebook</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-gray-600" />
            <span className="text-sm">TikTok</span>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Timeline Vertical - Estrutura Reorganizada */}
      <div className="space-y-8">
        {/* 3. Seleção do Político Monitorado */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Político Monitorado</h2>
            <p className="text-sm text-muted-foreground">Selecione um político para monitorar</p>
          </div>
          
          {/* Campo de Busca e Botão de Coleta */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <SearchPoliticianInput
                  onSelectPolitician={handleSelectPolitician}
                  placeholder="Buscar por nome..."
                />
              </div>
              <Button 
                onClick={handleCollectMentions}
                disabled={isCollecting || monitoredPoliticians.length === 0}
                className="flex items-center gap-2 px-4"
              >
                <RefreshCw className={`h-4 w-4 ${isCollecting ? 'animate-spin' : ''}`} />
                {isCollecting ? 'Coletando...' : 'Coletar Menções'}
              </Button>
            </div>
            
            {/* Seção "Importar do Sistema de Notícias" - apenas quando não há políticos */}
            {monitoredPoliticians.length === 0 && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Importar do Sistema de Notícias</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Adicione rapidamente políticos já cadastrados no sistema de notícias
                </p>
                <Button 
                  onClick={handleImportFromNews}
                  disabled={isLoadingPoliticians}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  <Users className="h-3 w-3 mr-1" />
                  {isLoadingPoliticians ? 'Importando...' : 'Importar Políticos'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 4. Informações do Político Selecionado */}
        {selectedPolitician && (
          <div className="bg-card rounded-xl border p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Informações do Político</h2>
              <p className="text-sm text-muted-foreground">Dados e configurações do monitoramento</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-foreground">
                  {selectedPolitician.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedPolitician.nome}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedPolitician.cargo} • {selectedPolitician.cidade}, {selectedPolitician.uf}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedPolitician.partido} • {selectedPolitician.mandato}
                </p>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleRemovePolitician(selectedPolitician)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Redes Monitoradas */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Redes Monitoradas:</p>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded text-xs">
                  <Twitter className="h-3 w-3 text-blue-500" />
                  <span className="text-blue-600">Twitter</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-pink-500/10 rounded text-xs">
                  <Instagram className="h-3 w-3 text-pink-500" />
                  <span className="text-pink-600">Instagram</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-600/10 rounded text-xs">
                  <Facebook className="h-3 w-3 text-blue-600" />
                  <span className="text-blue-700">Facebook</span>
                </div>
              </div>
            </div>

            {/* Palavras-chave */}
            {selectedPolitician.keywords && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Palavras-chave:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedPolitician.keywords.slice(0, 4).map((keyword: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-muted rounded text-xs">
                      {keyword}
                    </span>
                  ))}
                  {selectedPolitician.keywords.length > 4 && (
                    <span className="px-2 py-1 bg-muted rounded text-xs">
                      +{selectedPolitician.keywords.length - 4} mais
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Lista de Outros Políticos Monitorados */}
            {monitoredPoliticians.length > 1 && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Outros Políticos ({monitoredPoliticians.length - 1})</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {monitoredPoliticians
                    .filter(p => p.nome !== selectedPolitician?.nome)
                    .map((politician, index) => (
                      <div 
                        key={`${politician.nome}-${index}`}
                        onClick={() => setSelectedPolitician(politician)}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">
                            {politician.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{politician.nome}</p>
                          <p className="text-xs text-muted-foreground truncate">{politician.cidade}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Mini Dashboard */}
        {selectedPolitician && (
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Dashboard - {selectedPolitician.nome}</h2>
              <p className="text-sm text-muted-foreground">Métricas das últimas 24 horas</p>
            </div>
            <PoliticianMiniDashboard politicianName={selectedPolitician.nome} />
          </div>
        )}

        {/* 6. Menções Relacionadas ao Político */}
        {selectedPolitician && (
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Menções Recentes</h2>
              <p className="text-sm text-muted-foreground">Últimas menções encontradas nas redes sociais</p>
            </div>
            <SocialMentionsList selectedPolitician={selectedPolitician.nome} />
          </div>
        )}

        {/* Estado Vazio - Quando nenhum político está selecionado */}
        {!selectedPolitician && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Selecione um Político</h3>
                <p className="text-muted-foreground text-sm">
                  Escolha um político para começar o monitoramento de redes sociais e ver todas as análises em tempo real.
                </p>
              </div>
              {monitoredPoliticians.length === 0 && (
                <Button 
                  onClick={handleImportFromNews}
                  disabled={isLoadingPoliticians}
                  className="mt-4"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {isLoadingPoliticians ? 'Importando...' : 'Importar Políticos'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7. Análises de Sentimentos e Gráficos */}
      {selectedPolitician && (
        <div className="space-y-6">
          {/* Análises Rápidas */}
          <div className="bg-card rounded-xl border p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Análises de Sentimentos</h2>
              <p className="text-sm text-muted-foreground">Gráficos e tendências dos últimos 7 dias</p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <SentimentLineChart 
                selectedPolitician={selectedPolitician.nome}
                timeframe="7d"
              />
              <TrendingTopics 
                selectedPolitician={selectedPolitician.nome}
                timeframe="7d"
              />
            </div>
          </div>

          {/* Tabs por Plataforma */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Análise por Plataforma</h2>
              <p className="text-sm text-muted-foreground">Detalhamento por rede social</p>
            </div>
            <PlatformTabs 
              selectedPolitician={selectedPolitician.nome}
              timeframe="7d"
              onRefresh={() => window.location.reload()}
            />
          </div>

          {/* Análises Detalhadas - Expandível */}
          {showDetailedView && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Análises Detalhadas</h3>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowDetailedView(false)}
                  size="sm"
                >
                  Ocultar Detalhes
                </Button>
              </div>

              <SocialMetricsGrid 
                selectedPolitician={selectedPolitician.nome}
                timeframe="7d"
              />

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

              <ExportTools 
                selectedPolitician={selectedPolitician.nome}
                timeframe="7d"
              />
            </div>
          )}

          {/* Botão para Ver Mais Detalhes */}
          {!showDetailedView && (
            <div className="text-center">
              <Button 
                variant="outline"
                onClick={() => setShowDetailedView(true)}
                className="px-8"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Ver Análises Detalhadas
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialMonitoring;
