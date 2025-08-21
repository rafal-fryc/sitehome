import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Code, Scale, Mail } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-primary/5 px-4">
      <div className="container max-w-6xl">
        <div className="text-center space-y-8">
          {/* Hero Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
                Portfolio & Insights
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Exploring the intersection of law and technology through thoughtful analysis, 
              practical tools, and academic research.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
            <Card className="p-8 bg-gradient-to-br from-card to-accent/30 border-0 shadow-elegant hover:shadow-xl transition-all duration-300 hover:border-gold/20 border border-transparent">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-primary/10 to-gold/10 rounded-lg border border-gold/20">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Legal Articles</h3>
              </div>
              <p className="text-muted-foreground text-left leading-relaxed">
                In-depth analysis of contemporary legal issues, case studies, and academic research 
                exploring the evolving landscape of law.
              </p>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-card to-accent/30 border-0 shadow-elegant hover:shadow-xl transition-all duration-300 hover:border-gold/20 border border-transparent">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-primary/10 to-gold/10 rounded-lg border border-gold/20">
                  <Code className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Legal Tools</h3>
              </div>
              <p className="text-muted-foreground text-left leading-relaxed">
                Practical applications and digital tools designed to streamline legal research, 
                case management, and academic workflows.
              </p>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="flex justify-center items-center mt-12">
            <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-gold/30 hover:bg-gold/5 hover:border-gold">
              <Mail className="mr-2 h-5 w-5" />
              Get In Touch
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;