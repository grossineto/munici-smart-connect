-- Limpar fontes antigas e adicionar fontes reais com URLs específicas
DELETE FROM public.news_sources;

INSERT INTO public.news_sources (name, url, type, region) VALUES
-- Grandes veículos nacionais
('G1 São Paulo', 'https://g1.globo.com/sp/sao-paulo/', 'portal', 'estadual'),
('Folha de S.Paulo', 'https://www1.folha.uol.com.br/cotidiano/', 'portal', 'nacional'),
('Estadão São Paulo', 'https://sao-paulo.estadao.com.br/', 'portal', 'estadual'),
('UOL Notícias São Paulo', 'https://noticias.uol.com.br/cotidiano/sao-paulo/', 'portal', 'estadual'),
('CNN Brasil Política', 'https://www.cnnbrasil.com.br/politica/', 'portal', 'nacional'),

-- Veículos regionais importantes
('Agência Estado', 'https://www.estadao.com.br/politica/', 'portal', 'nacional'),
('Metrópoles', 'https://www.metropoles.com/sao-paulo', 'portal', 'estadual'),
('R7 São Paulo', 'https://noticias.r7.com/sao-paulo', 'portal', 'estadual'),
('Band São Paulo', 'https://www.band.uol.com.br/noticias/sao-paulo', 'portal', 'estadual'),

-- Veículos locais e críticos
('Portal da Prefeitura SP', 'https://www.prefeitura.sp.gov.br/cidade/secretarias/comunicacao/noticias/', 'oficial', 'municipal'),
('São Paulo Governo', 'https://www.saopaulo.sp.gov.br/ultimas-noticias/', 'oficial', 'estadual'),
('Veja São Paulo', 'https://vejasp.abril.com.br/', 'portal', 'estadual');