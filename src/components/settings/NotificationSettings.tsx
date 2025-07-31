import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Save, Bell, Mail, MessageSquare, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    email: {
      enabled: true,
      newRequests: true,
      statusChanges: true,
      urgentRequests: true,
      dailyReports: false,
      weeklyReports: true
    },
    push: {
      enabled: true,
      newRequests: true,
      statusChanges: false,
      urgentRequests: true,
      mentions: true
    },
    system: {
      sound: true,
      desktop: true,
      frequency: 'realtime' // realtime, hourly, daily
    }
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Aqui você salvaria as configurações no banco de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Sucesso",
        description: "Configurações de notificação salvas",
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

  const updateEmailSetting = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      email: { ...prev.email, [key]: value }
    }));
  };

  const updatePushSetting = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      push: { ...prev.push, [key]: value }
    }));
  };

  const updateSystemSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      system: { ...prev.system, [key]: value }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Status das Notificações */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {settings.email.enabled ? "Ativo" : "Inativo"}
              </span>
              <Badge variant={settings.email.enabled ? "default" : "secondary"}>
                {settings.email.enabled ? "ON" : "OFF"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Push</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {settings.push.enabled ? "Ativo" : "Inativo"}
              </span>
              <Badge variant={settings.push.enabled ? "default" : "secondary"}>
                {settings.push.enabled ? "ON" : "OFF"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frequência</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {settings.system.frequency === 'realtime' ? 'Tempo Real' : settings.system.frequency}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notificações por Email
          </CardTitle>
          <CardDescription>
            Configure quando você deseja receber emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações gerais por email
              </p>
            </div>
            <Switch
              checked={settings.email.enabled}
              onCheckedChange={(checked) => updateEmailSetting('enabled', checked)}
            />
          </div>

          {settings.email.enabled && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Info className="h-4 w-4 text-blue-500" />
                    <div className="space-y-0.5">
                      <Label>Novas Solicitações</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar sobre novas solicitações de munícipes
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.email.newRequests}
                    onCheckedChange={(checked) => updateEmailSetting('newRequests', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="space-y-0.5">
                      <Label>Mudanças de Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar quando solicitações mudarem de status
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.email.statusChanges}
                    onCheckedChange={(checked) => updateEmailSetting('statusChanges', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div className="space-y-0.5">
                      <Label>Solicitações Urgentes</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar sobre solicitações de alta prioridade
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.email.urgentRequests}
                    onCheckedChange={(checked) => updateEmailSetting('urgentRequests', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Relatórios Diários</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber resumo diário das atividades
                    </p>
                  </div>
                  <Switch
                    checked={settings.email.dailyReports}
                    onCheckedChange={(checked) => updateEmailSetting('dailyReports', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Relatórios Semanais</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber resumo semanal das atividades
                    </p>
                  </div>
                  <Switch
                    checked={settings.email.weeklyReports}
                    onCheckedChange={(checked) => updateEmailSetting('weeklyReports', checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Configurações Push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Configure notificações em tempo real no navegador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações em tempo real no navegador
              </p>
            </div>
            <Switch
              checked={settings.push.enabled}
              onCheckedChange={(checked) => updatePushSetting('enabled', checked)}
            />
          </div>

          {settings.push.enabled && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Novas Solicitações</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificação instantânea para novas solicitações
                    </p>
                  </div>
                  <Switch
                    checked={settings.push.newRequests}
                    onCheckedChange={(checked) => updatePushSetting('newRequests', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mudanças de Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar sobre atualizações de status
                    </p>
                  </div>
                  <Switch
                    checked={settings.push.statusChanges}
                    onCheckedChange={(checked) => updatePushSetting('statusChanges', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Solicitações Urgentes</Label>
                    <p className="text-sm text-muted-foreground">
                      Alerta imediato para casos urgentes
                    </p>
                  </div>
                  <Switch
                    checked={settings.push.urgentRequests}
                    onCheckedChange={(checked) => updatePushSetting('urgentRequests', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Menções</Label>
                    <p className="text-sm text-muted-foreground">
                      Quando você for mencionado em comentários
                    </p>
                  </div>
                  <Switch
                    checked={settings.push.mentions}
                    onCheckedChange={(checked) => updatePushSetting('mentions', checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Configurações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Configurações do Sistema
          </CardTitle>
          <CardDescription>
            Preferências gerais de notificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Som de Notificação</Label>
                <p className="text-sm text-muted-foreground">
                  Reproduzir som quando receber notificações
                </p>
              </div>
              <Switch
                checked={settings.system.sound}
                onCheckedChange={(checked) => updateSystemSetting('sound', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações Desktop</Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar notificações na área de trabalho
                </p>
              </div>
              <Switch
                checked={settings.system.desktop}
                onCheckedChange={(checked) => updateSystemSetting('desktop', checked)}
              />
            </div>
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