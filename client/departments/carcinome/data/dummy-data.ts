// ─── Carcinome Department — Dummy Data ────────────────────────────────────────
// Mirrors the structure of CARCINOME_ DATABASE.xlsx + Patient_Coordination_Tracker.xlsx
// Replace with live Supabase queries when backend is ready.

export type InfusionStatus = "Not Started" | "In Progress" | "Completed" | "Cancelled";
export type PaymentStatus = "Paid" | "Pending" | "Partially Paid" | "Insurance Processing";
export type DischargeSummaryStatus = "N/A" | "Not Started" | "In Progress" | "Completed";
export type OnboardingStatus =
  | "Active"
  | "Treatment completed"
  | "No longer with the organisation"
  | "No longer in the organisation";

export interface InfusionSession {
  date: string; // ISO date string
  supplier: string | null;
  supplierCost: number | null;
  nurse: string | null;
  nurseCost: number | null;
  totalAmount: number | null;
  paymentStatus: PaymentStatus | null;
  billGenerated: boolean;
  dischargeSummaryPdf: boolean;
  feedbackTaken: boolean;
  notes: string | null;
}

export interface Patient {
  id: string; // CC2026001 …
  name: string;
  phone: string;
  contactName: string | null;
  allottedIntern: string | null;
  onboardingStatus: OnboardingStatus;
  services: string;
  location: string;
  age: number | null;
  gender: "Male" | "Female" | "Other";
  assignedDoctor: string;
  diagnosis: string;
  medicine: string;
  dischargeSummaryCopy: string | null;
  supplier: string;
  supplierContact: string;
  assignedNurse: string;
  nurseContact: string;
  infusionScheduleNotes: string;
  upcomingInfusionStatus: string;
  confirmedDate: string | null;
  costOfInfusion: number | null;
  // From Patient Coordination Tracker
  infusionStatus: InfusionStatus;
  lastInfusionDate: string | null;
  dischargeSummaryStatus: DischargeSummaryStatus;
  paymentStatus: PaymentStatus;
  nextInfusionDate: string | null;
  coordinationNotes: string | null;
  completedSessionsCount?: number;
  totalPlannedSessions?: number;
  // Per-session history (from individual tabs in Carcinome DB)
  sessions: InfusionSession[];
}

export const patients: Patient[] = [
  {
    id: "CC2026001",
    name: "Pappu",
    phone: "99340 38365",
    contactName: null,
    allottedIntern: "Komal",
    onboardingStatus: "Treatment completed",
    services: "At home chemotherapy infusion",
    location: "Dharavi Junction, Mumbai",
    age: 44,
    gender: "Male",
    assignedDoctor: "Dr. Darshit Shah",
    diagnosis: "Right CA Buccal Mucosa (Oral Cancer)",
    medicine: "Aprecap 125 · Cisplatin 100 mg · Granisetron 3 mg · Dexa 8 mg · Pantoprazole 40 mg · KCL 2 · MGSO4 2",
    dischargeSummaryCopy: "Pappu_discharge_summary.pdf",
    supplier: "Mr. Anil",
    supplierContact: "97689 27006",
    assignedNurse: "Nurse Kavitha",
    nurseContact: "81047 16591",
    infusionScheduleNotes: "Weekly infusion rotations. Start coordinating next infusion after each completed session.",
    upcomingInfusionStatus: "Infusion treatment completed — follow up for payments",
    confirmedDate: null,
    costOfInfusion: null,
    infusionStatus: "Completed",
    lastInfusionDate: "2026-07-21",
    dischargeSummaryStatus: "Completed",
    paymentStatus: "Pending",
    nextInfusionDate: null,
    coordinationNotes: "Look into how many infusions are pending",
    sessions: [
      { date: "2026-05-12", supplier: "Mr. Anil", supplierCost: 3200, nurse: "Nurse Kavitha", nurseCost: 2500, totalAmount: 5700, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: true, feedbackTaken: true, notes: null },
      { date: "2026-05-26", supplier: "Mr. Anil", supplierCost: 3200, nurse: "Nurse Kavitha", nurseCost: 2500, totalAmount: 5700, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: false, feedbackTaken: false, notes: null },
      { date: "2026-06-09", supplier: "Mr. Anil", supplierCost: 3400, nurse: "Nurse Kavitha", nurseCost: 2500, totalAmount: 5900, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: false, feedbackTaken: true, notes: null },
      { date: "2026-07-21", supplier: "Mr. Anil", supplierCost: 3200, nurse: "Nurse Kavitha", nurseCost: 2500, totalAmount: 5700, paymentStatus: "Pending", billGenerated: false, dischargeSummaryPdf: false, feedbackTaken: false, notes: "Final session — payment follow-up needed" },
    ],
  },
  {
    id: "CC2026002",
    name: "Pushpa Ram Bachani",
    phone: "98338 63777",
    contactName: "Divesh Bachani",
    allottedIntern: "Soumyaparna",
    onboardingStatus: "Active",
    services: "At home chemotherapy infusion",
    location: "Khar W., Mumbai",
    age: 69,
    gender: "Female",
    assignedDoctor: "Dr. Sewanti Limaye",
    diagnosis: "Stage IV Metastatic High Grade Serous CA Ovary",
    medicine: "Paclitaxel + Carboplatin",
    dischargeSummaryCopy: "Pushpa_Bachani_discharge_summary.pdf",
    supplier: "Mr. Anil",
    supplierContact: "97689 27006",
    assignedNurse: "Mr. Shaan",
    nurseContact: "98227 57316",
    infusionScheduleNotes: "Weekly infusion rotations.",
    upcomingInfusionStatus: "Dr has asked to pause SMOF. Appointment cancelled for 6/08/26",
    confirmedDate: null,
    costOfInfusion: null,
    infusionStatus: "Completed",
    lastInfusionDate: "2026-07-19",
    dischargeSummaryStatus: "Completed",
    paymentStatus: "Pending",
    nextInfusionDate: null,
    coordinationNotes: "2 or more infusions pending — verify with doctor",
    sessions: [
      { date: "2026-06-10", supplier: "Mr. Anil", supplierCost: 4200, nurse: "Mr. Shaan", nurseCost: 3000, totalAmount: 7200, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: true, feedbackTaken: true, notes: null },
      { date: "2026-06-24", supplier: "Mr. Anil", supplierCost: 4200, nurse: "Mr. Shaan", nurseCost: 3000, totalAmount: 7200, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: false, feedbackTaken: false, notes: null },
      { date: "2026-07-08", supplier: "Mr. Anil", supplierCost: 4200, nurse: "Mr. Shaan", nurseCost: 3000, totalAmount: 7200, paymentStatus: "Pending", billGenerated: false, dischargeSummaryPdf: false, feedbackTaken: false, notes: "SMOF paused per doctor" },
      { date: "2026-07-19", supplier: "Mr. Anil", supplierCost: 4200, nurse: "Mr. Shaan", nurseCost: 3000, totalAmount: 7200, paymentStatus: "Pending", billGenerated: false, dischargeSummaryPdf: false, feedbackTaken: false, notes: null },
    ],
  },
  {
    id: "CC2026003",
    name: "Zara Morani",
    phone: "98213 19074",
    contactName: "Karim Morani",
    allottedIntern: null,
    onboardingStatus: "No longer with the organisation",
    services: "At home nursing + infusions",
    location: "Mumbai",
    age: null,
    gender: "Female",
    assignedDoctor: "Dr. Sewanti Limaye",
    diagnosis: "Breast Cancer with Brain Metastasis",
    medicine: "MVI (MultiVitamin) + IV Fluid + DNS",
    dischargeSummaryCopy: "Zara_Morani_discharge_summary.jpg",
    supplier: "Mr. Anil",
    supplierContact: "97689 27006",
    assignedNurse: "Mr. Shaan",
    nurseContact: "98227 57316",
    infusionScheduleNotes: "NO LONGER WITH THE ORGANISATION",
    upcomingInfusionStatus: "--",
    confirmedDate: null,
    costOfInfusion: null,
    infusionStatus: "Completed",
    lastInfusionDate: "2026-06-17",
    dischargeSummaryStatus: "Completed",
    paymentStatus: "Pending",
    nextInfusionDate: null,
    coordinationNotes: "Nursing from 18th July — ask Dr. Darshit",
    sessions: [
      { date: "2026-05-20", supplier: "Mr. Anil", supplierCost: 2800, nurse: "Mr. Shaan", nurseCost: 2500, totalAmount: 5300, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: true, feedbackTaken: true, notes: null },
      { date: "2026-06-03", supplier: "Mr. Anil", supplierCost: 2800, nurse: "Mr. Shaan", nurseCost: 2500, totalAmount: 5300, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: false, feedbackTaken: false, notes: null },
      { date: "2026-06-17", supplier: "Mr. Anil", supplierCost: 2800, nurse: "Mr. Shaan", nurseCost: 2500, totalAmount: 5300, paymentStatus: "Pending", billGenerated: false, dischargeSummaryPdf: false, feedbackTaken: false, notes: "Last session" },
    ],
  },
  {
    id: "CC2026004",
    name: "Sanjay Shorewala",
    phone: "98208 60967",
    contactName: null,
    allottedIntern: "Vanya",
    onboardingStatus: "Active",
    services: "At home chemotherapy infusion",
    location: "Juhu, Mumbai",
    age: 58,
    gender: "Male",
    assignedDoctor: "Dr. Darshit Shah",
    diagnosis: "Carcinoma Stomach",
    medicine: "FOLFOX regimen — Oxaliplatin + Leucovorin + 5FU",
    dischargeSummaryCopy: "Sanjay_Shorewala_discharge_summary.pdf",
    supplier: "Mr. Anil",
    supplierContact: "97689 27006",
    assignedNurse: "Nurse Kavitha",
    nurseContact: "81047 16591",
    infusionScheduleNotes: "Weekly infusion rotations.",
    upcomingInfusionStatus: "Scheduled for Monday",
    confirmedDate: "2026-08-11",
    costOfInfusion: 6200,
    infusionStatus: "Completed",
    lastInfusionDate: "2026-07-20",
    dischargeSummaryStatus: "Completed",
    paymentStatus: "Paid",
    nextInfusionDate: "2026-08-11",
    coordinationNotes: null,
    sessions: [
      { date: "2026-06-09", supplier: "Mr. Anil", supplierCost: 3800, nurse: "Nurse Kavitha", nurseCost: 2500, totalAmount: 6300, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: true, feedbackTaken: true, notes: null },
      { date: "2026-06-23", supplier: "Mr. Anil", supplierCost: 3800, nurse: "Nurse Kavitha", nurseCost: 2500, totalAmount: 6300, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: true, feedbackTaken: true, notes: null },
      { date: "2026-07-07", supplier: "Mr. Anil", supplierCost: 3800, nurse: "Nurse Kavitha", nurseCost: 2500, totalAmount: 6300, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: true, feedbackTaken: true, notes: null },
      { date: "2026-07-20", supplier: "Mr. Anil", supplierCost: 3800, nurse: "Nurse Kavitha", nurseCost: 2500, totalAmount: 6300, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: true, feedbackTaken: true, notes: null },
    ],
  },
  {
    id: "CC2026005",
    name: "Vijay Pandey",
    phone: "98200 68937",
    contactName: "Rajesh Dubey",
    allottedIntern: "Aditya",
    onboardingStatus: "Active",
    services: "At home chemotherapy infusion",
    location: "Borivali, Mumbai",
    age: 62,
    gender: "Male",
    assignedDoctor: "Dr. Sewanti Limaye",
    diagnosis: "Carcinoma Lung — Stage III",
    medicine: "Pemetrexed + Carboplatin + Bevacizumab",
    dischargeSummaryCopy: null,
    supplier: "Mr. Anil",
    supplierContact: "97689 27006",
    assignedNurse: "Mr. Shaan",
    nurseContact: "98227 57316",
    infusionScheduleNotes: "Bi-weekly. PET scan requested.",
    upcomingInfusionStatus: "PET scan result awaited before next infusion",
    confirmedDate: null,
    costOfInfusion: 8500,
    infusionStatus: "Completed",
    lastInfusionDate: "2026-07-07",
    dischargeSummaryStatus: "In Progress",
    paymentStatus: "Paid",
    nextInfusionDate: null,
    coordinationNotes: "PET scan request + medication pending",
    sessions: [
      { date: "2026-05-19", supplier: "Mr. Anil", supplierCost: 5500, nurse: "Mr. Shaan", nurseCost: 3000, totalAmount: 8500, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: false, feedbackTaken: true, notes: null },
      { date: "2026-06-02", supplier: "Mr. Anil", supplierCost: 5500, nurse: "Mr. Shaan", nurseCost: 3000, totalAmount: 8500, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: false, feedbackTaken: false, notes: null },
      { date: "2026-06-16", supplier: "Mr. Anil", supplierCost: 5500, nurse: "Mr. Shaan", nurseCost: 3000, totalAmount: 8500, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: false, feedbackTaken: false, notes: null },
      { date: "2026-07-07", supplier: "Mr. Anil", supplierCost: 5500, nurse: "Mr. Shaan", nurseCost: 3000, totalAmount: 8500, paymentStatus: "Paid", billGenerated: false, dischargeSummaryPdf: false, feedbackTaken: false, notes: "Awaiting PET scan" },
    ],
  },
  {
    id: "CC2026006",
    name: "Vina Pawar",
    phone: "70454 59692",
    contactName: null,
    allottedIntern: "Priya",
    onboardingStatus: "Active",
    services: "At home chemotherapy infusion",
    location: "Andheri, Mumbai",
    age: 55,
    gender: "Female",
    assignedDoctor: "Dr. Darshit Shah",
    diagnosis: "Carcinoma Breast — Stage II",
    medicine: "AC-T regimen — Adriamycin + Cyclophosphamide + Paclitaxel",
    dischargeSummaryCopy: "Vina_Pawar_discharge_summary.pdf",
    supplier: "Mr. Anil",
    supplierContact: "97689 27006",
    assignedNurse: "Nurse Kavitha",
    nurseContact: "81047 16591",
    infusionScheduleNotes: "Weekly. Confirm each Tuesday.",
    upcomingInfusionStatus: "Unconfirmed for next Tuesday",
    confirmedDate: null,
    costOfInfusion: 7200,
    infusionStatus: "Completed",
    lastInfusionDate: "2026-07-22",
    dischargeSummaryStatus: "Completed",
    paymentStatus: "Paid",
    nextInfusionDate: "2026-08-05",
    coordinationNotes: null,
    sessions: [
      { date: "2026-06-17", supplier: "Mr. Anil", supplierCost: 4500, nurse: "Nurse Kavitha", nurseCost: 2700, totalAmount: 7200, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: true, feedbackTaken: true, notes: null },
      { date: "2026-07-01", supplier: "Mr. Anil", supplierCost: 4500, nurse: "Nurse Kavitha", nurseCost: 2700, totalAmount: 7200, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: true, feedbackTaken: true, notes: null },
      { date: "2026-07-15", supplier: "Mr. Anil", supplierCost: 4500, nurse: "Nurse Kavitha", nurseCost: 2700, totalAmount: 7200, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: false, feedbackTaken: false, notes: null },
      { date: "2026-07-22", supplier: "Mr. Anil", supplierCost: 4500, nurse: "Nurse Kavitha", nurseCost: 2700, totalAmount: 7200, paymentStatus: "Paid", billGenerated: true, dischargeSummaryPdf: true, feedbackTaken: true, notes: null },
    ],
  },
  {
    id: "CC2026007",
    name: "Kamaladevi Jain",
    phone: "98671 44591",
    contactName: null,
    allottedIntern: null,
    onboardingStatus: "Active",
    services: "At home chemotherapy infusion",
    location: "Malad, Mumbai",
    age: 72,
    gender: "Female",
    assignedDoctor: "Dr. Sewanti Limaye",
    diagnosis: "Carcinoma Cervix — Stage III",
    medicine: "Cisplatin + 5FU",
    dischargeSummaryCopy: null,
    supplier: "Mr. Anil",
    supplierContact: "97689 27006",
    assignedNurse: "Nurse Kavitha",
    nurseContact: "81047 16591",
    infusionScheduleNotes: "Bi-weekly schedule.",
    upcomingInfusionStatus: "Pending coordination",
    confirmedDate: null,
    costOfInfusion: null,
    infusionStatus: "Not Started",
    lastInfusionDate: null,
    dischargeSummaryStatus: "Not Started",
    paymentStatus: "Pending",
    nextInfusionDate: null,
    coordinationNotes: null,
    sessions: [],
  },
  {
    id: "CC2026008",
    name: "Sushila Sarkar",
    phone: "90044 63261",
    contactName: "Dannie",
    allottedIntern: "Riya",
    onboardingStatus: "Active",
    services: "At home chemotherapy infusion",
    location: "Bandra, Mumbai",
    age: 65,
    gender: "Female",
    assignedDoctor: "Dr. Darshit Shah",
    diagnosis: "Carcinoma Colon — Stage II",
    medicine: "CAPOX — Capecitabine + Oxaliplatin",
    dischargeSummaryCopy: null,
    supplier: "NA",
    supplierContact: "--",
    assignedNurse: "Nurse Kavitha",
    nurseContact: "81047 16591",
    infusionScheduleNotes: "Tri-weekly cycle.",
    upcomingInfusionStatus: "Next scheduled 20 July",
    confirmedDate: "2026-07-20",
    costOfInfusion: 5000,
    infusionStatus: "Completed",
    lastInfusionDate: "2026-07-20",
    dischargeSummaryStatus: "In Progress",
    paymentStatus: "Paid",
    nextInfusionDate: "2026-08-10",
    coordinationNotes: "Age, diagnosis — cancer. Follow up on discharge summary.",
    sessions: [
      { date: "2026-07-06", supplier: null, supplierCost: 2500, nurse: "Nurse Kavitha", nurseCost: 2500, totalAmount: 5000, paymentStatus: "Paid", billGenerated: false, dischargeSummaryPdf: false, feedbackTaken: false, notes: null },
      { date: "2026-07-13", supplier: "NA", supplierCost: null, nurse: "Nurse Kavitha", nurseCost: 2500, totalAmount: 2500, paymentStatus: "Pending", billGenerated: false, dischargeSummaryPdf: false, feedbackTaken: false, notes: null },
      { date: "2026-07-20", supplier: null, supplierCost: null, nurse: "Nurse Kavitha", nurseCost: 2500, totalAmount: null, paymentStatus: null, billGenerated: false, dischargeSummaryPdf: false, feedbackTaken: false, notes: null },
    ],
  },
  {
    id: "CC2026009",
    name: "Anju Gupta",
    phone: "9594477772",
    contactName: "Sudhir Gupta",
    allottedIntern: null,
    onboardingStatus: "No longer in the organisation",
    services: "At home chemotherapy infusion",
    location: "41, Sea Breeze, Juhu Tara Road, Mumbai 400049",
    age: 68,
    gender: "Female",
    assignedDoctor: "Dr. Sewanti Limaye",
    diagnosis: "Carcinoma Ovary",
    medicine: "C#2 D1 Paclitaxel + Carboplatin",
    dischargeSummaryCopy: null,
    supplier: "Mr. Anil",
    supplierContact: "97689 27006",
    assignedNurse: "Mr. Shaan",
    nurseContact: "98227 57316",
    infusionScheduleNotes: "Next infusion not finalised — specialist nurse required (patient has difficult veins).",
    upcomingInfusionStatus: "Coordination pending — inquire nurse Shaan",
    confirmedDate: null,
    costOfInfusion: null,
    infusionStatus: "Not Started",
    lastInfusionDate: null,
    dischargeSummaryStatus: "Not Started",
    paymentStatus: "Pending",
    nextInfusionDate: null,
    coordinationNotes: "Ask for Anju Sudhir Gupta discharge summary",
    sessions: [],
  },
  {
    id: "CC2026010",
    name: "Ganga Prasad Joshi",
    phone: "98191 23750",
    contactName: "Chetan Joshi",
    allottedIntern: null,
    onboardingStatus: "No longer in the organisation",
    services: "At home chemotherapy infusion",
    location: "Mumbai (address pending)",
    age: 88,
    gender: "Male",
    assignedDoctor: "Dr. Sewanti Limaye",
    diagnosis: "Carcinoma Pancreas",
    medicine: "C#1 D15 FOLFOX — Oxaliplatin + Leucovorin + 5FU (Baxter pump 46h)",
    dischargeSummaryCopy: "Ganga_Prasad_Joshi_discharge_summary.pdf",
    supplier: "Mr. Anil",
    supplierContact: "97689 27006",
    assignedNurse: "Mr. Shaan",
    nurseContact: "98227 57316",
    infusionScheduleNotes: "Weekly infusion rotations.",
    upcomingInfusionStatus: "Patient no longer with the organisation",
    confirmedDate: null,
    costOfInfusion: null,
    infusionStatus: "Completed",
    lastInfusionDate: "2026-07-08",
    dischargeSummaryStatus: "Completed",
    paymentStatus: "Paid",
    nextInfusionDate: null,
    coordinationNotes: "Verify with Dr. Darshit",
    sessions: [
      { date: "2026-07-08", supplier: null, supplierCost: null, nurse: "Mr. Shaan", nurseCost: null, totalAmount: null, paymentStatus: "Paid", billGenerated: false, dischargeSummaryPdf: true, feedbackTaken: false, notes: "Requested discharge summary" },
    ],
  },
  {
    id: "CC2026011",
    name: "Vanita Dinesh Suthar",
    phone: "98334 43611",
    contactName: null,
    allottedIntern: "Aadya",
    onboardingStatus: "Active",
    services: "At home chemotherapy infusion",
    location: "J.S.S. Road, Shakuntala Sadan, Kalbadevi, Mumbai 400002",
    age: 39,
    gender: "Female",
    assignedDoctor: "Dr. Darshit Shah",
    diagnosis: "Carcinoma Lung",
    medicine: "C#4 Pemetrexed + Carboplatin",
    dischargeSummaryCopy: "Vanita_Dinesh_Suthar_discharge_summary.jpg",
    supplier: "Mr. Anil",
    supplierContact: "97689 27006",
    assignedNurse: "Nurse Kavitha",
    nurseContact: "81047 16591",
    infusionScheduleNotes: "Weekly rotations. Start coordination after each completed session.",
    upcomingInfusionStatus: "Infusion completed — gather feedback, set up next date",
    confirmedDate: "2026-07-07",
    costOfInfusion: null,
    infusionStatus: "Completed",
    lastInfusionDate: "2026-07-06",
    dischargeSummaryStatus: "Completed",
    paymentStatus: "Pending",
    nextInfusionDate: "2026-08-12",
    coordinationNotes: null,
    sessions: [
      { date: "2026-06-01", supplier: "Mr. Anil", supplierCost: null, nurse: null, nurseCost: null, totalAmount: null, paymentStatus: null, billGenerated: false, dischargeSummaryPdf: false, feedbackTaken: false, notes: null },
      { date: "2026-07-07", supplier: "Mr. Anil", supplierCost: 2641, nurse: "Nurse Kavitha", nurseCost: null, totalAmount: null, paymentStatus: "Pending", billGenerated: false, dischargeSummaryPdf: false, feedbackTaken: false, notes: null },
    ],
  },
  {
    id: "CC2026012",
    name: "Suresh Rathod",
    phone: "70455 48849",
    contactName: "Shourya",
    allottedIntern: null,
    onboardingStatus: "Active",
    services: "At home chemotherapy infusion",
    location: "Mumbai",
    age: null,
    gender: "Male",
    assignedDoctor: "Dr. Darshit Shah",
    diagnosis: "Carcinoma Prostate",
    medicine: "Docetaxel + Prednisone",
    dischargeSummaryCopy: null,
    supplier: "Mr. Anil",
    supplierContact: "97689 27006",
    assignedNurse: "Nurse Kavitha",
    nurseContact: "81047 16591",
    infusionScheduleNotes: "Tri-weekly cycle.",
    upcomingInfusionStatus: "Pending coordination",
    confirmedDate: null,
    costOfInfusion: null,
    infusionStatus: "Not Started",
    lastInfusionDate: "2026-07-10",
    dischargeSummaryStatus: "Completed",
    paymentStatus: "Pending",
    nextInfusionDate: null,
    coordinationNotes: null,
    sessions: [
      { date: "2026-07-10", supplier: null, supplierCost: null, nurse: null, nurseCost: null, totalAmount: null, paymentStatus: null, billGenerated: false, dischargeSummaryPdf: false, feedbackTaken: false, notes: null },
    ],
  },
  {
    id: "CC2026013",
    name: "Manjula Gadda",
    phone: "90828 06669",
    contactName: "Vijay",
    allottedIntern: null,
    onboardingStatus: "Active",
    services: "At home chemotherapy infusion",
    location: "Mumbai",
    age: null,
    gender: "Female",
    assignedDoctor: "Dr. Sewanti Limaye",
    diagnosis: "Carcinoma Uterus",
    medicine: "Carboplatin + Paclitaxel",
    dischargeSummaryCopy: null,
    supplier: "Mr. Anil",
    supplierContact: "97689 27006",
    assignedNurse: "Nurse Kavitha",
    nurseContact: "81047 16591",
    infusionScheduleNotes: "Schedule TBD.",
    upcomingInfusionStatus: "Pending coordination",
    confirmedDate: null,
    costOfInfusion: null,
    infusionStatus: "Not Started",
    lastInfusionDate: null,
    dischargeSummaryStatus: "Not Started",
    paymentStatus: "Pending",
    nextInfusionDate: null,
    coordinationNotes: null,
    sessions: [],
  },
];

