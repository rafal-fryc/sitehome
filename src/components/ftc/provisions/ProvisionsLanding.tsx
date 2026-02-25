import type { ProvisionsManifest } from "@/types/ftc";

interface Props {
  manifest: ProvisionsManifest;
}

export default function ProvisionsLanding({ manifest }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <h2 className="text-3xl font-garamond font-semibold text-primary mb-3">
        Provisions Library
      </h2>

      <p className="text-lg text-muted-foreground font-garamond max-w-xl mb-6">
        Browse{" "}
        <span className="font-semibold text-foreground">
          {manifest.total_provisions.toLocaleString()}
        </span>{" "}
        provisions from{" "}
        <span className="font-semibold text-foreground">
          {manifest.total_cases.toLocaleString()}
        </span>{" "}
        FTC consent orders
      </p>

      <p className="text-base text-muted-foreground font-garamond max-w-2xl mb-8">
        Select a topic from the sidebar to view provisions organized by
        statutory authority, practice area, or remedy type.
      </p>

      <div className="border border-rule bg-cream/50 p-4 max-w-xl">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Note:</span> Provision
          text is extracted from consent order PDFs using automated processing
          and should be verified against the original source documents available
          on the FTC website.
        </p>
      </div>
    </div>
  );
}
