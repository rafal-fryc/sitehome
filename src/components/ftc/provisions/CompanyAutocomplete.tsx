import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";

interface Props {
  companies: string[];
  selectedCompany: string | null;
  onSelect: (company: string | null) => void;
}

export default function CompanyAutocomplete({
  companies,
  selectedCompany,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className={cn(
            "inline-flex items-center gap-1.5 border border-rule px-3 py-1.5 text-sm font-garamond bg-cream hover:bg-gold/10 transition-colors",
            selectedCompany && "bg-primary/10 border-primary/30"
          )}
        >
          <span className="truncate max-w-[160px]">
            {selectedCompany || "Company..."}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="start">
        <Command>
          <CommandInput placeholder="Search company..." />
          <CommandList>
            <CommandEmpty>No company found.</CommandEmpty>
            <CommandGroup>
              {companies.map((company) => (
                <CommandItem
                  key={company}
                  value={company}
                  onSelect={() => {
                    onSelect(
                      company === selectedCompany ? null : company
                    );
                    setOpen(false);
                  }}
                  className="font-garamond"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCompany === company
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {company}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
