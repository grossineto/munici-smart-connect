import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Save, Shield, Lock, Eye, Download, AlertTriangle, CheckCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const SecuritySettings = () => {
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    passwordExpiry: 90,
    auditLogging: true,
    ipWhitelist: false,
    emailAlerts: true,
    dataRetention: 365
  });

  const [auditLogs] = useState([
    {
      id: 1,
      action: "Login",
      user: "admin@prefeitura.com",
      ip: "192.168.1.100",
      timestamp: "2024-01-31 10:30:00",
      status: "Success"
    },
    {
      id: 2,
      action: "User Created",
      user: "admin@prefeitura.com",
      ip: "192.168.1.100",
      timestamp: "2024-01-31 09:15:00",
      status: "Success"
    },
    {
      id: 3,
      action: "Failed Login",
      user: "unknown@email.com",
      ip: "203.0.113.42",
      timestamp: "2024-01-31 08:45:00",
      status: "Failed"
    }
  ]);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Aqui você salvaria as configurações no banco de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Sucesso",
        description: "Configurações de segurança salvas",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const exportAuditLogs = () => {
    toast({
      title: "Exportando",
      description: "Logs de auditoria sendo preparados para download",
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = (status: string) => {
    return status === "Success" ? (
      <Badge className="bg-green-100 text-green-800">Sucesso</Badge>
    ) : (
      <Badge variant="destructive">Falha</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status de Segurança */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2FA</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {settings.twoFactorAuth ? "Ativo" : "Inativo"}
              </span>
              <Badge variant={settings.twoFactorAuth ? "default" : "destructive"}>
                {settings.twoFactorAuth ? "ON" : "OFF"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auditoria</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {settings.auditLogging ? "Ativo" : "Inativo"}
              </span>
              <Badge variant={settings.auditLogging ? "default" : "secondary"}>
                {settings.auditLogging ? "ON" : "OFF"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tentativas Login</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Max {settings.maxLoginAttempts}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações de Autenticação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Autenticação e Acesso
          </CardTitle>
          <CardDescription>
            Configure políticas de autenticação e acesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autenticação de Dois Fatores (2FA)</Label>
                <p className="text-sm text-muted-foreground">
                  Exigir verificação adicional no login
                </p>
              </div>
              <Switch
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Lista Branca de IPs</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir acesso apenas de IPs específicos
                </p>
              </div>
              <Switch
                checked={settings.ipWhitelist}
                onCheckedChange={(checked) => updateSetting('ipWhitelist', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Segurança por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar sobre atividades suspeitas
                </p>
              </div>
              <Switch
                checked={settings.emailAlerts}
                onCheckedChange={(checked) => updateSetting('emailAlerts', checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Timeout de Sessão (horas)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="1"
                max="168"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Máximo de Tentativas de Login</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                min="3"
                max="10"
                value={settings.maxLoginAttempts}
                onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordExpiry">Expiração de Senha (dias)</Label>
              <Input
                id="passwordExpiry"
                type="number"
                min="30"
                max="365"
                value={settings.passwordExpiry}
                onChange={(e) => updateSetting('passwordExpiry', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataRetention">Retenção de Dados (dias)</Label>
              <Input
                id="dataRetention"
                type="number"
                min="90"
                max="2555"
                value={settings.dataRetention}
                onChange={(e) => updateSetting('dataRetention', parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs de Auditoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Logs de Auditoria
            </div>
            <Button onClick={exportAuditLogs} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardTitle>
          <CardDescription>
            Histórico de ações importantes no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Habilitar Logs de Auditoria</Label>
                <p className="text-sm text-muted-foreground">
                  Registrar todas as ações importantes do sistema
                </p>
              </div>
              <Switch
                checked={settings.auditLogging}
                onCheckedChange={(checked) => updateSetting('auditLogging', checked)}
              />
            </div>

            {settings.auditLogging && (
              <>
                <Separator />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ação</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>{log.ip}</TableCell>
                        <TableCell>{log.timestamp}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alertas de Segurança
          </CardTitle>
          <CardDescription>
            Recomendações para melhorar a segurança do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!settings.twoFactorAuth && (
              <div className="flex items-start gap-3 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">2FA Desabilitado</h4>
                  <p className="text-sm text-yellow-700">
                    Recomendamos habilitar a autenticação de dois fatores para maior segurança.
                  </p>
                </div>
              </div>
            )}

            {settings.twoFactorAuth && settings.auditLogging && (
              <div className="flex items-start gap-3 p-4 border border-green-200 rounded-lg bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Segurança Otimizada</h4>
                  <p className="text-sm text-green-700">
                    Suas configurações de segurança estão adequadas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botão de Salvar */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};