-- =============================================================================
-- Migration: 003_hr_schema
-- Purpose:   Merge Mayank's HR schema into JCFCentral.
-- Status:    REVIEW ONLY. Not applied. Run manually after review.
--
-- Decisions applied (confirmed by user):
--   1. Source `public.users` and `public.roles` CREATE TABLE blocks are
--      DROPPED — the existing JCFCentral tables are kept unchanged and used
--      for all FK targets (uuid `id`, matching column names). No rewrites
--      needed on the FK clauses.
--   2. Source `ARRAY` (untyped) columns are typed as `text[]` — all six
--      hold free-form categorical strings.
--   3. Foreign keys keep the default `NO ACTION` on delete/update, matching
--      the existing JCFCentral tables (work_items, tasks, etc.).
--   4. `daily_performance_entries.daily_total` and
--      `performance_reviews.total_score` are plain nullable smallint with
--      NO default — Postgres does not allow DEFAULT to reference other
--      columns (0A000). The application must compute and insert these
--      values itself.
--   5. RLS: 24 tables locked (pattern C — RLS on, zero policies,
--      service_role only, mirroring tab_visibility / leave_records) for
--      candidate personal data, hiring, performance, exit, and internal
--      infra. 4 tables open (pattern A — public read + authenticated write
--      + service_role all, mirroring work_items) for structural/reference
--      data: pods, performance_cycles, user_roles, pod_memberships.
--
-- Tables ordered by dependency so the file runs top-to-bottom without
-- deferred constraints. Source dump warned its ordering was not valid for
-- execution; this file's order is.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Independent tables (no FKs to other new tables)
-- ---------------------------------------------------------------------------

CREATE TABLE public.master_candidates (
  candidate_id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name character varying,
  last_name character varying,
  full_name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying,
  alternate_phone character varying,
  address text,
  city character varying,
  state character varying,
  applied_role character varying,
  department character varying,
  qualification character varying,
  college_name character varying,
  source character varying,
  referral_name character varying,
  availability_status character varying,
  notes text,
  submitted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  role_code character varying,
  CONSTRAINT master_candidates_pkey PRIMARY KEY (candidate_id)
);

CREATE TABLE public.pods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pod_code text NOT NULL UNIQUE CHECK (pod_code = upper(pod_code)),
  pod_name text NOT NULL CHECK (btrim(pod_name) <> ''::text),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pods_pkey PRIMARY KEY (id)
);

CREATE TABLE public.performance_cycles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cycle_code text NOT NULL UNIQUE CHECK (btrim(cycle_code) <> ''::text),
  cycle_number integer NOT NULL CHECK (cycle_number = ANY (ARRAY[1, 2, 3])),
  start_date date NOT NULL,
  end_date date NOT NULL,
  review_open_date date NOT NULL,
  lock_date date NOT NULL,
  cycle_status text NOT NULL DEFAULT 'DRAFT'::text CHECK (cycle_status = ANY (ARRAY['DRAFT'::text, 'OPEN'::text, 'REVIEW_OPEN'::text, 'READY_TO_CALCULATE'::text, 'CANDIDATE_REVIEW'::text, 'FINALIZED'::text, 'LOCKED'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT performance_cycles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.password_reset_request_throttles (
  request_key text NOT NULL CHECK (request_key ~ '^[0-9a-f]{64}$'::text),
  first_requested_at timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  last_requested_at timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT password_reset_request_throttles_pkey PRIMARY KEY (request_key)
);


-- ---------------------------------------------------------------------------
-- Tables depending only on existing public.users / public.roles
-- ---------------------------------------------------------------------------

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  assigned_by uuid,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_roles_role_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT user_roles_assigned_by_fk FOREIGN KEY (assigned_by) REFERENCES public.users(id)
);


-- ---------------------------------------------------------------------------
-- Tables depending on master_candidates
-- ---------------------------------------------------------------------------

CREATE TABLE public.hr_lifecycle (
  lifecycle_id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  lifecycle_status character varying NOT NULL,
  probation_start_date date,
  probation_end_date date,
  probation_review_notes text,
  hr_decision character varying,
  mid character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  internship_duration_months integer CHECK (internship_duration_months = ANY (ARRAY[3, 4, 6, 12])),
  current_end_date date,
  original_end_date date,
  probation_extension_count integer NOT NULL DEFAULT 0,
  total_extension_months integer NOT NULL DEFAULT 0,
  total_internship_duration_days integer,
  current_internship_duration_days integer,
  extension_months integer DEFAULT 0,
  extension_duration_days integer DEFAULT 0,
  total_duration_days integer,
  CONSTRAINT hr_lifecycle_pkey PRIMARY KEY (lifecycle_id),
  CONSTRAINT hr_lifecycle_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id)
);

CREATE TABLE public.hr_offer_letters (
  offer_letter_id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  offer_status character varying NOT NULL,
  offer_letter_number character varying,
  generated_at timestamp with time zone,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  google_doc_file_id text CHECK (google_doc_file_id IS NULL OR btrim(google_doc_file_id) <> ''::text AND char_length(google_doc_file_id) <= 255),
  google_pdf_file_id text CHECK (google_pdf_file_id IS NULL OR btrim(google_pdf_file_id) <> ''::text AND char_length(google_pdf_file_id) <= 255),
  documents_prepared_at timestamp with time zone,
  email_attempted_at timestamp with time zone,
  gmail_message_id text CHECK (gmail_message_id IS NULL OR btrim(gmail_message_id) <> ''::text AND char_length(gmail_message_id) <= 500),
  provider_accepted_at timestamp with time zone,
  CONSTRAINT hr_offer_letters_pkey PRIMARY KEY (offer_letter_id),
  CONSTRAINT hr_offer_letters_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id)
);

