# Outdoor CRM (AATOS) — Codebase Audit Report

**Date:** 2026-03-01
**Auditor:** Claude Code (Opus 4.6)
**Repo:** `outdoor-crm` — React 19 + Vite + Django 5 + DRF

---

## 1. Django Models

### `accounts` app
| Model | Fields | Relationships |
|-------|--------|---------------|
| **UserProfile** | dark_mode, default_region, email_notifications, reminder_notifications, weekly_summary | OneToOne → User, FK → Region (nullable) |

Auto-creates profile on User save via `post_save` signal.

### `customers` app
| Model | Fields | Relationships |
|-------|--------|---------------|
| **Region** | name, description, color, is_active | — |
| **Customer** | first_name, last_name, company, email, phone, mobile_phone, address, city, state, zip_code, latitude, longitude, customer_type (residential/commercial/municipal), status (active/inactive/lead/prospect), source, notes_text, tags (JSON), custom_fields (JSON), is_active (soft-delete), preferred_contact_method, best_call_time, last_contacted, next_follow_up, total_revenue, lifetime_value | FK → Region (nullable), FK → User (created_by, nullable) |
| **Note** | content, note_type (general/follow_up/meeting/call/email/task/important), is_pinned, is_current, version | FK → Customer, FK → User (created_by), FK → Note (parent_note, nullable) |

### `activities` app
| Model | Fields | Relationships |
|-------|--------|---------------|
| **ActivityType** | name, icon, color, is_active, sort_order | — |
| **Activity** | activity_type_name, date, duration_minutes, outcome (positive/neutral/negative/pending), notes, follow_up_date | FK → Customer, FK → ActivityType (nullable), FK → User (created_by) |

### `reminders` app
| Model | Fields | Relationships |
|-------|--------|---------------|
| **Reminder** | title, description, reminder_type (follow_up/call_back/meeting/task/deadline/custom), due_date, due_time, priority (low/medium/high/urgent), is_completed, completed_at, is_snoozed, snoozed_until, snooze_count, recurrence (none/daily/weekly/biweekly/monthly/quarterly), notes | FK → Customer (nullable), FK → User (assigned_to), FK → User (created_by) |

Has `get_next_business_day()` method and snooze logic.

### `routing` app
| Model | Fields | Relationships |
|-------|--------|---------------|
| **Route** | name, date, status (planned/in_progress/completed), total_distance, total_duration, notes | FK → User (created_by) |
| **RouteStop** | order, arrival_time, departure_time, notes, status (pending/visited/skipped) | FK → Route, FK → Customer |

### `imports` app
No models defined. Views handle CSV/Excel import/export directly.

### `services` app
| Model | Fields | Relationships |
|-------|--------|---------------|
| **ServiceCategory** | name, description, icon, color, is_seasonal, season_start, season_end, sort_order, is_active | — |
| **Service** | name, description, default_price, price_type (flat/hourly/custom), is_recurring, recurring_frequency (weekly/biweekly/monthly/quarterly/seasonal/one_time), estimated_duration_minutes, is_active | FK → ServiceCategory |
| **Job** | scheduled_date, scheduled_time, status (scheduled/confirmed/in_progress/completed/cancelled/invoiced), completion_date, completion_notes, actual_duration_minutes, price, billing_type, is_recurring, recurrence_pattern, recurrence_end_date, notes, address, photos (JSON) | FK → Customer, FK → Service (nullable), FK → User (created_by) |
| **Estimate** | title, description, line_items (JSON), subtotal, tax_rate, tax_amount, total, status (draft/sent/accepted/declined/expired), valid_until, accepted_date, convert_to_jobs, notes | FK → Customer, FK → User (created_by) |
| **Invoice** | invoice_number (unique), issue_date, due_date, subtotal, tax_rate, tax_amount, total, amount_paid, status (draft/sent/viewed/paid/overdue/void/partial), payment_date, payment_method, notes | FK → Customer, FK → User (created_by), M2M → Job |

Invoice has `balance_due` property and `save()` override that auto-sets status to "paid" when amount_paid >= total.

---

## 2. API Endpoints

