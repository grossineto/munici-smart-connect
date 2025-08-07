import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SocialMention {
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
  // Optional author metadata extracted from the source
  author_name?: string;
  author_username?: string;
  author_profile_image_url?: string;
  author_url?: string;
  raw_data?: any;
}

export interface SocialStats {
  totalMentions: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  platformBreakdown: Record<string, number>;
  engagementTotal: number;
}

export function useSocialMentions(politician?: string, platform?: string, limit = 20) {
  return useQuery({
    queryKey: ['socialMentions', politician, platform, limit],
    queryFn: async () => {
      let query = supabase
        .from('social_mentions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (politician) {
        query = query.eq('politician_name', politician);
      }

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as SocialMention[];
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
}

export function useSocialStats(politician?: string, timeframe = '7d') {
  return useQuery({
    queryKey: ['socialStats', politician, timeframe],
    queryFn: async () => {
      const timeframeDays = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframeDays);

      let query = supabase
        .from('social_mentions')
        .select('platform, sentiment, engagement_score')
        .gte('timestamp', startDate.toISOString());

      if (politician) {
        query = query.eq('politician_name', politician);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const stats: SocialStats = {
        totalMentions: data.length,
        positiveCount: data.filter(m => m.sentiment === 'positive').length,
        negativeCount: data.filter(m => m.sentiment === 'negative').length,
        neutralCount: data.filter(m => m.sentiment === 'neutral').length,
        platformBreakdown: {},
        engagementTotal: data.reduce((sum, m) => sum + (m.engagement_score || 0), 0)
      };

      // Contagem por plataforma
      data.forEach(mention => {
        stats.platformBreakdown[mention.platform] = 
          (stats.platformBreakdown[mention.platform] || 0) + 1;
      });

      return stats;
    },
    refetchInterval: 60000, // Atualiza a cada minuto
  });
}

export function useSocialMonitor() {
  const { data: mentions, isLoading: mentionsLoading } = useSocialMentions();
  const { data: stats, isLoading: statsLoading } = useSocialStats();

  return {
    mentions: mentions || [],
    stats: stats || {
      totalMentions: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      platformBreakdown: {},
      engagementTotal: 0
    },
    isLoading: mentionsLoading || statsLoading
  };
}