CREATE TABLE public.signed_offer_verifications (
  verification_id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  signed_offer_status character varying NOT NULL,
  signed_offer_submitted_at timestamp with time zone,
  verified_at timestamp with time zone,
  email_match_status character varying,
  phone_match_status character varying,
  verification_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT signed_offer_verifications_pkey PRIMARY KEY (verification_id),
  CONSTRAINT signed_offer_verifications_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id)
);

CREATE TABLE public.hr_activity_logs (
  activity_log_id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid,
  activity_type character varying NOT NULL,
  from_status character varying,
  to_status character varying,
  remarks text,
  activity_status character varying DEFAULT 'SUCCESS'::character varying,
  error_message text,
  metadata jsonb,
  performed_by character varying,
  performed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hr_activity_logs_pkey PRIMARY KEY (activity_log_id),
  CONSTRAINT hr_activity_logs_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id)
);

CREATE TABLE public.leave_requests (
  leave_request_id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  mid character varying,
  leave_type character varying NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  requested_leave_days integer NOT NULL CHECK (requested_leave_days > 0),
  reason text,
  supporting_document text,
  leave_status character varying NOT NULL DEFAULT 'PENDING'::character varying CHECK (leave_status::text = ANY (ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone,
  other_leave_type_reason text,
  CONSTRAINT leave_requests_pkey PRIMARY KEY (leave_request_id),
  CONSTRAINT leave_requests_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id)
);

CREATE TABLE public.leave_balances (
  candidate_id uuid NOT NULL,
  mid character varying,
  allocated_leave_days integer NOT NULL DEFAULT 15,
  approved_leave_days integer NOT NULL DEFAULT 0,
  remaining_leave_days integer NOT NULL DEFAULT 15,
  extra_leave_days integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leave_balances_pkey PRIMARY KEY (candidate_id),
  CONSTRAINT leave_balances_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id)
);

CREATE TABLE public.internship_extensions (
  extension_id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  mid character varying,
  extension_type character varying CHECK (extension_type::text = ANY (ARRAY['MONTHS'::character varying, 'LEAVE'::character varying]::text[])),
  extension_value integer,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  is_processed boolean DEFAULT false,
  CONSTRAINT internship_extensions_pkey PRIMARY KEY (extension_id),
  CONSTRAINT internship_extensions_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id)
);


-- ---------------------------------------------------------------------------
-- Tables depending on pods / master_candidates + users
-- ---------------------------------------------------------------------------

