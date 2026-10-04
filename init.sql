-- ==============================================================================
-- SyndicateOS Enterprise Real Estate & Multi-Venture Core - Database Schema
-- Compatible with PostgreSQL 14, 15, 16+
-- ==============================================================================

-- 1. App Users (Mobile Number as Unique User ID & 4-Digit PIN Auth)
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  firm_id TEXT,
  firm_code TEXT,
  partner_id TEXT,
  pin_code TEXT NOT NULL DEFAULT '9999',
  must_change_pin BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tenant Firms (Isolated Syndicate Firms)
CREATE TABLE IF NOT EXISTS firms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  location TEXT NOT NULL,
  state TEXT NOT NULL,
  sectors JSONB NOT NULL,
  subscription_plan TEXT NOT NULL DEFAULT 'enterprise',
  mrr_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_date TEXT NOT NULL,
  proprietor_name TEXT,
  proprietor_phone TEXT,
  managing_partner_name TEXT NOT NULL,
  managing_partner_phone TEXT NOT NULL,
  gstin TEXT,
  pan_number TEXT,
  business_type TEXT,
  trade_name TEXT,
  office_address TEXT,
  contact_email TEXT,
  rera_number TEXT,
  accountant_name TEXT NOT NULL,
  accountant_phone TEXT NOT NULL,
  feature_flags JSONB NOT NULL,
  encryption_status TEXT,
  credentials JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Projects & Ventures
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  firm_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  sector TEXT NOT NULL,
  location TEXT NOT NULL,
  mandal_district TEXT,
  survey_numbers TEXT,
  approval_authority TEXT,
  lp_or_rera_number TEXT,
  extent_value DOUBLE PRECISION NOT NULL DEFAULT 0,
  extent_unit TEXT NOT NULL DEFAULT 'Acres',
  road_width INTEGER,
  open_space_percent DOUBLE PRECISION,
  floor_rate_per_sq_yard DOUBLE PRECISION,
  base_sq_ft_rate DOUBLE PRECISION,
  total_estimated_outlay DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'active_sales',
  start_date TEXT NOT NULL,
  target_completion_date TEXT,
  partners JSONB NOT NULL DEFAULT '[]'::jsonb,
  plots_count INTEGER,
  notes TEXT,
  floors_count INTEGER,
  facing_premium DOUBLE PRECISION,
  contract_type TEXT,
  retention_percent DOUBLE PRECISION,
  counters_count INTEGER,
  daily_sales_target DOUBLE PRECISION,
  security_deposit DOUBLE PRECISION,
  flats_per_floor INTEGER,
  floor_plans JSONB,
  amenities JSONB,
  total_residential_sft DOUBLE PRECISION,
  total_amenities_sft DOUBLE PRECISION,
  total_built_up_area_sft DOUBLE PRECISION,
  plot_distribution JSONB,
  layout_amenities JSONB,
  plan_documents JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Plots (Open Plotting Module)
