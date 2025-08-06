
import { SocialDashboard } from "@/components/SocialDashboard";

const SocialMonitoring = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monitoramento de Redes Sociais</h1>
        <p className="text-muted-foreground">
          Acompanhe menções, posts e engajamento de políticos nas redes sociais em tempo real
        </p>
      </div>
      
      <SocialDashboard />
    </div>
  );
};

export default SocialMonitoring;
