export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  minWidth?: string;
  align?: "left" | "center" | "right";
  description?: string;
  isCustom?: boolean;
}

export interface TableColumnsState {
  patients: ColumnConfig[];
  sessions: ColumnConfig[];
  payments: ColumnConfig[];
  outreach: ColumnConfig[];
}

export const ALL_AVAILABLE_PATIENT_FIELDS: Omit<ColumnConfig, "order" | "visible">[] = [
  { id: "patientInfo", label: "Patient ID & Name", minWidth: "200px", description: "Patient name, ID & phone number" },
  { id: "doctor", label: "Assigned Doctor", minWidth: "140px", description: "Attending oncologist/physician" },
  { id: "stage", label: "Current Stage", minWidth: "130px", description: "Patient onboarding & treatment stage" },
  { id: "intern", label: "Assigned Intern", minWidth: "140px", description: "Operations assignee / coordinator" },
  { id: "nextSession", label: "Next Session", minWidth: "120px", description: "Scheduled date for next infusion" },
  { id: "paymentStatus", label: "Payment Status", minWidth: "130px", description: "Overall billing / collection status" },
  { id: "note", label: "Coordination Note", minWidth: "260px", description: "Editable coordination & quick note" },
  { id: "diagnosis", label: "Diagnosis & Cancer", minWidth: "150px", description: "Cancer type & diagnosis detail" },
  { id: "medicine", label: "Chemotherapy Regimen / Medicine", minWidth: "160px", description: "Prescribed medicines & protocol" },
  { id: "location", label: "Location / Hub", minWidth: "120px", description: "Hospital branch or treatment hub" },
  { id: "contactName", label: "Emergency / Primary Contact", minWidth: "150px", description: "Family / emergency contact name" },
  { id: "assignedNurse", label: "Assigned Nurse", minWidth: "140px", description: "Attending nurse practitioner" },
  { id: "nurseContact", label: "Nurse Contact No.", minWidth: "130px", description: "Nurse phone number" },
  { id: "supplier", label: "Pharma Supplier", minWidth: "140px", description: "Medicine supplier company" },
  { id: "supplierContact", label: "Supplier Contact", minWidth: "130px", description: "Supplier phone or ref" },
  { id: "ageGender", label: "Age & Gender", minWidth: "110px", description: "Patient age & gender details" },
  { id: "cost", label: "Total Infusion Cost", minWidth: "140px", description: "Configured cost per infusion session" },
  { id: "sessionsCount", label: "Sessions Progress", minWidth: "130px", description: "Completed vs planned infusion count" },
  { id: "lastSession", label: "Last Session Date", minWidth: "120px", description: "Date of previous infusion" },
  { id: "dischargeSummaryStatus", label: "Discharge Summary Status", minWidth: "150px", description: "Discharge summary document status" },
  { id: "infusionStatus", label: "Infusion Workflow Status", minWidth: "140px", description: "Infusion delivery status" },
];

export const ALL_AVAILABLE_SESSION_FIELDS: Omit<ColumnConfig, "order" | "visible">[] = [
  { id: "date", label: "Session Date", minWidth: "120px", description: "Date of infusion session" },
  { id: "patientInfo", label: "Patient Name & ID", minWidth: "180px", description: "Patient identity details" },
  { id: "nurse", label: "Assigned Nurse", minWidth: "140px", description: "Attending chemotherapy nurse" },
  { id: "supplier", label: "Pharma Supplier", minWidth: "140px", description: "Medication distributor / supplier" },
  { id: "amount", label: "Billed Amount", minWidth: "130px", description: "Session total billing amount" },
  { id: "paymentStatus", label: "Payment Status", minWidth: "140px", description: "Payment status for this session" },
  { id: "pdf", label: "Bill / Discharge PDF", minWidth: "150px", description: "Links to bill and discharge summary" },
  { id: "actions", label: "Actions", minWidth: "90px", align: "right", description: "Delete infusion session" },
  { id: "doctor", label: "Assigned Doctor", minWidth: "140px", description: "Patient's primary oncologist" },
  { id: "cycle", label: "Session Cycle", minWidth: "110px", description: "Infusion cycle number" },
  { id: "notes", label: "Session Notes", minWidth: "200px", description: "Clinical session notes" },
];

export const ALL_AVAILABLE_PAYMENT_FIELDS: Omit<ColumnConfig, "order" | "visible">[] = [
  { id: "refId", label: "Record Ref", minWidth: "110px", description: "Unique payment record reference" },
  { id: "patientInfo", label: "Patient Name & ID", minWidth: "180px", description: "Patient identity details" },
  { id: "doctor", label: "Assigned Doctor", minWidth: "140px", description: "Attending physician" },
  { id: "date", label: "Session Date", minWidth: "120px", description: "Infusion date" },
  { id: "amount", label: "Amount Billed", minWidth: "120px", description: "Billed fee in INR" },
  { id: "paymentStatus", label: "Payment Status", minWidth: "140px", description: "Collection status" },
  { id: "quickUpdate", label: "Quick Update", minWidth: "150px", align: "right", description: "Dropdown to update status" },
  { id: "intern", label: "Assigned Intern", minWidth: "140px", description: "Operations coordinator" },
  { id: "supplier", label: "Pharma Supplier", minWidth: "140px", description: "Pharma distributor" },
  { id: "phone", label: "Patient Phone", minWidth: "120px", description: "Patient phone contact" },
];

