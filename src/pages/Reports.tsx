import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Download, TrendingUp, TrendingDown, Users, FileText, Clock, CheckCircle, FileImage, FileSpreadsheet } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

interface ReportData {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  averageResponseTime: number;
  requestsByType: Array<{ type: string; count: number; label: string }>;
  requestsByStatus: Array<{ status: string; count: number; label: string }>;
  requestsByMonth: Array<{ month: string; count: number }>;
  topCitizens: Array<{ name: string; count: number; phone: string }>;
}

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    averageResponseTime: 0,
    requestsByType: [],
    requestsByStatus: [],
    requestsByMonth: [],
    topCitizens: []
  });
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const requestTypes = [
    { value: "manutencao", label: "Manutenção" },
    { value: "limpeza", label: "Limpeza" },
    { value: "iluminacao", label: "Iluminação" },
    { value: "transporte", label: "Transporte" },
    { value: "saude", label: "Saúde" },
    { value: "educacao", label: "Educação" },
    { value: "outros", label: "Outros" }
  ];

  const requestStatuses = [
    { value: "pending", label: "Pendente" },
    { value: "in_progress", label: "Em Andamento" },
    { value: "completed", label: "Concluída" },
    { value: "cancelled", label: "Cancelada" }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    try {
      // Buscar solicitações no período selecionado
      const { data: requests, error } = await supabase
        .from('requests')
        .select(`
          *,
          citizen:citizens(name, phone, email)
        `)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (error) throw error;

      const requestsData = requests || [];

      // Calcular estatísticas gerais
      const totalRequests = requestsData.length;
      const pendingRequests = requestsData.filter(r => r.status === 'pending').length;
      const completedRequests = requestsData.filter(r => r.status === 'completed').length;

      // Calcular tempo médio de resposta (simulado - em dias)
      const completedWithTime = requestsData
        .filter(r => r.status === 'completed' && r.completed_at)
        .map(r => {
          const created = new Date(r.created_at);
          const completed = new Date(r.completed_at!);
          return Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        });
      
      const averageResponseTime = completedWithTime.length > 0 
        ? Math.round(completedWithTime.reduce((acc, time) => acc + time, 0) / completedWithTime.length)
        : 0;

      // Solicitações por tipo
      const typeCount = new Map();
      requestsData.forEach(request => {
        typeCount.set(request.type, (typeCount.get(request.type) || 0) + 1);
      });

      const requestsByType = Array.from(typeCount.entries()).map(([type, count]) => ({
        type,
        count: count as number,
        label: requestTypes.find(t => t.value === type)?.label || type
      }));

      // Solicitações por status
      const statusCount = new Map();
      requestsData.forEach(request => {
        statusCount.set(request.status, (statusCount.get(request.status) || 0) + 1);
      });

      const requestsByStatus = Array.from(statusCount.entries()).map(([status, count]) => ({
        status,
        count: count as number,
        label: requestStatuses.find(s => s.value === status)?.label || status
      }));

      // Solicitações por mês (últimos 6 meses)
      const monthlyData = new Map();
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, 'yyyy-MM');
        const monthLabel = format(monthDate, 'MMM/yyyy', { locale: ptBR });
        monthlyData.set(monthKey, { month: monthLabel, count: 0 });
      }

      requestsData.forEach(request => {
        const monthKey = format(new Date(request.created_at), 'yyyy-MM');
        if (monthlyData.has(monthKey)) {
          monthlyData.get(monthKey)!.count++;
        }
      });

      const requestsByMonth = Array.from(monthlyData.values());

      // Top cidadãos com mais solicitações
      const citizenCount = new Map();
      requestsData.forEach(request => {
        const citizenKey = request.citizen.name;
        const current = citizenCount.get(citizenKey) || { name: request.citizen.name, phone: request.citizen.phone, count: 0 };
        citizenCount.set(citizenKey, { ...current, count: current.count + 1 });
      });

      const topCitizens = Array.from(citizenCount.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setReportData({
        totalRequests,
        pendingRequests,
        completedRequests,
        averageResponseTime,
        requestsByType,
        requestsByStatus,
        requestsByMonth,
        topCitizens
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do relatório.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('report-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `relatorio-solicitacoes-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Sucesso",
        description: "Relatório exportado para PDF com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório para PDF.",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Planilha de estatísticas gerais
      const statsData = [
        ['Estatísticas Gerais', ''],
        ['Total de Solicitações', reportData.totalRequests],
        ['Solicitações Pendentes', reportData.pendingRequests],
        ['Solicitações Concluídas', reportData.completedRequests],
        ['Tempo Médio de Resposta (dias)', reportData.averageResponseTime],
        ['Taxa de Conclusão (%)', Math.round((reportData.completedRequests / reportData.totalRequests) * 100) || 0],
        [''],
        ['Período', `${format(dateRange?.from || new Date(), 'dd/MM/yyyy')} - ${format(dateRange?.to || new Date(), 'dd/MM/yyyy')}`],
      ];

      const statsWS = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, statsWS, 'Estatísticas');

      // Planilha de solicitações por tipo
      if (reportData.requestsByType.length > 0) {
        const typeData = [
          ['Tipo', 'Quantidade'],
          ...reportData.requestsByType.map(item => [item.label, item.count])
        ];
        const typeWS = XLSX.utils.aoa_to_sheet(typeData);
        XLSX.utils.book_append_sheet(wb, typeWS, 'Por Tipo');
      }

      // Planilha de solicitações por status
      if (reportData.requestsByStatus.length > 0) {
        const statusData = [
          ['Status', 'Quantidade'],
          ...reportData.requestsByStatus.map(item => [item.label, item.count])
        ];
        const statusWS = XLSX.utils.aoa_to_sheet(statusData);
        XLSX.utils.book_append_sheet(wb, statusWS, 'Por Status');
      }

      // Planilha de tendência mensal
      if (reportData.requestsByMonth.length > 0) {
        const monthData = [
          ['Mês', 'Quantidade'],
          ...reportData.requestsByMonth.map(item => [item.month, item.count])
        ];
        const monthWS = XLSX.utils.aoa_to_sheet(monthData);
        XLSX.utils.book_append_sheet(wb, monthWS, 'Tendência Mensal');
      }

      // Planilha de top cidadãos
      if (reportData.topCitizens.length > 0) {
        const citizenData = [
          ['Nome', 'Telefone', 'Quantidade de Solicitações'],
          ...reportData.topCitizens.map(item => [item.name, item.phone, item.count])
        ];
        const citizenWS = XLSX.utils.aoa_to_sheet(citizenData);
        XLSX.utils.book_append_sheet(wb, citizenWS, 'Top Cidadãos');
      }

      const fileName = `relatorio-solicitacoes-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Sucesso",
        description: "Relatório exportado para Excel com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório para Excel.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Carregando relatórios...</h2>
        </div>
      </div>
    );
  }

  const completionRate = reportData.totalRequests > 0 
    ? Math.round((reportData.completedRequests / reportData.totalRequests) * 100) 
    : 0;

  return (
    <div id="report-content" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise e estatísticas das solicitações
          </p>
        </div>
        
        <div className="flex gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToPDF}>
                <FileImage className="mr-2 h-4 w-4" />
                Exportar para PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar para Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              no período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              aguardando atendimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.completedRequests}</div>
            <p className="text-xs text-muted-foreground">
              {completionRate}% de conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.averageResponseTime}</div>
            <p className="text-xs text-muted-foreground">
              dias para conclusão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solicitações por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitações por Tipo</CardTitle>
            <CardDescription>
              Distribuição das solicitações por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.requestsByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Solicitações por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Solicitações</CardTitle>
            <CardDescription>
              Distribuição atual por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.requestsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {reportData.requestsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tendência Temporal */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência dos Últimos Meses</CardTitle>
          <CardDescription>
            Volume de solicitações por mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.requestsByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Cidadãos */}
      <Card>
        <CardHeader>
          <CardTitle>Cidadãos com Mais Solicitações</CardTitle>
          <CardDescription>
            Top 5 cidadãos por número de solicitações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.topCitizens.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum dado disponível para o período selecionado
              </p>
            ) : (
              reportData.topCitizens.map((citizen, index) => (
                <div key={citizen.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{citizen.name}</p>
                      <p className="text-sm text-muted-foreground">{citizen.phone}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {citizen.count} solicitações
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;