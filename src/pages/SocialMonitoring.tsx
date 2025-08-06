
import { SocialDashboard } from "@/components/SocialDashboard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SocialMonitoring = () => {
  const [isCollecting, setIsCollecting] = useState(false);

  const handleCollectMentions = async () => {
    setIsCollecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-twitter-mentions');
      
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoramento de Redes Sociais</h1>
          <p className="text-muted-foreground">
            Acompanhe menções, posts e engajamento de políticos nas redes sociais em tempo real
          </p>
        </div>
        
        <Button 
          onClick={handleCollectMentions}
          disabled={isCollecting}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isCollecting ? 'animate-spin' : ''}`} />
          {isCollecting ? 'Coletando...' : 'Coletar Menções'}
        </Button>
      </div>
      
      <SocialDashboard />
    </div>
  );
};

export default SocialMonitoring;
