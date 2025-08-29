import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, Gavel, Search, FileCheck, Calculator } from "lucide-react";

const ProjectsSection = () => {
  const projects = [
    {
      title: "Compliance Checklist Generator",
      description: "Stay on top of dozens of laws with a customizable checklist generator, allowing you to discern the requirements with a few clicks.",
      technologies: ["Vite", "TypeScript", "OpenAI Codex"],
      status: "In Development",
      icon: Search,
      githubUrl: "https://github.com/rafal-fryc/law-list-buddy-34",
      demoUrl: "https://www.rafalsportfolio.me/checklists"
    },
    {
      title: "Contract Analysis Dashboard",
      description: "A comprehensive tool for analyzing legal contracts, identifying key clauses, potential risks, and ensuring compliance with standard legal frameworks.",
      technologies: ["Python", "Natural Language Processing", "Flask", "PDF Processing"],
      status: "Beta",
      icon: FileCheck,
      githubUrl: "#",
      demoUrl: "#"
    },
    {
      title: "Case Law Citation Generator",
      description: "Automated citation generation tool that formats legal citations according to various style guides including Bluebook, APA, and jurisdiction-specific formats.",
      technologies: ["JavaScript", "Citation APIs", "Legal Standards", "Web Scraping"],
      status: "Live",
      icon: Gavel,
      githubUrl: "#",
      demoUrl: "#"
    },
    {
      title: "Legal Fee Calculator",
      description: "A transparent calculator for estimating legal fees based on case complexity, jurisdiction, and practice area, helping clients understand potential costs.",
      technologies: ["Vue.js", "Data Analytics", "Legal Benchmarks", "API Integration"],
      status: "Planning",
      icon: Calculator,
      githubUrl: "#",
      demoUrl: "#"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Live": return "bg-green-500/10 text-green-700 border-green-500/20";
      case "Beta": return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "In Development": return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "Planning": return "bg-gray-500/10 text-gray-700 border-gray-500/20";
      default: return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-accent/10">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Technology Projects
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Innovative applications and tools designed to enhance legal practice, 
            streamline workflows, and bridge the gap between law and technology.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, index) => {
            const IconComponent = project.icon;
            return (
              <Card key={index} className="p-8 bg-gradient-to-br from-card to-accent/30 border-0 shadow-soft hover:shadow-elegant transition-all duration-300 hover:border-gold/20 border border-transparent">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-br from-primary/10 to-gold/10 rounded-lg border border-gold/20">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-foreground">{project.title}</h3>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>

                  {/* Technologies */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Technologies:</p>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={project.status === "Planning"}
                    >
                      <Github className="mr-2 h-4 w-4" />
                      Code
                    </Button>
                    <Button 
                      size="sm"
                      disabled={!["Live", "Beta"].includes(project.status)}
                      className="bg-gradient-to-r from-primary to-gold hover:from-primary-dark hover:to-gold-dark disabled:from-muted disabled:to-muted shadow-gold"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {project.status === "Live" ? "Try it" : project.status === "Beta" ? "Preview" : "Coming Soon"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-gold/30 hover:bg-gold/5 hover:border-gold">
            View All Projects
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
