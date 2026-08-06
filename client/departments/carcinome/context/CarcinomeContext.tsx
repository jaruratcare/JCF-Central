import React, { createContext, useContext, useState, useEffect } from "react";
import {
  patients as initialPatients,
  initialTasks,
  initialMasterData,
  initialAuditLogs,
  initialDocuments,
  initialNotes,
  type Patient,
  type InfusionSession,
  type Task,
  type MasterDataItem,
  type AuditLogEntry,
  type PatientDocument,
  type PatientNote,
  type PaymentStatus,
} from "../data/dummy-data";

interface CarcinomeContextType {
  patients: Patient[];
  tasks: Task[];
  masterData: MasterDataItem[];
  auditLogs: AuditLogEntry[];
  documents: PatientDocument[];
  notes: PatientNote[];
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Patient CRUD
  addPatient: (data: Omit<Patient, "id" | "sessions"> & { id?: string }) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  archivePatient: (id: string) => void;

  // Session CRUD
  addSession: (patientId: string, session: InfusionSession) => void;
  updateSession: (patientId: string, sessionIndex: number, session: InfusionSession) => void;
  deleteSession: (patientId: string, sessionIndex: number) => void;

  // Payment Status
  updatePaymentStatus: (patientId: string, paymentStatus: PaymentStatus, sessionIndex?: number) => void;

  // Task CRUD
  addTask: (task: Omit<Task, "id">) => void;
  updateTaskStatus: (taskId: string, status: Task["status"]) => void;
  deleteTask: (taskId: string) => void;

  // Master Data CRUD
  addMasterItem: (item: Omit<MasterDataItem, "id" | "active">) => void;
  toggleMasterItem: (id: string) => void;

  // Notes & Documents
  addNote: (patientId: string, content: string) => void;
  addDocument: (patientId: string, file: { name: string; fileType: "pdf" | "image" | "doc"; size: string }) => void;
}

const CarcinomeContext = createContext<CarcinomeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PATIENTS: "carcinome_patients_v2",
  TASKS: "carcinome_tasks_v2",
  MASTER: "carcinome_master_v2",
  LOGS: "carcinome_logs_v2",
  DOCS: "carcinome_docs_v2",
  NOTES: "carcinome_notes_v2",
};

