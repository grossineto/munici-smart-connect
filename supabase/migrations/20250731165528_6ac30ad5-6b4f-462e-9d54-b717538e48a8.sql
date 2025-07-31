-- Criar funções e melhorias para o User Flow do BRIAN

-- Adicionar campos necessários para WhatsApp na tabela messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_state TEXT DEFAULT 'initial';

-- Atualizar tabela citizens para incluir mais campos necessários
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS registration_step TEXT DEFAULT 'completed';
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'pt-BR';

-- Criar tabela para sessões de conversa do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  citizen_id UUID REFERENCES public.citizens(id),
  current_flow TEXT DEFAULT 'menu', -- menu, request_creation, appointment_booking, protocol_check
  flow_data JSONB DEFAULT '{}',
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_sessions (acesso administrativo)
CREATE POLICY "Authenticated users can view whatsapp sessions" 
ON public.whatsapp_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert whatsapp sessions" 
ON public.whatsapp_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update whatsapp sessions" 
ON public.whatsapp_sessions 
FOR UPDATE 
USING (true);

-- Criar tabela para métricas e análise preditiva
CREATE TABLE IF NOT EXISTS public.analytics_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL, -- request_volume, response_time, citizen_satisfaction, etc.
  category TEXT, -- tipo de solicitação, secretaria, etc.
  value NUMERIC NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para analytics_metrics
CREATE POLICY "Authenticated users can view analytics metrics" 
ON public.analytics_metrics 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert analytics metrics" 
ON public.analytics_metrics 
FOR INSERT 
WITH CHECK (true);

-- Criar função para gerar insights automáticos
CREATE OR REPLACE FUNCTION public.generate_analytics_insights()
RETURNS TABLE(
  insight_type TEXT,
  title TEXT,
  description TEXT,
  severity TEXT,
  data JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_week_requests INTEGER;
  last_week_requests INTEGER;
  avg_response_time NUMERIC;
  top_request_type TEXT;
  top_request_count INTEGER;
BEGIN
  -- Contar solicitações da semana atual vs semana passada
  SELECT COUNT(*) INTO current_week_requests
  FROM requests 
  WHERE created_at >= DATE_TRUNC('week', NOW());
  
  SELECT COUNT(*) INTO last_week_requests
  FROM requests 
  WHERE created_at >= DATE_TRUNC('week', NOW() - INTERVAL '1 week')
    AND created_at < DATE_TRUNC('week', NOW());
  
  -- Calcular tempo médio de resposta
  SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/86400) INTO avg_response_time
  FROM requests 
  WHERE completed_at IS NOT NULL 
    AND created_at >= NOW() - INTERVAL '30 days';
  
  -- Encontrar tipo de solicitação mais frequente
  SELECT type, COUNT(*) INTO top_request_type, top_request_count
  FROM requests 
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY type 
  ORDER BY COUNT(*) DESC 
  LIMIT 1;
  
  -- Retornar insights
  IF current_week_requests > last_week_requests * 1.5 THEN
    RETURN QUERY VALUES(
      'volume_increase',
      'Aumento significativo de solicitações',
      format('Volume aumentou %s%% comparado à semana passada', 
        ROUND(((current_week_requests - last_week_requests) * 100.0 / NULLIF(last_week_requests, 0)), 0)),
      'high',
      json_build_object('current_week', current_week_requests, 'last_week', last_week_requests)::JSONB
    );
  END IF;
  
  IF avg_response_time > 7 THEN
    RETURN QUERY VALUES(
      'slow_response',
      'Tempo de resposta acima da média',
      format('Tempo médio de %.1f dias está acima do ideal (7 dias)', avg_response_time),
      'medium',
      json_build_object('avg_days', avg_response_time)::JSONB
    );
  END IF;
  
  IF top_request_count > 10 THEN
    RETURN QUERY VALUES(
      'frequent_issue',
      format('Alta frequência: %s', top_request_type),
      format('%s casos de %s na última semana', top_request_count, top_request_type),
      'low',
      json_build_object('type', top_request_type, 'count', top_request_count)::JSONB
    );
  END IF;
  
  RETURN;
END;
$$;

-- Trigger para atualizar timestamp em whatsapp_sessions
CREATE TRIGGER update_whatsapp_sessions_updated_at
BEFORE UPDATE ON public.whatsapp_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone ON public.whatsapp_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_citizen_id ON public.whatsapp_sessions(citizen_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_type_period ON public.analytics_metrics(metric_type, period_start);
CREATE INDEX IF NOT EXISTS idx_citizens_whatsapp_phone ON public.citizens(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON public.messages(request_id);