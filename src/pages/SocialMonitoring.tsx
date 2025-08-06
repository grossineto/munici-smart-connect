
import { SocialDashboard } from "@/components/SocialDashboard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Plus } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SearchPoliticianInput } from "@/components/SearchPoliticianInput";
import { SocialPoliticianCard } from "@/components/SocialPoliticianCard";

const SocialMonitoring = () => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [selectedPolitician, setSelectedPolitician] = useState<any>(null);
  const [monitoredPoliticians, setMonitoredPoliticians] = useState<any[]>([]);

  // Função para adicionar político ao monitoramento
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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoramento de Redes Sociais</h1>
          <p className="text-muted-foreground">
            📢 Posts dos políticos • 💬 Menções públicas • 📈 Engajamento • 🧠 Análise de sentimento
          </p>
        </div>
        
        <Button 
          onClick={handleCollectMentions}
          disabled={isCollecting || monitoredPoliticians.length === 0}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isCollecting ? 'animate-spin' : ''}`} />
          {isCollecting ? 'Coletando...' : 'Coletar Menções'}
        </Button>
      </div>

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
              <div className="flex items-center gap-2 mb-4">
                <Plus className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Políticos Monitorados ({monitoredPoliticians.length})</h2>
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
            </div>
          )}
        </div>

        {/* Dashboard Principal */}
        <div className="lg:col-span-2">
          <SocialDashboard />
        </div>
      </div>
    </div>
  );
};

export default SocialMonitoring;
