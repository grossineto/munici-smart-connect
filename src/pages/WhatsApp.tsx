import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Send, Phone, Clock, User, Settings } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhatsAppSession {
  id: string;
  phone: string;
  current_flow: string;
  flow_data: any;
  last_activity: string;
  created_at: string;
  citizen: {
    name: string;
    id: string;
  } | null;
}

interface Message {
  id: string;
  content: string;
  is_from_citizen: boolean;
  created_at: string;
  sender_phone: string;
}

const WhatsApp = () => {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [config, setConfig] = useState({
    whatsappToken: "",
    phoneNumberId: "",
    verifyToken: "brian_verify_token"
  });

  const flowLabels: { [key: string]: string } = {
    'initial': '🔄 Cadastro Inicial',
    'menu': '📋 Menu Principal',
    'request_creation': '📝 Criando Solicitação',
    'appointment_booking': '📅 Agendamento',
    'protocol_check': '🔍 Consulta Protocolo',
    'free_message': '💬 Mensagem Livre'
  };

  useEffect(() => {
    loadSessions();
    loadConfig();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.phone);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select(`
          *,
          citizen:citizens(name, id)
        `)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as sessões do WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (phone: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_phone', phone)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const loadConfig = () => {
    // Em produção, isso viria das configurações do sistema
    const storedConfig = localStorage.getItem('whatsapp_config');
    if (storedConfig) {
      setConfig(JSON.parse(storedConfig));
    }
  };

  const saveConfig = () => {
    localStorage.setItem('whatsapp_config', JSON.stringify(config));
    toast({
      title: "Configuração salva",
      description: "As configurações do WhatsApp foram salvas localmente.",
    });
    setIsConfigDialogOpen(false);
  };

  const sendMessage = async () => {
    if (!selectedSession || !newMessage.trim()) return;

    try {
      // Salvar mensagem no banco
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_phone: selectedSession.phone,
          content: newMessage,
          is_from_citizen: false,
          message_type: 'text'
        });

      if (error) throw error;

      // Recarregar mensagens
      await loadMessages(selectedSession.phone);
      setNewMessage("");

      toast({
        title: "Mensagem enviada",
        description: "A mensagem foi registrada no sistema.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const getSessionStatus = (session: WhatsAppSession) => {
    const lastActivity = new Date(session.last_activity);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));

    if (diffMinutes < 5) {
      return { label: "Online", color: "bg-green-500" };
    } else if (diffMinutes < 30) {
      return { label: "Recente", color: "bg-yellow-500" };
    } else {
      return { label: "Inativo", color: "bg-gray-500" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Carregando conversas...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Business</h1>
          <p className="text-muted-foreground">
            Gerencie conversas e configure o bot
          </p>
        </div>
        
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurações do WhatsApp</DialogTitle>
              <DialogDescription>
                Configure as credenciais do WhatsApp Business API
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Token do WhatsApp</label>
                <Input
                  value={config.whatsappToken}
                  onChange={(e) => setConfig({ ...config, whatsappToken: e.target.value })}
                  placeholder="Digite o token do WhatsApp Business API"
                  type="password"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone Number ID</label>
                <Input
                  value={config.phoneNumberId}
                  onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                  placeholder="Digite o Phone Number ID"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Verify Token</label>
                <Input
                  value={config.verifyToken}
                  onChange={(e) => setConfig({ ...config, verifyToken: e.target.value })}
                  placeholder="Token de verificação do webhook"
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">URL do Webhook</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Configure este URL no Facebook Developer Console:
                </p>
                <code className="text-xs bg-white p-2 rounded mt-2 block">
                  https://iibhnjdyteqblzrfiyah.functions.supabase.co/whatsapp-webhook
                </code>
              </div>
              <Button onClick={saveConfig} className="w-full">
                Salvar Configurações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Sessões */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversas Ativas
            </CardTitle>
            <CardDescription>
              {sessions.length} sessões encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma conversa encontrada</p>
                  <p className="text-sm">As conversas aparecerão quando os usuários enviarem mensagens</p>
                </div>
              ) : (
                sessions.map((session) => {
                  const status = getSessionStatus(session);
                  return (
                    <div
                      key={session.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedSession?.id === session.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${status.color}`} />
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{session.phone}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {flowLabels[session.current_flow] || session.current_flow}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm">
                        <p className="text-muted-foreground">
                          {session.citizen?.name || "Visitante"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.last_activity), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-2">
          <CardHeader>
            {selectedSession ? (
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedSession.citizen?.name || selectedSession.phone}
                </CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span>{selectedSession.phone}</span>
                  <Badge variant="outline">
                    {flowLabels[selectedSession.current_flow] || selectedSession.current_flow}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {format(new Date(selectedSession.last_activity), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </CardDescription>
              </div>
            ) : (
              <div>
                <CardTitle>Selecione uma conversa</CardTitle>
                <CardDescription>
                  Escolha uma conversa na lista ao lado para visualizar as mensagens
                </CardDescription>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {selectedSession ? (
              <div className="space-y-4">
                {/* Mensagens */}
                <div className="h-96 overflow-y-auto space-y-3 border rounded-lg p-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma mensagem ainda</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.is_from_citizen ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-lg ${
                            message.is_from_citizen
                              ? 'bg-gray-100 text-gray-900'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.is_from_citizen ? 'text-gray-500' : 'text-primary-foreground/70'
                          }`}>
                            {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Enviar Mensagem */}
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="min-h-[60px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Info da Sessão */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Informações da Sessão</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>Fluxo Atual:</strong> {flowLabels[selectedSession.current_flow] || selectedSession.current_flow}</p>
                    <p><strong>Dados do Fluxo:</strong> {JSON.stringify(selectedSession.flow_data)}</p>
                    <p><strong>Última Atividade:</strong> {format(new Date(selectedSession.last_activity), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsApp;