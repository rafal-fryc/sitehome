import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Code, Scale, Mail } from "lucide-react";

const HeroSection = () => {
  const [showEmail, setShowEmail] = useState(false);

  return (
    <section className="py-20 px-4 bg-background">
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
            <div className="p-8 bg-cream border border-rule border-l-[3px] border-l-primary">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-primary/10 border border-rule">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Articles</h3>
              </div>
              <p className="text-muted-foreground text-left leading-relaxed">
                In-depth analysis of contemporary legal issues, case studies, and academic research
                exploring the evolving landscape of law.
              </p>
            </div>

            <div className="p-8 bg-cream border border-rule border-l-[3px] border-l-primary">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-primary/10 border border-rule">
                  <Code className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Projects</h3>
              </div>
              <p className="text-muted-foreground text-left leading-relaxed">
                Practical applications and digital tools designed to streamline legal research,
                case management, and academic workflows.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="flex flex-col items-center justify-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3 border-rule-dark hover:bg-accent hover:border-gold"
              onClick={() => setShowEmail(true)}
            >
              <Mail className="mr-2 h-5 w-5" />
              Get In Touch
            </Button>
            {showEmail && (
              <a
                href="mailto:rafstanfryc@gmail.com"
                className="mt-4 text-lg text-primary hover:underline"
              >
                rafstanfryc@gmail.com
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
