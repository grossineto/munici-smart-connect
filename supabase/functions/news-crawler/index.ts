import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting news crawling process...');

    // 1. Get active news sources
    const { data: sources, error: sourcesError } = await supabase
      .from('news_sources')
      .select('*')
      .eq('active', true);

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError);
      throw sourcesError;
    }

    console.log(`Found ${sources?.length || 0} active sources`);

    const results = [];

    // 2. Crawl each source
    for (const source of sources || []) {
      try {
        console.log(`Crawling ${source.name}...`);

        // Use Firecrawl to scrape the news source
        const crawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: source.url,
            formats: ['markdown'],
            options: {
              excludeTags: ['script', 'style', 'nav', 'footer', 'aside', 'advertisement'],
              includeLinks: true,
              onlyMainContent: true
            }
          }),
        });

        if (!crawlResponse.ok) {
          console.error(`Failed to crawl ${source.name}:`, crawlResponse.statusText);
          continue;
        }

        const crawlData = await crawlResponse.json();
        
        if (!crawlData.success) {
          console.error(`Crawl failed for ${source.name}:`, crawlData.error);
          continue;
        }

        // 3. Extract article links from the crawled content
        const content = crawlData.data?.markdown || '';
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const articleLinks = [];
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
          const title = match[1];
          const url = match[2];
          
          // Filter for news articles (basic heuristics)
          if (url.includes(source.url.replace('https://', '')) && 
              title.length > 20 && 
              !url.includes('/video/') && 
              !url.includes('/galeria/')) {
            articleLinks.push({ title, url });
          }
        }

        console.log(`Found ${articleLinks.length} potential articles from ${source.name}`);

        // 4. Process up to 5 recent articles per source
        const limitedArticles = articleLinks.slice(0, 5);
        
        for (const article of limitedArticles) {
          try {
            // Check if article already exists
            const { data: existingArticle } = await supabase
              .from('news_articles')
              .select('id')
              .eq('url', article.url)
              .single();

            if (existingArticle) {
              console.log(`Article already exists: ${article.title}`);
              continue;
            }

            // Scrape individual article
            const articleResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: article.url,
                formats: ['markdown'],
                options: {
                  excludeTags: ['script', 'style', 'nav', 'footer', 'aside', 'advertisement'],
                  onlyMainContent: true
                }
              }),
            });

            if (!articleResponse.ok) continue;

            const articleData = await articleResponse.json();
            if (!articleData.success) continue;

            const articleContent = articleData.data?.markdown || '';

            // 5. Save article to database
            const { data: savedArticle, error: insertError } = await supabase
              .from('news_articles')
              .insert({
                source_id: source.id,
                title: article.title,
                content: articleContent,
                url: article.url,
                published_at: new Date().toISOString()
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error saving article:', insertError);
              continue;
            }

            console.log(`Saved article: ${article.title}`);

            // 6. Analyze article with AI
            const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'system',
                    content: `Você é um analista especializado em monitoramento de notícias para gestão pública municipal. 
                    Analise a notícia e retorne APENAS um JSON válido com esta estrutura:
                    {
                      "sentiment_score": number(-1 a 1),
                      "urgency_level": "low|medium|high|critical",
                      "relevance_score": number(0 a 1),
                      "keywords": ["palavra1", "palavra2"],
                      "summary": "resumo em até 150 caracteres",
                      "impact_analysis": "análise do impacto",
                      "recommended_action": "ação recomendada",
                      "mentions_mayor": boolean,
                      "mentions_city": boolean,
                      "crisis_potential": boolean
                    }`
                  },
                  {
                    role: 'user',
                    content: `Título: ${article.title}\n\nConteúdo: ${articleContent.substring(0, 3000)}`
                  }
                ],
                temperature: 0.3,
                max_tokens: 1000
              }),
            });

            if (analysisResponse.ok) {
              const analysisData = await analysisResponse.json();
              const analysisText = analysisData.choices[0]?.message?.content;
              
              try {
                const analysis = JSON.parse(analysisText);
                
                // Save analysis
                await supabase
                  .from('news_analysis')
                  .insert({
                    article_id: savedArticle.id,
                    ...analysis
                  });

                // Create alert if high urgency or crisis potential
                if (analysis.urgency_level === 'high' || analysis.urgency_level === 'critical' || analysis.crisis_potential) {
                  await supabase
                    .from('news_alerts')
                    .insert({
                      article_id: savedArticle.id,
                      alert_type: analysis.crisis_potential ? 'crisis' : 'mention',
                      severity: analysis.urgency_level,
                      title: `Alerta: ${article.title}`,
                      message: analysis.summary
                    });
                }

                results.push({
                  source: source.name,
                  article: article.title,
                  analysis: analysis
                });

              } catch (parseError) {
                console.error('Error parsing AI analysis:', parseError);
              }
            }

            // Rate limiting - wait between requests
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (articleError) {
            console.error(`Error processing article: ${article.title}`, articleError);
          }
        }

        // Update source last_crawled_at
        await supabase
          .from('news_sources')
          .update({ last_crawled_at: new Date().toISOString() })
          .eq('id', source.id);

      } catch (sourceError) {
        console.error(`Error crawling source ${source.name}:`, sourceError);
      }
    }

    console.log(`Crawling completed. Processed ${results.length} articles`);

    return new Response(JSON.stringify({
      success: true,
      processed_articles: results.length,
      results: results.slice(0, 10) // Return first 10 for monitoring
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in news crawler:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});