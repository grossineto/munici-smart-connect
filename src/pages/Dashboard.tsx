
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, AlertTriangle, MessageSquare, Calendar, FileText, Phone, Eye, Share2, Newspaper } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { title: "Solicitações Pendentes", value: "24", change: "+12%", icon: MessageSquare },
    { title: "Cidadãos Ativos", value: "1,234", change: "+5%", icon: Users },
    { title: "Urgências Hoje", value: "3", change: "-2%", icon: AlertTriangle },
    { title: "Agendamentos", value: "18", change: "+8%", icon: Calendar },
  ];

  const quickActions = [
    { title: "Ver Insights", description: "Análises e tendências da cidade", icon: TrendingUp, path: "/insights" },
    { title: "Monitorar Notícias", description: "Acompanhe as notícias da região", icon: Newspaper, path: "/news-monitoring" },
    { title: "Monitorar Redes Sociais", description: "Acompanhe menções e engajamento", icon: Share2, path: "/social-monitoring" },
    { title: "Gabinete de Urgência", description: "Situações que precisam de atenção", icon: AlertTriangle, path: "/urgency-office" },
    { title: "WhatsApp", description: "Central de atendimento", icon: Phone, path: "/whatsapp" },
    { title: "Relatórios", description: "Gere relatórios detalhados", icon: FileText, path: "/reports" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao painel de controle do BR.I.A.N.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change} em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Ações Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <action.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </div>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(action.path)}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Acessar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
