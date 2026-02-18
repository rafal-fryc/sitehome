import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GroupingMode } from "@/types/ftc";

interface Props {
  mode: GroupingMode;
  onModeChange: (mode: GroupingMode) => void;
}

export default function FTCGroupingSelector({ mode, onModeChange }: Props) {
  return (
    <Tabs
      value={mode}
      onValueChange={(v) => onModeChange(v as GroupingMode)}
    >
      <TabsList className="w-full md:w-auto">
        <TabsTrigger value="year">By Year</TabsTrigger>
        <TabsTrigger value="administration">By Administration</TabsTrigger>
        <TabsTrigger value="category">By Category</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
