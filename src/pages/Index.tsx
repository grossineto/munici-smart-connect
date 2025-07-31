import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Carregando...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="text-center space-y-8 max-w-2xl mx-auto px-4 animate-fade-in">
        <div className="space-y-6">
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/15e88a34-c752-40da-b211-dbf4235418f1.png" 
              alt="BR.I.A.N. - Brasil Inteligência Artificial Nexus" 
              className="max-w-sm w-full h-auto hover-scale"
            />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Brasil Inteligência Artificial Nexus</h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Sistema inteligente para atendimento automatizado de munícipes via WhatsApp, 
            com dashboard administrativo em tempo real e análise preditiva de dados.
          </p>
        </div>
        
        <div className="space-y-6 pt-4">
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="text-lg px-12 py-4 h-auto hover-scale"
          >
            Acessar Sistema
          </Button>
          
          <div className="text-sm text-muted-foreground border-t pt-4">
            Sistema desenvolvido para prefeituras brasileiras
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