// ─── Computed summary helpers ──────────────────────────────────────────────────

export function getSummaryStats(pts: Patient[]) {
  const active = pts.filter((p) =>
    p.onboardingStatus === "Active" || p.onboardingStatus === "Treatment completed"
  ).length;
  const pendingPayment = pts.filter((p) => p.paymentStatus !== "Paid").length;
  const upcomingInfusions = pts.filter((p) => p.nextInfusionDate !== null).length;
  const dischargeInProgress = pts.filter(
    (p) => p.dischargeSummaryStatus === "In Progress" || p.dischargeSummaryStatus === "Not Started"
  ).length;
  const totalRevenue = pts.flatMap((p) => p.sessions).reduce(
    (sum, s) => sum + (s.totalAmount ?? 0),
    0
  );
  const totalSessions = pts.flatMap((p) => p.sessions).length;
  return { active, pendingPayment, upcomingInfusions, dischargeInProgress, totalRevenue, totalSessions };
}

// ─── Extended Types ──────────────────────────────────────────────────────────

export interface PatientDocument {
  id: string;
  patientId: string;
  name: string;
  fileType: "pdf" | "image" | "doc";
  uploadedAt: string;
  uploadedBy: string;
  size: string;
  url?: string;
}

export interface PatientNote {
  id: string;
  patientId: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  patientId?: string;
  patientName?: string;
  status: "Pending" | "In Progress" | "Completed";
  priority: "High" | "Medium" | "Low";
  assignee: string;
  dueDate: string;
  category: "Payment" | "Session Schedule" | "Discharge Summary" | "Doctor Review" | "General";
}

