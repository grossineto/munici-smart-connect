-- Adicionar novas colunas para análises elaboradas do GPT-4
ALTER TABLE public.news_analysis 
ADD COLUMN IF NOT EXISTS public_sentiment_prediction TEXT,
ADD COLUMN IF NOT EXISTS communication_strategy TEXT,
ADD COLUMN IF NOT EXISTS risk_assessment TEXT,
ADD COLUMN IF NOT EXISTS related_municipal_areas TEXT[],
ADD COLUMN IF NOT EXISTS media_monitoring_focus TEXT,
ADD COLUMN IF NOT EXISTS citizen_impact TEXT,
ADD COLUMN IF NOT EXISTS political_opportunity TEXT;