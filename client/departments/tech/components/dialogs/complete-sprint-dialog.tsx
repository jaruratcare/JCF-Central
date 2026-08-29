import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItemTypeIcon, getTypeColor } from "@/departments/tech/components/item-utils";
import { CheckCircle2 } from "lucide-react";
import type { WorkItemType } from "@/departments/tech/lib/api-client";

export type Disposition = "backlog" | `sprint-${number}`;

export interface IncompleteItem {
  id: number;
  type: WorkItemType;
  title: string;
  status: string;
  itemKey: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: { id: number; name: string };
  incompleteItems: IncompleteItem[];
  nextSprints: Array<{ id: number; name: string }>;
  onConfirm: (decisions: Record<number, Disposition>) => void;
  isPending: boolean;
}

export function CompleteSprintDialog({
  open, onOpenChange, sprint, incompleteItems, nextSprints, onConfirm, isPending,
}: Props) {
  const defaultDisposition: Disposition =
    nextSprints.length > 0 ? `sprint-${nextSprints[0].id}` : "backlog";

  const [decisions, setDecisions] = useState<Record<number, Disposition>>({});

  const getDecision = (id: number): Disposition => decisions[id] ?? defaultDisposition;

  const setAll = (disposition: Disposition) => {
    const next: Record<number, Disposition> = {};
    incompleteItems.forEach((i) => { next[i.id] = disposition; });
    setDecisions(next);
  };

  const handleConfirm = () => {
    const resolved: Record<number, Disposition> = {};
    incompleteItems.forEach((item) => { resolved[item.id] = getDecision(item.id); });
    onConfirm(resolved);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Complete &ldquo;{sprint.name}&rdquo;</DialogTitle>
          <DialogDescription>
            {incompleteItems.length === 0
              ? "All items are done — ready to complete this sprint."
              : `${incompleteItems.length} item${incompleteItems.length !== 1 ? "s are" : " is"} not done. Choose what to do with each one before closing.`}
          </DialogDescription>
        </DialogHeader>

        {incompleteItems.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center gap-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm text-muted-foreground">Great work — all items finished!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Batch controls */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Move all to:
              </span>
              <div className="flex gap-2 flex-wrap">
                {nextSprints.map((s) => (
                  <Button
                    key={s.id}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setAll(`sprint-${s.id}`)}
                  >
                    → {s.name}
                  </Button>
                ))}
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAll("backlog")}>
                  → Backlog
                </Button>
              </div>
            </div>

            {/* Per-item rows */}
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {incompleteItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 border rounded-lg hover:bg-muted/20 transition-colors"
                >
                  <ItemTypeIcon
                    type={item.type}
                    className={`w-4 h-4 flex-shrink-0 ${getTypeColor(item.type).split(" ")[0]}`}
                  />
                  <span className="text-[11px] font-mono text-muted-foreground w-16 flex-shrink-0">
                    {item.itemKey}
                  </span>
                  <span className="flex-1 text-sm font-medium truncate">{item.title}</span>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0 capitalize">
                    {item.status.replace("_", " ")}
                  </Badge>
                  <Select
                    value={getDecision(item.id)}
                    onValueChange={(v) =>
                      setDecisions((d) => ({ ...d, [item.id]: v as Disposition }))
                    }
                  >
                    <SelectTrigger className="w-44 h-7 text-xs flex-shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {nextSprints.map((s) => (
                        <SelectItem key={s.id} value={`sprint-${s.id}`} className="text-xs">
                          → {s.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="backlog" className="text-xs">
                        → Backlog (no sprint)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Completing…" : "Complete Sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
