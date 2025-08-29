import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.2.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedArticle {
  title: string;
  excerpt: string;
  substack_url: string;
  published_date: string;
  read_time: string;
  category: string;
}

type RawItem = Record<string, unknown>;

// Parse RSS XML to extract articles in a resilient way
function parseRssToArticles(xmlString: string): ParsedArticle[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const feed = parser.parse(xmlString) as { rss?: { channel?: { item?: RawItem | RawItem[] } } };
  const items = feed?.rss?.channel?.item ?? [];
  const itemArray: RawItem[] = Array.isArray(items) ? items : [items];

  return itemArray
    .map((item: RawItem): ParsedArticle => {
      const rawTitle = item.title as unknown;
      const title =
        typeof rawTitle === 'object' && rawTitle !== null
          ? String((rawTitle as Record<string, unknown>)['#text'] ?? '').trim()
          : String(rawTitle ?? '').trim();

      const descriptionRaw =
        (item['content:encoded'] as unknown) || (item.description as unknown) || '';
      const excerpt =
        String(descriptionRaw).replace(/<[^>]*>/g, '').substring(0, 200) + '...';

      const linkRaw = item.link as unknown;
      const substack_url = String(linkRaw ?? '').trim();

      const pubDateRaw = item.pubDate as unknown;
      const published_date = pubDateRaw
        ? new Date(String(pubDateRaw)).toISOString()
        : new Date().toISOString();

      const wordCount = excerpt.split(/\s+/).filter(Boolean).length * 5;
      const readTime = Math.max(1, Math.ceil(wordCount / 200));

      return {
        title,
        excerpt,
        substack_url,
        published_date,
        read_time: `${readTime} min read`,
        category: 'Legal Analysis',
      };
    })
    .filter((article: ParsedArticle) => article.title && article.substack_url);
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
    
    const rssResponse = await fetch(substackUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; SubstackSync/1.0; +https://rafalfryc.com)',
        Accept: 'application/rss+xml, application/xml',
      },
    });
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