import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const ArticlesSection = () => {
  const articles = [
    {
      title: "The Impact of AI on Legal Practice: Opportunities and Challenges",
      excerpt: "Examining how artificial intelligence is transforming the legal industry, from document review to predictive analytics, and the ethical considerations that arise.",
      date: "2024-01-15",
      readTime: "8 min read",
      category: "Technology Law"
    },
    {
      title: "Constitutional Implications of Digital Privacy Rights",
      excerpt: "An analysis of how traditional constitutional frameworks adapt to modern digital privacy concerns in the age of data surveillance.",
      date: "2024-01-08",
      readTime: "12 min read",
      category: "Constitutional Law"
    },
    {
      title: "Contract Law in the Digital Age: Smart Contracts and Legal Validity",
      excerpt: "Exploring the legal recognition and enforceability of smart contracts within existing contract law frameworks.",
      date: "2023-12-22",
      readTime: "10 min read",
      category: "Contract Law"
    }
  ];

  return (
    <section className="py-16 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Legal Articles & Analysis
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Thoughtful exploration of contemporary legal issues, academic research, 
            and the evolving intersection of law and technology.
          </p>
        </div>

        <div className="grid gap-8 md:gap-6">
          {articles.map((article, index) => (
            <Card key={index} className="p-8 bg-gradient-to-r from-card to-accent/20 border-0 shadow-soft hover:shadow-elegant transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="px-3 py-1 bg-gradient-to-r from-primary/10 to-gold/10 text-primary rounded-full font-medium border border-gold/20">
                      {article.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(article.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-semibold text-foreground leading-tight">
                    {article.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
                
                <Button className="bg-gradient-to-r from-primary to-gold hover:from-primary-dark hover:to-gold-dark w-fit shadow-gold">
                  Read Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-gold/30 hover:bg-gold/5 hover:border-gold">
            View All Articles
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ArticlesSection;