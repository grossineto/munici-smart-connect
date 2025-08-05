# Plataforma de Monitoramento de Notícias - Resumo Técnico

## Visão Geral
Sistema de monitoramento de notícias políticas em tempo real com análise de sentimento e alertas automáticos. Desenvolvido em React/TypeScript com Supabase como backend.

## Arquitetura Técnica
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Autenticação**: Supabase Auth
- **Roteamento**: React Router DOM

## Funcionalidades Principais

### 1. Sistema de Busca de Políticos
- **Componente**: `SearchPoliticianInput.tsx`
- **Funcionalidade**: Busca em tempo real por políticos cadastrados
- **Filtros**: Nome, cidade, partido, UF
- **UI**: Dropdown com sugestões, logos de partidos, fotos dos políticos

### 2. Políticos em Destaque
- **Componente**: `RecentSuggestions.tsx`
- **Funcionalidade**: Lista de políticos principais para seleção rápida
- **UI**: Cards com avatar, nome, cargo, partido e localização

### 3. Cards de Políticos
- **Componente**: `PoliticianCard.tsx`
- **Funcionalidade**: Exibição detalhada de informações do político
- **UI**: Avatar, badges de cargo, informações de mandato, logos partidários

### 4. Botão de Análise
- **Componente**: `StartAnalysisButton.tsx`
- **Funcionalidade**: Iniciar coleta e análise de notícias
- **UI**: Gradiente, animações, estados de loading

## Base de Dados de Políticos

### Prefeitos Cadastrados
1. **Ricardo Nunes** (São Paulo/SP - MDB)
2. **Eduardo Paes** (Rio de Janeiro/RJ - PSD)
3. **João Campos** (Recife/PE - PSB)
4. **Bruno Reis** (Salvador/BA - União Brasil)
5. **Fuad Noman** (Belo Horizonte/MG - PSD)
6. **Rafael Greca** (Curitiba/PR - PMN)
7. **Sebastião Melo** (Porto Alegre/RS - MDB)
8. **José Sarto** (Fortaleza/CE - PDT)
9. **David Almeida** (Manaus/AM - Avante)
10. **Suéllen Rosim** (Bauru/SP - PSD)
11. **Fábio Leite** (Botucatu/SP - PSD)
12. **Guto Issa** (São Roque/SP - PSD)
13. **Ivana Camarinha** (Pederneiras/SP - PV)

### Governadores Cadastrados
1. **Ibaneis Rocha** (Brasília/DF - MDB)
2. **Tarcísio Gomes de Freitas** (São Paulo/SP - Republicanos)

### Partidos com Logos Configurados
- **MDB**: Logo azul
- **PSD**: Logo laranja
- **PSB**: Logo vermelho
- **União Brasil**: Logo azul/laranja
- **PV (Partido Verde)**: Logo verde
- **Republicanos**: Logo multicolorido

### Fotos de Políticos Configuradas
- Ricardo Nunes, João Campos, Bruno Reis, Suéllen Rosim, Fábio Leite, Guto Issa, Ivana Camarinha, Tarcísio Gomes de Freitas

## Componentes UI Utilizados

### Shadcn/ui Components
- `Button`, `Card`, `Input`, `Badge`, `Avatar`
- `Dialog`, `Popover`, `Dropdown Menu`
- `Sidebar`, `Progress`, `Skeleton`
- `Toast`, `Alert`, `Tabs`

### Ícones (Lucide React)
- `Search`, `Brain`, `Rocket`, `User`, `MapPin`
- `Crown` (Prefeitos), `Shield` (Governadores)
- `TrendingUp`, `Loader2`

## Estrutura de Arquivos

```
src/
├── components/
│   ├── ui/                    # Shadcn components
│   ├── SearchPoliticianInput.tsx
│   ├── RecentSuggestions.tsx
│   ├── PoliticianCard.tsx
│   ├── StartAnalysisButton.tsx
│   ├── AnalysisModal.tsx
│   ├── SummaryModal.tsx
│   └── AppSidebar.tsx
├── pages/
│   ├── NewsMonitoring.tsx     # Página principal
│   ├── Dashboard.tsx
│   ├── Auth.tsx
│   └── ...outras páginas
├── layouts/
│   └── DashboardLayout.tsx
├── hooks/
│   ├── useAuth.tsx
│   └── useNotifications.tsx
└── lib/
    └── utils.ts
```

## Banco de Dados Supabase

### Tabelas Principais
- `news_articles`: Artigos coletados
- `news_analysis`: Análises de sentimento
- `news_alerts`: Alertas gerados
- `monitored_keywords`: Palavras-chave monitoradas
- `profiles`: Perfis de usuários
- `notifications`: Sistema de notificações

### Edge Functions
- `news-crawler`: Coleta de notícias
- `perplexity-news-collector`: Integração com Perplexity
- `real-news-collector`: Coleta em tempo real
- `test-news-analysis`: Testes de análise

## Design System

### Cores Principais
- Primary: Sistema de cores do tema
- Muted: Cores neutras para backgrounds
- Gradientes: Aplicados em botões principais

### Typography
- Fontes do sistema padrão
- Escalas responsivas
- Hierarquia bem definida

### Spacing & Layout
- Grid responsivo
- Containers flexíveis
- Paddings e margins consistentes

## Funcionalidades em Desenvolvimento
1. **Sistema de Alertas**: Notificações push em tempo real
2. **Análise de Sentimento**: IA para classificação de notícias
3. **Dashboard Analytics**: Métricas e gráficos
4. **Relatórios**: Geração de PDFs
5. **WhatsApp Integration**: Bot para notificações

## Estado Atual
- ✅ Interface de seleção de políticos funcional
- ✅ Base de dados completa com fotos e logos
- ✅ Componentes UI polidos e responsivos
- ✅ Sistema de busca otimizado
- ⏳ Integração com APIs de notícias
- ⏳ Sistema de análise de sentimento
- ⏳ Dashboard de métricas

## Próximos Passos Sugeridos
1. Implementar coleta automática de notícias
2. Desenvolver algoritmos de análise de sentimento
3. Criar dashboard com gráficos e métricas
4. Adicionar sistema de relatórios
5. Implementar notificações push
6. Expandir base de políticos para outros estados

## Observações Técnicas
- Código TypeScript bem tipado
- Componentes reutilizáveis
- Design system consistente
- Performance otimizada
- SEO friendly
- Acessibilidade contemplada

---

**Data de Atualização**: Janeiro 2025
**Versão**: 1.0
**Status**: Em desenvolvimento ativo