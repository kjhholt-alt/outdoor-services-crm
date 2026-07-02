# Outdoor CRM — Production Hardening Sprint

**Created:** 2026-04-09
**Project:** AATOS CRM (All Around Town Outdoor Services)
**Goal:** Close every gap between "polished demo" and "production-ready tool"

---

## Day 1: Security & Infrastructure

### Security Fixes
- [x] **Service catalog permissions** — Changed to `ReadOnlyOrAuthenticated`: anon can list/retrieve, auth required for mutations.
- [x] **JWT blacklist mismatch** — Added `rest_framework_simplejwt.token_blacklist` to `INSTALLED_APPS` + ran migration.
- [x] **Default `SECRET_KEY` fallback** — Now raises `RuntimeError` when `SECRET_KEY` env is missing and `DEBUG=False`.

### Dead Dependencies
- [x] **Celery + Redis** — Removed from `requirements.txt` and `settings.py`.

### Data Integrity
- [x] **Dashboard `monthly_revenue`** — Replaced `timedelta(days=i * 30)` with real calendar month boundary math.
- [x] **Estimate → Job name matching** — Now matches by `service_id` first, falls back to name lookup.

### Email Backend
- [x] **Console-only email** — `EMAIL_BACKEND` auto-switches: console in DEBUG, SMTP in production.

---

## Day 2: Reports API & Live Data

### Reports Backend
- [x] **Created `GET /api/reports/` endpoint** — Single endpoint returns: monthly revenue (current + prev year), jobs by status, revenue by category, crew productivity, summary stats.

### Reports Frontend
- [x] **Wired `ReportsPage.tsx` to live API** — React Query with demo data fallback via `reportsApi.getData()`.
- [x] **Demo fallback preserved** — Falls back to `demoReports.ts` data on error or demo mode.
- [x] **Date range filtering** — Month/Quarter/Year/All selector works on both live and demo data.

---

## Day 3: Leads, Company Profile, Invoice Fixes

### Leads Backend
- [x] **Created `Lead` model** — In `apps.customers.models`. Fields: business_name, contact_name, phone, email, address, type, source, score, status, services_needed (JSON), converted_customer FK.
- [x] **Created `LeadViewSet`** — Full CRUD with search/filter + `convert_to_customer` action. Mounted at `/leads/`.

### Leads Frontend
- [x] **Wired `LeadsPage.tsx` to real API** — React Query fetch with demo fallback to hardcoded leads.
- [x] **Convert to Customer flow** — Calls `leadsApi.convertToCustomer()` when not in demo mode, navigates to new customer.

### Company Profile Persistence
- [x] **Created `CompanyProfile` model** — Singleton (pk=1) in `apps.accounts.models`. Fields: name, address, phone, email, tax_rate, invoice_prefix, invoice_terms.
- [x] **Created `/auth/company-profile/` endpoint** — GET/PATCH.
- [x] **Wired `SettingsPage.tsx`** — Loads from API, saves via PATCH. Falls back to localStorage in demo mode.
- [ ] **Wire `pdf.ts`** — Still uses hardcoded company info. Stretch goal.

### Invoice Fixes
- [x] **Verified `InvoiceFormPage` sends `jobs`** — Confirmed: sends `jobs: formData.selectedJobs` (array of IDs). Serializer has `jobs` in fields.
- [x] **Invoice auto-number** — `Invoice.save()` override generates `INV-YYYY-NNNN`. Confirmed working + tested.

---

## Day 4: Backend Test Suite

### Auth Tests
- [x] **Login flow** — POST valid creds → 200 + tokens. POST bad creds → 401.
- [x] **Token refresh** — POST valid refresh → new access token.
- [x] **Protected endpoints** — /me requires auth. Dark mode toggle.

### Customer Tests
- [x] **CRUD** — Create, read, update, soft-delete customer.
- [x] **Search** — Filter by name via SearchFilter.
- [x] **Notes** — Create note, list notes, version history (new marks old not-current).
- [ ] **Import/Export** — Deferred (existing import/export app untouched).

### Services Tests
- [x] **Service catalog permissions** — Anon can list, anon blocked on create/delete, auth can create.

### Job Tests
- [x] **CRUD** — Create job, list jobs.
- [x] **Status transitions** — Start → in_progress, complete → completed with timestamp.
- [x] **Reschedule** — Creates new job, requires date param.
- [x] **Today filter** — Returns only today's jobs (timezone-aware).

