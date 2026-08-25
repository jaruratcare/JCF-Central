import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BellRing, CalendarDays, CheckCircle2, CircleDot, Clock3, Flag, Megaphone, Pencil, Plus, Search, ShieldAlert, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListProjects, useListUsers } from "@/departments/tech/lib/api-client";
import { announcementsKey, useCreateAnnouncement, useDeleteAnnouncement, useListAnnouncements, useUpdateAnnouncement, type Announcement } from "@/departments/tech/lib/announcements";
import { useListBlockers } from "@/departments/tech/lib/blockers";
import { useListMilestones } from "@/departments/tech/lib/milestones";
import { useListMemberProfiles } from "@/departments/tech/lib/member-profiles";
import { useListConversionReminders } from "@/departments/tech/lib/conversion-reminders";
import { useOrg } from "@/departments/tech/hooks/use-org";
import { useToast } from "@/hooks/use-toast";

type Priority = "critical" | "high" | "medium" | "low";
type Notice = Announcement & { author: string; date: string };

const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T00:00:00`)) : "Not set";
const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
const priorityClass = (value: string) => ({ critical: "bg-red-100 text-red-800", high: "bg-orange-100 text-orange-800", medium: "bg-sky-100 text-sky-800", low: "bg-slate-100 text-slate-700" })[value] ?? "bg-slate-100 text-slate-700";
const statusClass = (value: string) => value === "active" ? "bg-emerald-100 text-emerald-800" : value === "on_leave" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700";
const neutralStatusClass = (value?: string | null) => ({ done: "bg-emerald-100 text-emerald-800", completed: "bg-emerald-100 text-emerald-800", resolved: "bg-emerald-100 text-emerald-800", sent: "bg-emerald-100 text-emerald-800", in_progress: "bg-sky-100 text-sky-800", planned: "bg-sky-100 text-sky-800", blocked: "bg-red-100 text-red-800", at_risk: "bg-red-100 text-red-800" } as Record<string, string>)[value ?? ""] ?? "bg-slate-100 text-slate-700";

export default function OperationsDashboard() {
  const { data: apiProjects, isLoading: loadingProjects, isError: errorProjects } = useListProjects();
  const { data: apiUsers, isLoading: loadingUsers, isError: errorUsers } = useListUsers();
  const { data: apiNotices, isLoading: loadingNotices, isError: errorNotices } = useListAnnouncements();
  const { data: apiBlockers, isLoading: loadingBlockers, isError: errorBlockers } = useListBlockers();
  const { data: apiMilestones, isLoading: loadingMilestones, isError: errorMilestones } = useListMilestones();
  const { data: apiMemberProfiles, isLoading: loadingProfiles, isError: errorProfiles } = useListMemberProfiles();
  const { data: apiReminders, isLoading: loadingReminders, isError: errorReminders } = useListConversionReminders();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const { isMember, isCeoOffice } = useOrg();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const queryClient = useQueryClient();
  const canManageNotices = isCeoOffice || isMember === false;
  const notices: Notice[] = (apiNotices ?? []).map((notice) => ({ ...notice, author: "Tech Pod Lead", date: formatDate(notice.createdAt) }));

  const projects = (apiProjects ?? []).map((project) => ({ ...project, status: String(project.status), priority: (project.priority ?? "medium") as Priority }));
  const members = apiUsers ?? [];
  const profileByUserId = useMemo(() => new Map((apiMemberProfiles ?? []).map((profile) => [profile.userId, profile])), [apiMemberProfiles]);
  const activeMembers = members.filter((member) => member.status === "active").length;
  const activeProjects = projects.filter((project) => project.status === "active").length;
  const completedProjects = projects.filter((project) => project.status === "signed_off").length;
  const dueSoon = projects.filter((project) => project.deadline && new Date(project.deadline).getTime() < Date.now() + 14 * 86400000 && project.status !== "signed_off").length;
  const priorityCounts = useMemo(() => ["critical", "high", "medium", "low"].map((priority) => ({ priority, count: projects.filter((project) => project.priority === priority).length })), [projects]);
  const filteredMembers = members.filter((member) => `${member.name} Tech member`.toLowerCase().includes(memberSearch.toLowerCase().trim()));

  const openBlockers = (apiBlockers ?? []).filter((blocker) => blocker.status !== "resolved" && blocker.status !== "closed");
  const criticalBlockers = openBlockers.filter((blocker) => blocker.severity === "critical").length;
  const upcomingMilestones = useMemo(() => (apiMilestones ?? [])
    .filter((milestone) => milestone.status !== "done" && milestone.status !== "completed")
    .slice()
    .sort((a, b) => String(a.milestoneDate).localeCompare(String(b.milestoneDate))), [apiMilestones]);
  const pendingReminders = useMemo(() => (apiReminders ?? [])
    .filter((reminder) => reminder.status !== "sent" && reminder.status !== "completed")
    .slice()
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate))), [apiReminders]);
  const usersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);

  const addNotice = () => {
    if (!noticeTitle.trim() || !noticeBody.trim()) return;
    const data = { title: noticeTitle.trim(), body: noticeBody.trim() };
    const mutationOptions = {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: announcementsKey });
        toast({ title: editingNotice ? "Notice updated" : "Notice published", description: "The Tech department notice board is up to date." });
        setEditingNotice(null); setNoticeTitle(""); setNoticeBody(""); setNoticeOpen(false);
      },
      onError: (error: any) => toast({ title: editingNotice ? "Notice update failed" : "Notice publication failed", description: error?.message ?? "Please try again.", variant: "destructive" }),
    };
    if (editingNotice?.id) updateAnnouncement.mutate({ id: editingNotice.id, data }, mutationOptions);
    else createAnnouncement.mutate(data, mutationOptions);
  };

  const openNoticeEditor = (notice?: Notice) => {
    setEditingNotice(notice ?? null);
    setNoticeTitle(notice?.title ?? "");
    setNoticeBody(notice?.body ?? "");
    setNoticeOpen(true);
  };

  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Tech / department pulse</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Delivery control room</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">A live read on project health, member availability, and the dates that need attention.</p></div>
      {canManageNotices && <Button onClick={() => openNoticeEditor()} className="gap-2"><Plus className="h-4 w-4" />Add notice</Button>}
    </header>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {[
        { label: "Active members", value: activeMembers, detail: "Available now", icon: Users, color: "text-emerald-600" },
        { label: "On leave", value: members.filter((member) => member.status === "on_leave").length, detail: "Track return dates", icon: Clock3, color: "text-amber-600" },
        { label: "Projects delivered", value: completedProjects, detail: `${activeProjects} currently in flight`, icon: CheckCircle2, color: "text-sky-600" },
        { label: "Deadlines in 14 days", value: dueSoon, detail: "Prioritise owner follow-up", icon: CalendarDays, color: "text-amber-600" },
        { label: "Open blockers", value: openBlockers.length, detail: criticalBlockers ? `${criticalBlockers} critical` : openBlockers.length ? "None critical" : "No open blockers", icon: ShieldAlert, color: "text-red-600" },
      ].map(({ label, value, detail, icon: Icon, color }) => <Card key={label} className="xl:col-span-1"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></div><Icon className={`h-5 w-5 ${color}`} /></div><p className="mt-2 text-xs text-muted-foreground">{detail}</p></CardContent></Card>)}
    </div>

    <Tabs value={tab} onValueChange={setTab}><div className="overflow-x-auto pb-1"><TabsList className="h-auto min-w-max gap-1 p-1"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="people">People & leave</TabsTrigger><TabsTrigger value="projects">Projects & dates</TabsTrigger><TabsTrigger value="calendar">Calendar</TabsTrigger><TabsTrigger value="notices">Notice board</TabsTrigger></TabsList></div>
      <TabsContent value="overview" className="mt-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card><CardHeader><CardTitle>Delivery trend</CardTitle><CardDescription>Project completion across the current planning window.</CardDescription></CardHeader><CardContent>{loadingProjects ? <p className="py-8 text-center text-sm text-muted-foreground">Loading projects…</p> : errorProjects ? <p className="py-8 text-center text-sm text-destructive">Couldn't load projects.</p> : <><div className="flex h-48 items-end gap-3 border-b pt-8">{[{ month: "May", total: 1, done: 1 }, { month: "Jun", total: 2, done: 1 }, { month: "Jul", total: 3, done: 1 }, { month: "Aug", total: projects.length, done: completedProjects }].map((item) => <div className="flex flex-1 flex-col items-center gap-2" key={item.month}><div className="flex h-32 w-full max-w-16 items-end gap-1"><div className="w-1/2 rounded-t bg-slate-200" style={{ height: `${Math.max(18, item.total / Math.max(projects.length, 1) * 100)}%` }} /><div className="w-1/2 rounded-t bg-primary" style={{ height: `${Math.max(18, item.done / Math.max(projects.length, 1) * 100)}%` }} /></div><span className="text-xs text-muted-foreground">{item.month}</span></div>)}</div><div className="mt-4 flex gap-5 text-xs text-muted-foreground"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-200" />Planned</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />Completed</span></div></>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Priority mix</CardTitle><CardDescription>Where delivery risk is concentrated.</CardDescription></CardHeader><CardContent className="space-y-4">{projects.length === 0 && !loadingProjects ? <p className="py-4 text-center text-sm text-muted-foreground">No projects yet.</p> : priorityCounts.map(({ priority, count }) => <div key={priority}><div className="mb-1 flex justify-between text-sm"><span>{formatLabel(priority)}</span><span className="font-semibold">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${priority === "critical" ? "bg-red-500" : priority === "high" ? "bg-orange-500" : priority === "medium" ? "bg-sky-500" : "bg-slate-400"}`} style={{ width: `${Math.max(count / Math.max(projects.length, 1) * 100, count ? 8 : 0)}%` }} /></div></div>)}</CardContent></Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Next deadlines</CardTitle><CardDescription>Projects needing a date or owner conversation.</CardDescription></CardHeader><CardContent className="space-y-3">{loadingProjects ? <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p> : errorProjects ? <p className="py-8 text-center text-sm text-destructive">Couldn't load projects.</p> : projects.filter((project) => project.status !== "signed_off").length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No open projects.</p> : projects.filter((project) => project.status !== "signed_off").sort((a, b) => String(a.deadline).localeCompare(String(b.deadline))).map((project) => <div className="flex items-center justify-between gap-3 rounded-lg border p-3" key={project.id}><div><p className="font-medium">{project.name}</p><p className="text-xs text-muted-foreground">{formatDate(project.startDate)} to {formatDate(project.deadline)}</p></div><Badge className={priorityClass(project.priority)}>{formatLabel(project.priority)}</Badge></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Latest notices</CardTitle><CardDescription>Updates from the Tech Pod Lead.</CardDescription></CardHeader><CardContent className="space-y-4">{loadingNotices ? <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p> : errorNotices ? <p className="py-8 text-center text-sm text-destructive">Couldn't load notices.</p> : notices.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No notices yet.</p> : notices.slice(0, 3).map((notice) => <div key={notice.id}><div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /><p className="font-medium">{notice.title}</p></div><p className="mt-1 text-sm text-muted-foreground">{notice.body}</p><p className="mt-2 text-xs text-muted-foreground">{notice.author} · {notice.date}</p></div>)}</CardContent></Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-600" />Open blockers</CardTitle><CardDescription>Unresolved issues blocking delivery.</CardDescription></CardHeader><CardContent className="space-y-3">{loadingBlockers ? <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p> : errorBlockers ? <p className="py-4 text-center text-sm text-destructive">Couldn't load blockers.</p> : openBlockers.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No open blockers.</p> : openBlockers.slice(0, 5).map((blocker) => <div className="rounded-lg border p-3" key={blocker.id}><div className="flex items-center justify-between gap-2"><p className="font-medium">{blocker.referenceCode}</p><Badge className={priorityClass(blocker.severity)}>{formatLabel(blocker.severity)}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{blocker.description}</p></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Flag className="h-4 w-4 text-sky-600" />Upcoming milestones</CardTitle><CardDescription>Dates the Pod is tracking toward.</CardDescription></CardHeader><CardContent className="space-y-3">{loadingMilestones ? <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p> : errorMilestones ? <p className="py-4 text-center text-sm text-destructive">Couldn't load milestones.</p> : upcomingMilestones.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No upcoming milestones.</p> : upcomingMilestones.slice(0, 5).map((milestone) => <div className="rounded-lg border p-3" key={milestone.id}><div className="flex items-center justify-between gap-2"><p className="font-medium">{milestone.title}</p><Badge className={neutralStatusClass(milestone.status)}>{formatLabel(milestone.status ?? "planned")}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{formatDate(milestone.milestoneDate)}</p></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-amber-600" />Conversion reminders</CardTitle><CardDescription>Internship conversion decisions coming due.</CardDescription></CardHeader><CardContent className="space-y-3">{loadingReminders ? <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p> : errorReminders ? <p className="py-4 text-center text-sm text-destructive">Couldn't load reminders.</p> : pendingReminders.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No reminders due.</p> : pendingReminders.slice(0, 5).map((reminder) => <div className="rounded-lg border p-3" key={reminder.id}><div className="flex items-center justify-between gap-2"><p className="font-medium">{usersById.get(reminder.memberId)?.name ?? "Unknown member"}</p><Badge className={neutralStatusClass(reminder.status)}>{formatLabel(reminder.status)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{formatLabel(reminder.reminderType)} · due {formatDate(reminder.dueDate)}</p></div>)}</CardContent></Card>
        </div>
      </TabsContent>

      <TabsContent value="people" className="mt-6 space-y-6">
        <Card><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><CardTitle>Member availability</CardTitle><CardDescription>Employment status and internship period.</CardDescription></div><div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Search members" className="pl-9" /></div></div></CardHeader><CardContent className="overflow-x-auto">{loadingUsers || loadingProfiles ? <p className="py-8 text-center text-sm text-muted-foreground">Loading members…</p> : errorUsers || errorProfiles ? <p className="py-8 text-center text-sm text-destructive">Couldn't load member data.</p> : <><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="p-3">Member</th><th className="p-3">Status</th><th className="p-3">Employment status</th><th className="p-3">Internship period</th></tr></thead><tbody>{filteredMembers.map((member) => { const profile = profileByUserId.get(member.id); return <tr className="border-b last:border-0" key={member.id}><td className="p-3"><p className="font-medium">{member.name}</p><p className="text-xs text-muted-foreground">Tech member</p></td><td className="p-3"><Badge className={statusClass(member.status)}>{member.status === "on_leave" ? "On leave" : member.status === "exited" ? "Exited" : "Active"}</Badge></td><td className="p-3">{profile ? <Badge className={neutralStatusClass(profile.employmentStatus)}>{formatLabel(profile.employmentStatus)}</Badge> : <span className="text-muted-foreground">Not set</span>}</td><td className="p-3">{profile ? `${formatDate(profile.internshipStartDate)} to ${formatDate(profile.internshipEndDate)}` : "Not set"}</td></tr>; })}</tbody></table>{filteredMembers.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No members match your search.</p>}</>}</CardContent></Card>
        <div className="grid gap-4 sm:grid-cols-3">{[{ label: "Active", value: activeMembers, icon: CircleDot }, { label: "On leave", value: members.filter((member) => member.status === "on_leave").length, icon: Clock3 }, { label: "Total roster", value: members.length, icon: Users }].map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center gap-3 p-4"><Icon className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>)}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card><CardHeader><CardTitle>Leave tracking</CardTitle><CardDescription>Structured leave requests and balances.</CardDescription></CardHeader><CardContent><p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Coming soon</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Happiness check-in</CardTitle><CardDescription>Weekly pulse from Tech department members.</CardDescription></CardHeader><CardContent><p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Coming soon</p></CardContent></Card>
        </div>
      </TabsContent>

      <TabsContent value="projects" className="mt-6"><Card><CardHeader><CardTitle>Project register</CardTitle><CardDescription>Start date, deadline, owner, status, and priority. No financial fields.</CardDescription></CardHeader><CardContent className="overflow-x-auto">{loadingProjects ? <p className="py-8 text-center text-sm text-muted-foreground">Loading projects…</p> : errorProjects ? <p className="py-8 text-center text-sm text-destructive">Couldn't load projects.</p> : projects.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No projects yet.</p> : <table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="p-3">Project</th><th className="p-3">Status</th><th className="p-3">Priority</th><th className="p-3">Start</th><th className="p-3">Deadline</th><th className="p-3">Owner</th></tr></thead><tbody>{projects.map((project) => <tr className="border-b last:border-0" key={project.id}><td className="p-3"><p className="font-medium">{project.name}</p><p className="text-xs text-muted-foreground">{project.key}</p></td><td className="p-3"><Badge variant="outline">{project.status === "signed_off" ? "Completed" : project.status === "hold" ? "On hold" : "Active"}</Badge></td><td className="p-3"><Badge className={priorityClass(project.priority)}>{formatLabel(project.priority)}</Badge></td><td className="p-3">{formatDate(project.startDate)}</td><td className="p-3">{formatDate(project.deadline)}</td><td className="p-3">{usersById.get(project.ownerMemberId ?? "")?.name ?? "Unassigned"}</td></tr>)}</tbody></table>}</CardContent></Card></TabsContent>

      <TabsContent value="calendar" className="mt-6 space-y-6"><Card><CardHeader><CardTitle>August 2026 deadlines</CardTitle><CardDescription>Deadline markers are grouped by priority so the Pod can sequence attention.</CardDescription></CardHeader><CardContent>{loadingProjects || loadingMilestones ? <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p> : <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-center text-xs">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div className="bg-muted p-2 font-semibold text-muted-foreground" key={day}>{day}</div>)}{Array.from({ length: 35 }, (_, index) => { const day = index - 5; const dayStr = String(day).padStart(2, "0"); const due = projects.find((project) => project.deadline?.slice(8, 10) === dayStr && project.deadline?.slice(5, 7) === "08"); const milestone = upcomingMilestones.find((item) => item.milestoneDate?.slice(8, 10) === dayStr && item.milestoneDate?.slice(5, 7) === "08"); return <div className={`min-h-20 bg-card p-2 text-left ${day > 0 && day <= 31 ? "" : "bg-muted/40"}`} key={index}><span className="text-muted-foreground">{day > 0 && day <= 31 ? day : ""}</span>{due && <div className={`mt-2 rounded p-1 text-[10px] font-medium ${priorityClass(due.priority)}`}>{due.name}</div>}{milestone && <div className="mt-1 rounded bg-sky-100 p-1 text-[10px] font-medium text-sky-800">{milestone.title}</div>}</div>; })}</div>}</CardContent></Card><Card><CardHeader><CardTitle>Deadline signals</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3">{[{ label: "Critical", detail: "Escalate today", className: "bg-red-100 text-red-800" }, { label: "High", detail: "Owner check-in", className: "bg-orange-100 text-orange-800" }, { label: "Medium / low", detail: "Monitor in stand-up", className: "bg-sky-100 text-sky-800" }].map((item) => <div className="rounded-lg border p-3" key={item.label}><Badge className={item.className}>{item.label}</Badge><p className="mt-2 text-sm text-muted-foreground">{item.detail}</p></div>)}</CardContent></Card></TabsContent>

      <TabsContent value="notices" className="mt-6"><Card><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle>Tech notice board</CardTitle><CardDescription>Short, visible updates for the department. Only POD leads can publish or manage notices.</CardDescription></div>{canManageNotices && <Button variant="outline" size="sm" onClick={() => openNoticeEditor()}><Plus className="mr-2 h-4 w-4" />New notice</Button>}</div></CardHeader><CardContent className="space-y-4">{loadingNotices ? <p className="py-8 text-center text-sm text-muted-foreground">Loading notices…</p> : errorNotices ? <p className="py-8 text-center text-sm text-destructive">Couldn't load notices.</p> : notices.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No notices yet.</p> : notices.map((notice) => <div className="rounded-lg border p-4" key={notice.id}><div className="flex items-start gap-3"><BellRing className="mt-0.5 h-4 w-4 text-primary" /><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold">{notice.title}</p><p className="mt-1 text-sm text-muted-foreground">{notice.body}</p></div><div className="flex items-center gap-1">{canManageNotices && notice.id && <><Button variant="ghost" size="icon" aria-label={`Edit ${notice.title}`} onClick={() => openNoticeEditor(notice)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${notice.title}`} onClick={() => deleteAnnouncement.mutate(notice.id, { onSuccess: () => { queryClient.setQueryData<Announcement[]>(announcementsKey, (current) => current?.filter((item) => item.id !== notice.id) ?? []); queryClient.invalidateQueries({ queryKey: announcementsKey }); toast({ title: "Notice deleted", description: "The notice was removed from the department board." }); }, onError: (error: any) => toast({ title: "Notice deletion failed", description: error?.message ?? "Please try again.", variant: "destructive" }) })}><Trash2 className="h-4 w-4 text-destructive" /></Button></>}<span className="mr-2 text-xs text-muted-foreground">{notice.date}</span></div></div><p className="mt-3 text-xs font-medium">{notice.author} · Tech Pod Lead</p></div></div></div>)}</CardContent></Card></TabsContent>
    </Tabs>

    <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}><DialogContent><DialogHeader><DialogTitle>{editingNotice ? "Edit department notice" : "Add department notice"}</DialogTitle></DialogHeader><div className="space-y-4"><Input placeholder="Notice title" value={noticeTitle} onChange={(event) => setNoticeTitle(event.target.value)} /><Textarea placeholder="What should the Tech team know?" value={noticeBody} onChange={(event) => setNoticeBody(event.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setNoticeOpen(false)}>Cancel</Button><Button onClick={addNotice} disabled={!canManageNotices || !noticeTitle.trim() || !noticeBody.trim()}>{editingNotice ? "Save changes" : "Publish notice"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
