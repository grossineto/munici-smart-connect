-- Criação da tabela social_mentions para monitoramento de redes sociais
CREATE TABLE public.social_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  politician_name TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  url TEXT,
  mention_type TEXT NOT NULL DEFAULT 'mention',
  sentiment TEXT DEFAULT 'neutral',
  reach_estimate INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_social_mentions_platform ON public.social_mentions(platform);
CREATE INDEX idx_social_mentions_politician ON public.social_mentions(politician_name);
CREATE INDEX idx_social_mentions_timestamp ON public.social_mentions(timestamp DESC);
CREATE INDEX idx_social_mentions_sentiment ON public.social_mentions(sentiment);

-- Enable RLS
ALTER TABLE public.social_mentions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view social mentions" 
ON public.social_mentions 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert social mentions" 
ON public.social_mentions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update social mentions" 
ON public.social_mentions 
FOR UPDATE 
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_social_mentions_updated_at
BEFORE UPDATE ON public.social_mentions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();