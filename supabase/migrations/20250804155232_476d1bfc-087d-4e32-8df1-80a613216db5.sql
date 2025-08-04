-- Limpar palavras-chave antigas e adicionar novas para São Paulo
DELETE FROM public.monitored_keywords WHERE keyword LIKE '%bauru%' OR keyword LIKE '%Suéllen%';

INSERT INTO public.monitored_keywords (keyword, category, alert_threshold) VALUES
('prefeito de são paulo', 'prefeito', 1),
('Ricardo Nunes', 'prefeito', 1),
('prefeitura de são paulo', 'prefeito', 1),
('são paulo', 'cidade', 2),
('prefeito ricardo nunes', 'prefeito', 1),
('gestão ricardo nunes', 'prefeito', 1);