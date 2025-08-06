import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hash, TrendingUp, MessageCircle } from 'lucide-react';
import { useSocialMentions } from '@/hooks/useSocialMonitor';

interface TrendingTopicsProps {
  selectedPolitician?: string;
  timeframe?: string;
  className?: string;
}

interface WordData {
  word: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  size: number;
}

export function TrendingTopics({ 
  selectedPolitician, 
  timeframe = "7d",
  className = ""
}: TrendingTopicsProps) {
  const { data: mentions = [] } = useSocialMentions(
    selectedPolitician === "all" ? undefined : selectedPolitician
  );

  // Palavras irrelevantes para filtrar
  const stopWords = new Set([
    'que', 'não', 'uma', 'para', 'com', 'por', 'mais', 'foi', 'ser', 'tem', 
    'seu', 'sua', 'seus', 'suas', 'nos', 'das', 'dos', 'como', 'mas', 'até',
    'esse', 'essa', 'isso', 'aqui', 'ali', 'onde', 'quando', 'assim', 'ainda',
    'bem', 'muito', 'todo', 'toda', 'todos', 'todas', 'outro', 'outra', 'já',
    'também', 'sem', 'depois', 'antes', 'agora', 'então', 'porque', 'desde',
    'http', 'https', 'www', 'com', 'br', 'org', 'net', 'gov', 'rt', 'via'
  ]);

  const wordCloudData = useMemo(() => {
    const wordMap = new Map<string, { count: number; sentiments: string[] }>();

    mentions.forEach(mention => {
      // Processar texto
      const words = mention.content
        .toLowerCase()
        .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, ' ')
        .split(/\s+/)
        .filter(word => 
          word.length > 3 && 
          !stopWords.has(word) &&
          !word.match(/^\d+$/) &&
          !word.includes('@') &&
          !word.includes('#')
        );

      words.forEach(word => {
        if (!wordMap.has(word)) {
          wordMap.set(word, { count: 0, sentiments: [] });
        }
        const data = wordMap.get(word)!;
        data.count++;
        data.sentiments.push(mention.sentiment);
      });
    });

    // Converter para array e calcular métricas
    const wordArray = Array.from(wordMap.entries())
      .map(([word, data]) => {
        const positiveCount = data.sentiments.filter(s => s === 'positive').length;
        const negativeCount = data.sentiments.filter(s => s === 'negative').length;
        const neutralCount = data.sentiments.filter(s => s === 'neutral').length;
        
        let dominantSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (positiveCount > negativeCount && positiveCount > neutralCount) {
          dominantSentiment = 'positive';
        } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
          dominantSentiment = 'negative';
        }

        return {
          word,
          count: data.count,
          sentiment: dominantSentiment,
          size: Math.min(Math.max(data.count * 4, 12), 32)
        };
      })
      .filter(item => item.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    return wordArray;
  }, [mentions]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-success bg-success/10 border-success/20';
      case 'negative':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      default:
        return 'text-muted-foreground bg-muted/50 border-muted-foreground/20';
    }
  };

  const topTopics = wordCloudData.slice(0, 5);
  const emergingTopics = wordCloudData.slice(5, 10);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Word Cloud Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Tópicos em Destaque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-center p-4 bg-muted/20 rounded-lg min-h-[200px] items-center">
            {wordCloudData.map((word, index) => (
              <Badge
                key={word.word}
                variant="outline"
                className={`
                  ${getSentimentColor(word.sentiment)}
                  transition-all duration-200 hover:scale-110 cursor-pointer
                  border font-medium
                `}
                style={{
                  fontSize: `${word.size}px`,
                  padding: `${Math.max(word.size / 8, 4)}px ${Math.max(word.size / 4, 8)}px`,
                  opacity: 0.7 + (index < 10 ? 0.3 : 0)
                }}
              >
                {word.word}
                <span className="ml-1 text-xs opacity-70">
                  {word.count}
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Topics e Emerging Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Tópicos Principais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTopics.map((topic, index) => (
                <div key={topic.word} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="font-medium">{topic.word}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSentimentColor(topic.sentiment)}`}
                    >
                      {topic.sentiment === 'positive' ? '😊' : topic.sentiment === 'negative' ? '😠' : '😐'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    {topic.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emerging Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Tópicos Emergentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emergingTopics.map((topic, index) => (
                <div key={topic.word} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">
                      {index + 6}
                    </div>
                    <span className="font-medium">{topic.word}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSentimentColor(topic.sentiment)}`}
                    >
                      {topic.sentiment === 'positive' ? '😊' : topic.sentiment === 'negative' ? '😠' : '😐'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    {topic.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}