CREATE TABLE public.pod_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pod_id uuid NOT NULL,
  candidate_id uuid,
  user_id uuid,
  membership_type text NOT NULL CHECK (membership_type = ANY (ARRAY['CANDIDATE'::text, 'POD_LEAD'::text, 'TECH_LEAD'::text, 'TEAM_LEAD'::text, 'HR_SITE_CONNECT'::text])),
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  is_active boolean NOT NULL DEFAULT true,
  assigned_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pod_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT pod_memberships_pod_id_fk FOREIGN KEY (pod_id) REFERENCES public.pods(id),
  CONSTRAINT pod_memberships_candidate_id_fk FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id),
  CONSTRAINT pod_memberships_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT pod_memberships_assigned_by_fk FOREIGN KEY (assigned_by) REFERENCES public.users(id)
);

CREATE TABLE public.candidate_user_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL UNIQUE,
  account_status text NOT NULL DEFAULT 'ACTIVE'::text CHECK (account_status = ANY (ARRAY['ACTIVE'::text, 'INACTIVE'::text])),
  activated_at timestamp with time zone NOT NULL DEFAULT now(),
  deactivated_at timestamp with time zone,
  linked_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT candidate_user_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT candidate_user_accounts_candidate_id_fk FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id),
  CONSTRAINT candidate_user_accounts_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT candidate_user_accounts_linked_by_fk FOREIGN KEY (linked_by) REFERENCES public.users(id)
);

CREATE TABLE public.automation_jobs (
  job_id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  job_type text NOT NULL CHECK (btrim(job_type) <> ''::text),
  job_status text NOT NULL DEFAULT 'PENDING'::text CHECK (job_status = ANY (ARRAY['PENDING'::text, 'PROCESSING'::text, 'SUCCESS'::text, 'FAILED'::text, 'RETRY'::text, 'CANCELLED'::text])),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'::text),
  scheduled_at timestamp with time zone NOT NULL DEFAULT now(),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  completed_at timestamp with time zone,
  error_message text CHECK (error_message IS NULL OR char_length(error_message) <= 1000),
  idempotency_key text NOT NULL UNIQUE CHECK (btrim(idempotency_key) <> ''::text),
  provider_message_id text CHECK (provider_message_id IS NULL OR char_length(provider_message_id) <= 500),
  provider_accepted_at timestamp with time zone,
  requested_by uuid NOT NULL,
  last_attempt_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  offer_fallback_dispatched_at timestamp with time zone,
  offer_fallback_request_id bigint,
  exit_document_processing_lease_expires_at timestamp with time zone,
  exit_document_dispatch_lease_expires_at timestamp with time zone,
  exit_document_dispatch_request_id bigint,
  CONSTRAINT automation_jobs_pkey PRIMARY KEY (job_id),
  CONSTRAINT automation_jobs_candidate_id_fk FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id),
  CONSTRAINT automation_jobs_requested_by_fk FOREIGN KEY (requested_by) REFERENCES public.users(id)
);

CREATE TABLE public.candidate_signed_offer_files (
  file_id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  verification_id uuid,
  bucket_id text NOT NULL DEFAULT 'candidate-signed-offers'::text CHECK (bucket_id = 'candidate-signed-offers'::text),
  object_path text NOT NULL CHECK (btrim(object_path) <> ''::text),
  original_filename text NOT NULL CHECK (btrim(original_filename) <> ''::text),
  mime_type text NOT NULL CHECK (mime_type = 'application/pdf'::text),
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  file_status text NOT NULL CHECK (file_status = ANY (ARRAY['SUBMITTED'::text, 'VERIFIED'::text, 'MISMATCH_REVIEW'::text, 'REPLACED'::text])),
  uploaded_by uuid NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone,
  verified_at timestamp with time zone,
  replaced_at timestamp with time zone,
  replaced_by_file_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT candidate_signed_offer_files_pkey PRIMARY KEY (file_id),
  CONSTRAINT candidate_signed_offer_files_candidate_fk FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id),
  CONSTRAINT candidate_signed_offer_files_verification_fk FOREIGN KEY (verification_id) REFERENCES public.signed_offer_verifications(verification_id),
  CONSTRAINT candidate_signed_offer_files_uploaded_by_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id),
  CONSTRAINT candidate_signed_offer_files_replaced_by_fk FOREIGN KEY (replaced_by_file_id) REFERENCES public.candidate_signed_offer_files(file_id)
);


