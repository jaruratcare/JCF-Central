import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  type Patient,
  type InfusionSession,
  type Task,
  type MasterDataItem,
  type AuditLogEntry,
  type PatientDocument,
  type PatientNote,
  type PaymentStatus,
} from "../data/dummy-data";
import { type OncologistOutreach } from "../data/outreach-data";
import {
  type ColumnConfig,
  type TableColumnsState,
  DEFAULT_TABLE_COLUMNS,
  loadSavedTableColumns,
  saveTableColumns,
} from "../data/table-columns";

interface CarcinomeContextType {
  patients: Patient[];
  tasks: Task[];
  masterData: MasterDataItem[];
  auditLogs: AuditLogEntry[];
  documents: PatientDocument[];
  notes: PatientNote[];
  outreachEntries: OncologistOutreach[];
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;

  // Table Columns Customization
  tableColumns: TableColumnsState;
  updateTableColumns: (tabKey: keyof TableColumnsState, newColumns: ColumnConfig[]) => void;
  resetTableColumns: (tabKey?: keyof TableColumnsState) => void;

  // Patient CRUD
  addPatient: (data: Omit<Patient, "id" | "sessions"> & { id?: string }) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  archivePatient: (id: string) => Promise<void>;

  // Session CRUD
  addSession: (patientId: string, session: InfusionSession) => Promise<void>;
  updateSession: (patientId: string, sessionIndex: number, session: InfusionSession) => Promise<void>;
  deleteSession: (patientId: string, sessionIndex: number) => Promise<void>;

  // Payment Status
  updatePaymentStatus: (patientId: string, paymentStatus: PaymentStatus, sessionIndex?: number) => Promise<void>;

  // Task CRUD
  addTask: (task: Omit<Task, "id">) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task["status"]) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Master Data CRUD
  addMasterItem: (item: Omit<MasterDataItem, "id" | "active">) => Promise<void>;
  toggleMasterItem: (id: string) => Promise<void>;

  // Notes & Documents
  addNote: (patientId: string, content: string) => Promise<void>;
  addDocument: (patientId: string, file: { name: string; fileType: "pdf" | "image" | "doc"; size: string }) => Promise<void>;

  // Outreach CRUD
  addOutreachEntry: (data: Omit<OncologistOutreach, "id">) => Promise<void>;
  updateOutreachEntry: (id: string, updates: Partial<OncologistOutreach>) => Promise<void>;
  deleteOutreachEntry: (id: string) => Promise<void>;
}

const CarcinomeContext = createContext<CarcinomeContextType | undefined>(undefined);

