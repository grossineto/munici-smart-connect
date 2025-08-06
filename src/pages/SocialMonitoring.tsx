
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Users, Download, Twitter, Instagram, Facebook, Music, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SearchPoliticianInput } from "@/components/SearchPoliticianInput";
import { SocialPoliticianCard } from "@/components/SocialPoliticianCard";
import { SocialMetricsGrid } from "@/components/SocialMetricsGrid";
import { PlatformTabs } from "@/components/PlatformTabs";

const SocialMonitoring = () => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [selectedPolitician, setSelectedPolitician] = useState<any>(null);
  const [monitoredPoliticians, setMonitoredPoliticians] = useState<any[]>([]);
  const [isLoadingPoliticians, setIsLoadingPoliticians] = useState(false);
  const [keywords, setKeywords] = useState<any[]>([]);

  // Base de políticos do sistema de notícias
  const politiciansFromNews = [
    {
      nome: "Ricardo Nunes",
      partido: "MDB", 
      cargo: "Prefeito",
      cidade: "São Paulo",
      uf: "SP",
      mandato: "2021-2024",
      newsCount: 56
    },
    {
      nome: "Eduardo Paes",
      partido: "PSD",
      cargo: "Prefeito", 
      cidade: "Rio de Janeiro",
      uf: "RJ",
      mandato: "2021-2024",
      newsCount: 49
    },
    {
      nome: "João Campos",
      partido: "PSB",
      cargo: "Prefeito",
      cidade: "Recife", 
      uf: "PE",
      mandato: "2021-2024",
      newsCount: 22
    },
    {
      nome: "Suéllen Rosim",
      partido: "PARTIDO VERDE",
      cargo: "Prefeita",
      cidade: "Bauru",
      uf: "SP", 
      mandato: "2021-2024",
      newsCount: 21
    },
    {
      nome: "Bruno Reis",
      partido: "UNIÃO BRASIL",
      cargo: "Prefeito",
      cidade: "Salvador",
      uf: "BA",
      mandato: "2021-2024", 
      newsCount: 17
    },
    {
      nome: "Tarcísio Gomes de Freitas",
      partido: "REPUBLICANOS",
      cargo: "Governador",
      cidade: "São Paulo",
      uf: "SP",
      mandato: "2023-2026",
      newsCount: 8
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

  // Função para coletar menções (agora usando os políticos selecionados)
  const handleCollectMentions = async () => {
    if (monitoredPoliticians.length === 0) {
      toast.error("Adicione pelo menos um político para monitorar!");
      return;
    }

    setIsCollecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-twitter-mentions', {
        body: { 
          politicians: monitoredPoliticians.map(p => p.nome)
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Coleta de menções iniciada com sucesso!");
      
      // Aguardar um pouco e recarregar os dados
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao coletar menções:', error);
      toast.error("Erro ao coletar menções. Verifique as configurações da API.");
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header Modernizado */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 p-6 border shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight heading-institutional">
              Monitoramento de Redes Sociais
            </h1>
            <p className="text-muted-foreground text-lg">
              Acompanhe menções, sentimentos e engajamento em tempo real
            </p>
            
            {/* Status das Plataformas */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Twitter className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Twitter</span>
                <div className="w-2 h-2 bg-success rounded-full"></div>
              </div>
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-pink-500" />
                <span className="text-sm text-muted-foreground">Instagram</span>
                <div className="w-2 h-2 bg-muted rounded-full"></div>
              </div>
              <div className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Facebook</span>
                <div className="w-2 h-2 bg-muted rounded-full"></div>
              </div>
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-gray-900" />
                <span className="text-sm text-muted-foreground">TikTok</span>
                <div className="w-2 h-2 bg-muted rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleImportFromNews}
              disabled={isLoadingPoliticians}
              variant="outline"
              className="flex items-center gap-2 hover:bg-background/80"
            >
              <Download className={`h-4 w-4 ${isLoadingPoliticians ? 'animate-pulse' : ''}`} />
              {isLoadingPoliticians ? 'Importando...' : 'Importar Políticos'}
            </Button>
            
            <Button 
              onClick={handleCollectMentions}
              disabled={isCollecting || monitoredPoliticians.length === 0}
              className="flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isCollecting ? 'animate-spin' : ''}`} />
              {isCollecting ? 'Coletando...' : 'Coletar Menções'}
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas Principais */}
      <SocialMetricsGrid 
        selectedPolitician={selectedPolitician?.nome || "all"}
        timeframe="7d"
      />

      {/* Seção de Busca e Seleção de Políticos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Adicionar Político</h2>
            </div>
            
            <SearchPoliticianInput
              onSelectPolitician={handleSelectPolitician}
              placeholder="Busque por nome, partido ou cidade..."
            />
            
            <div className="mt-4 text-sm text-muted-foreground">
              💡 Busque e adicione políticos para monitorar suas menções nas redes sociais
            </div>
          </div>

          {/* Lista de Políticos Monitorados */}
          {monitoredPoliticians.length > 0 && (
            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Políticos Monitorados ({monitoredPoliticians.length})</h2>
                </div>
                
                {/* Info sobre palavras-chave */}
                {keywords.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {keywords.length} palavras-chave ativas
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {monitoredPoliticians.map((politician, index) => (
                  <SocialPoliticianCard
                    key={`${politician.nome}-${politician.cidade}-${index}`}
                    politician={politician}
                    onRemove={() => handleRemovePolitician(politician)}
                    isSelected={selectedPolitician?.nome === politician.nome && selectedPolitician?.cidade === politician.cidade}
                    onSelect={() => setSelectedPolitician(politician)}
                    showKeywords={true}
                  />
                ))}
              </div>
              
              {/* Resumo das palavras-chave por categoria */}
              {keywords.length > 0 && (
                <div className="mt-4 p-3 bg-muted/50 rounded border">
                  <h4 className="text-sm font-medium mb-2">Palavras-chave ativas por categoria:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(
                      keywords.reduce((acc, kw) => {
                        acc[kw.category] = (acc[kw.category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([category, count]) => (
                      <div key={category} className="flex justify-between">
                        <span className="capitalize">{category}:</span>
                        <span className="font-medium">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dashboard Principal */}
        <div className="lg:col-span-2">
          <PlatformTabs 
            selectedPolitician={selectedPolitician?.nome || "all"}
            timeframe="7d"
            onRefresh={() => window.location.reload()}
          />
        </div>
      </div>
    </div>
  );
};

export default SocialMonitoring;
