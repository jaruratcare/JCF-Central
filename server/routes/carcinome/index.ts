import { Router } from "express";
import { handleMigrate } from "./migrate";
import {
  handleGetPatients,
  handleAddPatient,
  handleUpdatePatient,
  handleDeletePatient,
} from "./patients";
import {
  handleAddSession,
  handleUpdateSession,
  handleDeleteSession,
} from "./sessions";
import {
  handleGetTasks,
  handleAddTask,
  handleUpdateTask,
  handleDeleteTask,
} from "./tasks";
import {
  handleGetMasterData,
  handleAddMasterData,
  handleUpdateMasterData,
  handleDeleteMasterData,
} from "./masterdata";
import { handleGetNotes, handleAddNote } from "./notes";
import { handleGetDocuments, handleAddDocument } from "./documents";
import { handleGetAuditLogs, handleAddAuditLog } from "./audit";
import { handleGetInternByEmail, handleSyncInternAccounts } from "./interns";
import {
  handleGetOutreach,
  handleAddOutreach,
  handleUpdateOutreach,
  handleDeleteOutreach,
} from "./outreach";

const router = Router();

// Migration
router.post("/migrate", handleMigrate);

// Patients
router.get("/patients", handleGetPatients);
router.post("/patients", handleAddPatient);
router.patch("/patients/:id", handleUpdatePatient);
router.delete("/patients/:id", handleDeletePatient);

// Sessions
router.post("/sessions", handleAddSession);
router.patch("/sessions/by-index", handleUpdateSession);
router.delete("/sessions/by-index", handleDeleteSession);
router.patch("/sessions/:id", handleUpdateSession);
router.delete("/sessions/:id", handleDeleteSession);

// Tasks
router.get("/tasks", handleGetTasks);
router.post("/tasks", handleAddTask);
router.patch("/tasks/:id", handleUpdateTask);
router.delete("/tasks/:id", handleDeleteTask);

// Master Data
router.get("/master-data", handleGetMasterData);
router.post("/master-data", handleAddMasterData);
router.patch("/master-data/:id", handleUpdateMasterData);
router.delete("/master-data/:id", handleDeleteMasterData);

// Notes & Documents
router.get("/notes", handleGetNotes);
router.post("/notes", handleAddNote);
router.get("/documents", handleGetDocuments);
router.post("/documents", handleAddDocument);

// Audit Logs
router.get("/audit-logs", handleGetAuditLogs);
router.post("/audit-logs", handleAddAuditLog);

// Oncologist Outreach Tracker
router.get("/outreach", handleGetOutreach);
router.post("/outreach", handleAddOutreach);
router.patch("/outreach/:id", handleUpdateOutreach);
router.delete("/outreach/:id", handleDeleteOutreach);

// Intern lookup & provisioning
router.get("/interns/by-email", handleGetInternByEmail);
router.post("/interns/sync-accounts", handleSyncInternAccounts);

export default router;
