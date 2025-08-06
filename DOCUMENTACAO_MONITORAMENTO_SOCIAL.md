# Documentação - Página de Monitoramento de Redes Sociais

## Visão Geral
A página de Monitoramento de Redes Sociais é uma ferramenta completa para acompanhar menções de políticos em tempo real nas principais plataformas sociais (Twitter, Instagram, Facebook e TikTok).

## Estrutura da Página

### 1. Header Principal
- **Título**: "Monitoramento de Redes Sociais"
- **Descrição**: "Acompanhe menções, sentimentos e engajamento em tempo real"
- **Status das Plataformas**: Indicadores visuais mostrando status de cada rede social
  - ✅ Twitter: Ativo (funcionando)
  - ✅ Instagram: Ativo (configurado)
  - ✅ Facebook: Ativo (configurado)
  - ⚪ TikTok: Inativo (não configurado)

### 2. Botões de Ação
- **"Importar Políticos"**: Importa lista pré-definida de políticos do sistema de notícias
- **"Coletar Menções"**: Inicia coleta manual de menções de todas as redes sociais

## Componentes Principais

### 1. SocialMetricsGrid
**Localização**: `/src/components/SocialMetricsGrid.tsx`
**Função**: Exibe métricas principais em cards
- Total de Menções
- Engajamento Total 
- Sentimento Positivo
- Sentimento Negativo
- Breakdown por plataforma

### 2. SearchPoliticianInput
**Localização**: `/src/components/SearchPoliticianInput.tsx`
**Função**: Busca e seleção de políticos para monitoramento
- Busca por nome, partido ou cidade
- Adiciona político à lista de monitorados

### 3. SocialPoliticianCard
**Localização**: `/src/components/SocialPoliticianCard.tsx`
**Função**: Exibe card individual de cada político monitorado
- Informações básicas (nome, cargo, cidade)
- Botões de ação (selecionar, remover)
- Status de monitoramento

### 4. PlatformTabs
**Localização**: `/src/components/PlatformTabs.tsx`
**Função**: Navegação entre diferentes redes sociais
- Filtros por plataforma
- Contadores de menções por rede

### 5. SentimentLineChart
**Localização**: `/src/components/SentimentLineChart.tsx`
**Função**: Gráfico de evolução do sentimento ao longo do tempo
- Linha temporal de sentimentos
- Filtros por período

### 6. TrendingTopics
**Localização**: `/src/components/TrendingTopics.tsx`
**Função**: Tópicos em alta relacionados aos políticos
- Palavras-chave mais mencionadas
- Análise de tendências

### 7. MentionHeatmap
**Localização**: `/src/components/MentionHeatmap.tsx`
**Função**: Mapa de calor das menções
- Visualização por horário/dia
- Intensidade de atividade

### 8. AlertsPanel
**Localização**: `/src/components/AlertsPanel.tsx`
**Função**: Sistema de alertas inteligentes
- Detecta picos de atividade
- Identifica mudanças de sentimento
- Alerta sobre alto engajamento
- Sistema de acknowledging

### 9. SocialTimeline
**Localização**: `/src/components/SocialTimeline.tsx`
**Função**: Timeline de eventos importantes
- Destaques de alto engajamento
- Marcos temporais
- Eventos críticos

### 10. ExportTools
**Localização**: `/src/components/ExportTools.tsx`
**Função**: Ferramentas de exportação
- Export para Excel/CSV
- Geração de relatórios
- Compartilhamento de dados

## Hooks Customizados

### 1. useSocialMonitor
**Localização**: `/src/hooks/useSocialMonitor.tsx`
**Função**: Hook principal que combina dados de menções e estatísticas
- `useSocialMentions`: Busca menções individuais
- `useSocialStats`: Calcula estatísticas agregadas
- Atualização automática a cada 30 segundos

### 2. useAuth
**Localização**: `/src/hooks/useAuth.tsx`
**Função**: Gerenciamento de autenticação
- Controle de acesso à página
- Verificação de permissões

## Edge Functions (Backend)

### 1. fetch-all-social-mentions
**Localização**: `/supabase/functions/fetch-all-social-mentions/`
**Função**: Orquestra coleta de todas as plataformas
- Executa coletas em paralelo
- Agrega resultados
- Retorna status consolidado

### 2. fetch-twitter-mentions
**Localização**: `/supabase/functions/fetch-twitter-mentions/`
**Função**: Coleta específica do Twitter
- Usa Twitter API v2
- Busca por palavras-chave específicas
- Rate limiting inteligente

### 3. fetch-instagram-mentions
**Localização**: `/supabase/functions/fetch-instagram-mentions/`
**Função**: Coleta específica do Instagram
- Usa Instagram Basic Display API
- Filtra posts por palavras-chave
- Calcula métricas de engajamento

### 4. fetch-facebook-mentions
**Localização**: `/supabase/functions/fetch-facebook-mentions/`
**Função**: Coleta específica do Facebook
- Usa Facebook Graph API
- Monitora páginas específicas
- Extrai métricas de interação

### 5. analyze-social-sentiment
**Localização**: `/supabase/functions/analyze-social-sentiment/`
**Função**: Análise de sentimento com IA
- Processa menções coletadas
- Classifica sentimentos (positivo/negativo/neutro)
- Extrai tópicos e emoções

## Sistema de Palavras-Chave Dinâmicas

### Estrutura de Políticos
Cada político possui:
```javascript
{
  nome: "Ricardo Nunes",
  partido: "MDB",
  cargo: "Prefeito", 
  cidade: "São Paulo",
  uf: "SP",
  mandato: "2021-2024",
  keywords: [
    "Ricardo Nunes",
    "prefeito São Paulo", 
    "prefeitura São Paulo",
    "prefeito de SP",
    "gestão Ricardo Nunes",
    "cidade de São Paulo",
    "MDB São Paulo"
  ]
}
```