export const CarcinomeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [masterData, setMasterData] = useState<MasterDataItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [outreachEntries, setOutreachEntries] = useState<OncologistOutreach[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const [tableColumns, setTableColumns] = useState<TableColumnsState>(() => loadSavedTableColumns());

  const updateTableColumns = useCallback((tabKey: keyof TableColumnsState, newColumns: ColumnConfig[]) => {
    setTableColumns((prev) => {
      const updated = {
        ...prev,
        [tabKey]: newColumns,
      };
      saveTableColumns(updated);
      return updated;
    });
  }, []);

  const resetTableColumns = useCallback((tabKey?: keyof TableColumnsState) => {
    setTableColumns((prev) => {
      if (tabKey) {
        const updated = {
          ...prev,
          [tabKey]: DEFAULT_TABLE_COLUMNS[tabKey],
        };
        saveTableColumns(updated);
        return updated;
      }
      saveTableColumns(DEFAULT_TABLE_COLUMNS);
      return DEFAULT_TABLE_COLUMNS;
    });
  }, []);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all live data from Supabase API
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let pRes = await fetch("/api/carcinome/patients");
      
      if (!pRes.ok) {
        console.warn("Carcinome DB tables missing or empty. Running auto-migration...");
        await fetch("/api/carcinome/migrate", { method: "POST" });
        pRes = await fetch("/api/carcinome/patients");
      }

      const pData = await pRes.json();
      
      if (Array.isArray(pData.patients) && pData.patients.length === 0) {
        console.info("Database empty, running initial seed migration...");
        await fetch("/api/carcinome/migrate", { method: "POST" });
        const retryRes = await fetch("/api/carcinome/patients");
        const retryData = await retryRes.json();
        setPatients(retryData.patients || []);
      } else {
        setPatients(pData.patients || []);
      }

      const [tRes, mdRes, nRes, dRes, aRes, oRes] = await Promise.all([
        fetch("/api/carcinome/tasks"),
        fetch("/api/carcinome/master-data"),
        fetch("/api/carcinome/notes"),
        fetch("/api/carcinome/documents"),
        fetch("/api/carcinome/audit-logs"),
        fetch("/api/carcinome/outreach"),
      ]);

      if (tRes.ok) setTasks((await tRes.json()).tasks || []);
      if (mdRes.ok) setMasterData((await mdRes.json()).masterData || []);
      if (nRes.ok) setNotes((await nRes.json()).notes || []);
      if (dRes.ok) setDocuments((await dRes.json()).documents || []);
      if (aRes.ok) setAuditLogs((await aRes.json()).auditLogs || []);
      if (oRes.ok) setOutreachEntries((await oRes.json()).outreach || []);

    } catch (err: any) {
      console.error("Failed to load Carcinome database data:", err);
      setError(err.message || "Failed to load database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Helper to persist audit logs to DB
  const logAction = async (
    action: AuditLogEntry["action"],
    targetType: AuditLogEntry["targetType"],
    targetId: string,
    targetName: string,
    details: string,
    changes?: AuditLogEntry["changes"]
  ) => {
    const entry: Partial<AuditLogEntry> = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      actor: "Team Lead",
      role: "Team Lead",
      action,
      targetType,
      targetId,
      targetName,
      details,
      changes,
    };
    try {
      const res = await fetch("/api/carcinome/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.auditLog) {
          setAuditLogs((prev) => [data.auditLog, ...prev]);
        }
      }
    } catch (e) {
      console.error("Failed to persist audit log", e);
    }
  };

  // Patients CRUD
  const addPatient = async (data: Omit<Patient, "id" | "sessions"> & { id?: string }) => {
    try {
      const res = await fetch("/api/carcinome/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add patient");
      const result = await res.json();
      if (result.patient) {
        setPatients((prev) => [result.patient, ...prev]);
        logAction("CREATE", "Patient", result.patient.id, result.patient.name, `Created patient profile for ${result.patient.name}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    try {
      const res = await fetch(`/api/carcinome/patients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.patient) {
          setPatients((prev) =>
            prev.map((p) => (p.id === id ? result.patient : p))
          );
          logAction("UPDATE", "Patient", id, result.patient.name, `Updated patient profile for ${result.patient.name}`);
        }
      }
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  const deletePatient = async (id: string) => {
    const target = patients.find((p) => p.id === id);
    setPatients((prev) => prev.filter((p) => p.id !== id));
    if (selectedPatientId === id) setSelectedPatientId(null);

    try {
      await fetch(`/api/carcinome/patients/${id}`, { method: "DELETE" });
      if (target) {
        logAction("DELETE", "Patient", id, target.name, `Deleted patient ${target.name}`);
      }
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  const archivePatient = async (id: string) => {
    await updatePatient(id, { onboardingStatus: "No longer with the organisation" });
  };

  // Session CRUD
  const addSession = async (patientId: string, session: InfusionSession) => {
    // Optimistic UI update
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const newSessions = [...p.sessions, session];
          return {
            ...p,
            sessions: newSessions,
            lastInfusionDate: session.date,
            nextInfusionDate: session.date,
          };
        }
        return p;
      })
    );

    try {
      const res = await fetch("/api/carcinome/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, session }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.patient) {
          setPatients((prev) =>
            prev.map((p) => (p.id === patientId ? data.patient : p))
          );
          logAction("CREATE", "Session", patientId, data.patient.name, `Added infusion session on ${session.date} for ${data.patient.name}`);
        }
      }
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  const updateSession = async (patientId: string, sessionIndex: number, session: InfusionSession) => {
    // Optimistic update
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const newSessions = [...p.sessions];
          newSessions[sessionIndex] = session;
          return { ...p, sessions: newSessions };
        }
        return p;
      })
    );

    try {
      const res = await fetch(`/api/carcinome/sessions/by-index`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, sessionIndex, session }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.patient) {
          setPatients((prev) =>
            prev.map((p) => (p.id === patientId ? data.patient : p))
          );
        }
      }
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  const deleteSession = async (patientId: string, sessionIndex: number) => {
    // Optimistic update
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const newSessions = p.sessions.filter((_, idx) => idx !== sessionIndex);
          return { ...p, sessions: newSessions };
        }
        return p;
      })
    );

    try {
      const res = await fetch(`/api/carcinome/sessions/by-index`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, sessionIndex }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.patient) {
          setPatients((prev) =>
            prev.map((p) => (p.id === patientId ? data.patient : p))
          );
        }
      }
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  // Payment Status
  const updatePaymentStatus = async (patientId: string, paymentStatus: PaymentStatus, sessionIndex?: number) => {
    await updatePatient(patientId, { paymentStatus });
    if (sessionIndex !== undefined) {
      const targetPatient = patients.find((p) => p.id === patientId);
      const existingSession = targetPatient?.sessions[sessionIndex];
      if (existingSession) {
        await updateSession(patientId, sessionIndex, { ...existingSession, paymentStatus });
      }
    }
  };

  // Task CRUD
  const addTask = async (taskData: Omit<Task, "id">) => {
    try {
      const res = await fetch("/api/carcinome/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.task) {
          setTasks((prev) => [data.task, ...prev]);
          logAction("CREATE", "Task", data.task.id, data.task.title, `Created task: ${data.task.title}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );

    try {
      const res = await fetch(`/api/carcinome/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.task) {
          logAction("TASK_COMPLETE", "Task", data.task.id, data.task.title, `Updated task ${data.task.id} status to ${status}`);
        }
      }
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  const deleteTask = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await fetch(`/api/carcinome/tasks/${taskId}`, { method: "DELETE" });
      if (target) {
        logAction("DELETE", "Task", taskId, target.title, `Deleted task ${target.title}`);
      }
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  // Master Data
  const addMasterItem = async (item: Omit<MasterDataItem, "id" | "active">) => {
    try {
      const res = await fetch("/api/carcinome/master-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          setMasterData((prev) => [...prev, data.item]);
          logAction("CREATE", "MasterData", data.item.id, data.item.label, `Added master option: ${data.item.label}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMasterItem = async (id: string) => {
    const item = masterData.find((m) => m.id === id);
    if (!item) return;
    const newActive = !item.active;

    setMasterData((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: newActive } : m))
    );

    try {
      await fetch(`/api/carcinome/master-data/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
      });
    } catch (err) {
      console.error(err);
      refreshData();
    }
  };

  // Notes & Documents
  const addNote = async (patientId: string, content: string) => {
    const targetPatient = patients.find((p) => p.id === patientId);
    try {
      const res = await fetch("/api/carcinome/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, content }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          setNotes((prev) => [data.note, ...prev]);
          logAction("UPDATE", "Patient", patientId, targetPatient?.name || patientId, `Added note to ${targetPatient?.name || patientId}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addDocument = async (
    patientId: string,
    file: { name: string; fileType: "pdf" | "image" | "doc"; size: string }
  ) => {
    const targetPatient = patients.find((p) => p.id === patientId);
    try {
      const res = await fetch("/api/carcinome/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, ...file }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.document) {
          setDocuments((prev) => [data.document, ...prev]);
          logAction("DOCUMENT_UPLOAD", "Document", data.document.id, file.name, `Uploaded document ${file.name}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addOutreachEntry = async (data: Omit<OncologistOutreach, "id">) => {
    try {
      const res = await fetch("/api/carcinome/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.item) {
          setOutreachEntries((prev) => [result.item, ...prev]);
        }
      }
    } catch (e) {
      console.error("Failed to add outreach entry:", e);
    }
  };

  const updateOutreachEntry = async (id: string, updates: Partial<OncologistOutreach>) => {
    try {
      const res = await fetch(`/api/carcinome/outreach/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setOutreachEntries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
        );
      }
    } catch (e) {
      console.error("Failed to update outreach entry:", e);
    }
  };

  const deleteOutreachEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/carcinome/outreach/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOutreachEntries((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete outreach entry:", e);
    }
  };

  return (
    <CarcinomeContext.Provider
      value={{
        patients,
        tasks,
        masterData,
        auditLogs,
        documents,
        notes,
        outreachEntries,
        selectedPatientId,
        setSelectedPatientId,
        activeTab,
        setActiveTab,
        loading,
        error,
        refreshData,

        tableColumns,
        updateTableColumns,
        resetTableColumns,

        addPatient,
        updatePatient,
        deletePatient,
        archivePatient,

        addSession,
        updateSession,
        deleteSession,
        updatePaymentStatus,

        addTask,
        updateTaskStatus,
        deleteTask,

        addMasterItem,
        toggleMasterItem,

        addNote,
        addDocument,

        addOutreachEntry,
        updateOutreachEntry,
        deleteOutreachEntry,
      }}
    >
      {children}
    </CarcinomeContext.Provider>
  );
};

export function useCarcinome() {
  const context = useContext(CarcinomeContext);
  if (!context) {
    throw new Error("useCarcinome must be used within a CarcinomeProvider");
  }
  return context;
}