export interface MasterDataItem {
  id: string;
  category:
    | "Doctor"
    | "Supplier"
    | "Assignee"
    | "SessionType"
    | "PatientStatus"
    | "PaymentStatus"
    | "Diagnosis"
    | "Location"
    | "PaymentMode"
    | "OutreachStage"
    | "OutreachStatus"
    | "Hospital"
    | "Specialisation";
  value: string;
  label: string;
  description?: string;
  /** Gmail address linked to this intern — used for login-based role detection (Assignee category only) */
  gmail?: string;
  active: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: "Team Lead" | "Operations Team" | "Finance System";
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "PAYMENT" | "DOCUMENT_UPLOAD" | "TASK_COMPLETE";
  targetType: "Patient" | "Session" | "Task" | "Payment" | "MasterData" | "Document";
  targetId: string;
  targetName: string;
  details: string;
  changes?: { field: string; oldVal?: string; newVal?: string }[];
}

// ─── Dummy Initial Master Data ───────────────────────────────────────────────

export const initialMasterData: MasterDataItem[] = [
  // Doctors
  { id: "md-doc-1", category: "Doctor", value: "Dr. Darshit Shah", label: "Dr. Darshit Shah", description: "Oncologist", active: true },
  { id: "md-doc-2", category: "Doctor", value: "Dr. Sewanti Limaye", label: "Dr. Sewanti Limaye", description: "Senior Medical Oncologist", active: true },
  { id: "md-doc-3", category: "Doctor", value: "Dr. Suresh Advani", label: "Dr. Suresh Advani", description: "Consultant Oncologist", active: true },

  // Suppliers
  { id: "md-sup-1", category: "Supplier", value: "Mr. Anil", label: "Mr. Anil (97689 27006)", description: "Primary Pharma Supplier", active: true },
  { id: "md-sup-2", category: "Supplier", value: "MedPlus Chemist", label: "MedPlus Chemist", description: "Retail Pharmacy Partner", active: true },

  // Assignees (Interns / Staff)
  { id: "md-asg-1", category: "Assignee", value: "Komal", label: "Komal", description: "Operations Intern", active: true },
  { id: "md-asg-2", category: "Assignee", value: "Soumyaparna", label: "Soumyaparna", description: "Operations Intern", active: true },
  { id: "md-asg-3", category: "Assignee", value: "Vanya", label: "Vanya", description: "Operations Intern", active: true },
  { id: "md-asg-4", category: "Assignee", value: "Aadya", label: "Aadya", description: "Operations Intern", active: true },
  { id: "md-asg-5", category: "Assignee", value: "Subhiksha", label: "Subhiksha", description: "Outreach Lead Intern", active: true },
  { id: "md-asg-6", category: "Assignee", value: "Lahari", label: "Lahari", description: "Outreach Lead Intern", active: true },
  { id: "md-asg-7", category: "Assignee", value: "Shamita", label: "Shamita", description: "Outreach Intern", active: true },
  { id: "md-asg-8", category: "Assignee", value: "Kalyani", label: "Kalyani", description: "Outreach Intern", active: true },

  // Session Types
  { id: "md-st-1", category: "SessionType", value: "Chemotherapy Infusion", label: "Chemotherapy Infusion", active: true },
  { id: "md-st-2", category: "SessionType", value: "Immunotherapy", label: "Immunotherapy", active: true },
  { id: "md-st-3", category: "SessionType", value: "IV Hydration & Supportive Care", label: "IV Hydration & Supportive Care", active: true },

  // Patient Statuses
  { id: "md-ps-1", category: "PatientStatus", value: "Active", label: "Active", active: true },
  { id: "md-ps-2", category: "PatientStatus", value: "Treatment completed", label: "Treatment completed", active: true },
  { id: "md-ps-3", category: "PatientStatus", value: "No longer with the organisation", label: "No longer with organisation", active: true },

  // Payment Statuses
  { id: "md-pay-1", category: "PaymentStatus", value: "Paid", label: "Paid", active: true },
  { id: "md-pay-2", category: "PaymentStatus", value: "Pending", label: "Pending", active: true },
  { id: "md-pay-3", category: "PaymentStatus", value: "Partially Paid", label: "Partially Paid", active: true },
  { id: "md-pay-4", category: "PaymentStatus", value: "Insurance Processing", label: "Insurance Processing", active: true },

  // Payment Modes
  { id: "md-pm-1", category: "PaymentMode", value: "UPI", label: "UPI Transfer", active: true },
  { id: "md-pm-2", category: "PaymentMode", value: "Bank Transfer", label: "NEFT / RTGS Bank Transfer", active: true },
  { id: "md-pm-3", category: "PaymentMode", value: "Cash", label: "Cash", active: true },
  { id: "md-pm-4", category: "PaymentMode", value: "Insurance Direct", label: "Insurance Claim Settlement", active: true },

  // Diagnoses
  { id: "md-dx-1", category: "Diagnosis", value: "Right CA Buccal Mucosa (Oral Cancer)", label: "Right CA Buccal Mucosa", active: true },
  { id: "md-dx-2", category: "Diagnosis", value: "Stage IV Metastatic High Grade Serous CA Ovary", label: "Stage IV CA Ovary", active: true },
  { id: "md-dx-3", category: "Diagnosis", value: "Breast Cancer with Brain Metastasis", label: "Breast Cancer w/ Brain Met", active: true },
  { id: "md-dx-4", category: "Diagnosis", value: "Carcinoma Stomach", label: "Carcinoma Stomach", active: true },
  { id: "md-dx-5", category: "Diagnosis", value: "Carcinoma Lung", label: "Carcinoma Lung", active: true },

  // Locations
  { id: "md-loc-1", category: "Location", value: "Dharavi Junction, Mumbai", label: "Dharavi, Mumbai", active: true },
  { id: "md-loc-2", category: "Location", value: "Khar W., Mumbai", label: "Khar West, Mumbai", active: true },
  { id: "md-loc-3", category: "Location", value: "Juhu, Mumbai", label: "Juhu, Mumbai", active: true },
  { id: "md-loc-4", category: "Location", value: "Kalbadevi, Mumbai", label: "Kalbadevi, Mumbai", active: true },

  // Outreach Stages
  { id: "md-os-1", category: "OutreachStage", value: "Initial", label: "Initial", active: true },
  { id: "md-os-2", category: "OutreachStage", value: "1st follow up", label: "1st follow up", active: true },
  { id: "md-os-3", category: "OutreachStage", value: "2nd follow up", label: "2nd follow up", active: true },
  { id: "md-os-4", category: "OutreachStage", value: "3rd follow up", label: "3rd follow up", active: true },
  { id: "md-os-5", category: "OutreachStage", value: "Subsequent Follow-up", label: "Subsequent Follow-up", active: true },
  { id: "md-os-6", category: "OutreachStage", value: "Collaboration Established/to be finalized", label: "Collaboration Established / Finalized", active: true },
  { id: "md-os-7", category: "OutreachStage", value: "Unresponsive", label: "Unresponsive Stage", active: true },

  // Outreach Statuses
  { id: "md-ost-1", category: "OutreachStatus", value: "Positive Response", label: "Positive Response", active: true },
  { id: "md-ost-2", category: "OutreachStatus", value: "Shared the Details", label: "Shared Details", active: true },
  { id: "md-ost-3", category: "OutreachStatus", value: "Busy/ Did not attend the call", label: "Busy / Did not attend call", active: true },
  { id: "md-ost-4", category: "OutreachStatus", value: "Awaiting Response", label: "Awaiting Response", active: true },
  { id: "md-ost-5", category: "OutreachStatus", value: "Unresponsive", label: "Unresponsive", active: true },
  { id: "md-ost-6", category: "OutreachStatus", value: "Declined", label: "Declined", active: true },
  { id: "md-ost-7", category: "OutreachStatus", value: "wrong number", label: "Wrong Number", active: true },

  // Hospitals & Clinics
  { id: "md-hosp-1", category: "Hospital", value: "Apollo", label: "Apollo Cancer Centre", active: true },
  { id: "md-hosp-2", category: "Hospital", value: "Jaslok", label: "Jaslok Hospital", active: true },
  { id: "md-hosp-3", category: "Hospital", value: "Lilavati", label: "Lilavati Hospital & Research Centre", active: true },
  { id: "md-hosp-4", category: "Hospital", value: "Kokilaben", label: "Kokilaben Dhirubhai Ambani Hospital", active: true },
  { id: "md-hosp-5", category: "Hospital", value: "HCG", label: "HCG Cancer Centre", active: true },
  { id: "md-hosp-6", category: "Hospital", value: "SL Raheja - Fortis ", label: "S.L. Raheja Hospital (Fortis)", active: true },
  { id: "md-hosp-7", category: "Hospital", value: "Asian Institute of Oncology", label: "Asian Institute of Oncology", active: true },
  { id: "md-hosp-8", category: "Hospital", value: "Max Nanavati", label: "Nanavati Max Healthcare", active: true },
  { id: "md-hosp-9", category: "Hospital", value: "Bombay Hospital", label: "Bombay Hospital", active: true },
  { id: "md-hosp-10", category: "Hospital", value: "Breach Candy", label: "Breach Candy Hospital", active: true },
  { id: "md-hosp-11", category: "Hospital", value: "POSITIVES", label: "POSITIVES Master List", active: true },

  // Specialisations
  { id: "md-sp-1", category: "Specialisation", value: "Surgical Oncologist", label: "Surgical Oncology", active: true },
  { id: "md-sp-2", category: "Specialisation", value: "Medical Oncologist", label: "Medical Oncology", active: true },
  { id: "md-sp-3", category: "Specialisation", value: "Haematology & Bone Marrow Transplant", label: "Haematology & BMT", active: true },
  { id: "md-sp-4", category: "Specialisation", value: "Radiation Oncology", label: "Radiation Oncology", active: true },
  { id: "md-sp-5", category: "Specialisation", value: "Pediatric Oncology", label: "Pediatric Oncology", active: true },
];

