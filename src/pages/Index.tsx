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
      <div className="text-center space-y-6 max-w-2xl mx-auto px-4">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-primary">BRIAN</h1>
          <h2 className="text-2xl font-semibold text-foreground">Brasil Inteligência Artificial Nexus</h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Sistema inteligente para atendimento automatizado de munícipes via WhatsApp, 
            com dashboard administrativo em tempo real e análise preditiva de dados.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-3"
          >
            Acessar Sistema
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Sistema desenvolvido para prefeituras
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
