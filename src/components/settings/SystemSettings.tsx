import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Save, RefreshCw, Database, Globe, Clock, Palette } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SystemSettings = () => {
  const [settings, setSettings] = useState({
    systemName: "BR.I.A.N.",
    systemDescription: "Brasil Inteligência Artificial Nexus",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
    autoBackup: true,
    maintenanceMode: false,
    debugMode: false,
    emailNotifications: true,
    smsNotifications: false,
    maxFileSize: 10,
    sessionTimeout: 24,
    theme: "system"
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Aqui você salvaria as configurações no banco de dados
      // Por enquanto, apenas simularemos a ação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso",
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

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Configurações Gerais
          </CardTitle>
          <CardDescription>
            Configurações básicas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="systemName">Nome do Sistema</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => updateSetting('systemName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="systemDescription">Descrição</Label>
              <Input
                id="systemDescription"
                value={settings.systemDescription}
                onChange={(e) => updateSetting('systemDescription', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                  <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                  <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sistema
          </CardTitle>
          <CardDescription>
            Configurações de funcionamento do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Backup Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Realizar backup automático dos dados diariamente
                </p>
              </div>
              <Switch
                checked={settings.autoBackup}
                onCheckedChange={(checked) => updateSetting('autoBackup', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo de Manutenção</Label>
                <p className="text-sm text-muted-foreground">
                  Bloquear acesso ao sistema para manutenção
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo Debug</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar logs detalhados para desenvolvimento
                </p>
              </div>
              <Switch
                checked={settings.debugMode}
                onCheckedChange={(checked) => updateSetting('debugMode', checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxFileSize">Tamanho Máximo de Arquivo (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Timeout de Sessão (horas)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Interface
          </CardTitle>
          <CardDescription>
            Personalização da interface do usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Restaurar Padrões
        </Button>
      </div>
    </div>
  );
};