### Lista Atual de Políticos
1. **Ricardo Nunes** (Prefeito - São Paulo/SP)
2. **Eduardo Paes** (Prefeito - Rio de Janeiro/RJ)
3. **João Campos** (Prefeito - Recife/PE)
4. **Suéllen Rosim** (Prefeita - Bauru/SP)
5. **Bruno Reis** (Prefeito - Salvador/BA)
6. **Tarcísio Gomes de Freitas** (Governador - São Paulo/SP)

## Banco de Dados

### Tabela: social_mentions
**Estrutura**:
- `id`: UUID único
- `platform`: string ('twitter', 'instagram', 'facebook', 'tiktok')
- `politician_name`: string
- `content`: text (conteúdo da menção)
- `timestamp`: timestamp with timezone
- `url`: string (link para o post original)
- `mention_type`: string ('mention', 'post', 'comment')
- `sentiment`: string ('positive', 'negative', 'neutral')
- `reach_estimate`: integer (estimativa de alcance)
- `engagement_score`: integer (soma de likes, comments, shares)
- `raw_data`: jsonb (dados brutos da API)
- `created_at`: timestamp
- `updated_at`: timestamp

### Tabela: monitored_keywords
**Estrutura**:
- `id`: UUID único
- `keyword`: string
- `category`: string
- `alert_threshold`: integer
- `active`: boolean
- `created_at`: timestamp
- `updated_at`: timestamp

## Fluxo de Funcionamento

### 1. Importação de Políticos
1. Usuário clica em "Importar Políticos"
2. Sistema carrega lista pré-definida
3. Políticos são adicionados à lista de monitoramento
4. Cada político traz suas palavras-chave específicas

### 2. Coleta de Menções
1. Usuário clica em "Coletar Menções"
2. Sistema chama `fetch-all-social-mentions`
3. Edge function executa coletas em paralelo:
   - Twitter: Busca por palavras-chave específicas
   - Instagram: Filtra posts pessoais por keywords
   - Facebook: Monitora páginas por keywords
   - TikTok: (não implementado ainda)
4. Dados são salvos na tabela `social_mentions`
5. Sistema dispara análise de sentimento
6. Interface é atualizada com novos dados

### 3. Filtragem por Político
1. Usuário seleciona político específico
2. Todos os componentes filtram dados pelo `politician_name`
3. Métricas são recalculadas para o político selecionado
4. Gráficos e visualizações são atualizados

### 4. Sistema de Alertas
1. `AlertsPanel` monitora padrões nos dados
2. Detecta automaticamente:
   - Picos de atividade (>50% aumento)
   - Alta concentração negativa (>60%)
   - Menções virais (>100 engajamento)
   - Mudanças bruscas de sentimento (>30%)
3. Gera alertas classificados por severidade
4. Permite acknowledgment e remoção

## Configurações de API

### Secrets Necessários
- `TWITTER_BEARER_TOKEN`: Token do Twitter API v2
- `FACEBOOK_ACCESS_TOKEN`: Token do Facebook Graph API
- `FACEBOOK_PAGE_ID`: ID da página do Facebook a monitorar
- `INSTAGRAM_ACCESS_TOKEN`: Token do Instagram Basic Display API
- `OPENAI_API_KEY`: Para análise de sentimento (se usando OpenAI)

### Rate Limits
- **Twitter**: 300 requests/15min
- **Instagram**: 200 requests/hour
- **Facebook**: 200 requests/hour

## Problemas Conhecidos e Soluções

### 1. Twitter Rate Limiting
**Problema**: API do Twitter tem limites baixos
**Solução**: Implementado delay entre requests e priorização por político

### 2. Instagram Limitações
**Problema**: Instagram Basic Display só acessa posts do próprio usuário
**Solução**: Para menções públicas, seria necessário Instagram Business API

### 3. Facebook Page Access
**Problema**: Necessário acesso específico à página
**Solução**: Configurar `FACEBOOK_PAGE_ID` corretamente

### 4. Filtragem por Político
**Problema**: Busca não estava específica por político
**Solução**: Implementado sistema de palavras-chave dinâmicas

## Melhorias Futuras Sugeridas

### 1. Funcionalidades
- Agendamento automático de coletas
- Sistema de notificações em tempo real
- Análise de influenciadores
- Detecção de fake news
- Comparação entre políticos
- Relatórios automatizados

### 2. UI/UX
- Dashboard mais interativo
- Filtros avançados por data/sentimento
- Visualizações mais ricas
- Sistema de favoritos
- Modo escuro
- Responsividade mobile melhorada

### 3. Performance
- Cache inteligente de dados
- Paginação de menções
- Otimização de queries
- Background processing
- CDN para assets

### 4. Integrações
- WhatsApp Business API
- YouTube API
- LinkedIn API
- Telegram monitoring
- RSS feeds de notícias
- Google Trends integration

## Arquitetura Técnica

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** para styling
- **Shadcn/ui** para componentes
- **React Query** para cache e estado
- **Recharts** para visualizações
- **Lucide React** para ícones

### Backend
- **Supabase** como BaaS
- **Deno** para Edge Functions
- **PostgreSQL** para banco de dados
- **Row Level Security** para permissões

### Deploy
- **Lovable** para hosting frontend
- **Supabase** para backend e banco
- **Edge Functions** para processamento

Este documento serve como base completa para entender toda a funcionalidade e arquitetura da página de Monitoramento de Redes Sociais.