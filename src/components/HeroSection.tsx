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
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary-dark via-primary to-primary-light bg-clip-text text-transparent">
                Law Student
              </h1>
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
                Portfolio & Insights
              </h2>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Exploring the intersection of law and technology through thoughtful analysis, 
              practical tools, and academic research.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
            <Card className="p-8 bg-gradient-to-br from-card to-accent/30 border-0 shadow-elegant hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Legal Articles</h3>
              </div>
              <p className="text-muted-foreground text-left leading-relaxed">
                In-depth analysis of contemporary legal issues, case studies, and academic research 
                exploring the evolving landscape of law.
              </p>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-card to-accent/30 border-0 shadow-elegant hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-lg px-8 py-3">
              <Scale className="mr-2 h-5 w-5" />
              Explore My Work
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
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