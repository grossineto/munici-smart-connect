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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                {analysis.news_articles?.author || 'Fonte'}
              </Badge>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: ptBR })}</span>
              {analysis.news_articles?.url && (
                <>
                  <span>•</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => window.open(analysis.news_articles.url, '_blank')}
                    className="h-auto p-1 text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver notícia original
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getSentimentIcon(analysis.sentiment_score)} Sentimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.sentiment_score > 0.3 ? 'POSITIVO' : 
                   analysis.sentiment_score < -0.3 ? 'NEGATIVO' : 'NEUTRO'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Score: {(analysis.sentiment_score * 100).toFixed(0)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Relevância
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((analysis.relevance_score || 0) * 10)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Gestão Municipal
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Urgência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`${getUrgencyColor(analysis.urgency_level)} text-xs px-2 py-1`}>
                  {analysis.urgency_level?.toUpperCase() || 'MÉDIO'}
                </Badge>
                {analysis.crisis_potential && (
                  <div className="mt-1">
                    <Badge variant="destructive" className="text-xs">🚨 POTENCIAL DE CRISE</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Visibilidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {analysis.mentions_mayor && (
                    <Badge className="bg-purple-100 text-purple-700 text-xs">👨‍💼 Menciona Prefeito</Badge>
                  )}
                  {analysis.mentions_city && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">🏙️ Menciona SP</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo Executivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Análise de Impacto */}
          {analysis.impact_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Análise de Impacto na Gestão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{analysis.impact_analysis}</p>
              </CardContent>
            </Card>
          )}

          {/* Ação Recomendada */}
          {analysis.recommended_action && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  Ação Recomendada para a Gestão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700 font-medium leading-relaxed">{analysis.recommended_action}</p>
              </CardContent>
            </Card>
          )}

          {/* Palavras-chave */}
          {analysis.keywords && analysis.keywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Palavras-chave Identificadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords.map((keyword: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detalhes Técnicos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Detalhes da Análise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Score de Sentimento:</span>
                  <span className="ml-2">{(analysis.sentiment_score || 0).toFixed(3)}</span>
                </div>
                <div>
                  <span className="font-medium">Score de Relevância:</span>
                  <span className="ml-2">{(analysis.relevance_score || 0).toFixed(1)}/10</span>
                </div>
                <div>
                  <span className="font-medium">Nível de Urgência:</span>
                  <span className="ml-2">{analysis.urgency_level || 'Não definido'}</span>
                </div>
                <div>
                  <span className="font-medium">Potencial de Crise:</span>
                  <span className="ml-2">{analysis.crisis_potential ? 'SIM' : 'NÃO'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}