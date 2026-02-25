import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  label: string;
}

interface Props {
  sections: Section[];
  className?: string;
}

export default function FTCSectionSidebar({ sections, className }: Props) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className={cn(
          "hidden lg:block sticky top-24 w-48 shrink-0 self-start",
          className
        )}
      >
        <ul className="space-y-1 border-l-2 border-rule">
          {sections.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => scrollTo(s.id)}
                className={cn(
                  "block w-full text-left text-sm font-garamond pl-4 py-1.5 border-l-2 -ml-[2px] transition-colors",
                  activeSection === s.id
                    ? "border-l-gold text-primary font-semibold"
                    : "border-l-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile/tablet horizontal bar */}
      <nav className="lg:hidden sticky top-0 z-10 bg-background border-b border-rule overflow-x-auto">
        <div className="flex gap-4 px-4 py-2 min-w-max">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={cn(
                "text-sm font-garamond whitespace-nowrap px-2 py-1",
                activeSection === s.id
                  ? "text-primary font-semibold border-b-2 border-gold"
                  : "text-muted-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
