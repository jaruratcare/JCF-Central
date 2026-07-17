import { useParams } from "wouter";
import { 
  useGetProject, 
  useGetProjectSummary, 
  useListProjectItems,
  getGetProjectQueryKey,
  getGetProjectSummaryQueryKey,
  getListProjectItemsQueryKey
} from "@/departments/tech/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";
import { Activity, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function ProjectDashboard() {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>();
  const projectId = parseInt(projectIdStr!);

  const { data: project, isLoading: loadingProject } = useGetProject(projectId, { 
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) } 
  });
  const { data: summary, isLoading: loadingSummary } = useGetProjectSummary(projectId, { 
    query: { enabled: !!projectId, queryKey: getGetProjectSummaryQueryKey(projectId) } 
  });

  if (loadingProject || loadingSummary) {
    return <div className="space-y-6">
      <Skeleton className="h-10 w-1/3" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>;
  }

  if (!project || !summary) return null;

  const typeData = Object.entries(summary.byType).map(([name, value]) => ({ name, value }));
  const statusData = Object.entries(summary.byStatus).map(([name, value]) => ({ 
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), 
    value 
  }));

  const COLORS = {
    epic: '#a855f7',
    story: '#3b82f6',
    task: '#10b981',
    bug: '#ef4444'
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-mono">
            {project.key}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{project.name}</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.openItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completedItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalItems > 0 ? Math.round((summary.completedItems / summary.totalItems) * 100) : 0}% completion
            </p>
          </CardContent>
        </Card>
        <Card className={summary.activeSprint ? "border-primary" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sprint</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {summary.activeSprint ? (
              <>
                <div className="text-xl font-bold truncate" title={summary.activeSprint.name}>
                  <Link href={`/projects/${projectId}/board`} className="hover:underline">
                    {summary.activeSprint.name}
                  </Link>
                </div>
                {summary.activeSprint.endDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ends {format(new Date(summary.activeSprint.endDate), 'MMM d')}
                  </p>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground mt-2">No active sprint</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Items by Status</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: '1px solid var(--border)'}} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items by Type</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: '1px solid var(--border)'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
