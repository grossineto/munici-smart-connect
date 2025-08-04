-- Inserir dados de teste diretamente no banco
DO $$
DECLARE
    source_id UUID;
    article1_id UUID;
    article2_id UUID;
    article3_id UUID;
BEGIN
    -- Pegar ID da primeira fonte de notícias
    SELECT id INTO source_id FROM public.news_sources LIMIT 1;
    
    -- Inserir artigos de teste (com URLs únicos baseados em timestamp)
    INSERT INTO public.news_articles (source_id, title, content, url, published_at) VALUES
    (source_id, 'Prefeito Ricardo Nunes anuncia nova obra em São Paulo', 
     'O prefeito de São Paulo, Ricardo Nunes, anunciou hoje investimento de R$ 500 milhões em nova obra de infraestrutura na cidade.', 
     'https://teste.com/sp-obra-' || extract(epoch from now()), 
     now())
    RETURNING id INTO article1_id;
    
    INSERT INTO public.news_articles (source_id, title, content, url, published_at) VALUES
    (source_id, 'Crise na saúde gera protestos contra prefeitura de São Paulo', 
     'Moradores protestam contra a gestão de Ricardo Nunes devido à falta de médicos nas UBS da periferia de São Paulo.', 
     'https://teste.com/sp-saude-' || extract(epoch from now()), 
     now())
    RETURNING id INTO article2_id;
    
    INSERT INTO public.news_articles (source_id, title, content, url, published_at) VALUES
    (source_id, 'São Paulo lidera ranking de inovação urbana no Brasil', 
     'A cidade de São Paulo, sob gestão do prefeito Ricardo Nunes, conquistou primeiro lugar em inovação urbana nacional.', 
     'https://teste.com/sp-inovacao-' || extract(epoch from now()), 
     now())
    RETURNING id INTO article3_id;
    
    -- Inserir análises de teste
    INSERT INTO public.news_analysis (article_id, sentiment_score, urgency_level, relevance_score, keywords, summary, impact_analysis, recommended_action, mentions_mayor, mentions_city, crisis_potential) VALUES
    (article1_id, 0.7, 'medium', 0.8, ARRAY['prefeito', 'ricardo nunes', 'obra', 'infraestrutura'], 
     'Prefeito anuncia obra importante', 'Impacto positivo na imagem do prefeito', 'Acompanhar andamento da obra', true, true, false),
    
    (article2_id, -0.6, 'high', 0.9, ARRAY['crise', 'saúde', 'protestos', 'ricardo nunes'], 
     'Crise na saúde gera protestos', 'Impacto negativo grave na gestão', 'Ação urgente necessária', true, true, true),
    
    (article3_id, 0.8, 'low', 0.7, ARRAY['são paulo', 'inovação', 'ranking', 'prefeito'], 
     'SP lidera em inovação', 'Impacto muito positivo', 'Divulgar conquista', true, true, false);
    
    -- Inserir alertas para artigos críticos
    INSERT INTO public.news_alerts (article_id, alert_type, severity, title, message) VALUES
    (article2_id, 'crisis', 'high', 'ALERTA: Crise na Saúde', 'Protestos contra gestão Ricardo Nunes devido à falta de médicos');
    
END $$;