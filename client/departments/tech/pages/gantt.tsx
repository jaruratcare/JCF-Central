import { useParams, Link } from "wouter";
import {
  useListSprints,
  useListProjectItems,
  useGetProject,
  getListSprintsQueryKey,
  getListProjectItemsQueryKey,
  getGetProjectQueryKey,
} from "@/departments/tech/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ItemTypeIcon, getTypeColor } from "@/departments/tech/components/item-utils";
import {
  addDays,
  differenceInDays,
  format,
  isBefore,
  max,
  min,
  startOfDay,
} from "date-fns";
import { CalendarDays } from "lucide-react";

/* ── colour maps ── */
const SPRINT_STATUS_COLOR: Record<string, string> = {
  active:    "bg-primary",
  planning:  "bg-amber-400",
  completed: "bg-emerald-500",
};

const ITEM_TYPE_BAR: Record<string, string> = {
  epic:  "bg-purple-500",
  story: "bg-blue-500",
  task:  "bg-emerald-500",
  bug:   "bg-red-500",
};

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  todo:        { label: "To Do",       cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  in_progress: { label: "In Progress", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  in_review:   { label: "In Review",   cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  done:        { label: "Done",        cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
};

/* ── helpers ── */
function datePos(date: Date, viewStart: Date, totalDays: number) {
  return (differenceInDays(date, viewStart) / totalDays) * 100;
}

function dateWidth(start: Date, end: Date, viewStart: Date, totalDays: number) {
  const left  = datePos(start, viewStart, totalDays);
  const right = datePos(addDays(end, 1), viewStart, totalDays);
  return { left, width: Math.max(right - left, 0.4) };
}

function itemBarRange(
  item: { dueDate?: string | null },
  sprintStart: Date,
  sprintEnd: Date,
): { start: Date; end: Date; hasOwnDate: boolean; isOverdue: boolean } {
  const today = startOfDay(new Date());
  if (!item.dueDate) return { start: sprintStart, end: sprintEnd, hasOwnDate: false, isOverdue: false };
  const parsed = new Date(item.dueDate);
  if (isNaN(parsed.getTime())) return { start: sprintStart, end: sprintEnd, hasOwnDate: false, isOverdue: false };
  const due = startOfDay(parsed);
  const isOverdue = isBefore(due, today);
  const barEnd = due < sprintStart ? sprintStart : due;
  return { start: sprintStart, end: barEnd, hasOwnDate: true, isOverdue };
}


/* ── component ── */
export default function Gantt() {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>();
  const projectId = parseInt(projectIdStr!);

  const { data: project,  isLoading: loadingProject  } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });
  const { data: sprints,  isLoading: loadingSprints  } = useListSprints(projectId, {
    query: { enabled: !!projectId, queryKey: getListSprintsQueryKey(projectId) },
  });
  const { data: items,    isLoading: loadingItems    } = useListProjectItems(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectItemsQueryKey(projectId) },
  });

  if (loadingSprints || loadingItems || loadingProject) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const sprintsWithDates = (sprints || []).filter((s) => s.startDate && s.endDate);

  if (sprintsWithDates.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gantt Chart</h1>
          <p className="text-muted-foreground">Date-based timeline of sprints and work items.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl border-dashed bg-card/50">
          <CalendarDays className="h-14 w-14 text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No sprints with dates</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-4">
            Create sprints with start and end dates on the Sprints page to see the Gantt chart.
          </p>
          <Link href={`/projects/${projectId}/sprints`} className="text-primary hover:underline text-sm">
            Go to Sprints →
          </Link>
        </div>
      </div>
    );
  }

  /* ── view window ── */
  const allSprintStarts = sprintsWithDates.map((s) => startOfDay(new Date(s.startDate!)));
  const allSprintEnds   = sprintsWithDates.map((s) => startOfDay(new Date(s.endDate!)));
  const extraDates: Date[] = [];
  (items || []).forEach((i) => {
    if (i.dueDate) { const d = startOfDay(new Date(i.dueDate)); if (!isNaN(d.getTime())) extraDates.push(d); }
  });
  if (project?.deadline) {
    const d = startOfDay(new Date(project.deadline));
    if (!isNaN(d.getTime())) extraDates.push(d);
  }

  const allDates  = [...allSprintStarts, ...allSprintEnds, ...extraDates];
  const viewStart = addDays(min(allDates), -2);
  const viewEnd   = addDays(max(allDates),  3);
  const totalDays = differenceInDays(viewEnd, viewStart);

  /* ── weekly ticks ── */
  const ticks: Date[] = [];
  let tickCur = viewStart;
  while (!isBefore(viewEnd, tickCur)) { ticks.push(tickCur); tickCur = addDays(tickCur, 7); }

  const today     = startOfDay(new Date());
  const todayPct  = datePos(today, viewStart, totalDays);
  const showToday = todayPct >= 0 && todayPct <= 100;

  const projectDeadline = project?.deadline ? startOfDay(new Date(project.deadline)) : null;
  const deadlinePct     = projectDeadline ? datePos(projectDeadline, viewStart, totalDays) : null;
  const showDeadline    = deadlinePct !== null && deadlinePct >= 0 && deadlinePct <= 100;

  /* ── shared background grid ── */
  const GridLines = () => (
    <>
      {ticks.map((tick, i) => (
        <div
          key={i}
          className="absolute inset-y-0 border-l border-border/15"
          style={{ left: `${datePos(tick, viewStart, totalDays)}%` }}
        />
      ))}
      {showToday && (
        <div
          className="absolute inset-y-0 border-l-2 border-red-500/50"
          style={{ left: `${todayPct}%` }}
        />
      )}
      {showDeadline && (
        <div
          className="absolute inset-y-0 border-l-2 border-dashed border-violet-500/50"
          style={{ left: `${deadlinePct!}%` }}
        />
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gantt Chart</h1>
        <p className="text-muted-foreground">Date-based timeline of sprints and work items.</p>
      </div>

      <p className="sm:hidden text-xs text-muted-foreground flex items-center gap-1.5">
        <span>← Scroll sideways to see the full timeline →</span>
      </p>

      <div className="border rounded-xl overflow-x-auto bg-card shadow-sm">
        <div className="min-w-[900px]">

          {/* ── Legend ── */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-6 pt-4 pb-3 text-xs text-muted-foreground border-b bg-muted/5">
            {[
              { label: "Active sprint", color: "bg-primary" },
              { label: "Planning",      color: "bg-amber-400" },
              { label: "Completed",     color: "bg-emerald-500" },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm ${l.color}`} /> {l.label}
              </span>
            ))}
            <span className="w-px h-4 bg-border mx-1" />
            {Object.entries(STATUS_CHIP).map(([, v]) => (
              <span key={v.label} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${v.cls}`}>
                {v.label}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-px h-3 bg-red-500" /> Today
              </span>
              {showDeadline && (
                <span className="flex items-center gap-1.5">
                  <span className="w-px h-3 border-l-2 border-dashed border-violet-500" /> Project deadline
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rotate-45 bg-red-500" /> Overdue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rotate-45 bg-slate-400" /> Due date
              </span>
            </span>
          </div>

          {/* ── Main layout ── */}
          <div className="flex overflow-x-auto">

            {/* Left label column */}
            <div className="w-56 flex-shrink-0 border-r bg-muted/10">
              <div className="h-10 border-b px-4 flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Item
              </div>

              {sprintsWithDates.map((sprint) => {
                const sprintItems = (items || []).filter((i) => i.sprintId === sprint.id);
                return (
                  <div key={sprint.id}>
                    <div className="h-10 flex items-center px-4 gap-2 border-b bg-muted/30">
                      <Badge
                        variant="secondary"
                        className={`text-white text-[10px] px-1.5 py-0 ${SPRINT_STATUS_COLOR[sprint.status] || "bg-slate-400"}`}
                      >
                        {sprint.status.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-semibold truncate">{sprint.name}</span>
                    </div>
                    {sprintItems.map((item) => {
                      const chip = STATUS_CHIP[item.status] ?? STATUS_CHIP.todo;
                      return (
                        <div key={item.id} className="h-10 flex items-center px-3 gap-2 border-b hover:bg-muted/20 transition-colors">
                          <ItemTypeIcon type={item.type} className={`w-3.5 h-3.5 flex-shrink-0 ${getTypeColor(item.type).split(" ")[0]}`} />
                          <Link
                            href={`/projects/${projectId}/items/${item.id}`}
                            className="text-xs truncate hover:text-primary transition-colors flex-1 min-w-0"
                            title={item.title}
                          >
                            {item.title}
                          </Link>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${chip.cls}`}>
                            {chip.label}
                          </span>
                        </div>
                      );
                    })}
                    {sprintItems.length === 0 && (
                      <div className="h-10 flex items-center px-4 border-b text-xs text-muted-foreground italic">No items</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right timeline column */}
            <div className="flex-1 relative min-w-0">

              {/* ── Weekly tick header ── */}
              <div className="h-10 border-b relative bg-muted/5">
                {ticks.map((tick, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 flex items-center"
                    style={{ left: `${datePos(tick, viewStart, totalDays)}%` }}
                  >
                    <div className="h-full border-l border-border/30" />
                    <span className="ml-1.5 text-[11px] text-muted-foreground whitespace-nowrap select-none">
                      {format(tick, "MMM d")}
                    </span>
                  </div>
                ))}
                {showToday && (
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-red-500"
                    style={{ left: `${todayPct}%` }}
                  >
                    <span className="absolute top-0.5 left-1 text-[9px] font-bold text-red-500 whitespace-nowrap">Today</span>
                  </div>
                )}
                {showDeadline && (
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-violet-500"
                    style={{ left: `${deadlinePct!}%` }}
                  >
                    <span className="absolute top-0.5 left-1 text-[9px] font-bold text-violet-500 whitespace-nowrap">Deadline</span>
                  </div>
                )}
              </div>

              {/* ── Sprint + item rows ── */}
              {sprintsWithDates.map((sprint) => {
                const sprintItems = (items || []).filter((i) => i.sprintId === sprint.id);
                const sStart = startOfDay(new Date(sprint.startDate!));
                const sEnd   = startOfDay(new Date(sprint.endDate!));
                const { left: sprintLeft, width: sprintWidth } = dateWidth(sStart, sEnd, viewStart, totalDays);
                const barColor = SPRINT_STATUS_COLOR[sprint.status] || "bg-slate-400";
                const sprintEndPct = datePos(addDays(sEnd, 1), viewStart, totalDays);

                return (
                  <div key={sprint.id}>
                    {/* Sprint bar row */}
                    <div className="h-10 border-b relative bg-muted/10">
                      <GridLines />
                      {/* Sprint bar */}
                      <div
                        className={`absolute top-2 bottom-2 rounded-md ${barColor} opacity-85 flex items-center px-2 overflow-hidden`}
                        style={{ left: `${sprintLeft}%`, width: `${sprintWidth}%` }}
                        title={`${sprint.name}: ${format(sStart, "MMM d, yyyy")} – ${format(sEnd, "MMM d, yyyy")}`}
                      >
                        <span className="text-white text-xs font-medium truncate whitespace-nowrap">
                          {sprint.name} &nbsp;·&nbsp; {format(sStart, "MMM d")}–{format(sEnd, "MMM d")}
                        </span>
                      </div>
                      {/* Sprint end diamond + date label */}
                      <div
                        className="absolute top-0 bottom-0 flex items-center gap-1 pointer-events-none"
                        style={{ left: `${sprintEndPct}%` }}
                        title={`Sprint ends ${format(sEnd, "MMM d, yyyy")}`}
                      >
                        <div className="w-2 h-2 rotate-45 bg-white border-2 border-slate-500 shadow-sm flex-shrink-0" style={{ transform: "rotate(45deg)" }} />
                        <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">{format(sEnd, "MMM d")}</span>
                      </div>
                    </div>

                    {/* Item rows */}
                    {sprintItems.map((item) => {
                      const itemBarColor = ITEM_TYPE_BAR[item.type] || "bg-slate-400";
                      const { start: iStart, end: iEnd, hasOwnDate, isOverdue } = itemBarRange(item, sStart, sEnd);
                      const { left: itemLeft, width: itemWidth } = dateWidth(iStart, iEnd, viewStart, totalDays);

                      const due = hasOwnDate && item.dueDate ? startOfDay(new Date(item.dueDate)) : null;
                      const dueDateMarkerPct = due ? datePos(addDays(due, 1), viewStart, totalDays) : null;
                      const dueDateLabel = due ? format(due, "MMM d") : null;

                      const barTitle = hasOwnDate && due
                        ? `${item.title} — due ${format(due, "MMM d, yyyy")}${isOverdue ? " (OVERDUE)" : ""}`
                        : `${item.title} — spans full sprint (no due date)`;

                      return (
                        <div key={item.id} className="h-10 border-b relative hover:bg-muted/10 transition-colors">
                          <GridLines />

                          {/* Item bar */}
                          <div
                            className={`absolute top-2.5 bottom-2.5 rounded ${itemBarColor} flex items-center px-1.5 overflow-hidden
                              ${hasOwnDate ? "opacity-85" : "opacity-30"}
                              ${item.status === "done" ? "opacity-50" : ""}`}
                            style={{ left: `${itemLeft}%`, width: `${itemWidth}%` }}
                            title={barTitle}
                          >
                            <span className="text-white text-[10px] truncate whitespace-nowrap select-none">
                              {item.title}
                            </span>
                            {item.status === "done" && (
                              <span className="ml-1 text-white/80 text-[10px] flex-shrink-0">✓</span>
                            )}
                          </div>

                          {/* Due-date marker: diamond + exact date label */}
                          {dueDateMarkerPct !== null && dueDateLabel && (
                            <div
                              className="absolute top-0 bottom-0 flex items-center gap-1 pointer-events-none"
                              style={{ left: `${dueDateMarkerPct}%` }}
                              title={barTitle}
                            >
                              {/* Vertical rule through full row height */}
                              <div className={`absolute inset-y-0 w-px ${isOverdue ? "bg-red-500/70" : "bg-slate-400/60"}`} />
                              {/* Diamond */}
                              <div
                                className={`w-2 h-2 rotate-45 flex-shrink-0 shadow-sm ${
                                  isOverdue
                                    ? "bg-red-500 border border-red-700"
                                    : "bg-slate-500 border border-slate-700"
                                }`}
                              />
                              {/* Date label */}
                              <span
                                className={`text-[10px] font-semibold whitespace-nowrap ${
                                  isOverdue ? "text-red-500" : "text-slate-500"
                                }`}
                              >
                                {dueDateLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {sprintItems.length === 0 && (
                      <div className="h-10 border-b relative"><GridLines /></div>
                    )}
                  </div>
                );
              })}

              {/* Project deadline full-height overlay */}
              {showDeadline && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-dashed border-violet-500/60 pointer-events-none"
                  style={{ left: `${deadlinePct!}%` }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
