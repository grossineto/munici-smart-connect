import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, CheckCircle, AlertTriangle, Users, Calendar, TrendingUp, Brain, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalCitizens: number;
  todayAppointments: number;
  urgentRequests: number;
  whatsappMessages: number;
  averageResponseTime: number;
}

interface AIInsight {
  insight_type: string;
  title: string;
  description: string;
  severity: string;
  data: any;
}

interface RecentRequest {
  id: string;
  protocol_number: string;
  type: string;
  status: string;
  priority: string;
  created_at: string;
  citizen_name?: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalCitizens: 0,
    todayAppointments: 0,
    urgentRequests: 0,
    whatsappMessages: 0,
    averageResponseTime: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Carregar estatísticas reais
      const [requestsData, citizensData, appointmentsData, messagesData] = await Promise.all([
        supabase.from('requests').select('*'),
        supabase.from('citizens').select('*'),
        supabase.from('appointments').select('*').eq('scheduled_date', new Date().toISOString().split('T')[0]),
        supabase.from('messages').select('*').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const requests = requestsData.data || [];
      const citizens = citizensData.data || [];
      const todayAppointments = appointmentsData.data || [];
      const recentMessages = messagesData.data || [];

      // Calcular tempo médio de resposta
      const completedRequests = requests.filter(r => r.status === 'completed' && r.completed_at);
      const avgResponseTime = completedRequests.length > 0
        ? completedRequests.reduce((acc, req) => {
            const created = new Date(req.created_at);
            const completed = new Date(req.completed_at);
            return acc + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / completedRequests.length
        : 0;

      setStats({
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        completedRequests: requests.filter(r => r.status === 'completed').length,
        urgentRequests: requests.filter(r => r.priority === 'urgent' || r.priority === 'high').length,
        totalCitizens: citizens.length,
        todayAppointments: todayAppointments.length,
        whatsappMessages: recentMessages.filter(m => m.is_from_citizen).length,
        averageResponseTime: Math.round(avgResponseTime),
      });

      // Carregar solicitações recentes
      const { data: recentRequestsData, error: recentError } = await supabase
        .from('requests')
        .select(`
          *,
          citizen:citizens(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentError && recentRequestsData) {
        setRecentRequests(recentRequestsData.map(req => ({
          id: req.id,
          protocol_number: req.protocol_number,
          type: req.type,
          status: req.status,
          priority: req.priority,
          created_at: req.created_at,
          citizen_name: req.citizen?.name || 'Desconhecido'
        })));
      }

      // Carregar insights de IA
      const { data: insights, error: insightsError } = await supabase
        .rpc('generate_analytics_insights');
      
      if (!insightsError && insights) {
        setAiInsights(insights);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as informações do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, label: "Pendente" },
      in_progress: { variant: "default" as const, label: "Em Andamento" },
      completed: { variant: "outline" as const, label: "Concluída" },
    };
    
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "text-green-600",
      medium: "text-yellow-600", 
      high: "text-red-600",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Carregando dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do sistema municipal de atendimento.
        </p>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Solicitações
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              Todas as solicitações registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando atendimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Concluídas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedRequests}</div>
            <p className="text-xs text-muted-foreground">
              Solicitações finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Urgentes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.urgentRequests}</div>
            <p className="text-xs text-muted-foreground">
              Prioridade alta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Munícipes Cadastrados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCitizens}</div>
            <p className="text-xs text-muted-foreground">
              Total de usuários registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Agendamentos Hoje
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Consultas agendadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              WhatsApp (24h)
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.whatsappMessages}</div>
            <p className="text-xs text-muted-foreground">
              Mensagens recebidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo Médio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseTime}</div>
            <p className="text-xs text-muted-foreground">
              dias para resolução
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análise Preditiva - Insights de IA */}
      {aiInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Análise Preditiva
            </CardTitle>
            <CardDescription>
              Insights automáticos baseados nos dados do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiInsights.map((insight, index) => (
                <div 
                  key={index} 
                  className={`p-4 border rounded-lg ${
                    insight.severity === 'high' ? 'border-red-200 bg-red-50' :
                    insight.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      insight.severity === 'high' ? 'bg-red-100' :
                      insight.severity === 'medium' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      {insight.severity === 'high' ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : insight.severity === 'medium' ? (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Solicitações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitações Recentes</CardTitle>
            <CardDescription>
              Últimas 5 solicitações registradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequests.length > 0 ? (
                recentRequests.map((request) => (
                  <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{request.protocol_number}</span>
                        <Badge {...getStatusBadge(request.status)}>
                          {getStatusBadge(request.status).label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.type} • {request.citizen_name}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className={`text-sm font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority === 'high' ? 'Alta' : 
                         request.priority === 'medium' ? 'Média' : 'Baixa'} prioridade
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma solicitação encontrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mapa de Demandas por Região */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Demandas por Região
            </CardTitle>
            <CardDescription>
              Distribuição geográfica das solicitações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Mapa interativo será implementado</p>
                <p className="text-sm">com integração de geolocalização</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;