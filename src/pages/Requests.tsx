import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Eye, Edit, Trash2, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Request {
  id: string;
  protocol_number: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  location?: string;
  created_at: string;
  citizen: {
    name: string;
    phone: string;
    email?: string;
  };
  assigned_to?: {
    full_name: string;
  };
}

interface Citizen {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

const Requests = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    citizen_id: "",
    type: "",
    title: "",
    description: "",
    priority: "medium",
    location: ""
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

  const requestPriorities = [
    { value: "low", label: "Baixa" },
    { value: "medium", label: "Média" },
    { value: "high", label: "Alta" },
    { value: "urgent", label: "Urgente" }
  ];

  useEffect(() => {
    loadRequests();
    loadCitizens();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          citizen:citizens(name, phone, email),
          assigned_to:profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as solicitações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCitizens = async () => {
    try {
      const { data, error } = await supabase
        .from('citizens')
        .select('id, name, phone, email')
        .order('name');

      if (error) throw error;
      setCitizens(data || []);
    } catch (error: any) {
      console.error('Error loading citizens:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.citizen_id || !newRequest.type || !newRequest.title || !newRequest.description) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const insertData = {
        citizen_id: newRequest.citizen_id,
        type: newRequest.type,
        title: newRequest.title,
        description: newRequest.description,
        priority: newRequest.priority,
        location: newRequest.location || undefined
      } as any;

      const { error } = await supabase
        .from('requests')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Solicitação criada com sucesso!",
      });

      setIsCreateDialogOpen(false);
      setNewRequest({
        citizen_id: "",
        type: "",
        title: "",
        description: "",
        priority: "medium",
        location: ""
      });
      loadRequests();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a solicitação.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pendente" },
      in_progress: { variant: "default" as const, label: "Em Andamento" },
      completed: { variant: "outline" as const, label: "Concluída" },
      cancelled: { variant: "destructive" as const, label: "Cancelada" }
    };
    return statusConfig[status as keyof typeof statusConfig] || { variant: "secondary", label: status };
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "text-green-600",
      medium: "text-yellow-600",
      high: "text-orange-600",
      urgent: "text-red-600"
    };
    return colors[priority as keyof typeof colors] || "text-gray-600";
  };

  const getTypeLabel = (type: string) => {
    const typeConfig = requestTypes.find(t => t.value === type);
    return typeConfig?.label || type;
  };

  const getPriorityLabel = (priority: string) => {
    const priorityConfig = requestPriorities.find(p => p.value === priority);
    return priorityConfig?.label || priority;
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.protocol_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.citizen.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesType = typeFilter === "all" || request.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Carregando solicitações...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Solicitações</h1>
          <p className="text-muted-foreground">
            Gerencie todas as solicitações dos cidadãos
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Solicitação</DialogTitle>
              <DialogDescription>
                Crie uma nova solicitação para um cidadão
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="citizen">Cidadão *</Label>
                <Select value={newRequest.citizen_id} onValueChange={(value) => 
                  setNewRequest({ ...newRequest, citizen_id: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cidadão" />
                  </SelectTrigger>
                  <SelectContent>
                    {citizens.map((citizen) => (
                      <SelectItem key={citizen.id} value={citizen.id}>
                        {citizen.name} - {citizen.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select value={newRequest.type} onValueChange={(value) => 
                  setNewRequest({ ...newRequest, type: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {requestTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder="Digite o título da solicitação"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Descreva detalhadamente a solicitação"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={newRequest.priority} onValueChange={(value) => 
                    setNewRequest({ ...newRequest, priority: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {requestPriorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    value={newRequest.location}
                    onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })}
                    placeholder="Endereço ou referência"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRequest}>
                Criar Solicitação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por protocolo, título ou cidadão..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {requestStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {requestTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Solicitações */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma solicitação encontrada.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <Badge {...getStatusBadge(request.status)}>
                        {getStatusBadge(request.status).label}
                      </Badge>
                    </div>
                    <CardDescription>
                      Protocolo: {request.protocol_number} • {getTypeLabel(request.type)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {request.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="font-medium">Cidadão:</span> {request.citizen.name}
                    </div>
                    <div>
                      <span className="font-medium">Telefone:</span> {request.citizen.phone}
                    </div>
                    {request.citizen.email && (
                      <div>
                        <span className="font-medium">Email:</span> {request.citizen.email}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="font-medium">Prioridade:</span>
                      <span className={`ml-1 ${getPriorityColor(request.priority)}`}>
                        {getPriorityLabel(request.priority)}
                      </span>
                    </div>
                    {request.location && (
                      <div>
                        <span className="font-medium">Local:</span> {request.location}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Criado em:</span>{' '}
                      {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                    {request.assigned_to && (
                      <div>
                        <span className="font-medium">Responsável:</span> {request.assigned_to.full_name}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Requests;