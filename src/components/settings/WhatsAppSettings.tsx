import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Save, MessageSquare, Phone, Webhook, TestTube, AlertCircle, CheckCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export const WhatsAppSettings = () => {
  const [settings, setSettings] = useState({
    apiKey: "waba_test_key_123...",
    phoneNumber: "+55 11 99999-9999",
    webhookUrl: "https://projeto.supabase.co/functions/v1/whatsapp-webhook",
    verifyToken: "brian_verify_token_123",
    autoResponse: true,
    businessHours: true,
    startTime: "08:00",
    endTime: "18:00",
    welcomeMessage: "Olá! Bem-vindo ao atendimento da Prefeitura. Como posso ajudá-lo?",
    outOfHoursMessage: "Olá! Nosso atendimento funciona de segunda a sexta, das 8h às 18h. Sua mensagem será registrada e responderemos assim que possível.",
    maxRetries: 3,
    timeout: 30
  });

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('connected');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Aqui você salvaria as configurações no banco de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Sucesso",
        description: "Configurações do WhatsApp salvas",
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

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConnectionStatus('connected');
      
      toast({
        title: "Sucesso",
        description: "Conexão com WhatsApp Business API testada com sucesso",
      });
    } catch (error) {
      setConnectionStatus('disconnected');
      toast({
        title: "Erro",
        description: "Falha na conexão com WhatsApp Business API",
        variant: "destructive"
      });
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Desconectado</Badge>;
      case 'testing':
        return <Badge variant="secondary">Testando...</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Status da Integração
            </div>
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            Status atual da conexão com a WhatsApp Business API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={testConnection} disabled={connectionStatus === 'testing'}>
              <TestTube className="h-4 w-4 mr-2" />
              {connectionStatus === 'testing' ? 'Testando...' : 'Testar Conexão'}
            </Button>
            
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Última verificação: há 2 minutos
              </div>
            )}
            
            {connectionStatus === 'disconnected' && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                Verifique as configurações da API
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configurações da API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Configurações da API
          </CardTitle>
          <CardDescription>
            Configurações de conexão com a WhatsApp Business API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Chave da API</Label>
              <Input
                id="apiKey"
                type="password"
                value={settings.apiKey}
                onChange={(e) => updateSetting('apiKey', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Número do WhatsApp Business</Label>
              <Input
                id="phoneNumber"
                value={settings.phoneNumber}
                onChange={(e) => updateSetting('phoneNumber', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL do Webhook</Label>
              <Input
                id="webhookUrl"
                value={settings.webhookUrl}
                onChange={(e) => updateSetting('webhookUrl', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verifyToken">Token de Verificação</Label>
              <Input
                id="verifyToken"
                type="password"
                value={settings.verifyToken}
                onChange={(e) => updateSetting('verifyToken', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Atendimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Configurações de Atendimento
          </CardTitle>
          <CardDescription>
            Configure como o sistema responde aos usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Resposta Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar mensagem de boas-vindas automaticamente
                </p>
              </div>
              <Switch
                checked={settings.autoResponse}
                onCheckedChange={(checked) => updateSetting('autoResponse', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Horário Comercial</Label>
                <p className="text-sm text-muted-foreground">
                  Respeitar horário de funcionamento da prefeitura
                </p>
              </div>
              <Switch
                checked={settings.businessHours}
                onCheckedChange={(checked) => updateSetting('businessHours', checked)}
              />
            </div>

            {settings.businessHours && (
              <div className="grid gap-4 md:grid-cols-2 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Horário de Início</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={settings.startTime}
                    onChange={(e) => updateSetting('startTime', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Horário de Término</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={settings.endTime}
                    onChange={(e) => updateSetting('endTime', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
              <Textarea
                id="welcomeMessage"
                value={settings.welcomeMessage}
                onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outOfHoursMessage">Mensagem Fora do Horário</Label>
              <Textarea
                id="outOfHoursMessage"
                value={settings.outOfHoursMessage}
                onChange={(e) => updateSetting('outOfHoursMessage', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Avançadas</CardTitle>
          <CardDescription>
            Configurações técnicas para desenvolvedores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxRetries">Máximo de Tentativas</Label>
              <Input
                id="maxRetries"
                type="number"
                min="1"
                max="10"
                value={settings.maxRetries}
                onChange={(e) => updateSetting('maxRetries', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (segundos)</Label>
              <Input
                id="timeout"
                type="number"
                min="5"
                max="120"
                value={settings.timeout}
                onChange={(e) => updateSetting('timeout', parseInt(e.target.value))}
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