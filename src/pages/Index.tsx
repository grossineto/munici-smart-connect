import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Brain, 
  MessageSquare, 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  ArrowRight,
  Sparkles,
  Bot,
  Activity,
  Globe,
  CheckCircle
} from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-semibold text-foreground">Carregando...</h1>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Brain,
      title: "Inteligência Artificial",
      description: "IA avançada para análise preditiva e insights estratégicos em tempo real",
      color: "text-primary"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Automatizado",
      description: "Atendimento inteligente 24/7 para munícipes via WhatsApp Business",
      color: "text-success"
    },
    {
      icon: BarChart3,
      title: "Analytics Avançado",
      description: "Dashboard completo com métricas e relatórios em tempo real",
      color: "text-accent"
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Proteção de dados LGPD e criptografia end-to-end garantida",
      color: "text-secondary"
    }
  ];

  const stats = [
    { number: "98%", label: "Eficiência", icon: Zap },
    { number: "24/7", label: "Disponibilidade", icon: Activity },
    { number: "500+", label: "Municípios", icon: Globe },
    { number: "1M+", label: "Atendimentos", icon: Users }
  ];

  const benefits = [
    "Redução de 80% no tempo de resposta ao cidadão",
    "Dashboard administrativo em tempo real",
    "Análise preditiva de demandas municipais",
    "Integração completa com sistemas existentes",
    "Suporte técnico especializado 24/7",
    "Conformidade total com LGPD"
  ];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {/* Logo com efeito float */}
            <div className="flex justify-center mb-8">
              <img 
                src="/lovable-uploads/15e88a34-c752-40da-b211-dbf4235418f1.png" 
                alt="BR.I.A.N. - Brasil Inteligência Artificial Nexus" 
                className="max-w-xs w-full h-auto float-animation hover-glow"
              />
            </div>

            {/* Título principal com gradiente */}
            <div className="space-y-4">
              <h1 className="heading-hero leading-tight">
                Brasil Inteligência
                <br />
                <span className="text-gradient">Artificial Nexus</span>
              </h1>
              
              <div className="flex items-center justify-center gap-2 text-lg text-accent">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Powered by Advanced AI</span>
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            {/* Descrição */}
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Revolucione o atendimento ao cidadão com nossa plataforma inteligente de 
              automação via WhatsApp, analytics preditivo e dashboard administrativo em tempo real.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="gradient-button text-lg px-8 py-4 h-auto hover-glow group"
              >
                <Bot className="w-5 h-5 mr-2 group-hover:animate-bounce-soft" />
                Acessar Plataforma
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-4 h-auto glass-effect hover:bg-white/20"
              >
                Ver Demonstração
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-t border-border/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-3">
                  <stat.icon className="w-8 h-8 text-primary group-hover:animate-bounce-soft" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">{stat.number}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Tecnologia de <span className="text-gradient">Última Geração</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Desenvolvido especificamente para prefeituras brasileiras com foco em eficiência e resultados
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="gradient-card p-6 rounded-2xl card-interactive hover-glow group"
              >
                <div className={`w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:pulse-glow`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Por que escolher o <span className="text-gradient">B.R.I.A.N.</span>?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Nossa plataforma foi desenvolvida com foco nas necessidades específicas do setor público brasileiro.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 group">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 group-hover:animate-bounce-soft" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="gradient-card p-8 rounded-2xl hover-glow">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto gradient-primary rounded-full flex items-center justify-center">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Implementação Rápida</h3>
                  <p className="text-muted-foreground">
                    Configure e comece a usar em menos de 24 horas. 
                    Nossa equipe cuida de toda a integração.
                  </p>
                  <Button className="gradient-button hover-glow">
                    Solicitar Demonstração
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="gradient-card p-12 rounded-3xl hover-glow">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Pronto para <span className="text-gradient">revolucionar</span> sua gestão?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de prefeituras que já confiam no B.R.I.A.N. 
              para melhorar o atendimento ao cidadão.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="gradient-button text-lg px-12 py-4 h-auto hover-glow group"
              >
                <Zap className="w-5 h-5 mr-2 group-hover:animate-bounce-soft" />
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground mt-6 border-t border-border/20 pt-6">
              Sistema desenvolvido especialmente para prefeituras brasileiras
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
