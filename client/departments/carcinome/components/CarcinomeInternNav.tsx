import React from "react";
import { Users, UserPlus } from "lucide-react";
import { useCarcinome } from "../context/CarcinomeContext";

interface CarcinomeInternNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const CarcinomeInternNav: React.FC<CarcinomeInternNavProps> = ({ activeTab, onTabChange }) => {
  const { internName, patients } = useCarcinome();

  const isPatientsActive = activeTab === "my-patients" || activeTab === "patients";
  const isOutreachActive = activeTab === "outreach";

  return (
    <div className="space-y-1">
      {/* Intern identity badge */}
      <div className="mx-3 mb-3 px-3 py-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">My Workspace</p>
        <p className="text-xs font-semibold text-blue-900 mt-0.5 truncate">{internName || "Intern"}</p>
        <p className="text-[10px] text-blue-700/70 mt-0.5">
          {patients.length} patient{patients.length !== 1 ? "s" : ""} assigned
        </p>
      </div>

      <button
        onClick={() => onTabChange("my-patients")}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left text-sm font-medium ${
          isPatientsActive
            ? "border-blue-600 bg-blue-600 text-white shadow-sm font-semibold"
            : "border-transparent text-slate-800 hover:border-sky-300/60 hover:bg-sky-200/70 hover:text-blue-950"
        }`}
      >
        <Users className={`h-4 w-4 flex-shrink-0 transition-all ${isPatientsActive ? "scale-110" : ""}`} />
        <span className="truncate">My Patients</span>
        {isPatientsActive && <div className="ml-auto h-2 w-2 rounded-full bg-white/90" />}
      </button>

      <button
        onClick={() => onTabChange("outreach")}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left text-sm font-medium ${
          isOutreachActive
            ? "border-blue-600 bg-blue-600 text-white shadow-sm font-semibold"
            : "border-transparent text-slate-800 hover:border-sky-300/60 hover:bg-sky-200/70 hover:text-blue-950"
        }`}
      >
        <UserPlus className={`h-4 w-4 flex-shrink-0 transition-all ${isOutreachActive ? "scale-110" : ""}`} />
        <span className="truncate">Oncologist Outreach</span>
        {isOutreachActive && <div className="ml-auto h-2 w-2 rounded-full bg-white/90" />}
      </button>
    </div>
  );
};
