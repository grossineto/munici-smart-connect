import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, TrendingUp, TrendingDown, AlertTriangle, Eye, Target, Users, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AnalysisModalProps {
  analysis: any;
  isOpen: boolean;
  onClose: () => void;
}

export function AnalysisModal({ analysis, isOpen, onClose }: AnalysisModalProps) {
  if (!analysis) return null;

  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return "😊";
    if (score < -0.3) return "😞";
    return "😐";
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': case 'critico': return 'text-red-600 bg-red-100';
      case 'high': case 'alto': return 'text-orange-600 bg-orange-100';
      case 'medium': case 'medio': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-6 w-6 text-blue-600" />
            Análise Detalhada de Opinião Pública
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Título da Notícia */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <h3 className="text-lg font-bold mb-2">{analysis.news_articles?.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                📰 {analysis.news_articles?.author || 'Fonte'}
              </Badge>
              <Badge variant="outline" className="bg-gray-100 text-gray-700">
                📅 {analysis.news_articles?.published_at 
                  ? new Date(analysis.news_articles.published_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Data não disponível'
                }
              </Badge>
              {analysis.news_articles?.url && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.open(analysis.news_articles.url, '_blank')}
                  className="bg-white"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Ver Notícia Original
                </Button>
              )}
            </div>
          </div>

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">{getSentimentIcon(analysis.sentiment_score)}</div>
              <div className="text-lg font-bold">
                {analysis.sentiment_score > 0.3 ? 'POSITIVA' : 
                 analysis.sentiment_score < -0.3 ? 'NEGATIVA' : 'NEUTRA'}
              </div>
              <div className="text-sm text-muted-foreground">Sentimento</div>
            </Card>

            <Card className={`p-4 text-center ${getUrgencyColor(analysis.urgency_level)}`}>
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-lg font-bold">{analysis.urgency_level?.toUpperCase()}</div>
              <div className="text-sm opacity-75">Urgência</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-lg font-bold">{analysis.relevance_score || 0}/10</div>
              <div className="text-sm text-muted-foreground">Relevância</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">{analysis.crisis_potential ? '🚨' : '✅'}</div>
              <div className="text-lg font-bold">
                {analysis.crisis_potential ? 'RISCO' : 'SEGURO'}
              </div>
              <div className="text-sm text-muted-foreground">Potencial de Crise</div>
            </Card>
          </div>

          {/* Badges Especiais */}
          <div className="flex flex-wrap gap-2">
            {analysis.mentions_mayor && (
              <Badge className="bg-purple-500 hover:bg-purple-600 px-3 py-1">
                👨‍💼 Menciona Prefeito Ricardo Nunes
              </Badge>
            )}
            {analysis.crisis_potential && (
              <Badge variant="destructive" className="animate-pulse px-3 py-1">
                ⚠️ Potencial de Crise
              </Badge>
            )}
            {analysis.relevance_score >= 8 && (
              <Badge className="bg-green-500 hover:bg-green-600 px-3 py-1">
                🔥 Alta Relevância
              </Badge>
            )}
          </div>

          {/* Palavras-chave */}
          {analysis.keywords && analysis.keywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Palavras-chave Estratégicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumo Executivo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📋 Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed font-medium">
                {analysis.summary || 'Resumo não disponível'}
              </p>
            </CardContent>
          </Card>

          {/* Análise de Impacto ELABORADA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                🎯 Análise de Impacto Municipal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {analysis.impact_analysis || 'Análise de impacto não disponível'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ação Recomendada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                🚀 Ação Recomendada para a Prefeitura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800 font-medium leading-relaxed">
                  {analysis.recommended_action || 'Nenhuma ação específica recomendada'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Análises Elaboradas - Seção Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Predição de Sentimento Público */}
            {analysis.public_sentiment_prediction && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    👥 Reação Pública Esperada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {analysis.public_sentiment_prediction}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Estratégia de Comunicação */}
            {analysis.communication_strategy && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    📢 Estratégia de Comunicação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {analysis.communication_strategy}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Avaliação de Riscos */}
            {analysis.risk_assessment && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    ⚠️ Avaliação de Riscos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {analysis.risk_assessment}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Oportunidade Política */}
            {analysis.political_opportunity && analysis.political_opportunity !== 'nenhuma oportunidade identificada' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🎯 Oportunidade Política
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-green-800 font-medium leading-relaxed">
                      {analysis.political_opportunity}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Áreas Municipais Envolvidas */}
          {analysis.related_municipal_areas && analysis.related_municipal_areas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🏛️ Secretarias e Órgãos Municipais Envolvidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.related_municipal_areas.map((area, index) => (
                    <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 px-3 py-1">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monitoramento de Mídia */}
          {analysis.media_monitoring_focus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  📺 Foco do Monitoramento de Mídia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 font-medium leading-relaxed">
                    {analysis.media_monitoring_focus}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Impacto no Cidadão */}
          {analysis.citizen_impact && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🏠 Impacto na Vida dos Cidadãos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-800 font-medium leading-relaxed">
                    {analysis.citizen_impact}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamp */}
          <div className="text-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 inline mr-1" />
            Análise gerada em {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: ptBR })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}