// ─── Initial Tasks ──────────────────────────────────────────────────────────

export const initialTasks: Task[] = [
  {
    id: "TSK-101",
    title: "Collect payment for final infusion session",
    description: "Follow up with patient family regarding pending Rs 5,700 for session completed on 21st July.",
    patientId: "CC2026001",
    patientName: "Pappu",
    status: "Pending",
    priority: "High",
    assignee: "Komal",
    dueDate: "2026-08-06",
    category: "Payment",
  },
  {
    id: "TSK-102",
    title: "Verify SMOF pause instructions with Dr. Sewanti",
    description: "Doctor asked to pause SMOF. Confirm updated medication list for next cycle.",
    patientId: "CC2026002",
    patientName: "Pushpa Ram Bachani",
    status: "In Progress",
    priority: "High",
    assignee: "Soumyaparna",
    dueDate: "2026-08-06",
    category: "Doctor Review",
  },
  {
    id: "TSK-103",
    title: "Confirm nurse availability for Sanjay Shorewala infusion",
    description: "Nurse Kavitha scheduled for home infusion session on 11th August.",
    patientId: "CC2026004",
    patientName: "Sanjay Shorewala",
    status: "Pending",
    priority: "Medium",
    assignee: "Vanya",
    dueDate: "2026-08-08",
    category: "Session Schedule",
  },
  {
    id: "TSK-104",
    title: "Upload missing discharge summary scan for Vanita Suthar",
    description: "Discharge summary scan image received from nurse; attach high-res PDF to patient documents.",
    patientId: "CC2026011",
    patientName: "Vanita Dinesh Suthar",
    status: "Pending",
    priority: "Medium",
    assignee: "Aadya",
    dueDate: "2026-08-07",
    category: "Discharge Summary",
  },
  {
    id: "TSK-105",
    title: "Review insurance reimbursement documents for Pushpa Bachani",
    description: "Cross check billing vouchers against insurance claim requirements.",
    patientId: "CC2026002",
    patientName: "Pushpa Ram Bachani",
    status: "Completed",
    priority: "Low",
    assignee: "Soumyaparna",
    dueDate: "2026-08-04",
    category: "Payment",
  },
];

