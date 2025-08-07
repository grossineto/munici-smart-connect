import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  Heart, 
  MessageCircle, 
  Share2, 
  Clock,
  Twitter,
  Instagram,
  Facebook,
  Music,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useSocialMentions } from '@/hooks/useSocialMonitor';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SocialMentionsListProps {
  selectedPolitician?: string;
  platform?: string;
  className?: string;
}

export function SocialMentionsList({ 
  selectedPolitician, 
  platform,
  className = ""
}: SocialMentionsListProps) {
  const { data: mentions = [], isLoading } = useSocialMentions(
    selectedPolitician === "all" ? undefined : selectedPolitician,
    platform,
    50
  );

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return <Twitter className="h-4 w-4 text-blue-500" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'facebook': return <Facebook className="h-4 w-4 text-blue-600" />;
      case 'tiktok': return <Music className="h-4 w-4 text-gray-900" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      case 'neutral': return '😐';
      default: return '🤔';
    }
  };

  const formatEngagement = (score: number) => {
    if (score > 1000) return `${(score / 1000).toFixed(1)}k`;
    return score.toString();
  };

  const getEngagementLevel = (score: number) => {
    if (score > 100) return { icon: <Zap className="h-3 w-3" />, label: 'Viral', color: 'text-orange-600' };
    if (score > 50) return { icon: <TrendingUp className="h-3 w-3" />, label: 'Alto', color: 'text-green-600' };
    if (score > 10) return { icon: <Heart className="h-3 w-3" />, label: 'Médio', color: 'text-blue-600' };
    return { icon: <MessageCircle className="h-3 w-3" />, label: 'Baixo', color: 'text-gray-600' };
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Carregando Menções...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Menções Recentes
            <Badge variant="secondary">
              {mentions.length} posts
            </Badge>
          </div>
          {selectedPolitician && selectedPolitician !== "all" && (
            <Badge variant="outline" className="ml-auto">
              {selectedPolitician}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {mentions.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma menção encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {selectedPolitician && selectedPolitician !== "all" 
                ? `Não há menções para ${selectedPolitician} no período selecionado.`
                : "Não há menções no período selecionado."
              }
            </p>
            <p className="text-sm text-muted-foreground">
              Tente coletar novas menções ou alterar o período de busca.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {mentions.map((mention) => {
              const engagementLevel = getEngagementLevel(mention.engagement_score);
              
              return (
                <div 
                  key={mention.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Header da Menção */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getPlatformIcon(mention.platform)}
                      <div>
                        <h4 className="font-semibold text-sm">
                          {mention.politician_name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(mention.timestamp), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Sentimento */}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getSentimentColor(mention.sentiment)}`}
                      >
                        {getSentimentIcon(mention.sentiment)} {mention.sentiment}
                      </Badge>
                      
                      {/* Tipo de Menção */}
                      <Badge variant="secondary" className="text-xs">
                        {mention.mention_type}
                      </Badge>
                    </div>
                  </div>

                  {/* Conteúdo da Menção */}
                  <div className="mb-3">
                    <p className="text-sm leading-relaxed text-foreground">
                      {mention.content}
                    </p>
                  </div>

                  {/* Métricas e Ações */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-4">
                      {/* Engajamento */}
                      <div className={`flex items-center gap-1 text-xs ${engagementLevel.color}`}>
                        {engagementLevel.icon}
                        <span className="font-medium">
                          {formatEngagement(mention.engagement_score)}
                        </span>
                        <span className="text-muted-foreground">
                          {engagementLevel.label}
                        </span>
                      </div>

                      {/* Alcance Estimado */}
                      {mention.reach_estimate > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Share2 className="h-3 w-3" />
                          <span>~{formatEngagement(mention.reach_estimate)} alcance</span>
                        </div>
                      )}
                    </div>

                    {/* Link para o Post Original */}
                    {mention.url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="h-8 px-3 text-xs"
                      >
                        <a 
                          href={mention.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver Post
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}