### Estimate Tests
- [x] **Create** — Create estimate with JSON line items.
- [x] **Accept** — Accept creates jobs from line items.

### Invoice Tests
- [x] **Auto-number** — Verify INV-YYYY-NNNN generation on create.
- [x] **Record payment** — Partial → status partial. Full → status paid + paid_date set.
- [x] **Outstanding/Overdue** — Filter endpoints return correct sets.
- [x] **Balance due** — Property math verified.

### Dashboard Tests
- [x] **Summary endpoint** — Returns expected shape, handles empty DB.

### Reports Tests
- [x] **Reports endpoint** — Returns expected shape, requires auth.

### Lead Tests
- [x] **CRUD** — Create, list, update status.
- [x] **Convert** — Creates customer, marks lead converted, blocks double-convert.

### Company Profile Tests
- [x] **GET/PATCH** — Creates default on first GET, updates on PATCH, singleton, requires auth.

### Reminder Tests
- [ ] **CRUD** — Deferred (existing reminder system untouched).

---

## Day 5: Frontend Tests + Doc Cleanup

### Frontend Test Setup
- [x] **Installed Vitest + Testing Library** — vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom.
- [x] **Added `vitest.config.ts`** — jsdom environment, setup file, CSS disabled.
- [x] **Added `test` script** — `npm test` runs `vitest run`.

### Frontend Smoke Tests (7 tests passing)
- [x] **Dashboard** — Renders without crashing.
- [x] **InvoicesPage** — Renders "Invoices" heading.
- [x] **ReportsPage** — Renders "Reports" heading after data loads.
- [x] **LeadsPage** — Renders "Market Leads" heading + lead cards.
- [x] **LoginPage** — Renders form fields + "Sign In" button + AATOS branding.

### Frontend Integration Tests
- [ ] **Deferred** — Stretch goal. Would need API mocking layer.

### Documentation Cleanup
- [x] **Updated `STATUS.md`** — Full rewrite reflecting sprint changes, current state, architecture.
- [x] **Updated `CLAUDE.md`** — Updated Known Quirks (removed fixed items), added new models/APIs, updated testing section.
- [x] **Updated `SPRINT_CHECKLIST.md`** — Marked all completed items.
- [ ] **Update `docs/AUDIT_REPORT.md`** — Low priority, STATUS.md covers the same ground.
- [ ] **Update `README.md`** — Low priority stretch goal.

---

## Stretch Goals

### Photo Upload
- [ ] Add Django media storage (or S3 via `django-storages`) for job photos.
- [ ] Create upload endpoint on `JobViewSet` — accept multipart, store file, return URL.
- [ ] Update frontend photo capture to upload to server AND keep IndexedDB as offline cache.

### Recurring Job Engine
- [ ] Management command `generate_recurring_jobs` — find jobs with `is_recurring=True` and `recurrence_pattern`, create next occurrence if due.
- [ ] Wire to Celery beat (if Celery is kept) or add as a cron-callable endpoint.

### Overdue Invoice Auto-Flagging
- [ ] Management command `flag_overdue_invoices` — find invoices past `due_date` with status not in (paid, void), set status to overdue.
- [ ] Run daily via Celery beat or cron.

### E2E Tests
- [ ] Set up Playwright in frontend.
- [ ] Happy path: Login → Create Customer → Create Job → Start Job → Complete Job → Create Invoice → Record Payment → Verify Dashboard.

---

## Reference: Files to Touch

| Area | Key Files |
|------|-----------|
| Security | `backend/crm_project/settings.py`, `backend/apps/services/views.py` |
| Reports API | `backend/apps/services/views.py`, `backend/apps/services/urls.py` |
| Reports UI | `frontend/src/pages/ReportsPage.tsx`, `frontend/src/data/demoReports.ts` |
| Leads | `backend/apps/services/models.py`, `backend/apps/services/views.py`, `frontend/src/pages/LeadsPage.tsx` |
| Company Profile | `backend/apps/accounts/models.py` (or new app), `frontend/src/pages/SettingsPage.tsx`, `frontend/src/lib/pdf.ts` |
| Backend Tests | `backend/apps/*/tests.py` (all apps) |
| Frontend Tests | `frontend/vitest.config.ts`, `frontend/src/**/*.test.tsx` (new) |
| Docs | `STATUS.md`, `CLAUDE.md`, `README.md`, `docs/AUDIT_REPORT.md` |
