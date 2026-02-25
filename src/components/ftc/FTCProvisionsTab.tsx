export default function FTCProvisionsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <h2 className="text-3xl font-garamond font-semibold text-primary mb-4">
        Provisions Library
      </h2>
      <p className="text-lg text-muted-foreground font-garamond max-w-xl mb-6">
        Coming Soon
      </p>
      <p className="text-base text-muted-foreground font-garamond max-w-2xl mb-8">
        Browse FTC consent order provisions by statutory topic, practice area,
        and remedy type.
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
