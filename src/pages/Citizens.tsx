import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, UserPlus, MapPin, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentTenantId } from "@/lib/tenant";

interface Citizen {
  id: string;
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  address?: string;
  neighborhood?: string;
  whatsapp_phone?: string;
  registration_step?: string;
  preferred_language?: string;
  created_at: string;
  updated_at: string;
}

export default function Citizens() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [filteredCitizens, setFilteredCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNeighborhood, setFilterNeighborhood] = useState("all");
  const [filterRegistrationStep, setFilterRegistrationStep] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    address: "",
    neighborhood: "",
    whatsapp_phone: "",
    preferred_language: "pt-BR"
  });

  useEffect(() => {
    fetchCitizens();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [citizens, searchTerm, filterNeighborhood, filterRegistrationStep]);

  const fetchCitizens = async () => {
    try {
      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCitizens(data || []);
      
      // Extract unique neighborhoods
      const uniqueNeighborhoods = [...new Set(
        (data || [])
          .map(citizen => citizen.neighborhood)
          .filter(Boolean)
      )].sort();
      setNeighborhoods(uniqueNeighborhoods);
    } catch (error) {
      console.error('Error fetching citizens:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar munícipes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = citizens;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(citizen =>
        citizen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citizen.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citizen.phone.includes(searchTerm) ||
        citizen.cpf?.includes(searchTerm)
      );
    }

    // Neighborhood filter
    if (filterNeighborhood && filterNeighborhood !== "all") {
      filtered = filtered.filter(citizen => citizen.neighborhood === filterNeighborhood);
    }

    // Registration step filter
    if (filterRegistrationStep && filterRegistrationStep !== "all") {
      filtered = filtered.filter(citizen => citizen.registration_step === filterRegistrationStep);
    }

    setFilteredCitizens(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const tenantId = await getCurrentTenantId();
      if (!tenantId) {
        toast({ title: "Sem acesso", description: "Não foi possível identificar seu município.", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from('citizens')
        .insert([{
          ...formData,
          registration_step: 'completed',
          tenant_id: tenantId,
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Munícipe cadastrado com sucesso"
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        address: "",
        neighborhood: "",
        whatsapp_phone: "",
        preferred_language: "pt-BR"
      });
      setIsDialogOpen(false);
      fetchCitizens();
    } catch (error) {
      console.error('Error creating citizen:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar munícipe",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterNeighborhood("all");
    setFilterRegistrationStep("all");
  };

  const getRegistrationStepBadge = (step?: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      incomplete: "destructive"
    };
    
    return (
      <Badge variant={variants[step || "incomplete"]}>
        {step === "completed" ? "Completo" : 
         step === "pending" ? "Pendente" : "Incompleto"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando munícipes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Munícipes</h1>
          <p className="text-muted-foreground">
            Gerencie o cadastro dos munícipes da cidade
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Munícipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Munícipe</DialogTitle>
              <DialogDescription>
                Preencha os dados do munícipe
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_phone">WhatsApp</Label>
                  <Input
                    id="whatsapp_phone"
                    value={formData.whatsapp_phone}
                    onChange={(e) => handleInputChange("whatsapp_phone", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Cadastrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Munícipes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{citizens.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cadastros Completos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {citizens.filter(c => c.registration_step === 'completed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bairros Atendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{neighborhoods.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Com WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {citizens.filter(c => c.whatsapp_phone).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, e-mail, telefone, CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Select value={filterNeighborhood} onValueChange={setFilterNeighborhood}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os bairros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os bairros</SelectItem>
                  {neighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status do Cadastro</Label>
              <Select value={filterRegistrationStep} onValueChange={setFilterRegistrationStep}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="completed">Completo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="incomplete">Incompleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Citizens Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Munícipes</CardTitle>
          <CardDescription>
            {filteredCitizens.length} de {citizens.length} munícipes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCitizens.map((citizen) => (
                  <TableRow key={citizen.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{citizen.name}</div>
                        {citizen.cpf && (
                          <div className="text-sm text-muted-foreground">
                            CPF: {citizen.cpf}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {citizen.phone}
                        </div>
                        {citizen.email && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 mr-1" />
                            {citizen.email}
                          </div>
                        )}
                        {citizen.whatsapp_phone && (
                          <Badge variant="outline" className="text-xs">
                            WhatsApp
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {citizen.neighborhood && (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1" />
                            {citizen.neighborhood}
                          </div>
                        )}
                        {citizen.address && (
                          <div className="text-xs text-muted-foreground">
                            {citizen.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRegistrationStepBadge(citizen.registration_step)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(citizen.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredCitizens.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum munícipe encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}