### Auth (`/auth/`)
| URL | Method | View | Permission |
|-----|--------|------|------------|
| `/auth/token/` | POST | TokenObtainPairView | AllowAny |
| `/auth/token/refresh/` | POST | TokenRefreshView | AllowAny |
| `/auth/me/` | GET, PATCH | CurrentUserView | IsAuthenticated |
| `/auth/dark-mode/` | POST | ToggleDarkModeView | IsAuthenticated |

**No registration endpoint exists.**

### Customers (`/`)
| URL | Method | View | Notes |
|-----|--------|------|-------|
| `/customers/` | GET, POST | CustomerViewSet | Search: first_name, last_name, company, email. Filter: status, customer_type, region, is_active |
| `/customers/{id}/` | GET, PUT, PATCH, DELETE | CustomerViewSet | DELETE = soft-delete (sets is_active=False) |
| `/customers/{id}/notes/` | GET, POST | CustomerViewSet.notes | |
| `/customers/{id}/notes/{note_id}/` | PUT, DELETE | CustomerViewSet.note_detail | |
| `/customers/{id}/activities/` | GET | CustomerViewSet.activities | |
| `/customers/{id}/reminders/` | GET | CustomerViewSet.reminders | |
| `/regions/` | CRUD | RegionViewSet | |

### Activities (`/activities/`)
| URL | Method | View |
|-----|--------|------|
| `/activities/activity-types/` | CRUD | ActivityTypeViewSet |
| `/activities/activities/` | CRUD | ActivityViewSet |

### Reminders (`/reminders/`)
| URL | Method | View | Notes |
|-----|--------|------|-------|
| `/reminders/reminders/` | CRUD | ReminderViewSet | Filter: is_completed, priority, reminder_type, assigned_to |
| `/reminders/reminders/{id}/complete/` | POST | complete action | |
| `/reminders/reminders/{id}/snooze/` | POST | snooze action | Accepts `hours` param |
| `/reminders/reminders/upcoming/` | GET | upcoming action | Next 7 days |
| `/reminders/reminders/overdue/` | GET | overdue action | |

### Routes (`/routes/`)
| URL | Method | View | Notes |
|-----|--------|------|-------|
| `/routes/routes/` | CRUD | RouteViewSet | |
| `/routes/routes/{id}/optimize/` | POST | optimize action | Nearest-neighbor with Haversine |
| `/routes/routes/{id}/add_stop/` | POST | add_stop action | |
| `/routes/route-stops/` | CRUD | RouteStopViewSet | |

### Import/Export (`/import/`)
| URL | Method | View | Notes |
|-----|--------|------|-------|
| `/import/import/customers/` | POST | import_customers | CSV/Excel upload |
| `/import/export/customers/` | GET | export_customers | CSV/Excel download |

### Services API (`/api/`)
| URL | Method | View | Notes |
|-----|--------|------|-------|
| `/api/categories/` | CRUD | ServiceCategoryViewSet | |
| `/api/services/` | CRUD | ServiceViewSet | Filter: category, is_active, is_recurring, price_type |
| `/api/jobs/` | CRUD | JobViewSet | Filter: status, customer, service, scheduled_date range, is_recurring |
| `/api/jobs/{id}/start/` | POST | start action | Sets status → in_progress |
| `/api/jobs/{id}/complete/` | POST | complete action | Sets status → completed, records completion |
| `/api/jobs/{id}/reschedule/` | POST | reschedule action | |
| `/api/estimates/` | CRUD | EstimateViewSet | Filter: status, customer |
| `/api/estimates/{id}/accept/` | POST | accept action | Converts to jobs if convert_to_jobs=True |
| `/api/invoices/` | CRUD | InvoiceViewSet | Filter: status, customer, date range |
| `/api/invoices/{id}/record-payment/` | POST | record_payment action | |
| `/api/invoices/outstanding/` | GET | outstanding action | |
| `/api/invoices/overdue/` | GET | overdue action | |
| `/api/dashboard/summary/` | GET | dashboard_summary | Stats for dashboard |

**Default permission for ALL endpoints: `AllowAny`** (set in settings.py `REST_FRAMEWORK`). Only `/auth/me/` and `/auth/dark-mode/` explicitly require `IsAuthenticated`.

---

## 3. React Pages & Components