export const ALL_AVAILABLE_OUTREACH_FIELDS: Omit<ColumnConfig, "order" | "visible">[] = [
  { id: "id", label: "ID", minWidth: "90px", description: "Unique outreach record ID" },
  { id: "doctorName", label: "Doctor & Specialisation", minWidth: "180px", description: "Doctor name & oncology specialty" },
  { id: "hospital", label: "Hospital / Clinic", minWidth: "180px", description: "Hospital affiliation & tag" },
  { id: "contactNumber", label: "Contact Number", minWidth: "130px", description: "Doctor / clinic phone contact" },
  { id: "email", label: "Email Address", minWidth: "160px", description: "Doctor email address" },
  { id: "outreachStage", label: "Outreach Stage", minWidth: "140px", description: "Current stage of outreach workflow" },
  { id: "status", label: "Response Status", minWidth: "140px", description: "Outreach response status" },
  { id: "outreachDoneBy", label: "Outreach Done By", minWidth: "130px", description: "Assigned intern / team member" },
  { id: "lastOutreachDate", label: "Last Contact Date", minWidth: "120px", description: "Date of last outreach contact" },
  { id: "notes", label: "Notes & Details", minWidth: "200px", description: "Outreach notes & decline reasons" },
  { id: "actions", label: "Actions", minWidth: "90px", align: "right", description: "Edit / delete actions" },
];

export const DEFAULT_PATIENT_COLUMNS: ColumnConfig[] = [
  { id: "patientInfo", label: "Patient ID & Name", visible: true, order: 0, minWidth: "200px", description: "Patient name, ID & phone number" },
  { id: "doctor", label: "Assigned Doctor", visible: true, order: 1, minWidth: "140px", description: "Attending oncologist/physician" },
  { id: "stage", label: "Current Stage", visible: true, order: 2, minWidth: "130px", description: "Patient onboarding & treatment stage" },
  { id: "intern", label: "Assigned Intern", visible: true, order: 3, minWidth: "140px", description: "Operations assignee / coordinator" },
  { id: "nextSession", label: "Next Session", visible: true, order: 4, minWidth: "120px", description: "Scheduled date for next infusion" },
  { id: "paymentStatus", label: "Payment Status", visible: true, order: 5, minWidth: "130px", description: "Overall billing / collection status" },
  { id: "note", label: "Coordination Note", visible: true, order: 6, minWidth: "260px", description: "Editable coordination & quick note" },
  { id: "diagnosis", label: "Diagnosis & Cancer", visible: false, order: 7, minWidth: "150px", description: "Cancer type & diagnosis detail" },
  { id: "medicine", label: "Chemotherapy Regimen / Medicine", visible: false, order: 8, minWidth: "160px", description: "Prescribed medicines & protocol" },
  { id: "location", label: "Location / Hub", visible: false, order: 9, minWidth: "120px", description: "Hospital branch or treatment hub" },
  { id: "cost", label: "Total Infusion Cost", visible: false, order: 10, minWidth: "140px", description: "Configured cost per infusion session" },
  { id: "sessionsCount", label: "Sessions Progress", visible: false, order: 11, minWidth: "130px", description: "Completed vs planned infusion count" },
  { id: "lastSession", label: "Last Session Date", visible: false, order: 12, minWidth: "120px", description: "Date of previous infusion" },
];

export const DEFAULT_SESSION_COLUMNS: ColumnConfig[] = [
  { id: "date", label: "Session Date", visible: true, order: 0, minWidth: "120px", description: "Date of infusion session" },
  { id: "patientInfo", label: "Patient Name & ID", visible: true, order: 1, minWidth: "180px", description: "Patient identity details" },
  { id: "nurse", label: "Assigned Nurse", visible: true, order: 2, minWidth: "140px", description: "Attending chemotherapy nurse" },
  { id: "supplier", label: "Pharma Supplier", visible: true, order: 3, minWidth: "140px", description: "Medication distributor / supplier" },
  { id: "amount", label: "Billed Amount", visible: true, order: 4, minWidth: "130px", description: "Session total billing amount" },
  { id: "paymentStatus", label: "Payment Status", visible: true, order: 5, minWidth: "140px", description: "Payment status for this session" },
  { id: "pdf", label: "Bill / Discharge PDF", visible: true, order: 6, minWidth: "150px", description: "Links to bill and discharge summary" },
  { id: "actions", label: "Actions", visible: true, order: 7, minWidth: "90px", align: "right", description: "Delete infusion session" },
  { id: "doctor", label: "Assigned Doctor", visible: false, order: 8, minWidth: "140px", description: "Patient's primary oncologist" },
  { id: "cycle", label: "Session Cycle", visible: false, order: 9, minWidth: "110px", description: "Infusion cycle number" },
];

