import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/auth/authContext";
import { toast } from "sonner";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  Edit2,
  ExternalLink,
  Filter,
  GripVertical,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings as SettingsIcon,
  Share2,
  Trash2,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
  Video,
  X,
  Database,
  Calendar as CalendarIcon,
  Check,
  Eye,
} from "lucide-react";

const API = "/api";

type View =
  | "Dashboard"
  | "My Tasks"
  | "Kanban Board"
  | "Calendar"
  | "Doctors Database"
  | "Horizon Series"
  | "Webinar Invitations"
  | "Social Media Records"
  | "Reports & Analytics"
  | "Notifications"
  | "Team Members"
  | "Settings";

type Status = "To Do" | "In Progress" | "Under Review" | "Completed";
type Priority = "High" | "Medium" | "Low";

type Task = {
  id: string | number;
  title: string;
  project: string;
  status: Status;
  priority: Priority;
  assignee: string;
  initials: string;
  due_date?: string;
  progress: number;
  comments: number;
  attachments: number;
  risk?: string;
};

type Doctor = {
  id: string | number;
  name: string;
  specialty: string;
  organization: string;
  location: string;
  status: "Active" | "Inactive" | "Contacted" | string;
  email?: string;
  phone?: string;
  notes?: string;
};

type Webinar = {
  id: string | number;
  title: string;
  speaker?: string;
  email?: string;
  organization?: string;
  event_date: string;
  invited: number;
  registered: number;
  status: "Active" | "Planning" | "Completed" | "Declined" | string;
};

type SocialRecord = {
  id: string | number;
  post: string;
  channel: string;
  post_date: string;
  reach: string;
  raw_reach?: number;
  engagement: string;
  raw_engagement?: number;
  status: "Published" | "Live" | "Draft" | "Scheduled" | string;
  url?: string;
};

type Notification = {
  id: string | number;
  type: string;
  title: string;
  source?: string;
  is_read: boolean;
  created_at: string;
};

type TeamMember = {
  id: string | number;
  name: string;
  role: string;
  email?: string;
  assigned_tasks: number;
  completed_tasks: number;
  productivity: number;
  initials: string;
  status?: string;
};

type DashboardStats = {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  upcoming: number;
};

const navigation: { label: View; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Tasks", icon: ListTodo },
  { label: "Kanban Board", icon: ClipboardList },
  { label: "Calendar", icon: CalendarDays },
  { label: "Doctors Database", icon: Database },
  { label: "Horizon Series", icon: Video },
  { label: "Webinar Invitations", icon: Send },
  { label: "Social Media Records", icon: Share2 },
  { label: "Reports & Analytics", icon: BarChart3 },
  { label: "Notifications", icon: Bell },
  { label: "Team Members", icon: Users },
  { label: "Settings", icon: SettingsIcon },
];

const classNames = (...values: (string | false | undefined | null)[]) =>
  values.filter(Boolean).join(" ");

const statusClass: Record<Status, string> = {
  "To Do": "bg-slate-100 text-slate-700 border border-slate-200",
  "In Progress": "bg-amber-50 text-amber-800 border border-amber-200",
  "Under Review": "bg-blue-50 text-blue-800 border border-blue-200",
  Completed: "bg-emerald-50 text-emerald-800 border border-emerald-200",
};

