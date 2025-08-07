import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase envs" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const now = new Date();

    // Load tenant settings
    const { data: settings, error: settingsError } = await supabase
      .from("tenant_settings")
      .select("tenant_id, retention_days_social, retention_days_news, retention_days_messages, retention_days_requests, retention_days_analytics");

    if (settingsError) throw settingsError;

    const results: Record<string, unknown>[] = [];

    for (const s of settings || []) {
      const tId = s.tenant_id as string;
      const cutoff = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

      // Social mentions
      const { error: delSocialErr, count: delSocialCount } = await supabase
        .from("social_mentions")
        .delete({ count: "exact" })
        .eq("tenant_id", tId)
        .lt("timestamp", cutoff(s.retention_days_social));

      // News domain (using created_at fallback)
      const { error: delNewsArticlesErr, count: delNewsArticles } = await supabase
        .from("news_articles").delete({ count: "exact" })
        .eq("tenant_id", tId)
        .lt("created_at", cutoff(s.retention_days_news));

      const { error: delNewsAnalysisErr, count: delNewsAnalysis } = await supabase
        .from("news_analysis").delete({ count: "exact" })
        .eq("tenant_id", tId)
        .lt("created_at", cutoff(s.retention_days_news));

      const { error: delNewsAlertsErr, count: delNewsAlerts } = await supabase
        .from("news_alerts").delete({ count: "exact" })
        .eq("tenant_id", tId)
        .lt("created_at", cutoff(s.retention_days_news));

      const { error: delNewsSourcesErr, count: delNewsSources } = await supabase
        .from("news_sources").delete({ count: "exact" })
        .eq("tenant_id", tId)
        .lt("created_at", cutoff(s.retention_days_news));

      // Messages / Requests
      const { error: delMessagesErr, count: delMessages } = await supabase
        .from("messages").delete({ count: "exact" })
        .eq("tenant_id", tId)
        .lt("created_at", cutoff(s.retention_days_messages));

      const { error: delRequestsErr, count: delRequests } = await supabase
        .from("requests").delete({ count: "exact" })
        .eq("tenant_id", tId)
        .lt("created_at", cutoff(s.retention_days_requests));

      // Analytics
      const { error: delAnalyticsErr, count: delAnalytics } = await supabase
        .from("analytics_metrics").delete({ count: "exact" })
        .eq("tenant_id", tId)
        .lt("period_end", cutoff(s.retention_days_analytics));

      results.push({
        tenant_id: tId,
        deleted: {
          social_mentions: delSocialCount ?? 0,
          news_articles: delNewsArticles ?? 0,
          news_analysis: delNewsAnalysis ?? 0,
          news_alerts: delNewsAlerts ?? 0,
          news_sources: delNewsSources ?? 0,
          messages: delMessages ?? 0,
          requests: delRequests ?? 0,
          analytics_metrics: delAnalytics ?? 0,
        },
        errors: [
          delSocialErr?.message,
          delNewsArticlesErr?.message,
          delNewsAnalysisErr?.message,
          delNewsAlertsErr?.message,
          delNewsSourcesErr?.message,
          delMessagesErr?.message,
          delRequestsErr?.message,
          delAnalyticsErr?.message,
        ].filter(Boolean),
      });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("data-retention-cleaner error", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
