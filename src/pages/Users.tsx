import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Users as UsersIcon, 
  UserPlus, 
  Shield, 
  Mail, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  full_name: string;
  phone?: string;
  role: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  email?: string;
  last_sign_in_at?: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "operator" | "viewer";
  assigned_by?: string;
  assigned_at: string;
  assignee?: {
    full_name: string;
  };
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "viewer",
    message: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Load profiles with user data
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Load user roles with assignee data
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select(`
          *,
          assignee:profiles!user_roles_assigned_by_fkey(full_name)
        `)
        .order("assigned_at", { ascending: false });

      // Note: The relation might not exist yet, so we'll handle this differently
      const { data: simpleRolesData, error: simpleRolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("assigned_at", { ascending: false });

      if (simpleRolesError) throw simpleRolesError;

      setUsers(profilesData || []);
      setUserRoles(simpleRolesData || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async () => {
    if (!newUser.email || !newUser.full_name) {
      toast({
        title: "Campos obrigatórios",
        description: "Email e nome completo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
        newUser.email,
        {
          data: {
            full_name: newUser.full_name,
            phone: newUser.phone,
          },
          redirectTo: `${window.location.origin}/auth`,
        }
      );

      if (authError) throw authError;

      // If user was created, assign role
      if (authData.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: newUser.role as "admin" | "moderator" | "operator" | "viewer",
            assigned_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (roleError) throw roleError;
      }

      toast({
        title: "Sucesso",
        description: "Convite enviado com sucesso",
      });

      setIsInviteDialogOpen(false);
      setNewUser({
        email: "",
        full_name: "",
        phone: "",
        role: "viewer",
        message: "",
      });
      loadUsers();
    } catch (error: any) {
      console.error("Error inviting user:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar convite",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Delete existing role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: newRole as "admin" | "moderator" | "operator" | "viewer",
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Função do usuário atualizada",
      });

      loadUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar função do usuário",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async () => {
    if (!selectedUserId) return;

    try {
      // Delete user roles first
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedUserId);

      // Delete profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", selectedUserId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso",
      });

      setIsDeleteDialogOpen(false);
      setSelectedUserId(null);
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover usuário",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: "Administrador", variant: "destructive" as const },
      moderator: { label: "Moderador", variant: "default" as const },
      operator: { label: "Operador", variant: "secondary" as const },
      viewer: { label: "Visualizador", variant: "outline" as const },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "admin").length,
    moderators: users.filter(u => u.role === "moderator").length,
    operators: users.filter(u => u.role === "operator").length,
    viewers: users.filter(u => u.role === "viewer").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Gerencie usuários administrativos e suas permissões</p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Convidar Novo Usuário</DialogTitle>
              <DialogDescription>
                Envie um convite para um novo usuário administrativo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="role">Função</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="moderator">Moderador</SelectItem>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Mensagem do Convite (opcional)</Label>
                <Textarea
                  id="message"
                  value={newUser.message}
                  onChange={(e) => setNewUser({ ...newUser, message: e.target.value })}
                  placeholder="Mensagem personalizada para o convite..."
                  rows={3}
                />
              </div>

              <Button onClick={inviteUser} className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Enviar Convite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderadores</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.moderators}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operadores</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.operators}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizadores</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.viewers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nome, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role-filter">Função</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as funções" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="moderator">Moderador</SelectItem>
                  <SelectItem value="operator">Operador</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("all");
                }}
                className="w-full"
              >
                <Filter className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email || "Não informado"}</TableCell>
                      <TableCell>{user.phone || "Não informado"}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => updateUserRole(user.user_id, "admin")}
                              disabled={user.role === "admin"}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Tornar Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateUserRole(user.user_id, "moderator")}
                              disabled={user.role === "moderator"}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Tornar Moderador
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateUserRole(user.user_id, "operator")}
                              disabled={user.role === "operator"}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Tornar Operador
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateUserRole(user.user_id, "viewer")}
                              disabled={user.role === "viewer"}
                            >
                              <UsersIcon className="mr-2 h-4 w-4" />
                              Tornar Visualizador
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUserId(user.user_id);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover Usuário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja remover este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}