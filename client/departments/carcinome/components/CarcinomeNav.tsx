import React from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  IndianRupee,
  Receipt,
  BarChart3,
  Database,
  Activity,
  Stethoscope,
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
  { id: "billing", label: "Billing", icon: Receipt },
  { id: "payments", label: "Payments", icon: IndianRupee },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "outreach", label: "Outreach Tracker", icon: Stethoscope },
  { id: "master-data", label: "Master Data", icon: Database },
  // { id: "audit", label: "Audit Log", icon: Activity },
];

export const CarcinomeNav: React.FC<CarcinomeNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="space-y-1">
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-blue-950">
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
                ? "border-blue-600 bg-blue-600 text-white shadow-sm font-semibold"
                : "border-transparent text-slate-800 hover:border-sky-300/60 hover:bg-sky-200/70 hover:text-blue-950"
            }`}
          >
            <Icon className={`h-4 w-4 flex-shrink-0 transition-all ${isActive ? "scale-110" : ""}`} />
            <span className="truncate">{item.label}</span>
            {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-white/90" />}
          </button>
        );
      })}
    </div>
  );
};
