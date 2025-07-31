import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, CheckCircle, AlertTriangle, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalCitizens: number;
  todayAppointments: number;
  urgentRequests: number;
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
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Dados mockados até o banco ser criado
      setStats({
        totalRequests: 127,
        pendingRequests: 23,
        completedRequests: 89,
        urgentRequests: 8,
        totalCitizens: 1543,
        todayAppointments: 12,
      });

      // Solicitações mockadas
      setRecentRequests([
        {
          id: '1',
          protocol_number: 'BR2024001',
          type: 'Buraco na rua',
          status: 'pending',
          priority: 'high',
          created_at: new Date().toISOString(),
          citizen_name: 'João Silva'
        },
        {
          id: '2',
          protocol_number: 'BR2024002',
          type: 'Limpeza urbana',
          status: 'in_progress',
          priority: 'medium',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          citizen_name: 'Maria Santos'
        },
        {
          id: '3',
          protocol_number: 'BR2024003',
          type: 'Iluminação pública',
          status: 'completed',
          priority: 'low',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          citizen_name: 'Pedro Costa'
        }
      ]);
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      </div>

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
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                  <div className="text-right">
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
    </div>
  );
};

export default Dashboard;