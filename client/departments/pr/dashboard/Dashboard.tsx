import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Filter,
  GripVertical,
  LayoutDashboard,
  ListTodo,
  Menu,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings,
  Share2,
  TrendingUp,
  Users,
  X,
  MessageCircle,
  UserRound,
  Database,
  Video,
  Calendar,
} from "lucide-react";

const API = "http://localhost:5000/api";

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

type Status =
  | "To Do"
  | "In Progress"
  | "Under Review"
  | "Completed";

type Priority = "High" | "Medium" | "Low";

type Task = {
  id: number;
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
  id: number;
  name: string;
  specialty: string;
  organization: string;
  location: string;
  status: string;
};

type Webinar = {
  id: number;
  title: string;
  event_date: string;
  invited: number;
  registered: number;
  status: string;
};

type SocialRecord = {
  id: number;
  post: string;
  channel: string;
  post_date: string;
  reach: string;
  engagement: string;
  status: string;
};

type Notification = {
  id: number;
  type: string;
  title: string;
  source?: string;
  is_read: boolean;
  created_at: string;
};

type TeamMember = {
  id: number;
  name: string;
  role: string;
  assigned_tasks: number;
  completed_tasks: number;
  productivity: number;
  initials: string;
};

type DashboardStats = {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  upcoming: number;
};

const navigation: {
  label: View;
  icon: typeof LayoutDashboard;
}[] = [
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
  { label: "Settings", icon: Settings },
];

const classNames = (
  ...values: (string | false | undefined)[]
) => values.filter(Boolean).join(" ");

const statusClass: Record<Status, string> = {
  "To Do": "bg-slate-100 text-slate-600",
  "In Progress": "bg-amber-50 text-amber-700",
  "Under Review": "bg-blue-50 text-blue-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

const priorityClass: Record<Priority, string> = {
  High: "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-emerald-50 text-emerald-600",
};

function Avatar({ initials }: { initials?: string }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E4EEE4] text-[10px] font-bold text-[#4F7150]">
      {initials || "??"}
    </span>
  );
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  change: string;
  icon: typeof ClipboardList;
  tone: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className={classNames("rounded-lg p-2.5", tone)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-emerald-600">
        <TrendingUp className="mr-1 inline h-3.5 w-3.5" />
        {change}
      </p>
    </div>
  );
}