// ─── Initial Audit Logs ──────────────────────────────────────────────────────

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: "LOG-5001",
    timestamp: "2026-08-05 14:30",
    actor: "Team Lead",
    role: "Team Lead",
    action: "STATUS_CHANGE",
    targetType: "Patient",
    targetId: "CC2026004",
    targetName: "Sanjay Shorewala",
    details: "Confirmed upcoming infusion session date for 2026-08-11",
    changes: [{ field: "confirmedDate", oldVal: "null", newVal: "2026-08-11" }],
  },
  {
    id: "LOG-5002",
    timestamp: "2026-08-05 12:15",
    actor: "Soumyaparna",
    role: "Operations Team",
    action: "TASK_COMPLETE",
    targetType: "Task",
    targetId: "TSK-105",
    targetName: "Insurance Document Review",
    details: "Marked task TSK-105 as Completed",
  },
  {
    id: "LOG-5003",
    timestamp: "2026-08-04 16:45",
    actor: "Komal",
    role: "Operations Team",
    action: "PAYMENT",
    targetType: "Payment",
    targetId: "CC2026001-S3",
    targetName: "Pappu (Session 3)",
    details: "Recorded payment of Rs 5,900 via UPI",
  },
  {
    id: "LOG-5004",
    timestamp: "2026-08-03 10:20",
    actor: "Team Lead",
    role: "Team Lead",
    action: "CREATE",
    targetType: "Session",
    targetId: "CC2026011-S2",
    targetName: "Vanita Dinesh Suthar (Session 2)",
    details: "Scheduled infusion session for 2026-07-07 with Nurse Kavitha",
  },
];

