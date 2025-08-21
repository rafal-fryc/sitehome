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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-gold"></div>
          <span className="font-semibold text-lg">Rafal's Portfolio</span>
        </div>
        
        <nav className="flex items-center space-x-1">
          {navigation.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              onClick={() => onSectionChange(item.id)}
              className="relative"
            >
              {item.name}
              {activeSection === item.id && (
                <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 bg-gradient-to-r from-primary-light to-gold" />
              )}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;