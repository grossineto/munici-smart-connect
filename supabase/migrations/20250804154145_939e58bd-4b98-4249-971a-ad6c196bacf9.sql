-- Create news_sources table for managing monitored news portals
CREATE TABLE public.news_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'portal', -- portal, social, rss
  region TEXT, -- nacional, estadual, municipal
  active BOOLEAN NOT NULL DEFAULT true,
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news_articles table for storing collected articles
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.news_sources(id),
  title TEXT NOT NULL,
  content TEXT,
  url TEXT NOT NULL UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE,
  author TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news_analysis table for AI analysis results
CREATE TABLE public.news_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE,
  sentiment_score NUMERIC(3,2), -- -1 to 1
  urgency_level TEXT NOT NULL DEFAULT 'low', -- low, medium, high, critical
  relevance_score NUMERIC(3,2), -- 0 to 1
  keywords TEXT[],
  summary TEXT,
  impact_analysis TEXT,
  recommended_action TEXT,
  mentions_mayor BOOLEAN DEFAULT false,
  mentions_city BOOLEAN DEFAULT false,
  crisis_potential BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news_alerts table for urgent notifications
CREATE TABLE public.news_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- crisis, mention, policy, trending
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monitored_keywords table for tracking specific terms
CREATE TABLE public.monitored_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  category TEXT, -- prefeito, politicas, infraestrutura, saude, educacao
  alert_threshold INTEGER DEFAULT 3, -- number of mentions to trigger alert
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitored_keywords ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins/mayors)
CREATE POLICY "Authenticated users can view news sources" ON public.news_sources FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage news sources" ON public.news_sources FOR ALL USING (true);

CREATE POLICY "Authenticated users can view news articles" ON public.news_articles FOR SELECT USING (true);
CREATE POLICY "System can insert news articles" ON public.news_articles FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view news analysis" ON public.news_analysis FOR SELECT USING (true);
CREATE POLICY "System can manage news analysis" ON public.news_analysis FOR ALL WITH CHECK (true);

CREATE POLICY "Authenticated users can view news alerts" ON public.news_alerts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update news alerts" ON public.news_alerts FOR UPDATE USING (true);
CREATE POLICY "System can insert news alerts" ON public.news_alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can manage monitored keywords" ON public.monitored_keywords FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_news_articles_published_at ON public.news_articles(published_at DESC);
CREATE INDEX idx_news_articles_url ON public.news_articles(url);
CREATE INDEX idx_news_analysis_urgency ON public.news_analysis(urgency_level);
CREATE INDEX idx_news_analysis_sentiment ON public.news_analysis(sentiment_score);
CREATE INDEX idx_news_alerts_severity ON public.news_alerts(severity, created_at DESC);
CREATE INDEX idx_news_alerts_acknowledged ON public.news_alerts(acknowledged, created_at DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_news_sources_updated_at BEFORE UPDATE ON public.news_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON public.news_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_news_analysis_updated_at BEFORE UPDATE ON public.news_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_news_alerts_updated_at BEFORE UPDATE ON public.news_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_monitored_keywords_updated_at BEFORE UPDATE ON public.monitored_keywords FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default news sources
INSERT INTO public.news_sources (name, url, type, region) VALUES
('G1', 'https://g1.globo.com', 'portal', 'nacional'),
('UOL Notícias', 'https://noticias.uol.com.br', 'portal', 'nacional'),
('Folha de S.Paulo', 'https://folha.uol.com.br', 'portal', 'nacional'),
('O Estado de S. Paulo', 'https://estadao.com.br', 'portal', 'nacional'),
('CNN Brasil', 'https://cnnbrasil.com.br', 'portal', 'nacional');

-- Insert some default monitored keywords
INSERT INTO public.monitored_keywords (keyword, category) VALUES
('prefeito', 'prefeito'),
('prefeitura', 'prefeito'),
('gestão municipal', 'politicas'),
('saúde pública', 'saude'),
('educação municipal', 'educacao'),
('infraestrutura urbana', 'infraestrutura'),
('transporte público', 'infraestrutura'),
('segurança pública', 'politicas');