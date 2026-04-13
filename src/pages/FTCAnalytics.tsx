import FTCHeader from "@/components/ftc/FTCHeader";
import FTCTabShell from "@/components/ftc/FTCTabShell";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function FTCAnalytics() {
  useDocumentTitle("FTC Enforcement Provisions Library | Rafal's Portfolio");
  return (
    <div className="min-h-screen bg-background">
      <FTCHeader />
      <FTCTabShell />
    </div>
  );
}