function TaskCard({
  task,
  onDragStart,
}: {
  task: Task;
  onDragStart: () => void;
}) {
  return (
    <article
      draggable
      onDragStart={onDragStart}
      className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-2">
        <span
          className={classNames(
            "mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold",
            priorityClass[task.priority]
          )}
        >
          {task.priority}
        </span>

        <GripVertical className="ml-auto h-4 w-4 text-slate-300" />
      </div>

      <h4 className="mt-2.5 text-sm font-semibold leading-5 text-slate-900">
        {task.title}
      </h4>

      <p className="mt-1 text-xs text-slate-500">
        {task.project}
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#4F7150]"
          style={{ width: `${task.progress || 0}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Avatar initials={task.initials} />

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-0.5">
            <MessageCircle className="h-3.5 w-3.5" />
            {task.comments || 0}
          </span>

          <span className="flex items-center gap-0.5">
            <Paperclip className="h-3.5 w-3.5" />
            {task.attachments || 0}
          </span>

          <span className="font-medium">
            {task.due_date || "No date"}
          </span>
        </div>
      </div>
    </article>
  );
}

function PageTitle({
  title,
  subtitle,
  action = true,
  onCreate,
}: {
  title: string;
  subtitle: string;
  action?: boolean;
  onCreate?: () => void;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-[#4F7150]">
          PR TEAM WORKSPACE
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {subtitle}
        </p>
      </div>

      {action && (
        <button
          onClick={onCreate}
          className="flex items-center gap-2 rounded-lg bg-[#4F7150] px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-[#3f5c40]"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </button>
      )}
    </div>
  );
}

export default function PRDashboard() {
  const [view, setView] = useState<View>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const [filter, setFilter] = useState<"All" | Status>("All");

  const [draggedTask, setDraggedTask] =
    useState<number | null>(null);

  const [noticeOpen, setNoticeOpen] = useState(false);

  const [role, setRole] = useState("Project Manager");

  const [loading, setLoading] = useState(true);

  /*
   * FETCH ALL DATA FROM BACKEND
   */

  const fetchTasks = async () => {
    const response = await fetch(`${API}/tasks`);

    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }

    const data = await response.json();
    setTasks(data);
  };

  const fetchDoctors = async () => {
    const response = await fetch(`${API}/doctors`);

    if (!response.ok) {
      throw new Error("Failed to fetch doctors");
    }

    const data = await response.json();
    setDoctors(data);
  };

  const fetchWebinars = async () => {
    const response = await fetch(`${API}/webinars`);

    if (!response.ok) {
      throw new Error("Failed to fetch webinars");
    }

    const data = await response.json();
    setWebinars(data);
  };

  const fetchSocial = async () => {
    const response = await fetch(`${API}/social`);

    if (!response.ok) {
      throw new Error("Failed to fetch social records");
    }

    const data = await response.json();
    setSocialRecords(data);
  };

  const fetchNotifications = async () => {
    const response = await fetch(
      `${API}/notifications`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }

    const data = await response.json();
    setNotifications(data);
  };

  const fetchTeam = async () => {
    const response = await fetch(`${API}/team`);

    if (!response.ok) {
      throw new Error("Failed to fetch team");
    }

    const data = await response.json();
    setTeam(data);
  };

  const fetchStats = async () => {
    const response = await fetch(
      `${API}/dashboard/stats`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard stats");
    }

    const data = await response.json();
    setStats(data);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      await Promise.all([
        fetchTasks(),
        fetchDoctors(),
        fetchWebinars(),
        fetchSocial(),
        fetchNotifications(),
        fetchTeam(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error("Dashboard loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /*
   * SEARCH + FILTER
   */

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        filter === "All" || task.status === filter;

      const text =
        `${task.title} ${task.project} ${task.assignee}`.toLowerCase();

      const matchesSearch = text.includes(
        query.toLowerCase()
      );

      return matchesStatus && matchesSearch;
    });
  }, [tasks, query, filter]);

  /*
   * NAVIGATION
   */

  const changeView = (next: View) => {
    setView(next);
    setSidebarOpen(false);
  };

  /*
   * KANBAN UPDATE
   */

  const moveTask = async (status: Status) => {
    if (!draggedTask) return;

    try {
      const response = await fetch(
        `${API}/tasks/${draggedTask}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();

      setTasks((items) =>
        items.map((item) =>
          item.id === updatedTask.id
            ? updatedTask
            : item
        )
      );

      fetchStats();
    } catch (error) {
      console.error("Task update error:", error);
    }

    setDraggedTask(null);
  };

  /*
   * CREATE TASK
   */

  const createTask = async () => {
    const title = window.prompt("Enter task title:");

    if (!title) return;

    try {
      const response = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          project: "PR Workspace",
          status: "To Do",
          priority: "Medium",
          assignee: "Amelia",
          initials: "AM",
          progress: 0,
          comments: 0,
          attachments: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const newTask = await response.json();

      setTasks((prev) => [newTask, ...prev]);

      fetchStats();
    } catch (error) {
      console.error("Create task error:", error);
    }
  };

  /*
   * CURRENT VIEW
   */

  const content = () => {
    if (loading) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-sm text-slate-500">
            Loading workspace...
          </div>
        </div>
      );
    }

    if (view === "Dashboard") {
      return (
        <DashboardHome
          stats={stats}
          tasks={tasks}
          notifications={notifications}
          onNavigate={changeView}
        />
      );
    }

    if (view === "Kanban Board") {
      return (
        <Kanban
          tasks={tasks}
          setDraggedTask={setDraggedTask}
          moveTask={moveTask}
          onCreate={createTask}
        />
      );
    }

    if (view === "My Tasks") {
      return (
        <TasksView
          tasks={filteredTasks}
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
        />
      );
    }

    if (view === "Calendar") {
      return <CalendarView tasks={tasks} />;
    }

    if (view === "Doctors Database") {
      return (
        <DoctorsView
          doctors={doctors}
          search={query}
          setSearch={setQuery}
        />
      );
    }

    if (view === "Webinar Invitations") {
      return (
        <WebinarsView
          webinars={webinars}
          search={query}
          setSearch={setQuery}
        />
      );
    }

    if (view === "Horizon Series") {
      return (
        <HorizonView
          webinars={webinars}
          tasks={tasks}
        />
      );
    }

    if (view === "Social Media Records") {
      return (
        <SocialView
          records={socialRecords}
          search={query}
          setSearch={setQuery}
        />
      );
    }

    if (view === "Reports & Analytics") {
      return (
        <Reports
          stats={stats}
          webinars={webinars}
          socialRecords={socialRecords}
        />
      );
    }

    if (view === "Notifications") {
      return (
        <NotificationsView
          notifications={notifications}
          refresh={fetchNotifications}
        />
      );
    }

    if (view === "Team Members") {
      return <TeamView team={team} />;
    }

    return (
      <SettingsView
        role={role}
        setRole={setRole}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans text-slate-900">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#4F7150] text-white transition-transform duration-300 lg:translate-x-0",
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        )}
      >
        <div className="flex h-[73px] items-center gap-3 border-b border-white/15 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white font-bold text-[#4F7150]">
            JC
          </div>

          <div>
            <p className="font-bold tracking-tight">
              JCF Central
            </p>

            <p className="text-[10px] text-white/65">
              PUBLIC RELATIONS
            </p>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navigation.map(
            ({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => changeView(label)}
                className={classNames(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  view === label
                    ? "bg-white/20 font-semibold"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />

                <span>{label}</span>

                {label === "Notifications" &&
                  notifications.filter(
                    (n) => !n.is_read
                  ).length > 0 && (
                    <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {
                        notifications.filter(
                          (n) => !n.is_read
                        ).length
                      }
                    </span>
                  )}
              </button>
            )
          )}
        </nav>

        <div className="border-t border-white/15 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
            <Avatar initials="AM" />

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">
                Amelia Martin
              </p>

              <p className="truncate text-[10px] text-white/65">
                {role}
              </p>
            </div>

            <ChevronDown className="ml-auto h-4 w-4 text-white/70" />
          </div>
        </div>
      </aside>

      {/* MAIN */}

      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[73px] items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden max-w-md flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-[#F7F5EF] px-3 py-2 sm:flex">
            <Search className="h-4 w-4 text-slate-400" />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search tasks, doctors, or records..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="ml-auto hidden text-right xl:block">
            <p className="text-xs font-semibold">
              {new Date().toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }
              )}
            </p>

            <p className="text-[11px] text-slate-500">
              PR Workspace
            </p>
          </div>

          <div className="h-8 border-l border-slate-200" />

          <button
            onClick={() =>
              setNoticeOpen(!noticeOpen)
            }
            className="relative rounded-lg p-2 hover:bg-slate-100"
          >
            <Bell className="h-5 w-5" />

            {notifications.some(
              (n) => !n.is_read
            ) && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          <Avatar initials="AM" />

          <button
            onClick={createTask}
            className="hidden items-center gap-2 rounded-lg bg-[#4F7150] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3f5c40] sm:flex"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </button>

          {noticeOpen && (
            <div className="absolute right-20 top-16 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <p className="px-2 pb-2 text-sm font-bold">
                Notifications
              </p>

              {notifications.length === 0 ? (
                <p className="p-3 text-xs text-slate-500">
                  No notifications
                </p>
              ) : (
                notifications
                  .slice(0, 3)
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className="rounded-lg bg-[#F7F5EF] p-2 text-xs"
                    >
                      {notification.title}
                    </div>
                  ))
              )}
            </div>
          )}
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {content()}
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

