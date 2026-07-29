import { useEffect, useState } from "react";
import { AlertTriangle, BellRing, CalendarDays, CircleDollarSign, Clock3, Heart, Megaphone, MessageSquare, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MemberStatus = "Active" | "Probation" | "Leave";
type ProjectStatus = "Active" | "On hold";
type Priority = "Critical" | "High" | "Medium" | "Low";

// Temporary display data. Replace these arrays with the Supabase-backed query results.
const members = [
  { name: "Riya Sharma", role: "Pod Lead", team: "Platform", status: "Active" as MemberStatus, email: "riya@jaruratcare.org", start: "2026-01-15", end: "2026-07-31", leaveDays: 3 },
  { name: "Rahul Jain", role: "Project Manager", team: "Core", status: "Probation" as MemberStatus, email: "rahul@jaruratcare.org", start: "2026-04-01", end: "2026-08-01", leaveDays: 1 },
  { name: "Sanya Patel", role: "Frontend Engineer", team: "Infrastructure", status: "Leave" as MemberStatus, email: "sanya@jaruratcare.org", start: "2026-02-01", end: "2026-08-01", leaveDays: 8, leaveFrom: "2026-07-25", leaveTo: "2026-08-01" },
  { name: "Nikhil Verma", role: "Backend Engineer", team: "Platform", status: "Active" as MemberStatus, email: "nikhil@jaruratcare.org", start: "2026-03-10", end: "2026-09-10", leaveDays: 5 },
  { name: "Aditi Rao", role: "HR Partner", team: "People", status: "Active" as MemberStatus, email: "aditi@jaruratcare.org", start: "2025-11-01", end: "2026-11-01", leaveDays: 2 },
];

const projects = [
  { name: "Central dashboard", team: "Platform", status: "Active" as ProjectStatus, priority: "Critical" as Priority, start: "2026-07-10", deadline: "2026-08-15", members: ["Riya Sharma", "Nikhil Verma"], allocated: 240000, spent: 152000 },
  { name: "Intern onboarding automation", team: "Core", status: "Active" as ProjectStatus, priority: "High" as Priority, start: "2026-07-01", deadline: "2026-07-31", members: ["Rahul Jain", "Aditi Rao"], allocated: 100000, spent: 67000 },
  { name: "Infrastructure stabilization", team: "Infrastructure", status: "On hold" as ProjectStatus, priority: "Medium" as Priority, start: "2026-06-01", deadline: "2026-09-01", members: ["Sanya Patel", "Nikhil Verma"], allocated: 180000, spent: 91000 },
];

const blockers = [
  { id: "BLK-01", project: "Central dashboard", team: "Platform", severity: "Critical", text: "Supabase row-level security policy is preventing cross-team project summaries from loading.", raisedAt: "2026-07-27T08:30:00", author: "Riya Sharma", authorRole: "Pod Lead", comment: "Escalated to backend; dashboard release is blocked until the policy is updated." },
  { id: "BLK-02", project: "Infrastructure stabilization", team: "Infrastructure", severity: "High", text: "Database patch is waiting for production change-window approval.", raisedAt: "2026-07-28T04:15:00", author: "Rahul Jain", authorRole: "Project Manager", comment: "Approval request sent to the ops reviewer." },
];

const announcements = [
  { title: "Probation review window", text: "Submit conversion feedback for interns whose review dates fall before 1 August.", author: "Aditi Rao", role: "HR", date: "Today, 10:00 AM" },
  { title: "Dashboard release freeze", text: "Feature freeze is scheduled for 12 August. Flag scope risks in the blocker log.", author: "Riya Sharma", role: "Pod Lead", date: "Yesterday" },
];

const milestones = [
  { date: "31 Jul", title: "Intern onboarding automation", detail: "First internal launch" },
  { date: "12 Aug", title: "Central dashboard", detail: "Feature freeze" },
  { date: "15 Aug", title: "Central dashboard", detail: "Company launch" },
  { date: "01 Sep", title: "Infrastructure stabilization", detail: "Production handover" },
];

const date = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

function tagClass(status: MemberStatus | ProjectStatus | Priority) {
  if (status === "Active") return "bg-emerald-100 text-emerald-800";
  if (status === "Leave" || status === "On hold") return "bg-amber-100 text-amber-800";
  if (status === "Probation" || status === "Medium") return "bg-sky-100 text-sky-800";
  if (status === "Critical") return "bg-red-100 text-red-800";
  if (status === "High") return "bg-orange-100 text-orange-800";
  return "bg-slate-100 text-slate-700";
}

function OpenTimer({ raisedAt }: { raisedAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const milliseconds = Math.max(0, now - new Date(raisedAt).getTime());
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  return <>{hours}h {minutes.toString().padStart(2, "0")}m open</>;
}

export default function OperationsDashboard() {
  const [tab, setTab] = useState("overview");
  const activeMembers = members.filter((member) => member.status === "Active").length;
  const activeProjects = projects.filter((project) => project.status === "Active").length;
  const totalBudget = projects.reduce((total, project) => total + project.allocated, 0);
  const totalSpend = projects.reduce((total, project) => total + project.spent, 0);

  return <div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-medium text-primary">Tech Department</p><h1 className="text-3xl font-bold tracking-tight">Operations dashboard</h1><p className="mt-1 text-sm text-muted-foreground">People, delivery health, blockers, and programme milestones in one view.</p></div>
      <Button variant="outline" className="gap-2" onClick={() => setTab("updates")}><Megaphone className="h-4 w-4" />Announcements</Button>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[{ label: "Active members", value: activeMembers, detail: "1 on probation", icon: Users }, { label: "Active projects", value: activeProjects, detail: "1 project on hold", icon: CalendarDays }, { label: "Critical blockers", value: 1, detail: "2 blockers open", icon: AlertTriangle }, { label: "Weekly happiness", value: "4.3/5", detail: "This week's vibe check", icon: Heart }].map(({ label, value, detail, icon: Icon }) => <Card key={label}><CardContent className="p-5"><div className="flex justify-between"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></div><Icon className="h-5 w-5 text-primary" /></div><p className="mt-2 text-xs text-muted-foreground">{detail}</p></CardContent></Card>)}
    </div>

    <Tabs value={tab} onValueChange={setTab}>
      <div className="overflow-x-auto pb-1"><TabsList className="h-auto min-w-max gap-1 p-1"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="people">People & leave</TabsTrigger><TabsTrigger value="projects">Projects</TabsTrigger><TabsTrigger value="blockers">Blockers</TabsTrigger><TabsTrigger value="updates">Updates</TabsTrigger><TabsTrigger value="roadmap">Roadmap & budget</TabsTrigger></TabsList></div>

      <TabsContent value="overview" className="mt-6 space-y-6"><div className="grid gap-6 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader><CardTitle>Delivery at a glance</CardTitle><CardDescription>Active initiatives and their next important dates.</CardDescription></CardHeader><CardContent className="space-y-3">{projects.map((project) => <div className="rounded-lg border p-4" key={project.name}><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{project.name}</p><p className="text-sm text-muted-foreground">{project.team} · {date(project.start)} — {date(project.deadline)}</p></div><div className="flex gap-2"><Badge className={tagClass(project.status)}>{project.status}</Badge><Badge className={tagClass(project.priority)}>{project.priority}</Badge></div></div><p className="mt-3 text-sm">Assigned: <span className="text-muted-foreground">{project.members.join(", ")}</span></p></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Conversion reminders</CardTitle><CardDescription>Upcoming probation-to-permanent reviews.</CardDescription></CardHeader><CardContent>{members.filter((member) => member.status === "Probation").map((member) => <div className="rounded-lg bg-amber-50 p-3 text-sm" key={member.email}><p className="flex items-center gap-2 font-medium"><BellRing className="h-4 w-4 text-amber-700" />{member.name}</p><p className="mt-1 text-muted-foreground">Review by {date(member.end)} · notify HR and Pod Lead</p></div>)}</CardContent></Card></div><div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Critical attention</CardTitle><CardDescription>Blockers that need an owner response.</CardDescription></CardHeader><CardContent className="space-y-3">{blockers.map((blocker) => <div className="flex justify-between gap-3 rounded-lg border p-3" key={blocker.id}><div><p className="font-medium">{blocker.project}</p><p className="text-sm text-muted-foreground">{blocker.text}</p></div><Badge className={blocker.severity === "Critical" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>{blocker.severity}</Badge></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Budget pulse</CardTitle><CardDescription>Portfolio spend against allocated budget.</CardDescription></CardHeader><CardContent><div className="flex items-end justify-between"><div><p className="text-2xl font-bold">{money(totalSpend)}</p><p className="text-sm text-muted-foreground">of {money(totalBudget)} allocated</p></div><CircleDollarSign className="h-7 w-7 text-primary" /></div><Progress className="mt-5" value={(totalSpend / totalBudget) * 100} /><p className="mt-2 text-sm text-muted-foreground">{Math.round((totalSpend / totalBudget) * 100)}% of budget used</p></CardContent></Card></div></TabsContent>

      <TabsContent value="people" className="mt-6 space-y-6"><Card><CardHeader><CardTitle>Leadership contacts</CardTitle><CardDescription>Active Pod Lead, Project Manager, and HR contacts.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">{members.filter((member) => ["Pod Lead", "Project Manager", "HR Partner"].includes(member.role)).map((member) => <div className="rounded-lg border p-4" key={member.email}><p className="font-semibold">{member.name}</p><p className="text-sm text-muted-foreground">{member.role} · {member.team}</p><a className="mt-2 block text-sm text-primary hover:underline" href={`mailto:${member.email}`}>{member.email}</a></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Members, duration & leave</CardTitle><CardDescription>Internship dates and total leave days for active members; leave periods for members currently on leave.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="p-3">Member</th><th className="p-3">Team</th><th className="p-3">Status</th><th className="p-3">Internship duration</th><th className="p-3">Current leave</th><th className="p-3">Total leave days</th></tr></thead><tbody>{members.map((member) => <tr className="border-b last:border-0" key={member.email}><td className="p-3"><p className="font-medium">{member.name}</p><p className="text-muted-foreground">{member.role}</p></td><td className="p-3">{member.team}</td><td className="p-3"><Badge className={tagClass(member.status)}>{member.status}</Badge></td><td className="p-3">{date(member.start)} — {date(member.end)}</td><td className="p-3">{member.status === "Leave" ? `${date(member.leaveFrom!)} — ${date(member.leaveTo!)}` : "—"}</td><td className="p-3">{member.leaveDays} days</td></tr>)}</tbody></table></CardContent></Card></TabsContent>

      <TabsContent value="projects" className="mt-6"><Card><CardHeader><CardTitle>Active and hold projects</CardTitle><CardDescription>Start/deadline dates, assigned members, priority, and spend by project.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="p-3">Project</th><th className="p-3">Status</th><th className="p-3">Priority</th><th className="p-3">Start date</th><th className="p-3">Deadline</th><th className="p-3">Assigned members</th><th className="p-3">Spend</th></tr></thead><tbody>{projects.map((project) => <tr className="border-b last:border-0" key={project.name}><td className="p-3 font-medium">{project.name}<p className="font-normal text-muted-foreground">{project.team}</p></td><td className="p-3"><Badge className={tagClass(project.status)}>{project.status}</Badge></td><td className="p-3"><Badge className={tagClass(project.priority)}>{project.priority}</Badge></td><td className="p-3">{date(project.start)}</td><td className="p-3">{date(project.deadline)}</td><td className="p-3">{project.members.join(", ")}</td><td className="p-3">{money(project.spent)} / {money(project.allocated)}</td></tr>)}</tbody></table></CardContent></Card></TabsContent>

      <TabsContent value="blockers" className="mt-6 space-y-4">{blockers.map((blocker) => <Card className={blocker.severity === "Critical" ? "border-red-200" : undefined} key={blocker.id}><CardHeader><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><div className="flex items-center gap-2"><Badge className={blocker.severity === "Critical" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>{blocker.severity}</Badge><span className="text-xs text-muted-foreground">{blocker.id}</span></div><CardTitle className="mt-2 text-lg">{blocker.project}</CardTitle><CardDescription>{blocker.team} team · Raised {new Date(blocker.raisedAt).toLocaleString("en-IN")}</CardDescription></div><div className="flex h-fit items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-800"><Clock3 className="h-4 w-4" /><OpenTimer raisedAt={blocker.raisedAt} /></div></div></CardHeader><CardContent><p className="text-sm">{blocker.text}</p><div className="mt-5 border-t pt-4"><p className="mb-3 text-sm font-semibold">Comments</p><div className="rounded-lg bg-muted/60 p-3 text-sm"><p className="font-medium">{blocker.author} <span className="font-normal text-muted-foreground">· {blocker.authorRole}</span></p><p className="mt-1 text-muted-foreground">{blocker.comment}</p></div></div></CardContent></Card>)}</TabsContent>

      <TabsContent value="updates" className="mt-6"><Card><CardHeader><CardTitle>Announcements</CardTitle><CardDescription>Messages from Pod Leads, PMs, and HR.</CardDescription></CardHeader><CardContent className="space-y-4">{announcements.map((announcement) => <div className="rounded-lg border p-4" key={announcement.title}><div className="flex flex-wrap justify-between gap-2"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /><p className="font-semibold">{announcement.title}</p></div><span className="text-xs text-muted-foreground">{announcement.date}</span></div><p className="mt-2 text-sm text-muted-foreground">{announcement.text}</p><p className="mt-3 text-xs font-medium">{announcement.author} · {announcement.role}</p></div>)}</CardContent></Card></TabsContent>

      <TabsContent value="roadmap" className="mt-6 space-y-6"><Card><CardHeader><CardTitle>Milestone timeline</CardTitle><CardDescription>Major launches and company checkpoints.</CardDescription></CardHeader><CardContent>{milestones.map((milestone, index) => <div className="relative flex gap-4 pb-7 last:pb-0" key={milestone.title}><div className="flex flex-col items-center"><div className={`h-3 w-3 rounded-full ${index === 0 ? "bg-primary" : "bg-muted-foreground/40"}`} />{index < milestones.length - 1 && <div className="h-full w-px bg-border" />}</div><div className="-mt-1"><p className="text-sm text-muted-foreground">{milestone.date}</p><p className="font-semibold">{milestone.title}</p><p className="text-sm text-muted-foreground">{milestone.detail}</p></div></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Budget & burn rate</CardTitle><CardDescription>Financial spend versus allocated budget per project.</CardDescription></CardHeader><CardContent className="space-y-5">{projects.map((project) => { const used = Math.round((project.spent / project.allocated) * 100); return <div key={project.name}><div className="mb-2 flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium">{project.name}</span><span className="text-muted-foreground">{money(project.spent)} of {money(project.allocated)} · {used}%</span></div><Progress value={used} /></div>; })}</CardContent></Card></TabsContent>
    </Tabs>
  </div>;
}