export const CarcinomeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      return saved ? JSON.parse(saved) : initialPatients;
    } catch {
      return initialPatients;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : initialTasks;
    } catch {
      return initialTasks;
    }
  });

  const [masterData, setMasterData] = useState<MasterDataItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MASTER);
      return saved ? JSON.parse(saved) : initialMasterData;
    } catch {
      return initialMasterData;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : initialAuditLogs;
    } catch {
      return initialAuditLogs;
    }
  });

  const [documents, setDocuments] = useState<PatientDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCS);
      return saved ? JSON.parse(saved) : initialDocuments;
    } catch {
      return initialDocuments;
    }
  });

  const [notes, setNotes] = useState<PatientNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      return saved ? JSON.parse(saved) : initialNotes;
    } catch {
      return initialNotes;
    }
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // LocalStorage Syncing
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MASTER, JSON.stringify(masterData));
  }, [masterData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }, [notes]);

  // Audit Log Helper
  const logAction = (
    action: AuditLogEntry["action"],
    targetType: AuditLogEntry["targetType"],
    targetId: string,
    targetName: string,
    details: string,
    changes?: AuditLogEntry["changes"]
  ) => {
    const newEntry: AuditLogEntry = {
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
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Patients CRUD
  const addPatient = (data: Omit<Patient, "id" | "sessions"> & { id?: string }) => {
    const id = data.id || `CC2026${(patients.length + 1).toString().padStart(3, "0")}`;
    const newPatient: Patient = {
      ...data,
      id,
      sessions: [],
    };
    setPatients((prev) => [newPatient, ...prev]);
    logAction("CREATE", "Patient", id, data.name, `Created new patient profile for ${data.name}`);
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          logAction(
            "UPDATE",
            "Patient",
            id,
            p.name,
            `Updated patient details for ${p.name}`,
            Object.keys(updates).map((key) => ({
              field: key,
              oldVal: String((p as any)[key] ?? "—"),
              newVal: String((updates as any)[key] ?? "—"),
            }))
          );
          return updated;
        }
        return p;
      })
    );
  };

  const deletePatient = (id: string) => {
    const target = patients.find((p) => p.id === id);
    setPatients((prev) => prev.filter((p) => p.id !== id));
    if (selectedPatientId === id) setSelectedPatientId(null);
    if (target) {
      logAction("DELETE", "Patient", id, target.name, `Deleted patient ${target.name}`);
    }
  };

  const archivePatient = (id: string) => {
    updatePatient(id, { onboardingStatus: "No longer with the organisation" });
    logAction("STATUS_CHANGE", "Patient", id, id, `Archived patient profile ${id}`);
  };

  // Session CRUD
  const addSession = (patientId: string, session: InfusionSession) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const newSessions = [...p.sessions, session];
          logAction(
            "CREATE",
            "Session",
            patientId,
            p.name,
            `Added infusion session on ${session.date} for ${p.name}`
          );
          return {
            ...p,
            sessions: newSessions,
            lastInfusionDate: session.date,
          };
        }
        return p;
      })
    );
  };

  const updateSession = (patientId: string, sessionIndex: number, session: InfusionSession) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const newSessions = [...p.sessions];
          newSessions[sessionIndex] = session;
          logAction(
            "UPDATE",
            "Session",
            patientId,
            p.name,
            `Updated session ${sessionIndex + 1} for ${p.name}`
          );
          return { ...p, sessions: newSessions };
        }
        return p;
      })
    );
  };

  const deleteSession = (patientId: string, sessionIndex: number) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const newSessions = p.sessions.filter((_, idx) => idx !== sessionIndex);
          logAction(
            "DELETE",
            "Session",
            patientId,
            p.name,
            `Deleted session ${sessionIndex + 1} for ${p.name}`
          );
          return { ...p, sessions: newSessions };
        }
        return p;
      })
    );
  };

  // Payment Status
  const updatePaymentStatus = (patientId: string, paymentStatus: PaymentStatus, sessionIndex?: number) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          let updatedSessions = p.sessions;
          if (sessionIndex !== undefined && updatedSessions[sessionIndex]) {
            updatedSessions = [...updatedSessions];
            updatedSessions[sessionIndex] = {
              ...updatedSessions[sessionIndex],
              paymentStatus,
            };
          }
          logAction(
            "PAYMENT",
            "Payment",
            patientId,
            p.name,
            `Updated payment status to ${paymentStatus} for ${p.name}`
          );
          return {
            ...p,
            paymentStatus,
            sessions: updatedSessions,
          };
        }
        return p;
      })
    );
  };

  // Task CRUD
  const addTask = (taskData: Omit<Task, "id">) => {
    const newTask: Task = {
      ...taskData,
      id: `TSK-${(tasks.length + 101).toString()}`,
    };
    setTasks((prev) => [newTask, ...prev]);
    logAction("CREATE", "Task", newTask.id, newTask.title, `Created task: ${newTask.title}`);
  };

  const updateTaskStatus = (taskId: string, status: Task["status"]) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          logAction(
            "TASK_COMPLETE",
            "Task",
            t.id,
            t.title,
            `Updated task ${t.id} status to ${status}`
          );
          return { ...t, status };
        }
        return t;
      })
    );
  };

  const deleteTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (target) {
      logAction("DELETE", "Task", taskId, target.title, `Deleted task ${target.title}`);
    }
  };

  // Master Data
  const addMasterItem = (item: Omit<MasterDataItem, "id" | "active">) => {
    const newItem: MasterDataItem = {
      ...item,
      id: `md-custom-${Date.now().toString().slice(-4)}`,
      active: true,
    };
    setMasterData((prev) => [...prev, newItem]);
    logAction(
      "CREATE",
      "MasterData",
      newItem.id,
      newItem.label,
      `Added master data option: ${newItem.label} under ${newItem.category}`
    );
  };

  const toggleMasterItem = (id: string) => {
    setMasterData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, active: !item.active };
          logAction(
            "UPDATE",
            "MasterData",
            id,
            item.label,
            `Toggled master item ${item.label} to ${updated.active ? "Active" : "Inactive"}`
          );
          return updated;
        }
        return item;
      })
    );
  };

  // Notes & Documents
  const addNote = (patientId: string, content: string) => {
    const targetPatient = patients.find((p) => p.id === patientId);
    const newNote: PatientNote = {
      id: `NTE-${Date.now().toString().slice(-4)}`,
      patientId,
      author: "Team Lead",
      role: "Operations Lead",
      content,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setNotes((prev) => [newNote, ...prev]);
    logAction(
      "UPDATE",
      "Patient",
      patientId,
      targetPatient?.name || patientId,
      `Added operational note to ${targetPatient?.name || patientId}`
    );
  };

  const addDocument = (
    patientId: string,
    file: { name: string; fileType: "pdf" | "image" | "doc"; size: string }
  ) => {
    const targetPatient = patients.find((p) => p.id === patientId);
    const newDoc: PatientDocument = {
      id: `DOC-${Date.now().toString().slice(-4)}`,
      patientId,
      name: file.name,
      fileType: file.fileType,
      uploadedAt: new Date().toISOString().slice(0, 10),
      uploadedBy: "Team Lead",
      size: file.size,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    logAction(
      "DOCUMENT_UPLOAD",
      "Document",
      newDoc.id,
      file.name,
      `Uploaded document ${file.name} for ${targetPatient?.name || patientId}`
    );
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
        selectedPatientId,
        setSelectedPatientId,
        activeTab,
        setActiveTab,

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