-- ---------------------------------------------------------------------------
-- Performance cycle tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.candidate_performance_cycles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  pod_id uuid NOT NULL,
  evaluation_start_date date NOT NULL,
  evaluation_end_date date NOT NULL,
  is_partial_cycle boolean NOT NULL DEFAULT false,
  eligible_days integer NOT NULL DEFAULT 0 CHECK (eligible_days >= 0),
  scored_days integer NOT NULL DEFAULT 0 CHECK (scored_days >= 0),
  daily_average numeric CHECK (daily_average IS NULL OR daily_average >= '-10'::integer::numeric AND daily_average <= 10::numeric),
  daily_component_score numeric CHECK (daily_component_score IS NULL OR daily_component_score >= 0::numeric AND daily_component_score <= 50::numeric),
  lead_score numeric CHECK (lead_score IS NULL OR lead_score >= 0::numeric AND lead_score <= 25::numeric),
  hr_score numeric CHECK (hr_score IS NULL OR hr_score >= 0::numeric AND hr_score <= 15::numeric),
  exceptional_score numeric CHECK (exceptional_score IS NULL OR exceptional_score >= 0::numeric AND exceptional_score <= 10::numeric),
  final_score numeric CHECK (final_score IS NULL OR final_score >= 0::numeric AND final_score <= 100::numeric),
  performance_band text CHECK (performance_band IS NULL OR (performance_band = ANY (ARRAY['OUTSTANDING'::text, 'EXCELLENT'::text, 'GOOD'::text, 'IMPROVEMENT_REQUIRED'::text, 'FORMAL_REVIEW'::text]))),
  result_status text NOT NULL DEFAULT 'PENDING'::text CHECK (result_status = ANY (ARRAY['PENDING'::text, 'DAILY_SCORING'::text, 'AWAITING_REVIEWS'::text, 'READY_TO_CALCULATE'::text, 'CANDIDATE_REVIEW'::text, 'FINALIZED'::text, 'LOCKED'::text, 'NOT_EVALUATED'::text])),
  calculated_at timestamp with time zone,
  finalized_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT candidate_performance_cycles_pkey PRIMARY KEY (id),
  CONSTRAINT candidate_performance_cycles_cycle_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id),
  CONSTRAINT candidate_performance_cycles_candidate_id_fk FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id),
  CONSTRAINT candidate_performance_cycles_pod_id_fk FOREIGN KEY (pod_id) REFERENCES public.pods(id)
);

CREATE TABLE public.daily_performance_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_cycle_id uuid NOT NULL,
  performance_date date NOT NULL,
  work_delivery_score smallint NOT NULL CHECK (work_delivery_score >= '-5'::integer AND work_delivery_score <= 5),
  communication_responsibility_score smallint NOT NULL CHECK (communication_responsibility_score >= '-5'::integer AND communication_responsibility_score <= 5),
  daily_total smallint,
  reviewer_user_id uuid NOT NULL,
  reason_code text CHECK (reason_code IS NULL OR (reason_code = ANY (ARRAY['WORK_COMPLETED'::text, 'PARTIAL_COMPLETION'::text, 'QUALITY_ISSUE'::text, 'DEADLINE_DELAY'::text, 'BLOCKER_COMMUNICATED'::text, 'MISSED_UPDATE'::text, 'STRONG_OWNERSHIP'::text, 'MEETING_ABSENCE'::text, 'FALSE_UPDATE'::text, 'OTHER'::text]))),
  reviewer_comment text CHECK (reviewer_comment IS NULL OR btrim(reviewer_comment) <> ''::text),
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT daily_performance_entries_pkey PRIMARY KEY (id),
  CONSTRAINT daily_performance_entries_candidate_cycle_id_fk FOREIGN KEY (candidate_cycle_id) REFERENCES public.candidate_performance_cycles(id),
  CONSTRAINT daily_performance_entries_reviewer_user_id_fk FOREIGN KEY (reviewer_user_id) REFERENCES public.users(id)
);