CREATE TABLE IF NOT EXISTS plots (
  id SERIAL PRIMARY KEY,
  firm_id TEXT,
  project_id TEXT,
  plot_number TEXT NOT NULL,
  area_sq_yards DOUBLE PRECISION NOT NULL,
  facing TEXT NOT NULL,
  rate_per_sq_yard DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  buyer_name TEXT,
  buyer_phone TEXT,
  buyer_aadhaar TEXT,
  advance_received DOUBLE PRECISION,
  payment_mode TEXT,
  payment_ref_number TEXT,
  booked_at TEXT,
  payment_milestone TEXT,
  notes TEXT,
  official_doc_value DOUBLE PRECISION,
  discount_approved_by TEXT,
  block_name TEXT,
  dimensions TEXT,
  road_width_ft INTEGER,
  marketing_request JSONB,
  blocked_by_agent TEXT,
  blocked_for_buyer TEXT,
  blocked_at TEXT,
  blocked_rate DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Apartment Units (Construction Module)
CREATE TABLE IF NOT EXISTS apartment_units (
  id TEXT PRIMARY KEY,
  firm_id TEXT,
  project_id TEXT,
  unit_number TEXT NOT NULL,
  floor INTEGER NOT NULL,
  flat_type TEXT NOT NULL,
  sft_area DOUBLE PRECISION NOT NULL,
  facing TEXT NOT NULL,
  base_rate DOUBLE PRECISION NOT NULL,
  facing_premium DOUBLE PRECISION NOT NULL DEFAULT 0,
  floor_rise DOUBLE PRECISION NOT NULL DEFAULT 0,
  parking_fee DOUBLE PRECISION NOT NULL DEFAULT 0,
  amenities_fee DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  buyer_name TEXT,
  buyer_phone TEXT,
  advance_received DOUBLE PRECISION DEFAULT 0,
  current_milestone TEXT,
  milestone_stage TEXT,
  official_doc_value DOUBLE PRECISION,
  discount_approved_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Firm Accounts (Commercial Bank Escrow & Cash in Hand Safe Vault)
CREATE TABLE IF NOT EXISTS firm_accounts (
  id TEXT PRIMARY KEY,
  firm_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  city TEXT NOT NULL,
  current_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
  opening_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
  upi_id TEXT,
  linked_project_id TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  authorized_signatories JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_date TEXT NOT NULL,
  notes TEXT,
  recent_transactions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Firm Account Transactions
CREATE TABLE IF NOT EXISTS firm_account_transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  firm_id TEXT,
  project_id TEXT,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  description TEXT NOT NULL,
  reference_no TEXT,
  category TEXT NOT NULL,
  partner_name TEXT,
  project_name TEXT,
  balance_after DOUBLE PRECISION NOT NULL,
  enrolled_by TEXT,
  approved_by TEXT,
  status TEXT DEFAULT 'approved',
  payment_mode TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Project Expenses
CREATE TABLE IF NOT EXISTS project_expenses (
  id TEXT PRIMARY KEY,
  firm_id TEXT,
  project_id TEXT,
  category TEXT NOT NULL,
  estimated_budget DOUBLE PRECISION NOT NULL DEFAULT 0,
  actual_spent DOUBLE PRECISION NOT NULL DEFAULT 0,
  vendor_notes TEXT NOT NULL DEFAULT '',
  official_tax_invoiced_amount DOUBLE PRECISION,
  is_official_tax_eligible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Syndicate Partners & Equity
CREATE TABLE IF NOT EXISTS syndicate_partners (
  id TEXT PRIMARY KEY,
  firm_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role_description TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT 'bg-amber-500',
  initial_capital DOUBLE PRECISION NOT NULL DEFAULT 0,
  actual_invested DOUBLE PRECISION DEFAULT 0,
  fixed_equity_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
  drawings DOUBLE PRECISION NOT NULL DEFAULT 0,
  share_of_field_expenses DOUBLE PRECISION NOT NULL DEFAULT 0,
  stock_draws_valuation DOUBLE PRECISION DEFAULT 0,
  official_declared_capital DOUBLE PRECISION,
  user_role TEXT,
  user_status TEXT DEFAULT 'active',
  pin_code TEXT,
  daily_spending_limit DOUBLE PRECISION,
  added_date TEXT,
  added_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Individual Partner Investments
CREATE TABLE IF NOT EXISTS individual_investments (
  id TEXT PRIMARY KEY,
  firm_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  partner_id TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  date TEXT NOT NULL,
  purpose TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  reference_no TEXT NOT NULL,
  notes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  enrolled_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  co_signatory TEXT,
  witness_name TEXT,
  cash_vault_location TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Field Expense Logs
CREATE TABLE IF NOT EXISTS field_expense_logs (
  id TEXT PRIMARY KEY,
  firm_id TEXT,
  project_id TEXT,
  partner_id TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT NOT NULL,
  voice_note_url TEXT,
  has_voice_note BOOLEAN DEFAULT FALSE,
  receipt_image TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reconciled_date TEXT,
  reconciled_by TEXT,
  requires_managing_partner_signoff BOOLEAN DEFAULT FALSE,
  approved_by_partners JSONB DEFAULT '[]'::jsonb,
  approval_signatures JSONB DEFAULT '[]'::jsonb,
  device_id TEXT,
  is_official_tax_eligible BOOLEAN DEFAULT FALSE,
  tax_invoice_eligible BOOLEAN DEFAULT FALSE,
  is_tax_official BOOLEAN DEFAULT FALSE,
  tax_invoice_no TEXT,
  vendor_name TEXT,
  payment_mode TEXT,
  enrolled_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  firm_id TEXT,
  timestamp TEXT NOT NULL,
  partner_name TEXT,
  actor_name TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  device_id TEXT NOT NULL,
  notes TEXT NOT NULL,
  impact_amount DOUBLE PRECISION,
  ledger_type TEXT NOT NULL DEFAULT 'Internal Syndicate',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. System Metadata
CREATE TABLE IF NOT EXISTS system_meta (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- INITIAL PRODUCTION SEED DATA (Root Super Admin & First Firm)
-- ==============================================================================

-- Super Admin User (G. Sudheer)
INSERT INTO app_users (id, phone, name, role, firm_id, firm_code, partner_id, pin_code, must_change_pin, status)
VALUES (
  'user-sa-9550247162',
  '9550247162',
  'G. Sudheer (Super Admin)',
  'super_admin',
  NULL,
  NULL,
  NULL,
  '9999',
  TRUE,
  'active'
) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- Primary Firm: Sri Chakra Associates (SC-AP)
INSERT INTO firms (
  id, name, code, location, state, sectors, subscription_plan, mrr_amount, status,
  created_date, proprietor_name, proprietor_phone, managing_partner_name,
  managing_partner_phone, accountant_name, accountant_phone, feature_flags
) VALUES (
  'firm-1791025604395',
  'Satya Constructions',
  'SC-AP',
  'Katavaram / Vijayawada',
  'Andhra Pradesh',
  '["real_estate_open_plotting", "real_estate_construction"]'::jsonb,
  'annual',
  9999,
  'active',
  '2026-10-03',
  'Managing Partner',
  '+91 98480 00000',
  'Managing Partner',
  '+91 98480 00000',
  'K. S. Narayana',
  '9440156789',
  '{"enablePlotGrid": true, "enableApartmentMatrix": true, "enableWhatsAppAlerts": true, "enableTallyExport": true, "enableVoiceNotes": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Accountant User
INSERT INTO app_users (id, phone, name, role, firm_id, firm_code, partner_id, pin_code, must_change_pin, status)
VALUES (
  'user-acc-9440156789',
  '9440156789',
  'K. S. Narayana (Accountant)',
  'accountant',
  'firm-1791025604395',
  'SC-AP',
  NULL,
  '9999',
  TRUE,
  'active'
) ON CONFLICT (phone) DO NOTHING;

-- Partner 1: srini
INSERT INTO app_users (id, phone, name, role, firm_id, firm_code, partner_id, pin_code, must_change_pin, status)
VALUES (
  'user-pt-9848011111',
  '9848011111',
  'srini',
  'field_partner',
  'firm-1791025604395',
  'SC-AP',
  'partner-proj-1791025902274',
  '9999',
  TRUE,
  'active'
) ON CONFLICT (phone) DO NOTHING;

-- Partner 2: Naresh
INSERT INTO app_users (id, phone, name, role, firm_id, firm_code, partner_id, pin_code, must_change_pin, status)
VALUES (
  'user-pt-9848022222',
  '9848022222',
  'Naresh',
  'field_partner',
  'firm-1791025604395',
  'SC-AP',
  'partner-proj-1791025882517',
  '9999',
  TRUE,
  'active'
) ON CONFLICT (phone) DO NOTHING;
