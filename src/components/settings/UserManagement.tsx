import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Search, UserPlus, Mail, Shield, Trash2, Edit, MoreHorizontal, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: 'admin' | 'moderator' | 'operator' | 'viewer';
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface InviteData {
  email: string;
  fullName: string;
  role: 'admin' | 'moderator' | 'operator' | 'viewer';
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData>({
    email: "",
    fullName: "",
    role: "viewer"
  });
  const [inviting, setInviting] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os usuários",
          variant: "destructive"
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async () => {
    if (!inviteData.email || !inviteData.fullName) {
      toast({
        title: "Erro",
        description: "Email e nome são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(
        inviteData.email,
        {
          data: {
            full_name: inviteData.fullName,
            role: inviteData.role
          },
          redirectTo: `${window.location.origin}/auth`
        }
      );

      if (error) {
        console.error('Error inviting user:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao convidar usuário",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: `Convite enviado para ${inviteData.email}`,
      });

      setInviteDialogOpen(false);
      setInviteData({ email: "", fullName: "", role: "viewer" });
      fetchUsers();
    } catch (error) {
      console.error('Error in inviteUser:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao convidar usuário",
        variant: "destructive"
      });
    } finally {
      setInviting(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Atualizar na tabela user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole as 'admin' | 'moderator' | 'operator' | 'viewer',
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (roleError) {
        console.error('Error updating user role:', roleError);
        toast({
          title: "Erro",
          description: "Erro ao atualizar função do usuário",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Função do usuário atualizada",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error in updateUserRole:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover usuário",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error in deleteUser:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'moderator':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'operator':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'moderator':
        return 'Moderador';
      case 'operator':
        return 'Operador';
      case 'viewer':
        return 'Visualizador';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header e Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por função" />
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

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Novo Usuário</DialogTitle>
              <DialogDescription>
                Envie um convite por email para um novo usuário acessar o sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  placeholder="Nome do usuário"
                  value={inviteData.fullName}
                  onChange={(e) => setInviteData(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="role">Função</Label>
                <Select value={inviteData.role} onValueChange={(value: any) => setInviteData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="moderator">Moderador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={inviteUser} disabled={inviting}>
                {inviting ? "Enviando..." : "Enviar Convite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operadores</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'operator').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizadores</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'viewer').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Gerencie usuários, funções e permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando usuários...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">{user.user_id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteUser(user.user_id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};