CREATE TABLE public.performance_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_cycle_id uuid NOT NULL,
  review_type text NOT NULL CHECK (review_type = ANY (ARRAY['LEAD'::text, 'HR'::text])),
  reviewer_user_id uuid NOT NULL,
  work_quality_score smallint CHECK (work_quality_score IS NULL OR work_quality_score >= 0 AND work_quality_score <= 10),
  role_capability_score smallint CHECK (role_capability_score IS NULL OR role_capability_score >= 0 AND role_capability_score <= 5),
  deadline_delivery_score smallint CHECK (deadline_delivery_score IS NULL OR deadline_delivery_score >= 0 AND deadline_delivery_score <= 5),
  ownership_teamwork_score smallint CHECK (ownership_teamwork_score IS NULL OR ownership_teamwork_score >= 0 AND ownership_teamwork_score <= 5),
  communication_professionalism_score smallint CHECK (communication_professionalism_score IS NULL OR communication_professionalism_score >= 0 AND communication_professionalism_score <= 5),
  attendance_update_discipline_score smallint CHECK (attendance_update_discipline_score IS NULL OR attendance_update_discipline_score >= 0 AND attendance_update_discipline_score <= 5),
  reporting_policy_compliance_score smallint CHECK (reporting_policy_compliance_score IS NULL OR reporting_policy_compliance_score >= 0 AND reporting_policy_compliance_score <= 5),
  total_score smallint,
  reviewer_comment text CHECK (reviewer_comment IS NULL OR btrim(reviewer_comment) <> ''::text),
  review_status text NOT NULL DEFAULT 'DRAFT'::text CHECK (review_status = ANY (ARRAY['DRAFT'::text, 'SUBMITTED'::text])),
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT performance_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT performance_reviews_candidate_cycle_id_fk FOREIGN KEY (candidate_cycle_id) REFERENCES public.candidate_performance_cycles(id),
  CONSTRAINT performance_reviews_reviewer_user_id_fk FOREIGN KEY (reviewer_user_id) REFERENCES public.users(id)
);

CREATE TABLE public.exceptional_contributions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_cycle_id uuid NOT NULL,
  contribution_type text NOT NULL CHECK (contribution_type = ANY (ARRAY['ADDITIONAL_TASK'::text, 'CROSS_TEAM_SUPPORT'::text, 'PROCESS_IMPROVEMENT'::text, 'LEADERSHIP'::text, 'HIGH_IMPACT_WORK'::text, 'REFERRAL'::text, 'OTHER'::text])),
  title text NOT NULL CHECK (btrim(title) <> ''::text),
  description text NOT NULL CHECK (btrim(description) <> ''::text),
  points smallint NOT NULL CHECK (points >= 1 AND points <= 10),
  evidence_url text CHECK (evidence_url IS NULL OR btrim(evidence_url) <> ''::text),
  source_type text NOT NULL DEFAULT 'MANUAL'::text CHECK (source_type = ANY (ARRAY['MANUAL'::text, 'EXTERNAL_AUTOMATION'::text])),
  external_reference_id text,
  submitted_by_user_id uuid NOT NULL,
  approval_status text NOT NULL DEFAULT 'PENDING'::text CHECK (approval_status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])),
  reviewed_by_user_id uuid,
  reviewed_at timestamp with time zone,
  review_notes text CHECK (review_notes IS NULL OR btrim(review_notes) <> ''::text),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exceptional_contributions_pkey PRIMARY KEY (id),
  CONSTRAINT exceptional_contributions_candidate_cycle_id_fk FOREIGN KEY (candidate_cycle_id) REFERENCES public.candidate_performance_cycles(id),
  CONSTRAINT exceptional_contributions_submitted_by_user_id_fk FOREIGN KEY (submitted_by_user_id) REFERENCES public.users(id),
  CONSTRAINT exceptional_contributions_reviewed_by_user_id_fk FOREIGN KEY (reviewed_by_user_id) REFERENCES public.users(id)
);

