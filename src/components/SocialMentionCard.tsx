import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart, MessageCircle, Share, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SocialMentionCardProps {
  mention: {
    id: string;
    platform: string;
    politician_name: string;
    content: string;
    timestamp: string;
    url?: string;
    mention_type: "post" | "mention" | "comment";
    sentiment: "positive" | "negative" | "neutral";
    reach_estimate: number;
    engagement_score: number;
    raw_data?: any;
  };
  showPlatformBadge?: boolean;
  className?: string;
}

const platformIcons: Record<string, string> = {
  twitter: "𝕏",
  instagram: "📷",
  facebook: "👤",
  tiktok: "🎵"
};

const sentimentColors: Record<string, string> = {
  positive: "bg-success text-success-foreground",
  negative: "bg-destructive text-destructive-foreground",
  neutral: "bg-muted text-muted-foreground"
};

const sentimentLabels: Record<string, string> = {
  positive: "Positivo",
  negative: "Negativo", 
  neutral: "Neutro"
};

export function SocialMentionCard({ mention, showPlatformBadge = false, className = "" }: SocialMentionCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="social-mention-card hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg">{platformIcons[mention.platform] || "📱"}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{mention.politician_name}</span>
                <Badge variant="outline" className="text-xs">
                  {mention.mention_type === "post" ? "Post Oficial" : 
                   mention.mention_type === "mention" ? "Menção" : "Comentário"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(mention.timestamp), "PPp", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Badge className={`${sentimentColors[mention.sentiment]} text-xs`}>
            {sentimentLabels[mention.sentiment]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm mb-4 line-clamp-3 leading-relaxed">
          {mention.content}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{formatNumber(mention.reach_estimate)} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{formatNumber(mention.engagement_score)}</span>
            </div>
          </div>

          {mention.url && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => window.open(mention.url, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver Post
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}