### Pages
| Page | Route | What It Does |
|------|-------|-------------|
| **LoginPage** | `/login` | JWT login form. Stores tokens in localStorage. |
| **DashboardPage** | `/` | Summary cards (today's jobs, revenue, outstanding, overdue), weather widget, today's schedule, overdue reminders |
| **CustomersPage** | `/customers` | Searchable/filterable customer list. Table on desktop, cards on mobile. |
| **CustomerDetailPage** | `/customers/:id` | Full customer view with stats, contact info, notes (with version history), activities, reminders |
| **CustomerFormPage** | `/customers/new`, `/customers/:id/edit` | Create/edit customer. QC-area ZIP auto-fill. Supports lead pre-fill from query params. |
| **JobsPage** | `/jobs` | Job list with today/week/all/calendar tabs. Start/complete actions. Photo capture. Weather badges. |
| **JobFormPage** | `/jobs/new` | Job creation. Customer/service dropdowns. Auto-fills price/duration from service. |
| **EstimatesPage** | `/estimates` | Estimate list with status badges. Links to create new. |
| **EstimateFormPage** | `/estimates/new` | Dynamic line items. Auto-title and valid_until. |
| **InvoicesPage** | `/invoices` | Invoice list with all/outstanding/overdue views. Preview modal. PDF download. |
| **InvoiceFormPage** | `/invoices/new` | Creates invoice from completed jobs. Tax calculation. Auto payment terms. |
| **ServicesPage** | `/services` | Read-only service catalog with expandable categories. |
| **ReportsPage** | `/reports` | Exists in routes but uses demo data. |
| **RemindersPage** | `/reminders` | Exists in routes. |
| **ActivitiesPage** | `/activities` | Exists in routes. |
| **RoutesPage** | `/routes` | Exists in routes. |
| **ImportPage** | `/import` | Exists in routes. |
| **CrewPage** | `/crew` | Exists in routes. |
| **LeadsPage** | `/leads` | Exists in routes. |

### Key Components
| Component | Purpose |
|-----------|---------|
| **Layout** | Sidebar navigation (12 items), dark mode toggle, mobile hamburger, demo mode banner |
| **ProtectedRoute** | Checks localStorage for access_token, redirects to /login if missing |

### Shared Libraries
| File | Purpose |
|------|---------|
| `api/client.ts` | Axios client with JWT interceptor, token refresh, demo mode fallback |
| `data/demo.ts` | Full demo dataset (customers, jobs, estimates, invoices, etc.) for when backend is unreachable |
| `types/index.ts` | TypeScript interfaces for all entities |
| `lib/pdf.ts` | Client-side PDF invoice generation with jsPDF, AATOS branding |

---

## 4. Features That EXIST and WORK

1. **JWT Authentication** — Login with username/password, token storage, auto-refresh interceptor
2. **Customer CRUD** — Create, edit, soft-delete customers with full field set
3. **Customer Detail** — Contact info, notes with version history, activity timeline, reminders
4. **Customer Search & Filter** — By name/email, status, region, with sorting
5. **Customer Import/Export** — CSV/Excel upload and download
6. **Job Creation** — Form with customer/service selection, auto-fill price/duration
7. **Job List** — Today/week/all views with status filters
8. **Job Calendar** — FullCalendar monthly/weekly view with color-coded events
9. **Job Status Transitions** — Start (→ in_progress), Complete (→ completed) with actual duration
10. **Photo Capture** — Camera capture on job detail, stored in IndexedDB
11. **Estimate Creation** — Dynamic line items with totals
12. **Estimate Accept** — Backend converts accepted estimate to jobs
13. **Invoice Creation** — From completed jobs with tax calculation
14. **Invoice List** — All/outstanding/overdue views
15. **Invoice Preview** — Modal preview of invoice details
16. **Invoice PDF** — Client-side generation with professional layout
17. **Service Catalog** — Read-only view of seeded categories and services
18. **Dashboard** — Summary stats, today's schedule, overdue reminders, weather widget
19. **Route Planning** — Create routes, add stops, optimize with nearest-neighbor algorithm
20. **Reminders** — Create, complete, snooze, with priority and recurrence
21. **Activity Logging** — Log activities with type, outcome, and follow-up dates
22. **Dark Mode** — Toggle in sidebar, persisted to user profile
23. **Demo Mode** — Full sample data fallback when backend is unavailable
24. **Mobile Responsive Layout** — Hamburger menu, card views on mobile
25. **Seed Data** — Management command seeds 5 categories, 24 services

---

## 5. Features That EXIST but Are BROKEN

### 5.1 Critical

| # | Bug | Location | Details |
|---|-----|----------|---------|
| 1 | **AllowAny default permissions** | `backend/crm_project/settings.py:74` | `DEFAULT_PERMISSION_CLASSES = ('rest_framework.permissions.AllowAny',)` — All API endpoints are publicly accessible without authentication. Only `/auth/me/` and `/auth/dark-mode/` explicitly require auth. |
| 2 | **LoginPage duplicates API base URL** | `frontend/src/pages/LoginPage.tsx` | Has its own `API_BASE_URL` constant separate from `api/client.ts`. If one is updated and the other isn't, login breaks while other API calls work (or vice versa). |

### 5.2 High

| # | Bug | Location | Details |
|---|-----|----------|---------|
| 3 | **InvoiceFormPage sends wrong field name** | `frontend/src/pages/InvoiceFormPage.tsx` | Sends `job_ids` array but backend `InvoiceCreateSerializer` expects `jobs` field (write_only PrimaryKeyRelatedField). Invoice creation from jobs will fail silently or 400. |
| 4 | **Invoice number not auto-generated** | `backend/apps/services/models.py` | `invoice_number` field is required and unique but has no auto-generation logic. Frontend must supply it or creation fails. Frontend does generate one (`INV-XXXX` format) but there's no server-side validation/auto-increment. |
| 5 | **`seed_demo_customers` command may not exist** | `backend/Procfile` | Procfile calls `seed_demo_customers` but this command file was not found in the codebase. Deployment will log a warning but continue (wrapped in try/except in seed_services). |
| 6 | **Demo mode triggers on localhost** | `frontend/src/api/client.ts` | `isDemoMode` is true when `VITE_API_URL` is empty OR equals `http://localhost:8000`. During local development with a real backend at localhost:8000, the app will use demo data instead of real API calls. |

### 5.3 Medium

| # | Bug | Location | Details |
|---|-----|----------|---------|
| 7 | **Email backend is console-only** | `backend/crm_project/settings.py` | `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'` — Emails are printed to stdout, never actually sent. Invoice emails won't work. |
| 8 | **No CSRF/CORS production URL configured by default** | `backend/crm_project/settings.py` | `FRONTEND_URL` env var must be set in production or CORS will block requests. `CORS_ALLOW_ALL_ORIGINS = DEBUG` means production requires explicit config. |

---

## 6. Features That Are MISSING (Required by Spec)

| # | Feature | Spec Section | Status |
|---|---------|-------------|--------|
| 1 | **User Registration** | Phase 2 (auth) | No registration endpoint. Users must be created via Django admin or `createsuperuser`. |
| 2 | **Settings Page** | 3.6 | Not built. No company info, tax rate, service type management, invoice terms, invoice numbering, or email settings UI. |
| 3 | **Global Search** | 3.7 | Not built. No search bar in header. No cross-entity search. |
| 4 | **Service Type Management** | 3.6 | Services page is read-only. No add/edit/delete for service types or categories in the UI. Backend CRUD endpoints exist but frontend doesn't use them. |
| 5 | **Recurring Job Generation** | 3.3 | Job model has `is_recurring`, `recurrence_pattern`, `recurrence_end_date` fields. Backend has no auto-generation logic. No UI for recurring job setup. |
| 6 | **Route Sheet / Daily View** | 3.3 | No crew-focused daily view with printable job list. The Jobs "Today" tab exists but isn't formatted as a route sheet. |
| 7 | **Invoice Email Sending** | 3.4 | No email sending UI or backend implementation. Email backend is console-only. |
| 8 | **Invoice Mark-as-Paid UI** | 3.4 | Backend has `record_payment` action. Frontend InvoicesPage has no "Mark Paid" button or payment recording flow. |
| 9 | **Estimate → Job Conversion UI** | 3.5 | Backend `accept` action exists and creates jobs. Frontend has no "Accept" or "Convert to Job" button on estimates. |
| 10 | **CSV Contact Import** | 3.2 | Import page exists but handles Excel format. Spec asks for CSV import with preview → confirm flow. |
| 11 | **Contact Notes on Detail Page** | 3.2 | Notes exist but the spec wants "Simple text notes with timestamp and author, chronological. Add note form at top." Current implementation has version history which is more complex. Works but UI could be simpler. |
| 12 | **Photo Upload to Server** | 3.3 | Photos are captured and stored in IndexedDB (client-only). No upload to Django media/S3. Photos are lost if browser data is cleared. |
| 13 | **Overdue Invoice Auto-Detection** | 3.4 | No background task or auto-flagging of overdue invoices. Status must be manually changed. |
| 14 | **Revenue Chart** | 3.1 | Dashboard has revenue stat but no bar chart of monthly revenue (last 6 months). Recharts is installed but not used for this. |
| 15 | **Recent Activity Feed on Dashboard** | 3.1 | Dashboard shows today's schedule and overdue reminders but no activity feed ("Invoice #1042 sent to John Smith"). |
| 16 | **Company Logo Upload** | 3.6 | No settings page, no logo upload. PDF uses hardcoded "AATOS" text. |
| 17 | **Seed Demo Data Command** | 4.2 | `seed_demo_customers` is referenced but doesn't exist. `seed_services` exists but only seeds categories/services, not contacts/jobs/invoices. |

---

## 7. Auth & Permissions

- **Auth method:** JWT via `djangorestframework-simplejwt`
- **Token endpoints:** `/auth/token/` (obtain), `/auth/token/refresh/` (refresh)
- **Token lifetime:** Access = 60 min, Refresh = 1 day (defaults)
- **Frontend storage:** `localStorage` (access_token, refresh_token)
- **Frontend protection:** `ProtectedRoute` checks for access_token in localStorage
- **Login works:** Yes, JWT flow is functional
- **Logout:** Frontend clears localStorage tokens (no server-side token blacklist)
- **Registration:** Does NOT exist. No endpoint, no UI.

### Permission Issues
- **`REST_FRAMEWORK.DEFAULT_PERMISSION_CLASSES` = `AllowAny`** — This means every single API endpoint (customers, jobs, invoices, etc.) is publicly accessible without authentication. Anyone with the API URL can read/write all data.
- Only `/auth/me/` and `/auth/dark-mode/` explicitly set `IsAuthenticated`.
- **No row-level security (RLS).** No filtering by `created_by` user. All users see all data. This is acceptable for a single-business CRM but the AllowAny default is a critical security hole.

---

## 8. Database

- **Development:** SQLite (`db.sqlite3`)
- **Production:** PostgreSQL via `dj-database-url` (reads `DATABASE_URL` env var)
- **Migrations:** All apps have migrations. No obvious pending migrations from code review.
- **Orphaned models:** None found. All models are used by views/serializers.
- **Indexes:** Standard Django auto-indexes on FKs and primary keys. No custom indexes.

---

## 9. Deployment

### Backend (Django → Railway)
- **Procfile:** `web: python manage.py migrate && python manage.py collectstatic --noinput && python manage.py seed_services && python manage.py seed_demo_customers && gunicorn crm_project.wsgi:application --bind 0.0.0.0:$PORT`
- **railway.json:** Exists with build/deploy commands
- **Static files:** WhiteNoise middleware configured
- **WSGI:** Gunicorn
- **Issue:** `seed_demo_customers` in Procfile will fail (command doesn't exist) but has try/except wrapper

### Frontend (React/Vite → Vercel)
- **vercel.json:** SPA rewrite rule (`"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]`)
- **Build:** `npm run build` (standard Vite build)
- **API URL:** Configured via `VITE_API_URL` env var
- **Issue:** No proxy in `vite.config.ts` for local development

### Environment Variables Needed
| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `SECRET_KEY` | Backend | Django secret key |
| `DEBUG` | Backend | Set to False in production |
| `FRONTEND_URL` | Backend | CORS allowed origin |
| `VITE_API_URL` | Frontend | Backend API base URL |

---

## 10. Hardcoded Values & Debug Artifacts

### Hardcoded Values
- **`LoginPage.tsx`:** `API_BASE_URL` constant duplicates logic from `api/client.ts`
- **`pdf.ts`:** Company name "AATOS - All Around Town Outdoor Services" and address "Davenport, Iowa" are hardcoded
- **`demo.ts`:** Demo data has Davenport, Iowa addresses (appropriate for demo mode)
- **`settings.py`:** `SITE_NAME = 'All Around Town Outdoor Services'` (appropriate)

### Debug Artifacts
- **console.log:** None found
- **print():** None found
- **TODO/FIXME/HACK:** None found
- **Test credentials in README.md:** Default login `jlischer/crm2024!` documented in README

### Localhost References
All localhost references are in proper env-var fallback patterns (e.g., `process.env.VITE_API_URL || 'http://localhost:8000'`). No hardcoded localhost URLs that would break production.

---

## 11. Proposal vs Reality

Cross-referencing `PROPOSAL.md` against what actually exists:

| Proposed Feature | Status | Notes |
|-----------------|--------|-------|
| Customer management (CRUD) | **DONE** | Full CRUD with search, filter, detail view |
| Customer notes & activity logging | **DONE** | Notes with version history, activity types with outcomes |
| Job scheduling | **DONE** | Create jobs, assign to customers, schedule date/time |
| Job calendar view | **DONE** | FullCalendar with monthly/weekly, color-coded |
| Job status tracking | **DONE** | Scheduled → In Progress → Completed flow |
| Service catalog (5 categories, 24 services) | **DONE** | Seeded via management command |
| Estimates/quotes | **PARTIAL** | Can create estimates. Cannot accept/convert to jobs from UI. |
| Invoice generation | **DONE** | Create from jobs or manually, with tax calculation |
| Invoice PDF | **DONE** | Client-side PDF with jsPDF, professional layout |
| Invoice email | **NOT BUILT** | Email backend is console-only, no send UI |
| Invoice payment tracking | **PARTIAL** | Backend has record_payment. No UI to mark paid. |
| Recurring jobs | **NOT BUILT** | Model fields exist, no generation logic or UI |
| Route planning | **DONE** | Create routes, add stops, optimize |
| Route sheet / daily view | **NOT BUILT** | No printable crew daily view |
| Crew mobile app | **PARTIAL** | Mobile responsive layout exists. No dedicated crew view. |
| Photo documentation | **PARTIAL** | Camera capture works. IndexedDB only, no server upload. |
| Weather integration | **PARTIAL** | Weather widget on dashboard/jobs. Appears to use demo/static data. |
| Reports & analytics | **NOT BUILT** | Reports page exists but uses demo data only |
| Follow-up reminders | **DONE** | Full reminder system with snooze, recurrence, priorities |
| Import/export | **DONE** | CSV/Excel import and export for customers |
| Dark mode | **DONE** | Toggle in sidebar, persisted to user profile |
| Multi-device / responsive | **DONE** | Mobile hamburger menu, card views, responsive tables |
| Settings page | **NOT BUILT** | No company info, tax rate, service management UI |
| Global search | **NOT BUILT** | No cross-entity search |
| User registration | **NOT BUILT** | No registration endpoint or UI |
| Seed demo data | **PARTIAL** | Services seeded. No customers/jobs/invoices seed command. |

### Summary
- **Fully delivered:** 13 of 24 proposed features
- **Partially delivered:** 6 features (missing key parts)
- **Not built:** 5 features (settings, global search, recurring jobs, reports, registration)

---

## 12. Priority Fix List (For Phase 2)

### Critical
1. Change `DEFAULT_PERMISSION_CLASSES` to `IsAuthenticated`
2. Fix `InvoiceFormPage` to send `jobs` instead of `job_ids`
3. Fix demo mode trigger logic (shouldn't activate on localhost:8000 during real dev)

### High
4. Add invoice auto-number generation on backend
5. Create `seed_demo_customers` management command (or rename to match Procfile)
6. Consolidate `LoginPage` API base URL with `api/client.ts`
7. Add "Mark as Paid" UI on invoices
8. Add "Accept Estimate" UI button

### Medium
9. Build Settings page (company info, tax rate, service types, invoice terms)
10. Build Global Search
11. Add revenue chart to dashboard
12. Add recent activity feed to dashboard
13. Build route sheet / daily view
14. Implement recurring job generation
15. Configure email backend for production (SMTP)

### Cleanup
16. Remove default credentials from README.md
17. Create proper seed_demo_data command (contacts + jobs + invoices + estimates)
18. Add server-side photo upload (replace IndexedDB)
