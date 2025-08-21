import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse RSS XML to extract articles
function parseRssToArticles(xmlString: string) {
  const articles: any[] = [];
  
  // Simple regex-based XML parsing for RSS items
  const itemRegex = /<item>(.*?)<\/item>/gs;
  let match;

  while ((match = itemRegex.exec(xmlString)) !== null) {
    const itemContent = match[1];
    
    // Extract title
    const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || 
                      itemContent.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract description/excerpt
    const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || 
                     itemContent.match(/<description>(.*?)<\/description>/);
    let excerpt = descMatch ? descMatch[1].trim() : '';
    
    // Clean HTML from excerpt and limit length
    excerpt = excerpt.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
    
    // Extract link
    const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
    const substack_url = linkMatch ? linkMatch[1].trim() : '';
    
    // Extract publication date
    const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
    const published_date = dateMatch ? new Date(dateMatch[1].trim()).toISOString() : new Date().toISOString();
    
    // Calculate read time (rough estimate: 200 words per minute)
    const wordCount = excerpt.split(' ').length * 5; // Estimate full article is 5x excerpt
    const readTime = Math.ceil(wordCount / 200);
    
    if (title && substack_url) {
      articles.push({
        title,
        excerpt,
        substack_url,
        published_date,
        read_time: `${readTime} min read`,
        category: 'Legal Analysis'
      });
    }
  }
  
  return articles;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Substack sync...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch RSS feed from Substack
    const substackUrl = 'https://rafalfryc.substack.com/feed';
    console.log(`Fetching RSS from: ${substackUrl}`);
    
    const rssResponse = await fetch(substackUrl);
    if (!rssResponse.ok) {
      throw new Error(`Failed to fetch RSS: ${rssResponse.status} ${rssResponse.statusText}`);
    }
    
    const rssXml = await rssResponse.text();
    console.log(`RSS fetched successfully, length: ${rssXml.length}`);
    
    // Parse articles from RSS
    const articles = parseRssToArticles(rssXml);
    console.log(`Parsed ${articles.length} articles from RSS`);
    
    if (articles.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No articles found in RSS feed',
        articlesProcessed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Sync articles to database
    let newArticles = 0;
    let updatedArticles = 0;

    for (const article of articles) {
      // Check if article already exists
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('substack_url', article.substack_url)
        .single();

      if (existing) {
        // Update existing article
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            title: article.title,
            excerpt: article.excerpt,
            read_time: article.read_time,
            category: article.category,
            updated_at: new Date().toISOString()
          })
          .eq('substack_url', article.substack_url);

        if (updateError) {
          console.error('Error updating article:', updateError);
        } else {
          updatedArticles++;
        }
      } else {
        // Insert new article
        const { error: insertError } = await supabase
          .from('articles')
          .insert([article]);

        if (insertError) {
          console.error('Error inserting article:', insertError);
        } else {
          newArticles++;
        }
      }
    }

    console.log(`Sync completed: ${newArticles} new, ${updatedArticles} updated`);

    return new Response(JSON.stringify({ 
      message: 'Substack sync completed successfully',
      articlesProcessed: articles.length,
      newArticles,
      updatedArticles
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in sync-substack function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to sync Substack articles',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});