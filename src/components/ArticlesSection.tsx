import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  substack_url: string;
  published_date: string;
  read_time: string;
  category: string;
}

const ArticlesSection = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Fetch articles from database
  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('published_date', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: "Error",
        description: "Failed to load articles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sync articles from Substack
  const syncSubstack = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-substack');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `${data.message}. Found ${data.articlesProcessed} articles.`,
      });

      // Refresh articles after sync
      await fetchArticles();
    } catch (error) {
      console.error('Error syncing Substack:', error);
      toast({
        title: "Error",
        description: "Failed to sync Substack articles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <section className="py-16 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Articles & Analysis
            </h2>
            <Button 
              onClick={syncSubstack}
              disabled={syncing}
              variant="outline"
              size="sm"
              className="border-gold/30 hover:bg-gold/5 hover:border-gold"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </Button>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Thoughtful exploration of contemporary legal issues, academic research, 
            and the evolving intersection of law and technology.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-foreground mb-4">No articles yet</h3>
              <p className="text-muted-foreground mb-6">
                Articles from your Substack will appear here once you publish them.
              </p>
              <Button onClick={syncSubstack} disabled={syncing} className="bg-gradient-to-r from-primary to-gold hover:from-primary-dark hover:to-gold-dark">
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 md:gap-6">
            {articles.map((article) => (
              <Card key={article.id} className="p-8 bg-gradient-to-r from-card to-accent/20 border-0 shadow-soft hover:shadow-elegant transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="px-3 py-1 bg-gradient-to-r from-primary/10 to-gold/10 text-primary rounded-full font-medium border border-gold/20">
                        {article.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(article.published_date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{article.read_time}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-semibold text-foreground leading-tight">
                      {article.title}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => window.open(article.substack_url, '_blank')}
                    className="bg-gradient-to-r from-primary to-gold hover:from-primary-dark hover:to-gold-dark w-fit shadow-gold"
                  >
                    Read Article
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {articles.length > 0 && (
          <div className="text-center mt-12">
            <Button 
              onClick={() => window.open('https://rafalfryc.substack.com', '_blank')}
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-3 border-gold/30 hover:bg-gold/5 hover:border-gold"
            >
              Visit My Substack
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ArticlesSection;