CREATE TABLE public.performance_review_revisions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  performance_review_id uuid NOT NULL,
  candidate_cycle_id uuid NOT NULL,
  review_type text NOT NULL CHECK (review_type = ANY (ARRAY['HR'::text, 'LEAD'::text])),
  previous_scores jsonb NOT NULL CHECK (jsonb_typeof(previous_scores) = 'object'::text),
  new_scores jsonb NOT NULL CHECK (jsonb_typeof(new_scores) = 'object'::text),
  previous_total_score smallint NOT NULL,
  new_total_score smallint NOT NULL,
  amendment_reason text NOT NULL CHECK (btrim(amendment_reason) <> ''::text),
  amended_by uuid NOT NULL,
  amended_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT performance_review_revisions_pkey PRIMARY KEY (id),
  CONSTRAINT performance_review_revisions_review_fk FOREIGN KEY (performance_review_id) REFERENCES public.performance_reviews(id),
  CONSTRAINT performance_review_revisions_candidate_cycle_fk FOREIGN KEY (candidate_cycle_id) REFERENCES public.candidate_performance_cycles(id),
  CONSTRAINT performance_review_revisions_amended_by_fk FOREIGN KEY (amended_by) REFERENCES public.users(id)
);


-- ---------------------------------------------------------------------------
-- Exit flow tables (depend on hr_lifecycle, pods, users, automation_jobs)
-- ---------------------------------------------------------------------------

CREATE TABLE public.exit_cases (
  exit_case_id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  lifecycle_id uuid NOT NULL,
  pod_id uuid,
  initiated_by uuid,
  mid character varying,
  pod_name_snapshot text,
  exit_date date NOT NULL,
  exit_type character varying NOT NULL CHECK (exit_type::text = ANY (ARRAY['COMPLETED_TERM'::character varying, 'EARLY_EXIT'::character varying, 'TERMINATED'::character varying]::text[])),
  overall_status character varying NOT NULL DEFAULT 'INITIATED'::character varying CHECK (overall_status::text = ANY (ARRAY['INITIATED'::character varying, 'CANDIDATE_PENDING'::character varying, 'HR_PENDING'::character varying, 'COMPLETED'::character varying]::text[])),
  candidate_form_completed boolean NOT NULL DEFAULT false,
  hr_form_completed boolean NOT NULL DEFAULT false,
  exit_completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exit_cases_pkey PRIMARY KEY (exit_case_id),
  CONSTRAINT fk_exit_case_candidate FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id),
  CONSTRAINT fk_exit_case_lifecycle FOREIGN KEY (lifecycle_id) REFERENCES public.hr_lifecycle(lifecycle_id),
  CONSTRAINT fk_exit_case_pod FOREIGN KEY (pod_id) REFERENCES public.pods(id),
  CONSTRAINT fk_exit_case_initiated_by FOREIGN KEY (initiated_by) REFERENCES public.users(id)
);

CREATE TABLE public.candidate_exit_feedback (
  feedback_id uuid NOT NULL DEFAULT gen_random_uuid(),
  exit_case_id uuid NOT NULL UNIQUE,
  candidate_id uuid NOT NULL,
  completed_full_duration boolean,
  primary_exit_reason text,
  other_exit_reasons text[],
  other_reason_text text,
  preventable_exit character varying,
  wanted_extension character varying,
  extension_reason text,
  overall_experience_rating integer CHECK (overall_experience_rating >= 1 AND overall_experience_rating <= 5),
  nps_score integer CHECK (nps_score >= 0 AND nps_score <= 10),
  expectation_match character varying,
  learning_rating integer CHECK (learning_rating >= 1 AND learning_rating <= 5),
  meaningful_work character varying,
  missing_exposure text[],
  missing_exposure_other text,
  guidance_rating integer CHECK (guidance_rating >= 1 AND guidance_rating <= 5),
  feedback_frequency character varying,
  psychological_safety_rating integer CHECK (psychological_safety_rating >= 1 AND psychological_safety_rating <= 5),
  valued_contributor_rating integer CHECK (valued_contributor_rating >= 1 AND valued_contributor_rating <= 5),
  work_distribution_rating integer CHECK (work_distribution_rating >= 1 AND work_distribution_rating <= 5),
  pod_culture_rating integer CHECK (pod_culture_rating >= 1 AND pod_culture_rating <= 5),
  safety_issue character varying,
  safety_issue_details text,
  is_confidential boolean DEFAULT false,
  hr_communication_issues text[],
  hr_communication_other text,
  improvement_suggestions text[],
  improvement_other text,
  rejoin_interest character varying,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT candidate_exit_feedback_pkey PRIMARY KEY (feedback_id),
  CONSTRAINT fk_candidate_feedback_exit_case FOREIGN KEY (exit_case_id) REFERENCES public.exit_cases(exit_case_id),
  CONSTRAINT fk_candidate_feedback_candidate FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(candidate_id)
);

