import { Button } from "@repo/ui/components/ui/Button";
import { LayoutGrid, List } from "lucide-react";

export function ViewToggle({
  view,
  onViewChange,
}: {
  view: "table" | "card";
  onViewChange: (v: "table" | "card") => void;
}) {
  return (
    <div className="flex items-center rounded-md border p-1 border-border bg-muted/40 w-fit">
      <Button
        variant={view === "table" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className="px-3"
      >
        <List className="h-4 w-4 mr-2" />
        Table
      </Button>
      <Button
        variant={view === "card" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("card")}
        className="px-3"
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Card
      </Button>
    </div>
  );
}