export const DEFAULT_PAYMENT_COLUMNS: ColumnConfig[] = [
  { id: "refId", label: "Record Ref", visible: true, order: 0, minWidth: "110px", description: "Unique payment record reference" },
  { id: "patientInfo", label: "Patient Name & ID", visible: true, order: 1, minWidth: "180px", description: "Patient identity details" },
  { id: "doctor", label: "Assigned Doctor", visible: true, order: 2, minWidth: "140px", description: "Attending physician" },
  { id: "date", label: "Session Date", visible: true, order: 3, minWidth: "120px", description: "Infusion date" },
  { id: "amount", label: "Amount Billed", visible: true, order: 4, minWidth: "120px", description: "Billed fee in INR" },
  { id: "paymentStatus", label: "Payment Status", visible: true, order: 5, minWidth: "140px", description: "Collection status" },
  { id: "quickUpdate", label: "Quick Update", visible: true, order: 6, minWidth: "150px", align: "right", description: "Dropdown to update status" },
  { id: "intern", label: "Assigned Intern", visible: false, order: 7, minWidth: "140px", description: "Operations coordinator" },
  { id: "supplier", label: "Pharma Supplier", visible: false, order: 8, minWidth: "140px", description: "Pharma distributor" },
];

export const DEFAULT_OUTREACH_COLUMNS: ColumnConfig[] = [
  { id: "id", label: "ID", visible: true, order: 0, minWidth: "90px", description: "Unique outreach record ID" },
  { id: "doctorName", label: "Doctor & Specialisation", visible: true, order: 1, minWidth: "180px", description: "Doctor name & oncology specialty" },
  { id: "hospital", label: "Hospital / Clinic", visible: true, order: 2, minWidth: "180px", description: "Hospital affiliation & tag" },
  { id: "contactNumber", label: "Contact Number", visible: true, order: 3, minWidth: "130px", description: "Doctor / clinic phone contact" },
  { id: "outreachStage", label: "Outreach Stage", visible: true, order: 4, minWidth: "140px", description: "Current stage of outreach workflow" },
  { id: "status", label: "Response Status", visible: true, order: 5, minWidth: "140px", description: "Outreach response status" },
  { id: "outreachDoneBy", label: "Outreach Done By", visible: true, order: 6, minWidth: "130px", description: "Assigned intern / team member" },
  { id: "notes", label: "Outreach Note", visible: true, order: 7, minWidth: "260px", description: "Inline editable notes & follow-up log" },
  { id: "actions", label: "Actions", visible: true, order: 8, minWidth: "90px", align: "right", description: "Edit / delete action buttons" },
  { id: "lastOutreachDate", label: "Last Contact Date", visible: false, order: 9, minWidth: "120px", description: "Date of last outreach contact" },
  { id: "email", label: "Email Address", visible: false, order: 10, minWidth: "160px", description: "Doctor email address" },
];

export const DEFAULT_TABLE_COLUMNS: TableColumnsState = {
  patients: DEFAULT_PATIENT_COLUMNS,
  sessions: DEFAULT_SESSION_COLUMNS,
  payments: DEFAULT_PAYMENT_COLUMNS,
  outreach: DEFAULT_OUTREACH_COLUMNS,
};

const STORAGE_KEY = "carcinome_table_columns_config";

export function loadSavedTableColumns(): TableColumnsState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        patients: syncColumns(parsed.patients, DEFAULT_PATIENT_COLUMNS),
        sessions: syncColumns(parsed.sessions, DEFAULT_SESSION_COLUMNS),
        payments: syncColumns(parsed.payments, DEFAULT_PAYMENT_COLUMNS),
        outreach: syncColumns(parsed.outreach, DEFAULT_OUTREACH_COLUMNS),
      };
    }
  } catch (e) {
    console.error("Failed to load table columns from localStorage", e);
  }
  return DEFAULT_TABLE_COLUMNS;
}

export function saveTableColumns(config: TableColumnsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save table columns to localStorage", e);
  }
}

function syncColumns(savedList: ColumnConfig[] | undefined, defaultList: ColumnConfig[]): ColumnConfig[] {
  if (!Array.isArray(savedList)) return defaultList;

  const result: ColumnConfig[] = [];
  const savedMap = new Map(savedList.map((col) => [col.id, col]));

  // Keep existing saved columns with updated defaults if new properties added
  savedList.forEach((col, idx) => {
    const def = defaultList.find((d) => d.id === col.id);
    result.push({
      ...(def || {}),
      ...col,
      order: typeof col.order === "number" ? col.order : idx,
      isCustom: col.isCustom ?? !def,
    });
  });

  // Append any new default columns not in saved
  defaultList.forEach((def) => {
    if (!savedMap.has(def.id)) {
      result.push({ ...def, order: result.length });
    }
  });

  return result.sort((a, b) => a.order - b.order);
}

export function getActiveColumns(columns: ColumnConfig[]): ColumnConfig[] {
  return [...columns].filter((c) => c.visible).sort((a, b) => a.order - b.order);
}