function DashboardHome({
  stats,
  tasks,
  notifications,
  onNavigate,
}: {
  stats: DashboardStats;
  tasks: Task[];
  notifications: Notification[];
  onNavigate: (value: View) => void;
}) {
  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  );

  return (
    <>
      <PageTitle
        title="Good morning, Amelia"
        subtitle="Here’s how the PR team is moving key initiatives forward."
        onCreate={() => onNavigate("My Tasks")}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Total Tasks"
          value={String(stats.total)}
          change="Live"
          icon={ClipboardList}
          tone="bg-[#E4EEE4] text-[#4F7150]"
        />

        <MetricCard
          title="Pending Tasks"
          value={String(stats.pending)}
          change="Live"
          icon={Clock3}
          tone="bg-amber-50 text-amber-600"
        />

        <MetricCard
          title="Completed"
          value={String(stats.completed)}
          change="Live"
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-600"
        />

        <MetricCard
          title="Overdue Tasks"
          value={String(stats.overdue)}
          change="Live"
          icon={AlertTriangle}
          tone="bg-red-50 text-red-600"
        />

        <MetricCard
          title="Upcoming Deadlines"
          value={String(stats.upcoming)}
          change="Live"
          icon={Calendar}
          tone="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">
                Task productivity
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Current workspace tasks
              </p>
            </div>

            <button
              onClick={() =>
                onNavigate("Reports & Analytics")
              }
              className="text-xs font-semibold text-[#4F7150] hover:underline"
            >
              View report
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500">
                No tasks available.
              </p>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <div key={task.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{task.title}</span>
                    <span>
                      {task.progress || 0}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#4F7150]"
                      style={{
                        width: `${task.progress || 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">
              Upcoming deadlines
            </h2>

            <CalendarDays className="h-4 w-4 text-[#4F7150]" />
          </div>

          <div className="mt-5 space-y-4">
            {tasks
              .filter(
                (task) => task.status !== "Completed"
              )
              .slice(0, 4)
              .map((task) => (
                <div
                  key={task.id}
                  className="border-l-2 border-[#4F7150] pl-3"
                >
                  <p className="text-xs font-semibold">
                    {task.due_date || "No date"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {task.title}
                  </p>
                </div>
              ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
          <h2 className="font-bold">
            Recent notifications
          </h2>

          <div className="mt-4 divide-y divide-slate-200">
            {notifications
              .slice(0, 5)
              .map((notification) => (
                <div
                  key={notification.id}
                  className="flex gap-3 py-3"
                >
                  <Bell className="mt-1 h-4 w-4 text-[#4F7150]" />

                  <div>
                    <p className="text-xs font-medium">
                      {notification.title}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-400">
                      {notification.source || "Workspace"}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">
              Attention needed
            </h2>

            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>

          <div className="mt-4 space-y-3">
            {tasks
              .filter(
                (task) =>
                  task.risk &&
                  task.status !== "Completed"
              )
              .slice(0, 4)
              .map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border-l-4 border-red-400 bg-red-50 p-3"
                >
                  <p className="text-xs font-semibold text-red-700">
                    {task.title}
                  </p>

                  <p className="mt-1 text-[11px] text-red-600">
                    Risk: {task.risk}
                  </p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </>
  );
}

/* ============================================================
   KANBAN
============================================================ */

function Kanban({
  tasks,
  setDraggedTask,
  moveTask,
  onCreate,
}: {
  tasks: Task[];
  setDraggedTask: (id: number) => void;
  moveTask: (status: Status) => void;
  onCreate: () => void;
}) {
  const columns: Status[] = [
    "To Do",
    "In Progress",
    "Under Review",
    "Completed",
  ];

  return (
    <>
      <PageTitle
        title="Kanban Board"
        subtitle="Move PR work forward across the team’s delivery workflow."
        onCreate={onCreate}
      />

      <div className="grid min-w-[980px] grid-cols-4 gap-4 overflow-x-auto pb-4">
        {columns.map((column, index) => {
          const items = tasks.filter(
            (task) => task.status === column
          );

          return (
            <section
              key={column}
              onDragOver={(event) =>
                event.preventDefault()
              }
              onDrop={() => moveTask(column)}
              className="rounded-xl bg-white/70 p-3"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={classNames(
                      "h-2 w-2 rounded-full",
                      [
                        "bg-slate-400",
                        "bg-amber-400",
                        "bg-blue-500",
                        "bg-emerald-500",
                      ][index]
                    )}
                  />

                  <h2 className="text-sm font-bold">
                    {column}
                  </h2>

                  <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    {items.length}
                  </span>
                </div>

                <MoreHorizontal className="h-4 w-4 text-slate-400" />
              </div>

              <div className="space-y-3">
                {items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={() =>
                      setDraggedTask(task.id)
                    }
                  />
                ))}

                <button
                  onClick={onCreate}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 hover:bg-white"
                >
                  <Plus className="h-4 w-4" />
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
   TASKS
============================================================ */

function TasksView({
  tasks,
  query,
  setQuery,
  filter,
  setFilter,
}: {
  tasks: Task[];
  query: string;
  setQuery: (value: string) => void;
  filter: "All" | Status;
  setFilter: (value: "All" | Status) => void;
}) {
  return (
    <>
      <PageTitle
        title="My Tasks"
        subtitle="Your assigned work across PR campaigns and programs."
      />

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />

            <input
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Search your tasks..."
            />
          </div>

          <div className="flex gap-2">
            {(
              [
                "All",
                "To Do",
                "In Progress",
                "Under Review",
                "Completed",
              ] as const
            ).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={classNames(
                  "rounded-lg px-3 py-2 text-xs font-semibold",
                  filter === item
                    ? "bg-[#4F7150] text-white"
                    : "bg-[#F7F5EF] text-slate-500"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#F7F5EF] text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Task</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due date</th>
                <th className="px-4 py-3">Progress</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-t border-slate-200 text-sm"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold">
                      {task.title}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {task.project}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={classNames(
                        "rounded px-2 py-1 text-xs font-semibold",
                        priorityClass[task.priority]
                      )}
                    >
                      {task.priority}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={classNames(
                        "rounded px-2 py-1 text-xs font-semibold",
                        statusClass[task.status]
                      )}
                    >
                      {task.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-xs">
                    {task.due_date || "No date"}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-[#4F7150]"
                          style={{
                            width: `${task.progress || 0}%`,
                          }}
                        />
                      </div>

                      <span className="text-xs text-slate-500">
                        {task.progress || 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   DOCTORS
============================================================ */

function DoctorsView({
  doctors,
  search,
  setSearch,
}: {
  doctors: Doctor[];
  search: string;
  setSearch: (value: string) => void;
}) {
  const filtered = doctors.filter((doctor) =>
    `${doctor.name} ${doctor.specialty} ${doctor.organization} ${doctor.location}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <DataTable
      title="Doctors Database"
      subtitle="Build and nurture relationships with clinical thought leaders."
      columns={[
        "Doctor",
        "Specialty",
        "Organization",
        "Location",
        "Status",
      ]}
      rows={filtered.map((doctor) => [
        doctor.name,
        doctor.specialty,
        doctor.organization,
        doctor.location,
        doctor.status,
      ])}
      search={search}
      setSearch={setSearch}
    />
  );
}

/* ============================================================
   WEBINARS
============================================================ */

function WebinarsView({
  webinars,
  search,
  setSearch,
}: {
  webinars: Webinar[];
  search: string;
  setSearch: (value: string) => void;
}) {
  const filtered = webinars.filter((webinar) =>
    `${webinar.title} ${webinar.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <DataTable
      title="Webinar Invitations"
      subtitle="Monitor outreach and registration performance across upcoming events."
      columns={[
        "Webinar",
        "Date",
        "Invited",
        "Registered",
        "Conversion",
        "Status",
      ]}
      rows={filtered.map((webinar) => [
        webinar.title,
        webinar.event_date,
        String(webinar.invited),
        String(webinar.registered),
        webinar.invited
          ? `${Math.round(
              (webinar.registered /
                webinar.invited) *
                100
            )}%`
          : "0%",
        webinar.status,
      ])}
      search={search}
      setSearch={setSearch}
    />
  );
}

/* ============================================================
   SOCIAL
============================================================ */

function SocialView({
  records,
  search,
  setSearch,
}: {
  records: SocialRecord[];
  search: string;
  setSearch: (value: string) => void;
}) {
  const filtered = records.filter((record) =>
    `${record.post} ${record.channel} ${record.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <DataTable
      title="Social Media Records"
      subtitle="Track every PR social activation in one place."
      columns={[
        "Post",
        "Channel",
        "Date",
        "Reach",
        "Engagement",
        "Status",
      ]}
      rows={filtered.map((record) => [
        record.post,
        record.channel,
        record.post_date,
        record.reach,
        record.engagement,
        record.status,
      ])}
      search={search}
      setSearch={setSearch}
    />
  );
}

/* ============================================================
   DATA TABLE
============================================================ */

function DataTable({
  title,
  subtitle,
  columns,
  rows,
  search,
  setSearch,
}: {
  title: string;
  subtitle: string;
  columns: string[];
  rows: string[][];
  search: string;
  setSearch: (value: string) => void;
}) {
  return (
    <>
      <PageTitle title={title} subtitle={subtitle} />

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-4 border-b border-slate-200 p-4">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#F7F5EF] text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-5 py-3 font-semibold"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={`${row[0]}-${rowIndex}`}
                  className="border-t border-slate-200 text-sm"
                >
                  {row.map((cell, index) => (
                    <td
                      key={`${cell}-${index}`}
                      className="whitespace-nowrap px-5 py-4"
                    >
                      <span
                        className={classNames(
                          index === 0 &&
                            "font-semibold",
                          index === row.length - 1 &&
                            "rounded px-2 py-1 text-xs font-semibold",
                          cell === "Active" ||
                            cell === "Live" ||
                            cell === "Published"
                            ? "bg-emerald-50 text-emerald-700"
                            : cell === "Pending" ||
                              cell === "Planning" ||
                              cell === "Scheduled"
                            ? "bg-amber-50 text-amber-700"
                            : cell === "Contacted" ||
                              cell === "In review" ||
                              cell === "Draft"
                            ? "bg-blue-50 text-blue-700"
                            : ""
                        )}
                      >
                        {cell}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          Showing {rows.length} records
        </div>
      </div>
    </>
  );
}

/* ============================================================
   CALENDAR
============================================================ */

function CalendarView({
  tasks,
}: {
  tasks: Task[];
}) {
  return (
    <>
      <PageTitle
        title="Calendar"
        subtitle="A clear view of team deadlines, events, and publishing dates."
        action={false}
      />

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-bold">
            Task deadlines
          </h2>

          <CalendarDays className="h-5 w-5 text-[#4F7150]" />
        </div>

        <div className="space-y-3">
          {tasks
            .filter((task) => task.due_date)
            .sort((a, b) =>
              String(a.due_date).localeCompare(
                String(b.due_date)
              )
            )
            .map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {task.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {task.project}
                  </p>
                </div>

                <span className="text-xs font-semibold text-[#4F7150]">
                  {task.due_date}
                </span>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

/* ============================================================
   HORIZON
============================================================ */

function HorizonView({
  webinars,
  tasks,
}: {
  webinars: Webinar[];
  tasks: Task[];
}) {
  const nextWebinar = webinars[0];

  const horizonTasks = tasks.filter((task) =>
    task.project
      ?.toLowerCase()
      .includes("horizon")
  );

  return (
    <>
      <PageTitle
        title="Horizon Series"
        subtitle="Plan and coordinate the flagship expert conversation series."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl bg-[#4F7150] p-6 text-white lg:col-span-2">
          <p className="text-xs font-semibold tracking-wider text-white/65">
            NEXT WEBINAR
          </p>

          <h2 className="mt-3 max-w-lg text-2xl font-bold">
            {nextWebinar?.title ||
              "No Horizon Series webinar"}
          </h2>

          <p className="mt-3 text-sm text-white/75">
            {nextWebinar?.event_date
              ? `Scheduled for ${nextWebinar.event_date}`
              : "Create a webinar to see it here."}
          </p>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold text-slate-500">
            REGISTRATION STATUS
          </p>

          <p className="mt-3 text-3xl font-bold">
            {nextWebinar?.registered || 0}

            <span className="text-base font-medium text-slate-500">
              {" "}
              / {nextWebinar?.invited || 0}
            </span>
          </p>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#4F7150]"
              style={{
                width: `${
                  nextWebinar?.invited
                    ? Math.min(
                        100,
                        (nextWebinar.registered /
                          nextWebinar.invited) *
                          100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <InfoCard
          icon={ClipboardList}
          title="Production tasks"
          value={String(horizonTasks.length)}
          note="Horizon tasks"
        />

        <InfoCard
          icon={Calendar}
          title="Upcoming webinars"
          value={String(webinars.length)}
          note="From database"
        />

        <InfoCard
          icon={AlertTriangle}
          title="Open risks"
          value={String(
            horizonTasks.filter(
              (task) =>
                task.risk &&
                task.status !== "Completed"
            ).length
          )}
          note="Need attention"
        />
      </div>
    </>
  );
}

/* ============================================================
   REPORTS
============================================================ */

function Reports({
  stats,
  webinars,
  socialRecords,
}: {
  stats: DashboardStats;
  webinars: Webinar[];
  socialRecords: SocialRecord[];
}) {
  const totalInvited = webinars.reduce(
    (sum, webinar) => sum + (webinar.invited || 0),
    0
  );

  const totalRegistered = webinars.reduce(
    (sum, webinar) =>
      sum + (webinar.registered || 0),
    0
  );

  const conversion = totalInvited
    ? Math.round(
        (totalRegistered / totalInvited) * 100
      )
    : 0;

  return (
    <>
      <PageTitle
        title="Reports & Analytics"
        subtitle="Turn PR activity into a clear view of team impact."
        action={false}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <InfoCard
          icon={ClipboardList}
          title="Total Tasks"
          value={String(stats.total)}
          note="From database"
        />

        <InfoCard
          icon={CheckCircle2}
          title="Completed"
          value={String(stats.completed)}
          note="Completed tasks"
        />

        <InfoCard
          icon={TrendingUp}
          title="Task Completion"
          value={
            stats.total
              ? `${Math.round(
                  (stats.completed /
                    stats.total) *
                    100
                )}%`
              : "0%"
          }
          note="Current rate"
        />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-bold">
            Webinar outreach
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Invitations and registration conversion
          </p>

          <div className="mt-7 space-y-5">
            <ProgressLabel
              label="Invitations"
              value={String(totalInvited)}
              percent={totalInvited ? 100 : 0}
            />

            <ProgressLabel
              label="Registrations"
              value={String(totalRegistered)}
              percent={conversion}
            />
          </div>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-bold">
            Social media
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Records currently stored
          </p>

          <div className="mt-6">
            <InfoCard
              icon={Share2}
              title="Social Records"
              value={String(
                socialRecords.length
              )}
              note="Database records"
            />
          </div>
        </section>
      </div>
    </>
  );
}

function ProgressLabel({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-bold">
          {value}
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#4F7150]"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
  note,
}: {
  icon: typeof UserRound;
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <Icon className="h-5 w-5 text-[#4F7150]" />

      <p className="mt-5 text-xs font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {note}
      </p>
    </div>
  );
}

/* ============================================================
   NOTIFICATIONS
============================================================ */

function NotificationsView({
  notifications,
  refresh,
}: {
  notifications: Notification[];
  refresh: () => void;
}) {
  const markRead = async (id: number) => {
    try {
      await fetch(
        `${API}/notifications/${id}/read`,
        {
          method: "PATCH",
        }
      );

      refresh();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <PageTitle
        title="Notifications"
        subtitle="Stay on top of the work that needs your attention."
        action={false}
      />

      <div className="max-w-3xl rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {notifications.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No notifications.
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex gap-4 border-b border-slate-200 p-5 last:border-0"
            >
              <div
                className={classNames(
                  "mt-1 h-2.5 w-2.5 rounded-full",
                  notification.is_read
                    ? "bg-slate-300"
                    : "bg-red-500"
                )}
              />

              <div className="flex-1">
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {notification.title}
                  </p>

                  {!notification.is_read && (
                    <button
                      onClick={() =>
                        markRead(notification.id)
                      }
                      className="text-xs font-semibold text-[#4F7150]"
                    >
                      Mark read
                    </button>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {notification.source ||
                    "Workspace"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* ============================================================
   TEAM
============================================================ */

function TeamView({
  team,
}: {
  team: TeamMember[];
}) {
  return (
    <>
      <PageTitle
        title="Team Members"
        subtitle="See workload, progress, and productivity across the PR team."
      />

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-[#F7F5EF] text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">
                Team member
              </th>

              <th className="px-5 py-3">
                Role
              </th>

              <th className="px-5 py-3">
                Assigned tasks
              </th>

              <th className="px-5 py-3">
                Completed
              </th>

              <th className="px-5 py-3">
                Productivity
              </th>
            </tr>
          </thead>

          <tbody>
            {team.map((person) => (
              <tr
                key={person.id}
                className="border-t border-slate-200"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      initials={person.initials}
                    />

                    <span className="text-sm font-semibold">
                      {person.name}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span className="rounded bg-[#E4EEE4] px-2 py-1 text-xs font-medium text-[#4F7150]">
                    {person.role}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm">
                  {person.assigned_tasks}
                </td>

                <td className="px-5 py-4 text-sm">
                  {person.completed_tasks}
                </td>

                <td className="px-5 py-4 text-sm font-semibold text-emerald-600">
                  {person.productivity}%
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
   SETTINGS
============================================================ */

function SettingsView({
  role,
  setRole,
}: {
  role: string;
  setRole: (value: string) => void;
}) {
  return (
    <>
      <PageTitle
        title="Settings"
        subtitle="Manage your PR workspace preferences and role access."
        action={false}
      />

      <div className="max-w-3xl">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-bold">
            Role & access
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select your workspace role.
          </p>

          <label className="mt-5 block text-xs font-semibold text-slate-500">
            ACTIVE ROLE
          </label>

          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value)
            }
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
          >
            <option>
              Project Manager
            </option>

            <option>PR Intern</option>

            <option>
              Social Media Marketing Intern
            </option>

            <option>
              Social Media Manager Intern
            </option>
          </select>

          <div className="mt-5 rounded-lg bg-[#F7F5EF] p-4 text-xs text-slate-500">
            {role === "Project Manager"
              ? "Full access to tasks, data records, analytics, team members, and workspace settings."
              : "Contributors can update assigned tasks, collaborate in comments, and view permitted campaign data."}
          </div>
        </section>
      </div>
    </>
  );
}