import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, Gavel, Search, FileCheck, Calculator, BarChart3, ScrollText, Scale, Laptop } from "lucide-react";

const ProjectsSection = () => {
  const projects = [
    {
      title: "NIST AI RMF Skill",
      description: "A Lawve.ai skill that operationalizes the NIST AI Risk Management Framework, helping teams map, measure, and manage AI risks through structured guidance.",
      technologies: ["Lawve.ai", "NIST AI RMF", "Prompt Engineering"],
      status: "Live",
      icon: Search,
      githubUrl: "https://github.com/rafal-fryc/NIST-AI-RMF-Skill",
      demoUrl: "https://lawve.ai/en/skills/nist-ai-rmf-rafal-fryc"
    },
    {
      title: "GDPR Stop Processing Orders Report",
      description: "A comprehensive analysis report of GDPR processing orders, aggregating data from multiple sources to provide insights into compliance patterns and regulatory trends.",
      technologies: ["Data Analysis", "GDPR Compliance", "Report Generation", "Legal Research"],
      status: "Live",
      icon: FileCheck,
      githubUrl: "#",
      demoUrl: "/GDPRorders"
    },
    {
      title: "IVO Comparison · MN · OH · CA · CT",
      description: "Side-by-side reading of four Independent Verification Organization bills — Minnesota S.F. 4636, Ohio H.B. 628, California S.B. 813, and Connecticut H.B. 5222 § 47 (a 5-IVO capped pilot sunsetting March 31, 2031). Seven mind-map branches, twenty-five matrix dimensions, every cell carrying its statutory citation.",
      technologies: ["Comparative Statutes", "AI Regulation", "Editorial Design"],
      status: "Live",
      icon: Scale,
      githubUrl: "#",
      demoUrl: "/ivo"
    },
    {
      title: "Statute Analysis Guide",
      description: "A comprehensive guide for reading, interpreting, and applying statutes, regulations, and rules. Covers legal hierarchy, interpretation canons, requirement extraction, exemption handling, cross-jurisdictional comparison, and enforcement analysis — with practical checklists for compliance workflows.",
      technologies: ["Statutory Interpretation", "Legal Compliance", "Regulatory Analysis", "Claude Code Skill"],
      status: "Live",
      icon: Gavel,
      githubUrl: "https://github.com/lawvable/awesome-legal-skills/tree/main/skills/statute-analysis-rafal-fryc",
      demoUrl: "#"
    },
    {
      title: "TechRegParser",
      description: "A multi-agent system that extracts requirements from data privacy and technology regulation statutes using Anthropic's Agent SDK. Features anti-hallucination safeguards with verbatim quotes, two-pass verification, and an interactive HTML viewer for filtering and exploring extracted obligations.",
      technologies: ["Anthropic Agent SDK", "Multi-Agent System", "Regulatory Analysis", "Python"],
      status: "Live",
      icon: Calculator,
      githubUrl: "https://github.com/rafal-fryc/TechRegParser",
      demoUrl: "#"
    },
    {
      title: "FTC Enforcement Analytics",
      description: "An interactive dashboard analyzing 285+ FTC enforcement actions across data privacy, consumer protection, COPPA, and more. Explore cases grouped by year, presidential administration, or regulatory category — with violation breakdowns, bar charts, and downloadable case files for each action.",
      technologies: ["React", "TypeScript", "Recharts", "Data Pipeline"],
      status: "Live",
      icon: BarChart3,
      githubUrl: "#",
      demoUrl: "/FTCAnalytics"
    },
    {
      title: "Mike — Local Desktop Edition",
      description: "Downloadable Electron desktop fork of the Mike AI legal platform. Storage moves from Supabase/S3 to a local SQLite database and workspace folder; auth moves from Supabase to a scrypt-hashed password with per-launch HS256 JWT; distribution ships as a Windows NSIS installer bundling LibreOffice for DOCX previews. Only network calls are to your configured Anthropic/Gemini API keys.",
      technologies: ["Electron", "Next.js", "Express", "SQLite", "TypeScript"],
      status: "Live",
      icon: Laptop,
      githubUrl: "https://github.com/LegalQuants/LQmikelocal",
      demoUrl: "#"
    },
    {
      title: "Zwiad Regulatory Monitoring",
      description: "Source-verified regulatory intelligence reports on US privacy, cybersecurity, and AI law developments. Produced by a multi-agent Claude Code pipeline that scans sources, researches findings, and fact-checks before publishing.",
      technologies: ["Claude Code", "Multi-Agent Pipeline", "Regulatory Research"],
      status: "Live",
      icon: ScrollText,
      githubUrl: "https://github.com/rafal-fryc/Zwiad",
      demoUrl: "/reports"
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
    <section className="py-16 px-4 bg-background">
      <div className="container max-w-6xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Technology Projects
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Innovative applications and tools designed to enhance legal practice,
            streamline workflows, and bridge the gap between law and technology.
          </p>
          <div className="border-b border-rule mt-4" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, index) => {
            const IconComponent = project.icon;
            return (
              <div key={index} className="p-8 bg-cream border border-rule border-l-[3px] border-l-primary">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary/10 border border-rule">
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide-label">Technologies</p>
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
                    {project.githubUrl && project.githubUrl !== "#" ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-rule-dark hover:bg-accent hover:border-gold">
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github className="mr-2 h-4 w-4" />
                          Code
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="border-rule-dark"
                      >
                        <Github className="mr-2 h-4 w-4" />
                        Code
                      </Button>
                    )}

                    {project.demoUrl && project.demoUrl !== "#" ? (
                      <Button
                        asChild
                        size="sm"
                        className="bg-primary text-primary-foreground border border-gold hover:bg-primary-light"
                      >
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {project.status === "Live"
                            ? "Try it"
                            : project.status === "Beta"
                              ? "Preview"
                              : "Coming Soon"}
                        </a>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled
                        className="bg-primary text-primary-foreground border border-gold"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {project.status === "Live"
                          ? "Try it"
                          : project.status === "Beta"
                            ? "Preview"
                            : "Coming Soon"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ProjectsSection;