CREATE TABLE public.hr_exit_evaluations (
  evaluation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  exit_case_id uuid NOT NULL UNIQUE,
  reviewer_id uuid NOT NULL,
  skill_rating integer CHECK (skill_rating >= 1 AND skill_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  ownership_rating integer CHECK (ownership_rating >= 1 AND ownership_rating <= 5),
  reliability_rating integer CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
  collaboration_rating integer CHECK (collaboration_rating >= 1 AND collaboration_rating <= 5),
  adaptability_rating integer CHECK (adaptability_rating >= 1 AND adaptability_rating <= 5),
  timeliness_rating integer CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  independence_rating integer CHECK (independence_rating >= 1 AND independence_rating <= 5),
  hr_primary_reason text,
  hr_other_reasons text[],
  hr_preventable character varying,
  retention_attempt boolean DEFAULT false,
  retention_notes text,
  extension_offer character varying,
  lead_extension_recommendation character varying,
  certificate_recommendation character varying,
  certificate_condition text,
  lor_recommendation character varying,
  lor_condition text,
  rehire_eligibility character varying,
  internal_notes text,
  candidate_summary text,
  handover_complete character varying,
  handover_method text[],
  handover_gap text,
  verified_by uuid,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hr_exit_evaluations_pkey PRIMARY KEY (evaluation_id),
  CONSTRAINT fk_hr_eval_exit_case FOREIGN KEY (exit_case_id) REFERENCES public.exit_cases(exit_case_id),
  CONSTRAINT fk_hr_eval_reviewer FOREIGN KEY (reviewer_id) REFERENCES public.users(id),
  CONSTRAINT fk_hr_eval_verified_by FOREIGN KEY (verified_by) REFERENCES public.users(id)
);

CREATE TABLE public.exit_handover_items (
  handover_item_id uuid NOT NULL DEFAULT gen_random_uuid(),
  exit_case_id uuid NOT NULL,
  task_name text NOT NULL,
  task_status text,
  next_steps text,
  successor_name text,
  repository_link text,
  transfer_documents text,
  access_to_revoke text,
  time_sensitive_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exit_handover_items_pkey PRIMARY KEY (handover_item_id),
  CONSTRAINT fk_handover_exit_case FOREIGN KEY (exit_case_id) REFERENCES public.exit_cases(exit_case_id)
);

CREATE TABLE public.exit_clearance (
  clearance_id uuid NOT NULL DEFAULT gen_random_uuid(),
  exit_case_id uuid NOT NULL UNIQUE,
  certificate_generated boolean DEFAULT false,
  lor_generated boolean DEFAULT false,
  github_removed boolean DEFAULT false,
  slack_removed boolean DEFAULT false,
  email_removed boolean DEFAULT false,
  drive_access_removed boolean DEFAULT false,
  assets_returned boolean DEFAULT false,
  final_clearance_status character varying DEFAULT 'PENDING'::character varying CHECK (final_clearance_status::text = ANY (ARRAY['PENDING'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying]::text[])),
  cleared_by uuid,
  cleared_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exit_clearance_pkey PRIMARY KEY (clearance_id),
  CONSTRAINT fk_clearance_exit_case FOREIGN KEY (exit_case_id) REFERENCES public.exit_cases(exit_case_id),
  CONSTRAINT fk_clearance_user FOREIGN KEY (cleared_by) REFERENCES public.users(id)
);

CREATE TABLE public.exit_documents (
  document_id uuid NOT NULL DEFAULT gen_random_uuid(),
  exit_case_id uuid NOT NULL,
  document_type character varying NOT NULL CHECK (document_type::text = ANY (ARRAY['CERTIFICATE'::character varying, 'LOR'::character varying, 'EXIT_LETTER'::character varying, 'EXIT_REPORT'::character varying]::text[])),
  storage_path text NOT NULL,
  uploaded_by uuid,
  uploaded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  document_variant text CHECK (document_variant IS NULL OR (document_variant = ANY (ARRAY['INTERN_CERTIFICATE'::text, 'POD_LEAD_CERTIFICATE'::text, 'VOLUNTEER_CERTIFICATE'::text, 'INTERN_LOR'::text, 'POD_LEAD_LOR'::text, 'OPERATIONS_ASSOCIATE_LOR'::text]))),
  bucket_id text,
  generated_at timestamp with time zone,
  generated_by_job_id uuid,
  template_key text,
  template_version text,
  certificate_id text CHECK (certificate_id IS NULL OR certificate_id = upper(btrim(certificate_id)) AND certificate_id ~ '^CERT-[A-Z0-9]+$'::text),
  certificate_verification_url text,
  gmail_message_id text,
  emailed_at timestamp with time zone,
  revoked_at timestamp with time zone,
  revocation_reason text,
  CONSTRAINT exit_documents_pkey PRIMARY KEY (document_id),
  CONSTRAINT fk_exit_document_case FOREIGN KEY (exit_case_id) REFERENCES public.exit_cases(exit_case_id),
  CONSTRAINT fk_exit_document_user FOREIGN KEY (uploaded_by) REFERENCES public.users(id),
  CONSTRAINT exit_documents_generated_by_job_id_fkey FOREIGN KEY (generated_by_job_id) REFERENCES public.automation_jobs(job_id)
);

CREATE TABLE public.exit_document_requests (
  request_id uuid NOT NULL DEFAULT gen_random_uuid(),
  exit_case_id uuid NOT NULL,
  document_variant text NOT NULL CHECK (document_variant = ANY (ARRAY['INTERN_CERTIFICATE'::text, 'POD_LEAD_CERTIFICATE'::text, 'VOLUNTEER_CERTIFICATE'::text, 'INTERN_LOR'::text, 'POD_LEAD_LOR'::text, 'OPERATIONS_ASSOCIATE_LOR'::text])),
  status text NOT NULL DEFAULT 'REQUESTED'::text CHECK (status = ANY (ARRAY['REQUESTED'::text, 'PROCESSING'::text, 'GENERATED'::text, 'EMAILED'::text, 'FAILED'::text])),
  requested_by uuid NOT NULL,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  job_id uuid,
  error_message text CHECK (error_message IS NULL OR char_length(error_message) <= 1000),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  date_mismatch_override_approved boolean NOT NULL DEFAULT false,
  reserved_document_id uuid,
  reserved_storage_path text,
  reserved_certificate_id text,
  reserved_certificate_verification_url text,
  drive_file_id text,
  drive_uploaded_at timestamp with time zone,
  email_attempted_at timestamp with time zone,
  CONSTRAINT exit_document_requests_pkey PRIMARY KEY (request_id),
  CONSTRAINT exit_document_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id),
  CONSTRAINT exit_document_requests_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.automation_jobs(job_id),
  CONSTRAINT exit_document_requests_exit_case_id_fkey FOREIGN KEY (exit_case_id) REFERENCES public.exit_cases(exit_case_id)
);