// ─── Initial Documents ──────────────────────────────────────────────────────

export const initialDocuments: PatientDocument[] = [
  {
    id: "DOC-101",
    patientId: "CC2026001",
    name: "Pappu_discharge_summary.pdf",
    fileType: "pdf",
    uploadedAt: "2026-07-22",
    uploadedBy: "Komal",
    size: "1.4 MB",
  },
  {
    id: "DOC-102",
    patientId: "CC2026002",
    name: "Pushpa_Bachani_discharge_summary.pdf",
    fileType: "pdf",
    uploadedAt: "2026-07-20",
    uploadedBy: "Soumyaparna",
    size: "2.1 MB",
  },
  {
    id: "DOC-103",
    patientId: "CC2026003",
    name: "Zara_Morani_discharge_summary.jpg",
    fileType: "image",
    uploadedAt: "2026-06-18",
    uploadedBy: "Team Lead",
    size: "850 KB",
  },
  {
    id: "DOC-104",
    patientId: "CC2026004",
    name: "Sanjay_Shorewala_discharge_summary.pdf",
    fileType: "pdf",
    uploadedAt: "2026-07-21",
    uploadedBy: "Vanya",
    size: "1.8 MB",
  },
  {
    id: "DOC-105",
    patientId: "CC2026011",
    name: "Vanita_Dinesh_Suthar_discharge_summary.jpg",
    fileType: "image",
    uploadedAt: "2026-07-08",
    uploadedBy: "Aadya",
    size: "920 KB",
  },
];

// ─── Initial Notes ──────────────────────────────────────────────────────────

export const initialNotes: PatientNote[] = [
  {
    id: "NTE-1",
    patientId: "CC2026001",
    author: "Komal",
    role: "Operations Intern",
    content: "Spoke with patient's family. Final payment promised by end of week.",
    createdAt: "2026-08-01 11:30",
  },
  {
    id: "NTE-2",
    patientId: "CC2026002",
    author: "Soumyaparna",
    role: "Operations Intern",
    content: "Dr. Sewanti advised pausing SMOF infusion until next blood count report.",
    createdAt: "2026-08-03 15:45",
  },
];