const priorityClass: Record<Priority, string> = {
  High: "bg-red-50 text-red-700 border border-red-200",
  Medium: "bg-amber-50 text-amber-700 border border-amber-200",
  Low: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

function Avatar({ initials, size = "md" }: { initials?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-6 w-6 text-[9px]",
    md: "h-8 w-8 text-[11px]",
    lg: "h-10 w-10 text-sm",
  };
  return (
    <span
      className={classNames(
        "flex shrink-0 items-center justify-center rounded-full bg-[#E4EEE4] font-bold text-[#4F7150] ring-1 ring-[#4F7150]/20",
        sizeClasses[size]
      )}
    >
      {initials || "??"}
    </span>
  );
}

function PageTitle({
  title,
  subtitle,
  actionText = "Create Task",
  action = true,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionText?: string;
  action?: boolean;
  onAction?: () => void;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#4F7150]" />
          <p className="text-xs font-bold tracking-wider text-[#4F7150] uppercase">
            Public Relations Workspace
          </p>
        </div>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      {action && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 rounded-lg bg-[#4F7150] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3f5c40] hover:shadow active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {actionText}
        </button>
      )}
    </div>
  );
}

export default function PRDashboard() {
  const { user, logout } = useAuth();

  const [view, setView] = useState<View>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarAccountOpen, setSidebarAccountOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  const sidebarAccountRef = useRef<HTMLDivElement>(null);
  const headerUserMenuRef = useRef<HTMLDivElement>(null);
  const noticeDropdownRef = useRef<HTMLDivElement>(null);

  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [socialRecords, setSocialRecords] = useState<SocialRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    upcoming: 0,
  });

  const [query, setQuery] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"All" | Status>("All");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<"All" | Priority>("All");
  const [draggedTask, setDraggedTask] = useState<string | number | null>(null);
  const [role, setRole] = useState("Project Manager");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal States
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [initialTaskStatus, setInitialTaskStatus] = useState<Status>("To Do");
  const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);

  const [webinarModalOpen, setWebinarModalOpen] = useState(false);
  const [webinarToEdit, setWebinarToEdit] = useState<Webinar | null>(null);

  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialToEdit, setSocialToEdit] = useState<SocialRecord | null>(null);

  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<TeamMember | null>(null);

  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "task" | "doctor" | "webinar" | "social" | "notification" | "team";
    id: string | number;
    name: string;
  } | null>(null);

  // User details
  const userName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "PR Member"
    : "Amelia Martin";
  const userInitials = user
    ? `${user.firstName?.[0] || "P"}${user.lastName?.[0] || "M"}`.toUpperCase()
    : "AM";
  const userEmail = user?.email || "pr.member@test.local";
  const userRole = user?.role === "department_pod_lead" ? "PR Lead" : "PR Member";

  // Handle click-away for popups and Escape key to close all modals/popups
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        sidebarAccountRef.current &&
        !sidebarAccountRef.current.contains(target)
      ) {
        setSidebarAccountOpen(false);
      }
      if (
        headerUserMenuRef.current &&
        !headerUserMenuRef.current.contains(target)
      ) {
        setUserMenuOpen(false);
      }
      if (
        noticeDropdownRef.current &&
        !noticeDropdownRef.current.contains(target)
      ) {
        setNoticeOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSidebarAccountOpen(false);
        setUserMenuOpen(false);
        setNoticeOpen(false);
        setTaskModalOpen(false);
        setTaskDetailModalOpen(false);
        setDoctorModalOpen(false);
        setWebinarModalOpen(false);
        setSocialModalOpen(false);
        setTeamModalOpen(false);
        setAnnouncementModalOpen(false);
        setDeleteConfirmOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  /*
   * DATA FETCHING
   */
  const fetchTasks = async () => {
    const res = await fetch(`${API}/tasks`);
    if (!res.ok) throw new Error("Failed to fetch tasks");
    const data = await res.json();
    setTasks(data);
  };

  const fetchDoctors = async () => {
    const res = await fetch(`${API}/doctors`);
    if (!res.ok) throw new Error("Failed to fetch doctors");
    const data = await res.json();
    setDoctors(data);
  };

  const fetchWebinars = async () => {
    const res = await fetch(`${API}/webinars`);
    if (!res.ok) throw new Error("Failed to fetch webinars");
    const data = await res.json();
    setWebinars(data);
  };

  const fetchSocial = async () => {
    const res = await fetch(`${API}/social`);
    if (!res.ok) throw new Error("Failed to fetch social records");
    const data = await res.json();
    setSocialRecords(data);
  };

  const fetchNotifications = async () => {
    const res = await fetch(`${API}/notifications`);
    if (!res.ok) throw new Error("Failed to fetch notifications");
    const data = await res.json();
    setNotifications(data);
  };

  const fetchTeam = async () => {
    const res = await fetch(`${API}/team`);
    if (!res.ok) throw new Error("Failed to fetch team members");
    const data = await res.json();
    setTeam(data);
  };

  const fetchStats = async () => {
    const res = await fetch(`${API}/dashboard/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    const data = await res.json();
    setStats(data);
  };

  const loadData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      await Promise.all([
        fetchTasks(),
        fetchDoctors(),
        fetchWebinars(),
        fetchSocial(),
        fetchNotifications(),
        fetchTeam(),
        fetchStats(),
      ]);

      if (isManualRefresh) {
        toast.success("Workspace data refreshed");
      }
    } catch (err: any) {
      console.error("Dashboard load error:", err);
      toast.error(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /*
   * TASK OPERATIONS
   */
  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      if (taskToEdit) {
        // UPDATE
        const res = await fetch(`${API}/tasks/${taskToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (!res.ok) throw new Error("Failed to update task");
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        if (selectedTask?.id === updated.id) setSelectedTask(updated);
        toast.success("Task updated successfully");
      } else {
        // CREATE
        const res = await fetch(`${API}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...taskData,
            status: taskData.status || initialTaskStatus,
          }),
        });
        if (!res.ok) throw new Error("Failed to create task");
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
        toast.success("Task created successfully");
      }
      setTaskModalOpen(false);
      setTaskToEdit(null);
      fetchStats();
    } catch (err: any) {
      console.error("Task save error:", err);
      toast.error(err.message || "Failed to save task");
    }
  };

  const handleUpdateTaskStatus = async (taskId: string | number, nextStatus: Status) => {
    try {
      const res = await fetch(`${API}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (selectedTask?.id === updated.id) setSelectedTask(updated);
      toast.success(`Task moved to ${nextStatus}`);
      fetchStats();
    } catch (err: any) {
      console.error("Status update error:", err);
      toast.error(err.message || "Failed to update task status");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: Status) => {
    if (draggedTask !== null) {
      handleUpdateTaskStatus(draggedTask, status);
      setDraggedTask(null);
    }
  };

  /*
   * DOCTOR OPERATIONS
   */
  const handleSaveDoctor = async (docData: Partial<Doctor>) => {
    try {
      if (doctorToEdit) {
        const res = await fetch(`${API}/doctors/${doctorToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(docData),
        });
        if (!res.ok) throw new Error("Failed to update doctor");
        const updated = await res.json();
        setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        toast.success("Doctor details updated");
      } else {
        const res = await fetch(`${API}/doctors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(docData),
        });
        if (!res.ok) throw new Error("Failed to add doctor");
        const created = await res.json();
        setDoctors((prev) => [created, ...prev]);
        toast.success("Doctor added to database");
      }
      setDoctorModalOpen(false);
      setDoctorToEdit(null);
    } catch (err: any) {
      console.error("Doctor save error:", err);
      toast.error(err.message || "Failed to save doctor");
    }
  };

  /*
   * WEBINAR OPERATIONS
   */
  const handleSaveWebinar = async (webData: Partial<Webinar>) => {
    try {
      if (webinarToEdit) {
        const res = await fetch(`${API}/webinars/${webinarToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webData),
        });
        if (!res.ok) throw new Error("Failed to update webinar");
        const updated = await res.json();
        setWebinars((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
        toast.success("Webinar updated");
      } else {
        const res = await fetch(`${API}/webinars`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webData),
        });
        if (!res.ok) throw new Error("Failed to schedule webinar");
        const created = await res.json();
        setWebinars((prev) => [created, ...prev]);
        toast.success("Webinar scheduled successfully");
      }
      setWebinarModalOpen(false);
      setWebinarToEdit(null);
    } catch (err: any) {
      console.error("Webinar save error:", err);
      toast.error(err.message || "Failed to save webinar");
    }
  };

  /*
   * SOCIAL RECORD OPERATIONS
   */
  const handleSaveSocial = async (socData: Partial<SocialRecord>) => {
    try {
      if (socialToEdit) {
        const res = await fetch(`${API}/social/${socialToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(socData),
        });
        if (!res.ok) throw new Error("Failed to update social record");
        const updated = await res.json();
        setSocialRecords((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        toast.success("Social record updated");
      } else {
        const res = await fetch(`${API}/social`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(socData),
        });
        if (!res.ok) throw new Error("Failed to create social post");
        const created = await res.json();
        setSocialRecords((prev) => [created, ...prev]);
        toast.success("Social record logged");
      }
      setSocialModalOpen(false);
      setSocialToEdit(null);
    } catch (err: any) {
      console.error("Social save error:", err);
      toast.error(err.message || "Failed to save social record");
    }
  };

  /*
   * TEAM OPERATIONS
   */
  const handleSaveTeamMember = async (memberData: Partial<TeamMember>) => {
    try {
      if (teamToEdit) {
        const res = await fetch(`${API}/team/${teamToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberData),
        });
        if (!res.ok) throw new Error("Failed to update member");
        const updated = await res.json();
        setTeam((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        toast.success("Team member updated");
      } else {
        const res = await fetch(`${API}/team`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberData),
        });
        if (!res.ok) throw new Error("Failed to add member");
        const created = await res.json();
        setTeam((prev) => [created, ...prev]);
        toast.success("Team member added");
      }
      setTeamModalOpen(false);
      setTeamToEdit(null);
    } catch (err: any) {
      console.error("Team save error:", err);
      toast.error(err.message || "Failed to save team member");
    }
  };

  /*
   * NOTIFICATION OPERATIONS
   */
  const handleMarkNotificationRead = async (id: string | number) => {
    try {
      const res = await fetch(`${API}/notifications/${id}/read`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark as read");
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success("Notification marked as read");
    } catch (err: any) {
      toast.error(err.message || "Failed to update notification");
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await fetch(`${API}/notifications/read-all`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark all as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (err: any) {
      toast.error(err.message || "Failed to mark all notifications read");
    }
  };

  const handleCreateAnnouncement = async (title: string, message: string, type: string) => {
    try {
      const res = await fetch(`${API}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, type }),
      });
      if (!res.ok) throw new Error("Failed to post announcement");
      const created = await res.json();
      setNotifications((prev) => [created, ...prev]);
      setAnnouncementModalOpen(false);
      toast.success("Announcement broadcast to PR team");
    } catch (err: any) {
      toast.error(err.message || "Failed to post announcement");
    }
  };

  /*
   * GENERIC DELETE HANDLER
   */
  const executeDelete = async () => {
    if (!deleteTarget) return;
    const { type, id, name } = deleteTarget;

    try {
      if (type === "task") {
        const res = await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete task");
        setTasks((prev) => prev.filter((t) => t.id !== id));
        if (selectedTask?.id === id) setTaskDetailModalOpen(false);
        fetchStats();
      } else if (type === "doctor") {
        const res = await fetch(`${API}/doctors/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete doctor");
        setDoctors((prev) => prev.filter((d) => d.id !== id));
      } else if (type === "webinar") {
        const res = await fetch(`${API}/webinars/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete webinar");
        setWebinars((prev) => prev.filter((w) => w.id !== id));
      } else if (type === "social") {
        const res = await fetch(`${API}/social/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete social record");
        setSocialRecords((prev) => prev.filter((s) => s.id !== id));
      } else if (type === "notification") {
        const res = await fetch(`${API}/notifications/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete notification");
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } else if (type === "team") {
        const res = await fetch(`${API}/team/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to remove team member");
        setTeam((prev) => prev.filter((m) => m.id !== id));
      }

      toast.success(`${name || "Item"} deleted successfully`);
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete item");
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  /*
   * EXPORT PR REPORT
   */
  const exportPRReport = () => {
    try {
      const rows = [
        ["PUBLIC RELATIONS DEPARTMENT - IMPACT & ACTIVITY REPORT"],
        [`Generated on: ${new Date().toLocaleString()}`],
        [`Generated by: ${userName} (${userRole})`],
        [],
        ["--- DASHBOARD SUMMARY ---"],
        ["Metric", "Value"],
        ["Total Tasks", stats.total],
        ["Pending Tasks", stats.pending],
        ["Completed Tasks", stats.completed],
        ["Overdue Tasks", stats.overdue],
        ["Upcoming Deadlines", stats.upcoming],
        [],
        ["--- TASKS LIST ---"],
        ["Title", "Project", "Status", "Priority", "Assignee", "Due Date", "Progress %"],
        ...tasks.map((t) => [
          `"${t.title.replace(/"/g, '""')}"`,
          `"${t.project}"`,
          t.status,
          t.priority,
          t.assignee,
          t.due_date || "N/A",
          `${t.progress}%`,
        ]),
        [],
        ["--- DOCTORS ENGAGED ---"],
        ["Name", "Specialty", "Hospital / Organization", "City", "Status", "Email", "Phone"],
        ...doctors.map((d) => [
          `"${d.name}"`,
          d.specialty,
          `"${d.organization}"`,
          d.location,
          d.status,
          d.email || "",
          d.phone || "",
        ]),
        [],
        ["--- WEBINARS ---"],
        ["Title", "Speaker", "Event Date", "Invited", "Registered", "Status"],
        ...webinars.map((w) => [
          `"${w.title}"`,
          w.speaker || "",
          w.event_date,
          w.invited,
          w.registered,
          w.status,
        ]),
        [],
        ["--- SOCIAL MEDIA PERFORMANCE ---"],
        ["Post", "Platform", "Date", "Reach", "Engagement", "Status"],
        ...socialRecords.map((s) => [
          `"${s.post.replace(/"/g, '""')}"`,
          s.channel,
          s.post_date,
          s.reach,
          s.engagement,
          s.status,
        ]),
      ];

      const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `PR_Performance_Report_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("PR performance report downloaded as CSV");
    } catch (err: any) {
      toast.error("Failed to generate report");
    }
  };

  /*
   * SEARCH & FILTER FOR TASKS
   */
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = taskStatusFilter === "All" || task.status === taskStatusFilter;
      const matchesPriority = taskPriorityFilter === "All" || task.priority === taskPriorityFilter;
      const text = `${task.title} ${task.project} ${task.assignee} ${task.risk || ""}`.toLowerCase();
      const matchesSearch = text.includes(query.toLowerCase());
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [tasks, query, taskStatusFilter, taskPriorityFilter]);

  const changeView = (next: View) => {
    setView(next);
    setSidebarOpen(false);
  };

  const unreadNotifCount = notifications.filter((n) => !n.is_read).length;

  /*
   * VIEW RENDERER
   */
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[500px] flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-[#4F7150]" />
          <p className="text-sm font-medium text-slate-500">Loading PR Workspace data...</p>
        </div>
      );
    }

    switch (view) {
      case "Dashboard":
        return (
          <DashboardHome
            stats={stats}
            tasks={tasks}
            doctors={doctors}
            webinars={webinars}
            notifications={notifications}
            onNavigate={changeView}
            onCreateTask={() => {
              setTaskToEdit(null);
              setInitialTaskStatus("To Do");
              setTaskModalOpen(true);
            }}
            onAddDoctor={() => {
              setDoctorToEdit(null);
              setDoctorModalOpen(true);
            }}
            onScheduleWebinar={() => {
              setWebinarToEdit(null);
              setWebinarModalOpen(true);
            }}
            onNewSocial={() => {
              setSocialToEdit(null);
              setSocialModalOpen(true);
            }}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setTaskDetailModalOpen(true);
            }}
            onMarkNotifRead={handleMarkNotificationRead}
            onMarkAllNotifsRead={handleMarkAllNotificationsRead}
            greeting={getGreeting()}
            userName={userName}
          />
        );

      case "My Tasks":
        return (
          <TasksView
            tasks={filteredTasks}
            query={query}
            setQuery={setQuery}
            statusFilter={taskStatusFilter}
            setStatusFilter={setTaskStatusFilter}
            priorityFilter={taskPriorityFilter}
            setPriorityFilter={setTaskPriorityFilter}
            onCreate={() => {
              setTaskToEdit(null);
              setInitialTaskStatus("To Do");
              setTaskModalOpen(true);
            }}
            onEdit={(task) => {
              setTaskToEdit(task);
              setTaskModalOpen(true);
            }}
            onDelete={(task) => {
              setDeleteTarget({ type: "task", id: task.id, name: task.title });
              setDeleteConfirmOpen(true);
            }}
            onView={(task) => {
              setSelectedTask(task);
              setTaskDetailModalOpen(true);
            }}
            onQuickStatusChange={handleUpdateTaskStatus}
          />
        );

      case "Kanban Board":
        return (
          <KanbanBoardView
            tasks={tasks}
            searchQuery={query}
            setDraggedTask={setDraggedTask}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onCreate={(columnStatus) => {
              setTaskToEdit(null);
              setInitialTaskStatus(columnStatus);
              setTaskModalOpen(true);
            }}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setTaskDetailModalOpen(true);
            }}
            onTaskEdit={(task) => {
              setTaskToEdit(task);
              setTaskModalOpen(true);
            }}
            onTaskDelete={(task) => {
              setDeleteTarget({ type: "task", id: task.id, name: task.title });
              setDeleteConfirmOpen(true);
            }}
          />
        );

      case "Calendar":
        return (
          <CalendarView
            tasks={tasks}
            webinars={webinars}
            socialRecords={socialRecords}
            onCreateTask={(dateStr) => {
              setTaskToEdit(null);
              setInitialTaskStatus("To Do");
              setTaskModalOpen(true);
            }}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setTaskDetailModalOpen(true);
            }}
          />
        );

      case "Doctors Database":
        return (
          <DoctorsView
            doctors={doctors}
            search={query}
            setSearch={setQuery}
            onAdd={() => {
              setDoctorToEdit(null);
              setDoctorModalOpen(true);
            }}
            onEdit={(doc) => {
              setDoctorToEdit(doc);
              setDoctorModalOpen(true);
            }}
            onDelete={(doc) => {
              setDeleteTarget({ type: "doctor", id: doc.id, name: doc.name });
              setDeleteConfirmOpen(true);
            }}
          />
        );

      case "Horizon Series":
        return (
          <HorizonView
            webinars={webinars}
            tasks={tasks}
            onScheduleWebinar={() => {
              setWebinarToEdit(null);
              setWebinarModalOpen(true);
            }}
            onAddTask={() => {
              setTaskToEdit(null);
              setInitialTaskStatus("To Do");
              setTaskModalOpen(true);
            }}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setTaskDetailModalOpen(true);
            }}
            onWebinarEdit={(web) => {
              setWebinarToEdit(web);
              setWebinarModalOpen(true);
            }}
          />
        );

      case "Webinar Invitations":
        return (
          <WebinarsView
            webinars={webinars}
            search={query}
            setSearch={setQuery}
            onAdd={() => {
              setWebinarToEdit(null);
              setWebinarModalOpen(true);
            }}
            onEdit={(web) => {
              setWebinarToEdit(web);
              setWebinarModalOpen(true);
            }}
            onDelete={(web) => {
              setDeleteTarget({ type: "webinar", id: web.id, name: web.title });
              setDeleteConfirmOpen(true);
            }}
          />
        );

      case "Social Media Records":
        return (
          <SocialView
            records={socialRecords}
            search={query}
            setSearch={setQuery}
            onAdd={() => {
              setSocialToEdit(null);
              setSocialModalOpen(true);
            }}
            onEdit={(record) => {
              setSocialToEdit(record);
              setSocialModalOpen(true);
            }}
            onDelete={(record) => {
              setDeleteTarget({ type: "social", id: record.id, name: record.post });
              setDeleteConfirmOpen(true);
            }}
          />
        );

      case "Reports & Analytics":
        return (
          <ReportsView
            stats={stats}
            tasks={tasks}
            doctors={doctors}
            webinars={webinars}
            socialRecords={socialRecords}
            onExportReport={exportPRReport}
          />
        );

      case "Notifications":
        return (
          <NotificationsView
            notifications={notifications}
            onMarkRead={handleMarkNotificationRead}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onNewAnnouncement={() => setAnnouncementModalOpen(true)}
            onDeleteNotif={(n) => {
              setDeleteTarget({ type: "notification", id: n.id, name: n.title });
              setDeleteConfirmOpen(true);
            }}
          />
        );

      case "Team Members":
        return (
          <TeamView
            team={team}
            tasks={tasks}
            onAdd={() => {
              setTeamToEdit(null);
              setTeamModalOpen(true);
            }}
            onEdit={(member) => {
              setTeamToEdit(member);
              setTeamModalOpen(true);
            }}
            onDelete={(member) => {
              setDeleteTarget({ type: "team", id: member.id, name: member.name });
              setDeleteConfirmOpen(true);
            }}
          />
        );

      case "Settings":
        return (
          <SettingsView
            userName={userName}
            userEmail={userEmail}
            userRole={userRole}
            role={role}
            setRole={setRole}
            onLogout={logout}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans text-slate-900 selection:bg-[#4F7150] selection:text-white">
      {/* SIDEBAR BACKDROP ON MOBILE */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#4F7150] text-white shadow-xl transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[73px] items-center gap-3 border-b border-white/15 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white font-bold text-[#4F7150] shadow-sm">
            JC
          </div>

          <div>
            <p className="font-bold tracking-tight">JCF Central</p>
            <p className="text-[10px] font-medium tracking-wider text-white/70 uppercase">
              PUBLIC RELATIONS
            </p>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => changeView(label)}
              className={classNames(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all",
                view === label
                  ? "bg-white/20 font-semibold text-white shadow-xs"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{label}</span>

              {label === "Notifications" && unreadNotifCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                  {unreadNotifCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* SIDEBAR USER FOOTER */}
        <div className="relative border-t border-white/15 p-4" ref={sidebarAccountRef}>
          <div
            onClick={() => setSidebarAccountOpen((prev) => !prev)}
            className={classNames(
              "flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors",
              sidebarAccountOpen ? "bg-white/20 ring-1 ring-white/30" : "bg-white/10 hover:bg-white/15"
            )}
          >
            <Avatar initials={userInitials} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{userName}</p>
              <p className="truncate text-[10px] text-white/70">{userRole}</p>
            </div>
            <ChevronDown
              className={classNames(
                "h-4 w-4 text-white/70 transition-transform duration-200",
                sidebarAccountOpen && "rotate-180 text-white"
              )}
            />
          </div>

          {sidebarAccountOpen && (
            <div
              className="absolute bottom-full left-4 right-4 mb-2 z-50 rounded-xl border border-white/20 bg-[#385539] p-2 text-white shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-white/15 px-3 py-2">
                <p className="text-xs font-bold text-white">{userName}</p>
                <p className="truncate text-[11px] text-white/75">{userEmail}</p>
                <span className="mt-1 inline-block rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {userRole}
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setSidebarAccountOpen(false);
                    changeView("Settings");
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-white/90 hover:bg-white/15 hover:text-white transition-colors"
                >
                  <SettingsIcon className="h-4 w-4 text-white/70" />
                  Settings & Preferences
                </button>
              </div>

              <div className="border-t border-white/15 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSidebarAccountOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-red-300" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="min-h-screen lg:pl-64">
        {/* HEADER */}
        <header className="sticky top-0 z-20 flex h-[73px] items-center gap-4 border-b border-slate-200 bg-white/95 px-4 shadow-xs backdrop-blur-md sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* SEARCH BAR */}
          <div className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-[#F7F5EF] px-3 py-2 text-slate-600 transition-colors focus-within:border-[#4F7150] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#4F7150]/20">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search in ${view.toLowerCase()}...`}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* REFRESH BUTTON */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              title="Refresh Workspace"
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 active:scale-95 sm:flex"
            >
              <RefreshCw className={classNames("h-3.5 w-3.5", refreshing && "animate-spin")} />
              Sync
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            <div className="relative" ref={noticeDropdownRef}>
              <button
                onClick={() => setNoticeOpen((prev) => !prev)}
                className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {noticeOpen && (
                <div
                  className="absolute right-0 top-12 z-50 w-84 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2">
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        className="text-xs font-semibold text-[#4F7150] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-400">
                        No notifications right now
                      </p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.is_read) handleMarkNotificationRead(n.id);
                          }}
                          className={classNames(
                            "cursor-pointer rounded-lg p-2.5 text-xs transition-colors",
                            n.is_read
                              ? "bg-slate-50 text-slate-600 hover:bg-slate-100"
                              : "border-l-3 border-[#4F7150] bg-[#E4EEE4]/50 font-medium text-slate-900 hover:bg-[#E4EEE4]"
                          )}
                        >
                          <p className="truncate font-semibold">{n.title}</p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {n.source || "PR Workspace"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-2 border-t border-slate-100 pt-2 text-center">
                    <button
                      onClick={() => {
                        setNoticeOpen(false);
                        changeView("Notifications");
                      }}
                      className="text-xs font-semibold text-[#4F7150] hover:underline"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* USER MENU DROPDOWN */}
            <div className="relative" ref={headerUserMenuRef}>
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg p-1 text-slate-700 hover:bg-slate-100"
              >
                <Avatar initials={userInitials} size="md" />
                <span className="hidden text-xs font-semibold sm:inline">{userName}</span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:inline" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-xs font-bold text-slate-900">{userName}</p>
                    <p className="text-[11px] text-slate-500">{userEmail}</p>
                    <span className="mt-1 inline-block rounded bg-[#E4EEE4] px-1.5 py-0.5 text-[10px] font-semibold text-[#4F7150]">
                      {userRole}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        changeView("Settings");
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <SettingsIcon className="h-4 w-4 text-slate-400" />
                      Settings & Preferences
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* QUICK CREATE TASK */}
            <button
              onClick={() => {
                setTaskToEdit(null);
                setInitialTaskStatus("To Do");
                setTaskModalOpen(true);
              }}
              className="hidden items-center gap-2 rounded-lg bg-[#4F7150] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#3f5c40] active:scale-95 sm:flex"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </button>
          </div>
        </header>

        {/* VIEW CONTENT */}
        <div className="p-4 sm:p-6 lg:p-8">{renderContent()}</div>
      </main>

      {/* ============================================================
          MODALS & DIALOGS
      ============================================================ */}

      {/* TASK MODAL (CREATE / EDIT) */}
      {taskModalOpen && (
        <TaskModal
          task={taskToEdit}
          initialStatus={initialTaskStatus}
          teamMembers={team}
          onClose={() => {
            setTaskModalOpen(false);
            setTaskToEdit(null);
          }}
          onSave={handleSaveTask}
        />
      )}

      {/* TASK DETAIL MODAL */}
      {taskDetailModalOpen && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => {
            setTaskDetailModalOpen(false);
            setSelectedTask(null);
          }}
          onEdit={() => {
            setTaskDetailModalOpen(false);
            setTaskToEdit(selectedTask);
            setTaskModalOpen(true);
          }}
          onDelete={() => {
            setTaskDetailModalOpen(false);
            setDeleteTarget({ type: "task", id: selectedTask.id, name: selectedTask.title });
            setDeleteConfirmOpen(true);
          }}
          onStatusChange={(newStatus) => handleUpdateTaskStatus(selectedTask.id, newStatus)}
        />
      )}

      {/* DOCTOR MODAL (CREATE / EDIT) */}
      {doctorModalOpen && (
        <DoctorModal
          doctor={doctorToEdit}
          onClose={() => {
            setDoctorModalOpen(false);
            setDoctorToEdit(null);
          }}
          onSave={handleSaveDoctor}
        />
      )}

      {/* WEBINAR MODAL (CREATE / EDIT) */}
      {webinarModalOpen && (
        <WebinarModal
          webinar={webinarToEdit}
          doctors={doctors}
          onClose={() => {
            setWebinarModalOpen(false);
            setWebinarToEdit(null);
          }}
          onSave={handleSaveWebinar}
        />
      )}

      {/* SOCIAL RECORD MODAL (CREATE / EDIT) */}
      {socialModalOpen && (
        <SocialModal
          record={socialToEdit}
          onClose={() => {
            setSocialModalOpen(false);
            setSocialToEdit(null);
          }}
          onSave={handleSaveSocial}
        />
      )}

      {/* TEAM MEMBER MODAL (CREATE / EDIT) */}
      {teamModalOpen && (
        <TeamMemberModal
          member={teamToEdit}
          onClose={() => {
            setTeamModalOpen(false);
            setTeamToEdit(null);
          }}
          onSave={handleSaveTeamMember}
        />
      )}

      {/* ANNOUNCEMENT MODAL */}
      {announcementModalOpen && (
        <AnnouncementModal
          onClose={() => setAnnouncementModalOpen(false)}
          onSend={handleCreateAnnouncement}
        />
      )}

      {/* REUSABLE DELETE CONFIRMATION DIALOG */}
      {deleteConfirmOpen && deleteTarget && (
        <DeleteConfirmDialog
          title={`Delete ${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)}`}
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action is permanent.`}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setDeleteTarget(null);
          }}
          onConfirm={executeDelete}
        />
      )}
    </div>
  );
}

/* ============================================================
   DASHBOARD HOME VIEW
============================================================ */

function DashboardHome({
  stats,
  tasks,
  doctors,
  webinars,
  notifications,
  onNavigate,
  onCreateTask,
  onAddDoctor,
  onScheduleWebinar,
  onNewSocial,
  onTaskClick,
  onMarkNotifRead,
  onMarkAllNotifsRead,
  greeting,
  userName,
}: {
  stats: DashboardStats;
  tasks: Task[];
  doctors: Doctor[];
  webinars: Webinar[];
  notifications: Notification[];
  onNavigate: (view: View) => void;
  onCreateTask: () => void;
  onAddDoctor: () => void;
  onScheduleWebinar: () => void;
  onNewSocial: () => void;
  onTaskClick: (task: Task) => void;
  onMarkNotifRead: (id: string | number) => void;
  onMarkAllNotifsRead: () => void;
  greeting: string;
  userName: string;
}) {
  const upcomingDeadlines = tasks
    .filter((t) => t.status !== "Completed" && t.due_date)
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
    .slice(0, 4);

  const atRiskTasks = tasks.filter((t) => t.risk && t.status !== "Completed").slice(0, 4);

  return (
    <>
      <PageTitle
        title={`${greeting}, ${userName}`}
        subtitle="Here’s how the PR team is moving key media, partnerships, and campaign initiatives forward."
        actionText="Create Task"
        onAction={onCreateTask}
      />

      {/* STAT METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Total Tasks"
          value={String(stats.total)}
          subtext="Active in PR"
          icon={ClipboardList}
          tone="bg-[#E4EEE4] text-[#4F7150]"
          onClick={() => onNavigate("My Tasks")}
        />
        <MetricCard
          title="Pending Tasks"
          value={String(stats.pending)}
          subtext="In progress / review"
          icon={Clock3}
          tone="bg-amber-50 text-amber-600"
          onClick={() => onNavigate("Kanban Board")}
        />
        <MetricCard
          title="Completed Tasks"
          value={String(stats.completed)}
          subtext="Delivered"
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-600"
          onClick={() => onNavigate("My Tasks")}
        />
        <MetricCard
          title="Overdue Tasks"
          value={String(stats.overdue)}
          subtext="Needs attention"
          icon={AlertTriangle}
          tone="bg-red-50 text-red-600"
          onClick={() => onNavigate("Calendar")}
        />
        <MetricCard
          title="Upcoming Deadlines"
          value={String(stats.upcoming)}
          subtext="This month"
          icon={CalendarIcon}
          tone="bg-blue-50 text-blue-600"
          onClick={() => onNavigate("Calendar")}
        />
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Quick Actions:</p>
        <button
          onClick={onCreateTask}
          className="flex items-center gap-1.5 rounded-lg bg-[#E4EEE4] px-3 py-1.5 text-xs font-semibold text-[#4F7150] transition-colors hover:bg-[#d6e5d6]"
        >
          <Plus className="h-3.5 w-3.5" />
          New Task
        </button>
        <button
          onClick={onAddDoctor}
          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
        >
          <Database className="h-3.5 w-3.5" />
          Add Doctor
        </button>
        <button
          onClick={onScheduleWebinar}
          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
        >
          <Video className="h-3.5 w-3.5" />
          Schedule Webinar
        </button>
        <button
          onClick={onNewSocial}
          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
        >
          <Share2 className="h-3.5 w-3.5" />
          New Social Post
        </button>
      </div>

      {/* TASK PRODUCTIVITY & UPCOMING DEADLINES */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* TASK PROGRESS */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Task Productivity & Progress</h2>
              <p className="mt-0.5 text-xs text-slate-500">Live tracker for PR initiatives</p>
            </div>
            <button
              onClick={() => onNavigate("Reports & Analytics")}
              className="text-xs font-semibold text-[#4F7150] hover:underline"
            >
              View analytics &rarr;
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {tasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No tasks created yet.</p>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="group cursor-pointer rounded-lg p-2 transition-colors hover:bg-slate-50"
                >
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={classNames(
                          "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                          priorityClass[task.priority]
                        )}
                      >
                        {task.priority}
                      </span>
                      <span className="font-semibold text-slate-900 group-hover:text-[#4F7150]">
                        {task.title}
                      </span>
                    </div>
                    <span className="font-bold text-slate-700">{task.progress}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={classNames(
                        "h-full rounded-full transition-all",
                        task.progress === 100 ? "bg-emerald-600" : "bg-[#4F7150]"
                      )}
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* UPCOMING DEADLINES */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Upcoming Deadlines</h2>
            <CalendarDays className="h-4 w-4 text-[#4F7150]" />
          </div>

          <div className="mt-5 space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No pending deadlines</p>
            ) : (
              upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="cursor-pointer rounded-lg border-l-3 border-[#4F7150] bg-slate-50/70 p-3 transition-colors hover:bg-slate-100"
                >
                  <p className="text-xs font-bold text-slate-900">{task.title}</p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{task.project}</span>
                    <span className="font-semibold text-[#4F7150]">{task.due_date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* RECENT NOTIFICATIONS & ATTENTION NEEDED */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* NOTIFICATIONS */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Recent Notifications</h2>
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={onMarkAllNotifsRead}
                className="text-xs font-semibold text-[#4F7150] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No notifications available</p>
            ) : (
              notifications.slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  className="flex items-start justify-between gap-3 py-3 text-xs"
                >
                  <div className="flex gap-3">
                    <Bell
                      className={classNames(
                        "mt-0.5 h-4 w-4 shrink-0",
                        n.is_read ? "text-slate-400" : "text-[#4F7150]"
                      )}
                    />
                    <div>
                      <p
                        className={classNames(
                          "text-xs",
                          n.is_read ? "text-slate-600" : "font-semibold text-slate-900"
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {n.source || "PR Workspace"} &bull;{" "}
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => onMarkNotifRead(n.id)}
                      className="shrink-0 text-[11px] font-semibold text-[#4F7150] hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* ATTENTION NEEDED */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Attention Needed</h2>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>

          <div className="mt-4 space-y-3">
            {atRiskTasks.length === 0 ? (
              <div className="rounded-lg bg-emerald-50 p-4 text-center text-xs font-medium text-emerald-800">
                ✨ No critical blockers or task risks flagged!
              </div>
            ) : (
              atRiskTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="cursor-pointer rounded-lg border-l-4 border-red-500 bg-red-50/80 p-3 transition-colors hover:bg-red-100/80"
                >
                  <p className="text-xs font-bold text-red-900">{task.title}</p>
                  <p className="mt-1 text-[11px] text-red-700">Risk: {task.risk}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  tone,
  onClick,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={classNames(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={classNames("rounded-lg p-2.5", tone)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-500">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
        {subtext}
      </p>
    </div>
  );
}

/* ============================================================
   TASKS VIEW
============================================================ */

function TasksView({
  tasks,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  onCreate,
  onEdit,
  onDelete,
  onView,
  onQuickStatusChange,
}: {
  tasks: Task[];
  query: string;
  setQuery: (value: string) => void;
  statusFilter: "All" | Status;
  setStatusFilter: (value: "All" | Status) => void;
  priorityFilter: "All" | Priority;
  setPriorityFilter: (value: "All" | Priority) => void;
  onCreate: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onView: (task: Task) => void;
  onQuickStatusChange: (taskId: string | number, status: Status) => void;
}) {
  return (
    <>
      <PageTitle
        title="My Tasks"
        subtitle="Manage assigned PR campaigns, medical outreach, and editorial deliverables."
        actionText="Create Task"
        onAction={onCreate}
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        {/* FILTER BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder="Search tasks by title, project, assignee..."
            />
          </div>

          {/* STATUS PILLS */}
          <div className="flex flex-wrap gap-1.5">
            {(["All", "To Do", "In Progress", "Under Review", "Completed"] as const).map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={classNames(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    statusFilter === st
                      ? "bg-[#4F7150] text-white shadow-xs"
                      : "bg-[#F7F5EF] text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {st}
                </button>
              )
            )}
          </div>
        </div>

        {/* TASKS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-[#F7F5EF] text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Task & Project</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No tasks match your search or filter.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div
                        onClick={() => onView(task)}
                        className="cursor-pointer font-semibold text-slate-900 hover:text-[#4F7150]"
                      >
                        {task.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <span>{task.project}</span>
                        {task.risk && (
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                            Risk: {task.risk}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar initials={task.initials} size="sm" />
                        <span className="text-xs font-medium text-slate-700">{task.assignee}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={classNames(
                          "rounded-md px-2 py-1 text-xs font-semibold",
                          priorityClass[task.priority]
                        )}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={task.status}
                        onChange={(e) => onQuickStatusChange(task.id, e.target.value as Status)}
                        className={classNames(
                          "cursor-pointer rounded-md px-2 py-1 text-xs font-semibold outline-none",
                          statusClass[task.status]
                        )}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>

                    <td className="px-4 py-4 text-xs font-medium text-slate-600">
                      {task.due_date || "No deadline"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={classNames(
                              "h-full rounded-full",
                              task.progress === 100 ? "bg-emerald-600" : "bg-[#4F7150]"
                            )}
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{task.progress}%</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onView(task)}
                          title="View Details"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit(task)}
                          title="Edit Task"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#4F7150]"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(task)}
                          title="Delete Task"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          Showing {tasks.length} tasks
        </div>
      </div>
    </>
  );
}

/* ============================================================
   KANBAN BOARD VIEW
============================================================ */

function KanbanBoardView({
  tasks,
  searchQuery,
  setDraggedTask,
  onDrop,
  onDragOver,
  onCreate,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
}: {
  tasks: Task[];
  searchQuery: string;
  setDraggedTask: (id: string | number | null) => void;
  onDrop: (status: Status) => void;
  onDragOver: (e: React.DragEvent) => void;
  onCreate: (columnStatus: Status) => void;
  onTaskClick: (task: Task) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
}) {
  const columns: { status: Status; dotColor: string }[] = [
    { status: "To Do", dotColor: "bg-slate-400" },
    { status: "In Progress", dotColor: "bg-amber-400" },
    { status: "Under Review", dotColor: "bg-blue-500" },
    { status: "Completed", dotColor: "bg-emerald-500" },
  ];

  return (
    <>
      <PageTitle
        title="Kanban Board"
        subtitle="Drag and drop tasks across PR delivery stages in real-time."
        actionText="Add Task"
        onAction={() => onCreate("To Do")}
      />

      <div className="grid min-w-[1000px] grid-cols-4 gap-4 overflow-x-auto pb-6">
        {columns.map(({ status, dotColor }) => {
          const items = tasks.filter((t) => {
            const matchesCol = t.status === status;
            const text = `${t.title} ${t.project} ${t.assignee}`.toLowerCase();
            const matchesQuery = text.includes(searchQuery.toLowerCase());
            return matchesCol && matchesQuery;
          });

          return (
            <section
              key={status}
              onDragOver={onDragOver}
              onDrop={() => onDrop(status)}
              className="flex min-h-[500px] flex-col rounded-xl border border-slate-200 bg-slate-100/70 p-3.5"
            >
              {/* COLUMN HEADER */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={classNames("h-2.5 w-2.5 rounded-full", dotColor)} />
                  <h2 className="text-sm font-bold text-slate-900">{status}</h2>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {items.length}
                  </span>
                </div>

                <button
                  onClick={() => onCreate(status)}
                  title={`Add task to ${status}`}
                  className="rounded-lg p-1 text-slate-500 hover:bg-white hover:text-slate-900"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* CARD LIST */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {items.map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTask(task.id)}
                    className="group relative cursor-grab rounded-lg border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-[#4F7150]/50 hover:shadow-md active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={classNames(
                          "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                          priorityClass[task.priority]
                        )}
                      >
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskEdit(task);
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-[#4F7150]"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskDelete(task);
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4
                      onClick={() => onTaskClick(task)}
                      className="mt-2 text-sm font-semibold leading-snug text-slate-900 hover:text-[#4F7150]"
                    >
                      {task.title}
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">{task.project}</p>

                    {task.risk && (
                      <div className="mt-2 rounded bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
                        ⚠️ {task.risk}
                      </div>
                    )}

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={classNames(
                          "h-full rounded-full",
                          task.progress === 100 ? "bg-emerald-600" : "bg-[#4F7150]"
                        )}
                        style={{ width: `${task.progress || 0}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-1">
                      <Avatar initials={task.initials} size="sm" />
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-0.5">
                          <MessageCircle className="h-3 w-3" />
                          {task.comments}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Paperclip className="h-3 w-3" />
                          {task.attachments}
                        </span>
                        <span className="font-semibold text-[#4F7150]">{task.due_date || ""}</span>
                      </div>
                    </div>
                  </article>
                ))}

                <button
                  onClick={() => onCreate(status)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:border-[#4F7150] hover:bg-white hover:text-[#4F7150]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add task
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

/* ============================================================
   CALENDAR VIEW
============================================================ */

function CalendarView({
  tasks,
  webinars,
  socialRecords,
  onCreateTask,
  onTaskClick,
}: {
  tasks: Task[];
  webinars: Webinar[];
  socialRecords: SocialRecord[];
  onCreateTask: (dateStr: string) => void;
  onTaskClick: (task: Task) => void;
}) {
  const [calendarMode, setCalendarMode] = useState<"grid" | "list">("grid");
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Compute days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Combine events by date string YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, { tasks: Task[]; webinars: Webinar[]; social: SocialRecord[] }> = {};

    tasks.forEach((t) => {
      if (t.due_date) {
        const d = t.due_date.split("T")[0];
        if (!map[d]) map[d] = { tasks: [], webinars: [], social: [] };
        map[d].tasks.push(t);
      }
    });

    webinars.forEach((w) => {
      if (w.event_date && w.event_date !== "TBD") {
        const d = w.event_date.split("T")[0];
        if (!map[d]) map[d] = { tasks: [], webinars: [], social: [] };
        map[d].webinars.push(w);
      }
    });

    socialRecords.forEach((s) => {
      if (s.post_date && s.post_date !== "Draft") {
        const d = s.post_date.split("T")[0];
        if (!map[d]) map[d] = { tasks: [], webinars: [], social: [] };
        map[d].social.push(s);
      }
    });

    return map;
  }, [tasks, webinars, socialRecords]);

  return (
    <>
      <PageTitle
        title="PR Schedule & Calendar"
        subtitle="Track deadlines, webinars, and publication schedules across months."
        actionText="Add Event / Task"
        onAction={() => onCreateTask(new Date().toISOString().split("T")[0])}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        {/* CALENDAR CONTROLS */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
              <button
                onClick={prevMonth}
                className="rounded p-1 text-slate-600 hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToday}
                className="rounded px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="rounded p-1 text-slate-600 hover:bg-slate-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 p-1">
              <button
                onClick={() => setCalendarMode("grid")}
                className={classNames(
                  "rounded px-3 py-1 text-xs font-semibold",
                  calendarMode === "grid" ? "bg-[#4F7150] text-white" : "text-slate-600"
                )}
              >
                Month Grid
              </button>
              <button
                onClick={() => setCalendarMode("list")}
                className={classNames(
                  "rounded px-3 py-1 text-xs font-semibold",
                  calendarMode === "list" ? "bg-[#4F7150] text-white" : "text-slate-600"
                )}
              >
                Timeline List
              </button>
            </div>
          </div>
        </div>

        {calendarMode === "grid" ? (
          <div>
            {/* WEEKDAY HEADERS */}
            <div className="grid grid-cols-7 gap-px border-b border-slate-200 bg-slate-100 text-center text-xs font-bold text-slate-600">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="bg-[#F7F5EF] py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* MONTH DAYS GRID */}
            <div className="grid grid-cols-7 gap-px bg-slate-200">
              {/* Empty padding days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[110px] bg-slate-50/50 p-2" />
              ))}

              {/* Real month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                  dayNum
                ).padStart(2, "0")}`;
                const events = eventsByDate[formattedDate];
                const isToday =
                  new Date().toDateString() === new Date(year, month, dayNum).toDateString();

                return (
                  <div
                    key={formattedDate}
                    onClick={() => onCreateTask(formattedDate)}
                    className={classNames(
                      "group min-h-[110px] cursor-pointer bg-white p-2 transition-colors hover:bg-slate-50",
                      isToday && "ring-2 ring-inset ring-[#4F7150]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={classNames(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          isToday
                            ? "bg-[#4F7150] text-white"
                            : "text-slate-700 group-hover:bg-slate-100"
                        )}
                      >
                        {dayNum}
                      </span>
                    </div>

                    <div className="mt-1 space-y-1 overflow-y-auto">
                      {events?.tasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(t);
                          }}
                          className={classNames(
                            "truncate rounded px-1.5 py-0.5 text-[10px] font-semibold",
                            t.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 line-through"
                              : "bg-[#E4EEE4] text-[#4F7150]"
                          )}
                          title={`Task: ${t.title}`}
                        >
                          📋 {t.title}
                        </div>
                      ))}

                      {events?.webinars.map((w) => (
                        <div
                          key={w.id}
                          className="truncate rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700"
                          title={`Webinar: ${w.title}`}
                        >
                          🎥 {w.title}
                        </div>
                      ))}

                      {events?.social.map((s) => (
                        <div
                          key={s.id}
                          className="truncate rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700"
                          title={`Social Post: ${s.post}`}
                        >
                          📣 {s.channel}: {s.post}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* TIMELINE LIST */
          <div className="space-y-4">
            {tasks
              .filter((t) => t.due_date)
              .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
              .map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E4EEE4] font-bold text-[#4F7150]">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">
                        {task.project} &bull; Assigned to {task.assignee}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={classNames(
                        "rounded px-2 py-1 text-xs font-semibold",
                        statusClass[task.status]
                      )}
                    >
                      {task.status}
                    </span>
                    <span className="text-xs font-bold text-[#4F7150]">{task.due_date}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ============================================================
   DOCTORS VIEW
============================================================ */

function DoctorsView({
  doctors,
  search,
  setSearch,
  onAdd,
  onEdit,
  onDelete,
}: {
  doctors: Doctor[];
  search: string;
  setSearch: (v: string) => void;
  onAdd: () => void;
  onEdit: (doc: Doctor) => void;
  onDelete: (doc: Doctor) => void;
}) {
  const [specialtyFilter, setSpecialtyFilter] = useState("All");

  const specialties = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialty).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [doctors]);

  const filtered = doctors.filter((doc) => {
    const matchesSpecialty = specialtyFilter === "All" || doc.specialty === specialtyFilter;
    const text = `${doc.name} ${doc.specialty} ${doc.organization} ${doc.location} ${doc.email || ""} ${doc.phone || ""}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  return (
    <>
      <PageTitle
        title="Doctors & Key Opinion Leaders"
        subtitle="Nurture relationships with clinical thought leaders, webinar hosts, and advisors."
        actionText="Add Doctor"
        onAction={onAdd}
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        {/* SEARCH & FILTERS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctors by name, specialty, hospital..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            >
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec === "All" ? "All Specialties" : spec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-[#F7F5EF] text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-4 py-3">Specialty</th>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No doctors found. Click "Add Doctor" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4EEE4] text-xs font-bold text-[#4F7150]">
                          Dr
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{doc.name}</p>
                          {doc.notes && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                              {doc.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {doc.specialty}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs font-medium text-slate-700">
                      {doc.organization}
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-600">{doc.location}</td>

                    <td className="px-4 py-4 text-xs text-slate-600">
                      <div>{doc.email || "No email"}</div>
                      <div className="text-[11px] text-slate-400">{doc.phone || ""}</div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={classNames(
                          "rounded-md px-2 py-1 text-xs font-semibold",
                          doc.status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {doc.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(doc)}
                          title="Edit Doctor"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#4F7150]"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(doc)}
                          title="Delete Doctor"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          Showing {filtered.length} doctors
        </div>
      </div>
    </>
  );
}

/* ============================================================
   HORIZON SERIES VIEW
============================================================ */

function HorizonView({
  webinars,
  tasks,
  onScheduleWebinar,
  onAddTask,
  onTaskClick,
  onWebinarEdit,
}: {
  webinars: Webinar[];
  tasks: Task[];
  onScheduleWebinar: () => void;
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
  onWebinarEdit: (webinar: Webinar) => void;
}) {
  const nextWebinar = webinars[0];
  const horizonTasks = tasks.filter((t) => t.project.toLowerCase().includes("horizon"));

  return (
    <>
      <PageTitle
        title="Horizon Expert Series"
        subtitle="Coordinate the flagship clinical and public health speaker series."
        actionText="Schedule Series Webinar"
        onAction={onScheduleWebinar}
      />

      {/* HERO BANNER */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="relative overflow-hidden rounded-2xl bg-[#4F7150] p-7 text-white shadow-md lg:col-span-2">
          <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase">
            FLAGSHIP INITIATIVE
          </span>

          <h2 className="mt-4 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
            {nextWebinar?.title || "Horizon Series: Thought Leadership"}
          </h2>

          <p className="mt-2 text-sm text-white/80">
            {nextWebinar?.speaker ? `Keynote: ${nextWebinar.speaker}` : "Speaker: To Be Confirmed"}
          </p>

          <p className="mt-1 text-xs text-white/70">
            {nextWebinar?.event_date
              ? `Scheduled on ${nextWebinar.event_date}`
              : "Date pending scheduling"}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onScheduleWebinar}
              className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-[#4F7150] transition-colors hover:bg-slate-100"
            >
              Schedule New Episode
            </button>
            <button
              onClick={onAddTask}
              className="rounded-lg bg-white/20 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/30"
            >
              Add Production Task
            </button>
          </div>
        </section>

        {/* REGISTRATION PROGRESS */}
        <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Registration Conversion
            </p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {nextWebinar?.registered || 0}
              <span className="text-base font-medium text-slate-400">
                {" "}
                / {nextWebinar?.invited || 0}
              </span>
            </p>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#4F7150]"
                style={{
                  width: `${
                    nextWebinar?.invited
                      ? Math.min(100, Math.round((nextWebinar.registered / nextWebinar.invited) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-[#F7F5EF] p-3 text-xs text-slate-600">
            Conversion target: 60%+ for invited medical partners.
          </div>
        </section>
      </div>

      {/* HORIZON TASKS */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="font-bold text-slate-900">Horizon Production Pipeline</h3>
          <button
            onClick={onAddTask}
            className="text-xs font-semibold text-[#4F7150] hover:underline"
          >
            + Add Task
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {horizonTasks.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No tasks currently tagged under Horizon Series.
            </p>
          ) : (
            horizonTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onTaskClick(t)}
                className="flex cursor-pointer items-center justify-between py-3 transition-colors hover:bg-slate-50"
              >
                <div>
                  <p className="font-semibold text-slate-900 hover:text-[#4F7150]">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    Assignee: {t.assignee} &bull; Due: {t.due_date || "N/A"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={classNames(
                      "rounded px-2 py-1 text-xs font-semibold",
                      statusClass[t.status]
                    )}
                  >
                    {t.status}
                  </span>
                  <span className="text-xs font-bold text-slate-700">{t.progress}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

/* ============================================================
   WEBINARS VIEW
============================================================ */

function WebinarsView({
  webinars,
  search,
  setSearch,
  onAdd,
  onEdit,
  onDelete,
}: {
  webinars: Webinar[];
  search: string;
  setSearch: (v: string) => void;
  onAdd: () => void;
  onEdit: (web: Webinar) => void;
  onDelete: (web: Webinar) => void;
}) {
  const filtered = webinars.filter((w) => {
    const text = `${w.title} ${w.speaker || ""} ${w.organization || ""} ${w.status}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <>
      <PageTitle
        title="Webinar Invitations & Outreach"
        subtitle="Track keynote outreach, invitations sent, and RSVP conversion rates."
        actionText="Schedule Webinar"
        onAction={onAdd}
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        {/* SEARCH BAR */}
        <div className="flex items-center gap-3 border-b border-slate-200 p-4">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search webinars by title, speaker, organization..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-[#F7F5EF] text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Webinar Title</th>
                <th className="px-4 py-3">Keynote Speaker</th>
                <th className="px-4 py-3">Event Date</th>
                <th className="px-4 py-3">Invited</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Conversion</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No webinars found. Click "Schedule Webinar" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((web) => {
                  const rate = web.invited ? Math.round((web.registered / web.invited) * 100) : 0;
                  return (
                    <tr key={web.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-semibold text-slate-900">{web.title}</td>

                      <td className="px-4 py-4 text-xs">
                        <p className="font-semibold text-slate-800">{web.speaker || "TBD"}</p>
                        <p className="text-slate-400">{web.organization || ""}</p>
                      </td>

                      <td className="px-4 py-4 text-xs font-medium text-slate-600">
                        {web.event_date}
                      </td>

                      <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                        {web.invited}
                      </td>

                      <td className="px-4 py-4 text-xs font-semibold text-emerald-700">
                        {web.registered}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#4F7150]"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{rate}%</span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={classNames(
                            "rounded-md px-2 py-1 text-xs font-semibold",
                            web.status === "Active" || web.status === "Accepted"
                              ? "bg-emerald-50 text-emerald-700"
                              : web.status === "Completed"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          )}
                        >
                          {web.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEdit(web)}
                            title="Edit Webinar"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#4F7150]"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDelete(web)}
                            title="Delete Webinar"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          Showing {filtered.length} webinar campaigns
        </div>
      </div>
    </>
  );
}

/* ============================================================
   SOCIAL MEDIA VIEW
============================================================ */

function SocialView({
  records,
  search,
  setSearch,
  onAdd,
  onEdit,
  onDelete,
}: {
  records: SocialRecord[];
  search: string;
  setSearch: (v: string) => void;
  onAdd: () => void;
  onEdit: (rec: SocialRecord) => void;
  onDelete: (rec: SocialRecord) => void;
}) {
  const [channelFilter, setChannelFilter] = useState("All");

  const channels = ["All", "LinkedIn", "Twitter", "Facebook", "Instagram", "YouTube"];

  const filtered = records.filter((rec) => {
    const matchesChannel = channelFilter === "All" || rec.channel === channelFilter;
    const text = `${rec.post} ${rec.channel} ${rec.status}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  return (
    <>
      <PageTitle
        title="Social Media Records"
        subtitle="Manage public outreach, campaign posts, press releases, and impact analytics."
        actionText="Create Social Post"
        onAction={onAdd}
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        {/* SEARCH & FILTER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts and campaign titles..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            >
              {channels.map((ch) => (
                <option key={ch} value={ch}>
                  {ch === "All" ? "All Platforms" : ch}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-[#F7F5EF] text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Post Title / Content</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Publish Date</th>
                <th className="px-4 py-3">Reach</th>
                <th className="px-4 py-3">Engagement</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No social records found. Click "Create Social Post" to add one.
                  </td>
                </tr>
              ) : (
                filtered.map((rec) => (
                  <tr key={rec.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{rec.post}</p>
                      {rec.url && (
                        <a
                          href={rec.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#4F7150] hover:underline"
                        >
                          View link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {rec.channel}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs font-medium text-slate-600">
                      {rec.post_date}
                    </td>

                    <td className="px-4 py-4 text-xs font-bold text-slate-900">{rec.reach}</td>

                    <td className="px-4 py-4 text-xs font-semibold text-emerald-700">
                      {rec.engagement}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={classNames(
                          "rounded-md px-2 py-1 text-xs font-semibold",
                          rec.status === "Published" || rec.status === "Live"
                            ? "bg-emerald-50 text-emerald-700"
                            : rec.status === "Scheduled"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {rec.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(rec)}
                          title="Edit Post"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#4F7150]"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(rec)}
                          title="Delete Post"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          Showing {filtered.length} social media records
        </div>
      </div>
    </>
  );
}

/* ============================================================
   REPORTS & ANALYTICS VIEW
============================================================ */

function ReportsView({
  stats,
  tasks,
  doctors,
  webinars,
  socialRecords,
  onExportReport,
}: {
  stats: DashboardStats;
  tasks: Task[];
  doctors: Doctor[];
  webinars: Webinar[];
  socialRecords: SocialRecord[];
  onExportReport: () => void;
}) {
  const totalInvited = webinars.reduce((sum, w) => sum + (w.invited || 0), 0);
  const totalRegistered = webinars.reduce((sum, w) => sum + (w.registered || 0), 0);
  const conversionRate = totalInvited ? Math.round((totalRegistered / totalInvited) * 100) : 0;

  const totalReach = socialRecords.reduce((sum, s) => sum + (s.raw_reach || 0), 0);
  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wider text-[#4F7150] uppercase">
            Performance & Insights
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time analytics across PR campaigns, medical outreach, and media coverage.
          </p>
        </div>

        <button
          onClick={onExportReport}
          className="flex items-center gap-2 rounded-lg bg-[#4F7150] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#3f5c40] active:scale-95"
        >
          <Download className="h-4 w-4" />
          Export PR Report (CSV)
        </button>
      </div>

      {/* METRICS CARDS */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase">Task Completion Rate</p>
          <p className="mt-2 text-3xl font-extrabold text-[#4F7150]">{completionRate}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#4F7150]" style={{ width: `${completionRate}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {stats.completed} of {stats.total} total PR deliverables completed
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase">Webinar RSVP Conversion</p>
          <p className="mt-2 text-3xl font-extrabold text-blue-700">{conversionRate}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${conversionRate}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {totalRegistered} registrations from {totalInvited} medical invitations
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Social Reach</p>
          <p className="mt-2 text-3xl font-extrabold text-purple-700">
            {totalReach >= 1000 ? `${(totalReach / 1000).toFixed(1)}K` : totalReach}
          </p>
          <p className="mt-3 text-[11px] text-slate-500">
            Across {socialRecords.length} campaigns & press announcements
          </p>
        </div>
      </div>

      {/* DETAILED STATS */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="font-bold text-slate-900">Task Stage Distribution</h3>
          <div className="mt-6 space-y-4">
            {(["To Do", "In Progress", "Under Review", "Completed"] as const).map((st) => {
              const count = tasks.filter((t) => t.status === st).length;
              const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={st}>
                  <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-700">
                    <span>{st}</span>
                    <span>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={classNames(
                        "h-full rounded-full",
                        st === "Completed"
                          ? "bg-emerald-600"
                          : st === "Under Review"
                          ? "bg-blue-600"
                          : st === "In Progress"
                          ? "bg-amber-500"
                          : "bg-slate-400"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="font-bold text-slate-900">Medical Outreach Breakdown</h3>
          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700">
                <span>Active Key Opinion Leaders</span>
                <span>{doctors.filter((d) => d.status === "Active").length} doctors</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#4F7150]"
                  style={{
                    width: `${
                      doctors.length
                        ? Math.round(
                            (doctors.filter((d) => d.status === "Active").length / doctors.length) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700">
                <span>Completed Webinar Programs</span>
                <span>
                  {webinars.filter((w) => w.status === "Completed" || w.status === "Active").length}{" "}
                  webinars
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${
                      webinars.length
                        ? Math.round(
                            (webinars.filter(
                              (w) => w.status === "Completed" || w.status === "Active"
                            ).length /
                              webinars.length) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

/* ============================================================
   NOTIFICATIONS VIEW
============================================================ */

function NotificationsView({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNewAnnouncement,
  onDeleteNotif,
}: {
  notifications: Notification[];
  onMarkRead: (id: string | number) => void;
  onMarkAllRead: () => void;
  onNewAnnouncement: () => void;
  onDeleteNotif: (n: Notification) => void;
}) {
  const [filter, setFilter] = useState<"All" | "Unread">("All");

  const filtered = notifications.filter((n) => (filter === "Unread" ? !n.is_read : true));

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wider text-[#4F7150] uppercase">
            Team Alerts & Notices
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Stay updated on assignments, deadline alerts, milestones, and announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={onMarkAllRead}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Mark all as read
            </button>
          )}

          <button
            onClick={onNewAnnouncement}
            className="flex items-center gap-2 rounded-lg bg-[#4F7150] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#3f5c40] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Send Notice
          </button>
        </div>
      </div>

      <div className="max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xs">
        {/* TABS */}
        <div className="flex gap-2 border-b border-slate-200 p-4">
          <button
            onClick={() => setFilter("All")}
            className={classNames(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === "All"
                ? "bg-[#4F7150] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("Unread")}
            className={classNames(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === "Unread"
                ? "bg-[#4F7150] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Unread ({notifications.filter((n) => !n.is_read).length})
          </button>
        </div>

        {/* LIST */}
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">
              No notifications in this view.
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className={classNames(
                  "flex items-start justify-between gap-4 p-5 transition-colors",
                  !n.is_read && "bg-[#E4EEE4]/30"
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={classNames(
                      "mt-1 h-3 w-3 shrink-0 rounded-full",
                      n.is_read ? "bg-slate-300" : "bg-red-500"
                    )}
                  />
                  <div>
                    <p
                      className={classNames(
                        "text-sm",
                        n.is_read ? "text-slate-700" : "font-bold text-slate-900"
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{n.source || "PR Workspace"}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {!n.is_read && (
                    <button
                      onClick={() => onMarkRead(n.id)}
                      className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-[#4F7150] shadow-2xs ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteNotif(n)}
                    title="Delete notification"
                    className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

/* ============================================================
   TEAM MEMBERS VIEW
============================================================ */

function TeamView({
  team,
  tasks,
  onAdd,
  onEdit,
  onDelete,
}: {
  team: TeamMember[];
  tasks: Task[];
  onAdd: () => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
}) {
  return (
    <>
      <PageTitle
        title="Public Relations Team"
        subtitle="Manage member roles, active workloads, and team productivity scores."
        actionText="Add Team Member"
        onAction={onAdd}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-[#F7F5EF] text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Team Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Assigned Tasks</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Productivity Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm">
            {team.map((person) => (
              <tr key={person.id} className="transition-colors hover:bg-slate-50/70">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar initials={person.initials} size="md" />
                    <div>
                      <p className="font-semibold text-slate-900">{person.name}</p>
                      <p className="text-xs text-slate-400">{person.email || "pr.member@jcf.org"}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span className="rounded bg-[#E4EEE4] px-2.5 py-1 text-xs font-semibold text-[#4F7150]">
                    {person.role}
                  </span>
                </td>

                <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                  {person.assigned_tasks} tasks
                </td>

                <td className="px-4 py-4 text-xs font-semibold text-emerald-700">
                  {person.completed_tasks} tasks
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{ width: `${person.productivity}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-emerald-700">
                      {person.productivity}%
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={classNames(
                      "rounded-md px-2 py-0.5 text-xs font-medium",
                      person.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    )}
                  >
                    {person.status || "active"}
                  </span>
                </td>

                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(person)}
                      title="Edit Member"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#4F7150]"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(person)}
                      title="Remove Member"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ============================================================
   SETTINGS VIEW
============================================================ */

function SettingsView({
  userName,
  userEmail,
  userRole,
  role,
  setRole,
  onLogout,
}: {
  userName: string;
  userEmail: string;
  userRole: string;
  role: string;
  setRole: (v: string) => void;
  onLogout: () => void;
}) {
  const [taskAlerts, setTaskAlerts] = useState(true);
  const [webinarAlerts, setWebinarAlerts] = useState(true);
  const [socialAlerts, setSocialAlerts] = useState(false);

  return (
    <>
      <PageTitle
        title="Settings & Workspace Preferences"
        subtitle="Manage your profile, active PR role capabilities, and notification channels."
        action={false}
      />

      <div className="max-w-3xl space-y-6">
        {/* PROFILE CARD */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="font-bold text-slate-900">User Profile</h2>
          <div className="mt-4 flex items-center gap-4">
            <Avatar initials={userName.slice(0, 2).toUpperCase()} size="lg" />
            <div>
              <p className="font-bold text-slate-900">{userName}</p>
              <p className="text-xs text-slate-500">{userEmail}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded bg-[#E4EEE4] px-2 py-0.5 text-xs font-semibold text-[#4F7150]">
                  Department: Public Relations
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  Role: {userRole}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ROLE SIMULATION */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="font-bold text-slate-900">Workspace Role Selector</h2>
          <p className="mt-1 text-xs text-slate-500">
            Switch your active view capability for testing different PR permissions.
          </p>

          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              toast.success(`Active workspace role set to ${e.target.value}`);
            }}
            className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#4F7150] focus:ring-2 focus:ring-[#4F7150]/20"
          >
            <option>Project Manager</option>
            <option>PR Coordinator</option>
            <option>Social Media Manager</option>
            <option>PR Intern</option>
          </select>
        </section>

        {/* NOTIFICATION PREFERENCES */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="font-bold text-slate-900">Alert Preferences</h2>
          <div className="mt-4 space-y-3 text-sm">
            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-slate-700">Task deadline reminders</span>
              <input
                type="checkbox"
                checked={taskAlerts}
                onChange={(e) => {
                  setTaskAlerts(e.target.checked);
                  toast.success("Preferences updated");
                }}
                className="h-4 w-4 rounded text-[#4F7150] accent-[#4F7150]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-slate-700">Webinar speaker RSVPs</span>
              <input
                type="checkbox"
                checked={webinarAlerts}
                onChange={(e) => {
                  setWebinarAlerts(e.target.checked);
                  toast.success("Preferences updated");
                }}
                className="h-4 w-4 rounded text-[#4F7150] accent-[#4F7150]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-slate-700">Social milestone alerts</span>
              <input
                type="checkbox"
                checked={socialAlerts}
                onChange={(e) => {
                  setSocialAlerts(e.target.checked);
                  toast.success("Preferences updated");
                }}
                className="h-4 w-4 rounded text-[#4F7150] accent-[#4F7150]"
              />
            </label>
          </div>
        </section>

        {/* SIGNOUT BUTTON */}
        <section className="rounded-xl border border-red-200 bg-red-50/50 p-6">
          <h2 className="font-bold text-red-900">Account Session</h2>
          <p className="mt-1 text-xs text-red-700">
            Sign out of your session on this workstation.
          </p>
          <button
            onClick={onLogout}
            className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-red-700 active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            Sign Out Now
          </button>
        </section>
      </div>
    </>
  );
}

/* ============================================================
   MODALS IMPLEMENTATION
============================================================ */

function ModalWrapper({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95"
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

// 1. Task Modal
function TaskModal({
  task,
  initialStatus,
  teamMembers,
  onClose,
  onSave,
}: {
  task: Task | null;
  initialStatus: Status;
  teamMembers: TeamMember[];
  onClose: () => void;
  onSave: (data: Partial<Task>) => void;
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [project, setProject] = useState(task?.project || "PR Workspace");
  const [assignee, setAssignee] = useState(task?.assignee || "Amelia Martin");
  const [priority, setPriority] = useState<Priority>(task?.priority || "Medium");
  const [status, setStatus] = useState<Status>(task?.status || initialStatus);
  const [dueDate, setDueDate] = useState(task?.due_date || "");
  const [progress, setProgress] = useState(task?.progress || 0);
  const [risk, setRisk] = useState(task?.risk || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    const initials = assignee
      ? assignee
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "PM";

    onSave({
      title: title.trim(),
      project: project.trim(),
      assignee: assignee.trim(),
      initials,
      priority,
      status,
      due_date: dueDate || undefined,
      progress: status === "Completed" ? 100 : Number(progress),
      risk: risk.trim() || undefined,
    });
  };

  return (
    <ModalWrapper
      title={task ? "Edit Task" : "Create New PR Task"}
      subtitle="Fill in deliverable details and assign to team members."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
        <div>
          <label className="block text-slate-700">Task Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Schedule Dr. Kumar cardiology interview"
            className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150] focus:ring-2 focus:ring-[#4F7150]/20"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700">Project / Campaign</label>
            <input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. Horizon Series"
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>

          <div>
            <label className="block text-slate-700">Assignee</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            >
              {teamMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} ({m.role})
                </option>
              ))}
              <option value="PR Member">PR Member</option>
              <option value="Amelia Martin">Amelia Martin</option>
              <option value="Raj Patel">Raj Patel</option>
              <option value="Sarah Chen">Sarah Chen</option>
              <option value="Michael Johnson">Michael Johnson</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700">Status</label>
            <select
              value={status}
              onChange={(e) => {
                const s = e.target.value as Status;
                setStatus(s);
                if (s === "Completed") setProgress(100);
              }}
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Under Review">Under Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>

          <div>
            <label className="block text-slate-700">Progress ({progress}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="mt-3.5 w-full accent-[#4F7150]"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700">Risk / Blocker Note (Optional)</label>
          <input
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            placeholder="e.g. Awaiting clinical director approval"
            className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#4F7150] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#3f5c40]"
          >
            {task ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// 2. Task Details Modal
function TaskDetailModal({
  task,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: Status) => void;
}) {
  return (
    <ModalWrapper title="Task Overview" subtitle={task.project} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{task.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={classNames(
                "rounded px-2 py-0.5 text-xs font-semibold",
                priorityClass[task.priority]
              )}
            >
              {task.priority} Priority
            </span>
            <span
              className={classNames(
                "rounded px-2 py-0.5 text-xs font-semibold",
                statusClass[task.status]
              )}
            >
              {task.status}
            </span>
          </div>
        </div>

        {task.risk && (
          <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-3 text-xs font-medium text-red-800">
            ⚠️ <strong>Risk Identified:</strong> {task.risk}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#F7F5EF] p-4 text-xs">
          <div>
            <p className="text-slate-500">Assignee</p>
            <p className="mt-1 font-bold text-slate-900">{task.assignee}</p>
          </div>
          <div>
            <p className="text-slate-500">Due Date</p>
            <p className="mt-1 font-bold text-slate-900">{task.due_date || "None"}</p>
          </div>
          <div>
            <p className="text-slate-500">Progress</p>
            <p className="mt-1 font-bold text-slate-900">{task.progress}%</p>
          </div>
          <div>
            <p className="text-slate-500">Project</p>
            <p className="mt-1 font-bold text-slate-900">{task.project}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-700">Quick Status Change:</p>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {(["To Do", "In Progress", "Under Review", "Completed"] as const).map((st) => (
              <button
                key={st}
                onClick={() => onStatusChange(st)}
                className={classNames(
                  "rounded-md py-1.5 text-center text-xs font-semibold transition-colors",
                  task.status === st
                    ? "bg-[#4F7150] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-between border-t border-slate-100 pt-4">
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Task
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg bg-[#4F7150] px-4 py-2 text-xs font-bold text-white hover:bg-[#3f5c40]"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

// 3. Doctor Modal
function DoctorModal({
  doctor,
  onClose,
  onSave,
}: {
  doctor: Doctor | null;
  onClose: () => void;
  onSave: (d: Partial<Doctor>) => void;
}) {
  const [name, setName] = useState(doctor?.name || "");
  const [specialty, setSpecialty] = useState(doctor?.specialty || "Cardiology");
  const [organization, setOrganization] = useState(doctor?.organization || "");
  const [location, setLocation] = useState(doctor?.location || "");
  const [status, setStatus] = useState(doctor?.status || "Active");
  const [email, setEmail] = useState(doctor?.email || "");
  const [phone, setPhone] = useState(doctor?.phone || "");
  const [notes, setNotes] = useState(doctor?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Doctor name is required");
      return;
    }
    onSave({
      name: name.trim(),
      specialty: specialty.trim(),
      organization: organization.trim(),
      location: location.trim(),
      status,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <ModalWrapper
      title={doctor ? "Edit Doctor Profile" : "Add Doctor / KOL"}
      subtitle="Enter details for clinical outreach and webinar partnerships."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
        <div>
          <label className="block">Doctor Full Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Rajesh Kumar"
            className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block">Specialty</label>
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Cardiology"
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>

          <div>
            <label className="block">Relationship Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block">Hospital / Clinic Affiliation</label>
            <input
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. City General Hospital"
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>

          <div>
            <label className="block">City / Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Mumbai, India"
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="r.kumar@hospital.org"
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>

          <div>
            <label className="block">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91-98765-43210"
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>
        </div>

        <div>
          <label className="block">Notes / Collaboration Topics</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special interest in rural cardiology workshops"
            className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#4F7150] px-5 py-2 text-xs font-bold text-white hover:bg-[#3f5c40]"
          >
            {doctor ? "Save Changes" : "Add Doctor"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// 4. Webinar Modal
function WebinarModal({
  webinar,
  doctors,
  onClose,
  onSave,
}: {
  webinar: Webinar | null;
  doctors: Doctor[];
  onClose: () => void;
  onSave: (w: Partial<Webinar>) => void;
}) {
  const [title, setTitle] = useState(webinar?.title || "");
  const [speaker, setSpeaker] = useState(webinar?.speaker || "");
  const [organization, setOrganization] = useState(webinar?.organization || "");
  const [email, setEmail] = useState(webinar?.email || "");
  const [eventDate, setEventDate] = useState(webinar?.event_date || "");
  const [status, setStatus] = useState(webinar?.status || "Planning");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Webinar title is required");
      return;
    }
    onSave({
      title: title.trim(),
      speaker: speaker.trim() || undefined,
      organization: organization.trim() || undefined,
      email: email.trim() || undefined,
      event_date: eventDate || new Date().toISOString().split("T")[0],
      status,
    });
  };

  return (
    <ModalWrapper
      title={webinar ? "Edit Webinar" : "Schedule Webinar"}
      subtitle="Plan Horizon and community health expert webinars."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
        <div>
          <label className="block">Webinar Topic / Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Advances in Pediatric Nutrition"
            className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block">Keynote Speaker</label>
            <input
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              placeholder="e.g. Dr. Priya Singh"
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>

          <div>
            <label className="block">Speaker Organization</label>
            <input
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Childrens Care Center"
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block">Event Date</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>

          <div>
            <label className="block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            >
              <option value="Planning">Planning / Sent</option>
              <option value="Active">Active / Accepted</option>
              <option value="Completed">Completed</option>
              <option value="Declined">Declined</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block">Speaker Contact Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="speaker@hospital.org"
            className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#4F7150] px-5 py-2 text-xs font-bold text-white hover:bg-[#3f5c40]"
          >
            {webinar ? "Save Changes" : "Schedule Webinar"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// 5. Social Media Modal
function SocialModal({
  record,
  onClose,
  onSave,
}: {
  record: SocialRecord | null;
  onClose: () => void;
  onSave: (s: Partial<SocialRecord>) => void;
}) {
  const [post, setPost] = useState(record?.post || "");
  const [channel, setChannel] = useState(record?.channel || "LinkedIn");
  const [postDate, setPostDate] = useState(record?.post_date || "");
  const [reach, setReach] = useState(String(record?.raw_reach || record?.reach || 0));
  const [engagement, setEngagement] = useState(
    String(record?.raw_engagement || record?.engagement || 0)
  );
  const [status, setStatus] = useState(record?.status || "Published");
  const [url, setUrl] = useState(record?.url || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!post.trim()) {
      toast.error("Post content is required");
      return;
    }
    onSave({
      post: post.trim(),
      channel,
      post_date: postDate || new Date().toISOString().split("T")[0],
      reach: reach.trim(),
      engagement: engagement.trim(),
      status,
      url: url.trim() || undefined,
    });
  };

  return (
    <ModalWrapper
      title={record ? "Edit Social Record" : "Create Social Post"}
      subtitle="Log publication details, reach, and engagement metrics."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
        <div>
          <label className="block">Post Title / Content Description *</label>
          <textarea
            rows={3}
            value={post}
            onChange={(e) => setPost(e.target.value)}
            placeholder="e.g. Dr. Kumar keynote highlights on senior cardiovascular health"
            className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block">Platform / Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            >
              <option value="LinkedIn">LinkedIn</option>
              <option value="Twitter">Twitter / X</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="YouTube">YouTube</option>
            </select>
          </div>

          <div>
            <label className="block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            >
              <option value="Published">Published</option>
              <option value="Live">Live Campaign</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block">Impressions / Reach Count</label>
            <input
              value={reach}
              onChange={(e) => setReach(e.target.value)}
              placeholder="e.g. 5200 or 5.2K"
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>

          <div>
            <label className="block">Interactions / Engagements</label>
            <input
              value={engagement}
              onChange={(e) => setEngagement(e.target.value)}
              placeholder="e.g. 320"
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block">Published Date</label>
            <input
              type="date"
              value={postDate}
              onChange={(e) => setPostDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>

          <div>
            <label className="block">Post Link / URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://linkedin.com/post/..."
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#4F7150] px-5 py-2 text-xs font-bold text-white hover:bg-[#3f5c40]"
          >
            {record ? "Save Changes" : "Create Record"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// 6. Team Member Modal
function TeamMemberModal({
  member,
  onClose,
  onSave,
}: {
  member: TeamMember | null;
  onClose: () => void;
  onSave: (m: Partial<TeamMember>) => void;
}) {
  const [name, setName] = useState(member?.name || "");
  const [role, setRole] = useState(member?.role || "PR Coordinator");
  const [email, setEmail] = useState(member?.email || "");
  const [status, setStatus] = useState(member?.status || "active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Member name is required");
      return;
    }
    onSave({
      name: name.trim(),
      role: role.trim(),
      email: email.trim() || undefined,
      status,
    });
  };

  return (
    <ModalWrapper
      title={member ? "Edit Team Member" : "Add Team Member"}
      subtitle="Manage PR workspace member directory."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
        <div>
          <label className="block">Full Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Chen"
            className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block">Workspace Role</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. PR Coordinator"
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            />
          </div>

          <div>
            <label className="block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            >
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block">Official Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah.chen@jcf.org"
            className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#4F7150] px-5 py-2 text-xs font-bold text-white hover:bg-[#3f5c40]"
          >
            {member ? "Save Member" : "Add Member"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// 7. Announcement Modal
function AnnouncementModal({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (title: string, message: string, type: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("task");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Announcement title is required");
      return;
    }
    onSend(title.trim(), message.trim(), type);
  };

  return (
    <ModalWrapper
      title="Broadcast Announcement"
      subtitle="Send high-priority notice to all PR workspace members."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
        <div>
          <label className="block">Notice Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Horizon Series speaker confirmed"
            className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
            required
          />
        </div>

        <div>
          <label className="block">Notice Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
          >
            <option value="task">Task Assignment</option>
            <option value="deadline">Deadline Reminder</option>
            <option value="milestone">Milestone / Achievement</option>
            <option value="update">General Workspace Update</option>
          </select>
        </div>

        <div>
          <label className="block">Message Details</label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Additional context or links for the PR team..."
            className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-[#4F7150]"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-[#4F7150] px-5 py-2 text-xs font-bold text-white hover:bg-[#3f5c40]"
          >
            <Send className="h-3.5 w-3.5" />
            Send Notice
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// 8. Reusable Delete Confirmation
function DeleteConfirmDialog({
  title,
  message,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-1.5 text-xs text-slate-500">{message}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 active:scale-95"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}