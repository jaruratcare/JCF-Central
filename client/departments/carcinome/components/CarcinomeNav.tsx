import React from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  IndianRupee,
  BarChart3,
  Database,
  Activity,
} from "lucide-react";

interface CarcinomeNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const CARCINOME_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Users },
  { id: "sessions", label: "Sessions", icon: Calendar },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "payments", label: "Payments", icon: IndianRupee },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "master-data", label: "Master Data", icon: Database },
  { id: "audit", label: "Audit Log", icon: Activity },
];

export const CarcinomeNav: React.FC<CarcinomeNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="space-y-2">
      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-200/80">
        Carcinome Ops
      </div>
      {CARCINOME_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left text-sm font-medium ${
              isActive
                ? "border-blue-300/60 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-sm"
                : "border-transparent text-sidebar-foreground/80 hover:border-blue-300/40 hover:bg-white/10 hover:text-sidebar-foreground"
            }`}
          >
            <Icon className={`h-4 w-4 flex-shrink-0 transition-all ${isActive ? "scale-110" : ""}`} />
            <span className="truncate">{item.label}</span>
            {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-white/80" />}
          </button>
        );
      })}
    </div>
  );
};
