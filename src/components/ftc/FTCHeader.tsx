import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function FTCHeader() {
  return (
    <header className="py-8 px-4 bg-primary border-b-[3px] border-gold text-primary-foreground">
      <div className="container max-w-6xl mx-auto">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-4 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portfolio
          </Link>
        </Button>
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          FTC Enforcement Actions
        </h1>
        <p className="text-xl text-primary-foreground/80 max-w-3xl">
          Interactive analysis of Federal Trade Commission enforcement actions in
          data privacy and consumer protection — spanning multiple
          administrations and regulatory categories.
        </p>
      </div>
    </header>
  );
}
