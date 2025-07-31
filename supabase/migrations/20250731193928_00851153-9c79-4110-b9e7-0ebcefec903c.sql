-- Criar tabela de notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  action_url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificações
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar notificações automaticamente
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _title TEXT,
  _message TEXT,
  _type TEXT DEFAULT 'info',
  _action_url TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url, metadata)
  VALUES (_user_id, _title, _message, _type, _action_url, _metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Função para notificar todos os admins
CREATE OR REPLACE FUNCTION public.notify_admins(
  _title TEXT,
  _message TEXT,
  _type TEXT DEFAULT 'info',
  _action_url TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER := 0;
  admin_user RECORD;
BEGIN
  FOR admin_user IN 
    SELECT DISTINCT ur.user_id 
    FROM public.user_roles ur 
    WHERE ur.role IN ('admin', 'moderator')
  LOOP
    PERFORM public.create_notification(
      admin_user.user_id,
      _title,
      _message,
      _type,
      _action_url,
      _metadata
    );
    admin_count := admin_count + 1;
  END LOOP;
  
  RETURN admin_count;
END;
$$;

-- Trigger para notificar sobre novas solicitações
CREATE OR REPLACE FUNCTION public.notify_new_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  citizen_name TEXT;
BEGIN
  -- Buscar nome do cidadão
  SELECT name INTO citizen_name FROM public.citizens WHERE id = NEW.citizen_id;
  
  -- Notificar admins sobre nova solicitação
  PERFORM public.notify_admins(
    'Nova Solicitação',
    format('Nova solicitação de %s: %s', COALESCE(citizen_name, 'Cidadão'), NEW.title),
    'info',
    format('/requests?id=%s', NEW.id),
    json_build_object(
      'request_id', NEW.id,
      'protocol', NEW.protocol_number,
      'type', NEW.type,
      'priority', NEW.priority
    )::jsonb
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar sobre mudanças de status
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  citizen_name TEXT;
  status_message TEXT;
BEGIN
  -- Só notificar se o status mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Buscar nome do cidadão
    SELECT name INTO citizen_name FROM public.citizens WHERE id = NEW.citizen_id;
    
    -- Mensagem baseada no novo status
    CASE NEW.status
      WHEN 'in_progress' THEN status_message := 'em andamento';
      WHEN 'completed' THEN status_message := 'concluída';
      WHEN 'cancelled' THEN status_message := 'cancelada';
      ELSE status_message := NEW.status::text;
    END CASE;
    
    -- Notificar admins sobre mudança de status
    PERFORM public.notify_admins(
      'Status Atualizado',
      format('Solicitação de %s foi %s: %s', COALESCE(citizen_name, 'Cidadão'), status_message, NEW.title),
      CASE NEW.status 
        WHEN 'completed' THEN 'success'
        WHEN 'cancelled' THEN 'warning'
        ELSE 'info'
      END,
      format('/requests?id=%s', NEW.id),
      json_build_object(
        'request_id', NEW.id,
        'protocol', NEW.protocol_number,
        'old_status', OLD.status,
        'new_status', NEW.status
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar triggers
CREATE TRIGGER notify_new_request_trigger
AFTER INSERT ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_request();

CREATE TRIGGER notify_status_change_trigger
AFTER UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_status_change();

-- Configurar realtime para a tabela de notificações
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;