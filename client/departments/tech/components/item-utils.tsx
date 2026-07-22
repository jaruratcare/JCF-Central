import { Layers, BookOpen, CheckSquare, Bug } from "lucide-react";
import { WorkItemType, WorkItemPriority, ProjectMember } from "@/departments/tech/lib/api-client";

/** Resolves a work item's assigneeId to the matching project member's display name, if any. */
export const resolveAssigneeName = (
  members: ProjectMember[] | undefined,
  assigneeId?: string | null,
): string | undefined => {
  if (!assigneeId || !members) return undefined;
  const member = members.find((m) => m.userId === assigneeId);
  return member?.name ?? member?.email;
};

export const ItemTypeIcon = ({ type, className }: { type: WorkItemType, className?: string }) => {
  switch (type) {
    case "epic": return <Layers className={className} />;
    case "story": return <BookOpen className={className} />;
    case "task": return <CheckSquare className={className} />;
    case "bug": return <Bug className={className} />;
    default: return <CheckSquare className={className} />;
  }
};

export const getTypeColor = (type: WorkItemType) => {
  switch (type) {
    case "epic": return "text-purple-500 bg-purple-500/10 border-purple-500/20";
    case "story": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    case "task": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    case "bug": return "text-red-500 bg-red-500/10 border-red-500/20";
    default: return "text-gray-500 bg-gray-500/10 border-gray-500/20";
  }
};

export const getPriorityColor = (priority: WorkItemPriority) => {
  switch (priority) {
    case "critical": return "text-red-600 bg-red-600/10 border-red-600/20";
    case "high": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    case "medium": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "low": return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    default: return "text-slate-500 bg-slate-500/10 border-slate-500/20";
  }
};
