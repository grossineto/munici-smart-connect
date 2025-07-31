import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export const TestNotifications = () => {
  const { user } = useAuth();

  const createTestNotification = async (type: 'info' | 'success' | 'warning' | 'error') => {
    if (!user) return;

    const notifications = {
      info: {
        title: "Nova Solicitação",
        message: "João Silva fez uma nova solicitação: Buraco na rua",
        action_url: "/requests"
      },
      success: {
        title: "Solicitação Concluída",
        message: "A solicitação #2024000001 foi concluída com sucesso",
        action_url: "/requests"
      },
      warning: {
        title: "Solicitação Pendente",
        message: "Solicitação #2024000002 está pendente há 5 dias",
        action_url: "/requests"
      },
      error: {
        title: "Erro no Sistema",
        message: "Falha na integração com o WhatsApp. Verificar configurações",
        action_url: "/whatsapp"
      }
    };

    const notification = notifications[type];

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: notification.title,
          message: notification.message,
          type,
          action_url: notification.action_url,
          metadata: {
            test: true,
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.error('Erro ao criar notificação:', error);
        toast({
          title: "Erro",
          description: "Falha ao criar notificação de teste",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: `Notificação de teste criada (${type})`,
        });
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold mb-3">Testar Sistema de Notificações</h3>
      <div className="flex flex-wrap gap-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => createTestNotification('info')}
        >
          Info
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => createTestNotification('success')}
        >
          Sucesso
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => createTestNotification('warning')}
        >
          Aviso
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => createTestNotification('error')}
        >
          Erro
        </Button>
      </div>
    </div>
  );
};