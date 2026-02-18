import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Header = ({ activeSection, onSectionChange }: HeaderProps) => {
  const navigation = [
    { name: 'Home', id: 'home' },
    { name: 'Articles', id: 'articles' },
    { name: 'Projects', id: 'projects' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-primary border-b-[3px] border-gold">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gold/20 border border-gold flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">R</span>
          </div>
          <span className="font-semibold text-lg text-primary-foreground">Rafal's Portfolio</span>
        </div>

        <nav className="flex items-center space-x-1">
          {navigation.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 relative",
                activeSection === item.id && "text-primary-foreground border-b-2 border-gold"
              )}
            >
              {item.name}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
