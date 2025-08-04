-- Atualizar fontes existentes e adicionar novas sem deletar
UPDATE public.news_sources 
SET name = 'G1 São Paulo', 
    url = 'https://g1.globo.com/sp/sao-paulo/',
    region = 'estadual'
WHERE name = 'G1';

-- Inserir novas fontes reais importantes
INSERT INTO public.news_sources (name, url, type, region) VALUES
('Folha de S.Paulo', 'https://www1.folha.uol.com.br/cotidiano/', 'portal', 'nacional'),
('Estadão São Paulo', 'https://sao-paulo.estadao.com.br/', 'portal', 'estadual'),
('UOL SP', 'https://noticias.uol.com.br/cotidiano/sao-paulo/', 'portal', 'estadual'),
('CNN Brasil Política', 'https://www.cnnbrasil.com.br/politica/', 'portal', 'nacional'),
('Metrópoles SP', 'https://www.metropoles.com/sao-paulo', 'portal', 'estadual'),
('R7 São Paulo', 'https://noticias.r7.com/sao-paulo', 'portal', 'estadual'),
('Band SP', 'https://www.band.uol.com.br/noticias/sao-paulo', 'portal', 'estadual'),
('Prefeitura SP', 'https://www.prefeitura.sp.gov.br/cidade/secretarias/comunicacao/noticias/', 'oficial', 'municipal'),
('Veja SP', 'https://vejasp.abril.com.br/', 'portal', 'estadual'),
('Portal Terra SP', 'https://www.terra.com.br/noticias/brasil/cidades/sao-paulo/', 'portal', 'estadual'),
('Jornal da USP', 'https://jornal.usp.br/', 'academico', 'estadual');