import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemTypeIcon } from "@/departments/tech/components/item-utils";
import type { Project, Sprint, WorkItem } from "@/departments/tech/lib/api-client";

/* ── colour maps (kept in sync with gantt.tsx) ── */
const ITEM_TYPE_BAR: Record<string, string> = {
  epic: "bg-purple-500",
  story: "bg-blue-500",
  task: "bg-emerald-500",
  bug: "bg-red-500",
};

const SPRINT_STATUS_COLOR: Record<string, string> = {
  active: "bg-primary",
  planning: "bg-amber-400",
  completed: "bg-emerald-500",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDay(value?: string | null): Date | null {
  if (!value) return null;
  const d = startOfDay(new Date(value));
  return isNaN(d.getTime()) ? null : d;
}

interface CalendarViewProps {
  projectId: number;
  project?: Project;
  sprints?: Sprint[];
  items?: WorkItem[];
}

export function CalendarView({ projectId, project, sprints, items }: CalendarViewProps) {
  const deadline = parseDay(project?.deadline);

  const sprintRanges = useMemo(
    () =>
      (sprints || [])
        .map((s) => ({ sprint: s, start: parseDay(s.startDate), end: parseDay(s.endDate) }))
        .filter((s): s is { sprint: Sprint; start: Date; end: Date } => !!s.start && !!s.end),
    [sprints],
  );

  const datedItems = useMemo(
    () =>
      (items || [])
        .map((i) => ({ item: i, due: parseDay(i.dueDate) }))
        .filter((i): i is { item: WorkItem; due: Date } => !!i.due),
    [items],
  );

  // Default to the current month if it holds any data, otherwise the earliest
  // relevant date so the user doesn't land on an empty month.
  const defaultMonth = useMemo(() => {
    const today = startOfDay(new Date());
    const all = [
      ...datedItems.map((d) => d.due),
      ...sprintRanges.map((s) => s.start),
      ...sprintRanges.map((s) => s.end),
      ...(deadline ? [deadline] : []),
    ];
    if (all.length === 0) return today;
    const inThisMonth = all.some((d) => isSameMonth(d, today));
    if (inThisMonth) return today;
    return all.reduce((min, d) => (d < min ? d : min), all[0]);
  }, [datedItems, sprintRanges, deadline]);

  const [currentMonth, setCurrentMonth] = useState<Date>(defaultMonth);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const today = startOfDay(new Date());

  return (
    <div className="border rounded-xl bg-card shadow-sm overflow-x-auto">
      <div className="min-w-[760px]">
        {/* ── Month navigation ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-b">
          <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(startOfMonth(today))}>
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-6 py-2.5 text-xs text-muted-foreground border-b bg-muted/5">
          {[
            { label: "Epic", color: "bg-purple-500" },
            { label: "Story", color: "bg-blue-500" },
            { label: "Task", color: "bg-emerald-500" },
            { label: "Bug", color: "bg-red-500" },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${l.color}`} /> {l.label}
            </span>
          ))}
          <span className="w-px h-4 bg-border mx-1" />
          {[
            { label: "Active sprint", color: "bg-primary" },
            { label: "Planning", color: "bg-amber-400" },
            { label: "Completed", color: "bg-emerald-500" },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${l.color}`} /> {l.label}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" /> Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rotate-45 border-2 border-dashed border-violet-500" /> Deadline
            </span>
          </span>
        </div>

        {/* ── Weekday header ── */}
        <div className="grid grid-cols-7 border-b bg-muted/10">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
              {d}
            </div>
          ))}
        </div>

        {/* ── Day grid ── */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const inMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, today);
            const isDeadline = !!deadline && isSameDay(day, deadline);

            const dayItems = datedItems.filter((d) => isSameDay(d.due, day));
            const coveringSprints = sprintRanges.filter((s) =>
              isWithinInterval(day, { start: s.start, end: s.end }),
            );

            const visibleItems = dayItems.slice(0, 3);
            const overflow = dayItems.length - visibleItems.length;

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[112px] border-b border-r p-1.5 flex flex-col gap-1 ${
                  inMonth ? "bg-card" : "bg-muted/20 text-muted-foreground/50"
                } ${isDeadline ? "ring-2 ring-inset ring-violet-500/50" : ""}`}
              >
                {/* Date number + deadline marker */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full ${
                      isToday ? "bg-red-500 text-white" : inMonth ? "" : "opacity-60"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {isDeadline && (
                    <span className="text-[9px] font-bold text-violet-500 uppercase tracking-wide">Deadline</span>
                  )}
                </div>

                {/* Sprint bands — label once per week row / sprint start */}
                {coveringSprints.map(({ sprint, start }) => {
                  const showLabel = isSameDay(day, start) || day.getDay() === 0;
                  return (
                    <div
                      key={sprint.id}
                      className={`h-4 rounded-sm px-1 flex items-center overflow-hidden ${
                        SPRINT_STATUS_COLOR[sprint.status] || "bg-slate-400"
                      } opacity-85`}
                      title={`${sprint.name}: ${format(start, "MMM d")} – ${format(
                        parseDay(sprint.endDate) as Date,
                        "MMM d",
                      )}`}
                    >
                      {showLabel && (
                        <span className="text-white text-[9px] font-medium truncate whitespace-nowrap">
                          {sprint.name}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Items due this day */}
                {visibleItems.map(({ item }) => (
                  <Link
                    key={item.id}
                    href={`/projects/${projectId}/items/${item.id}`}
                    className={`group flex items-center gap-1 rounded px-1 py-0.5 ${
                      ITEM_TYPE_BAR[item.type] || "bg-slate-400"
                    } ${item.status === "done" ? "opacity-50" : "opacity-90 hover:opacity-100"} transition-opacity`}
                    title={`${item.title} — due ${format(day, "MMM d, yyyy")}`}
                  >
                    <ItemTypeIcon type={item.type} className="w-2.5 h-2.5 flex-shrink-0 text-white" />
                    <span className="text-white text-[10px] truncate whitespace-nowrap">{item.title}</span>
                    {item.status === "done" && <span className="ml-auto text-white/80 text-[9px]">✓</span>}
                  </Link>
                ))}

                {overflow > 0 && (
                  <span className="text-[10px] text-muted-foreground pl-1">+{overflow} more</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
