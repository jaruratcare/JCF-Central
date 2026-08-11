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
      <div className="px-4 py-3 text-xs font-bold text-sidebar-foreground/70 uppercase tracking-wider">
        Carcinome Operations
      </div>
      {CARCINOME_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left text-sm font-medium ${
              isActive
                ? "bg-gradient-to-r from-sidebar-primary to-blue-500 text-sidebar-primary-foreground shadow-md ring-1 ring-blue-400/30"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            }`}
          >
            <Icon className={`h-4 w-4 flex-shrink-0 transition-all ${isActive ? "scale-110" : ""}`} />
            <span className="truncate">{item.label}</span>
            {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-white opacity-70" />}
          </button>
        );
      })}
    </div>
  );
};