-- =============================================================================
-- Row Level Security
--
-- Pattern A (open, mirrors work_items exactly):
--   - public read
--   - authenticated insert/update/delete
--   - service_role: all
--
-- Pattern C (locked, mirrors tab_visibility / leave_records exactly):
--   - RLS enabled, ZERO policies
--   - Only service_role (bypasses RLS) can read/write
-- =============================================================================

-- --- Pattern A (open) — 4 structural/reference tables --------------------------
ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.pods FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.pods FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON public.pods FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete" ON public.pods FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "service_role_all" ON public.pods FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.performance_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.performance_cycles FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.performance_cycles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON public.performance_cycles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete" ON public.performance_cycles FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "service_role_all" ON public.performance_cycles FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.user_roles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON public.user_roles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete" ON public.user_roles FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "service_role_all" ON public.user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.pod_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.pod_memberships FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.pod_memberships FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON public.pod_memberships FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete" ON public.pod_memberships FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "service_role_all" ON public.pod_memberships FOR ALL TO service_role USING (true) WITH CHECK (true);

-- --- Pattern C (locked, service_role only) — 24 sensitive tables ---------------
ALTER TABLE public.master_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signed_offer_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_signed_offer_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_performance_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_performance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exceptional_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_review_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_exit_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_exit_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_handover_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_clearance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_request_throttles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- End of migration 003_hr_schema
-- =============================================================================