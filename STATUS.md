# Outdoor CRM (AATOS) - Status

**Last Updated**: 2026-04-09

## CLIENT PROJECT — Proposal Ready

**Proposal**: See `PROPOSAL.md` in this directory
**Pricing tiers**: $500 (code handoff) / $800 (turnkey setup) / $800 + $75-150/mo (ongoing support)

## FULLY DEPLOYED - Both Frontend & Backend Live

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | LIVE | https://outdoor-services-crm.vercel.app |
| Backend | LIVE | https://motivated-vitality-production.up.railway.app |
| Health Check | PASSING | https://motivated-vitality-production.up.railway.app/health/ |
| GitHub | LIVE | https://github.com/kjhholt-alt/outdoor-services-crm |

---

## Production Hardening Sprint (2026-04-09)

### Security Fixes
- **Service catalog permissions** — `ServiceCategoryViewSet` and `ServiceViewSet` now use `ReadOnlyOrAuthenticated`: anon can list/retrieve, auth required for create/update/delete
- **JWT token blacklist** — Added `rest_framework_simplejwt.token_blacklist` to INSTALLED_APPS + migration. `BLACKLIST_AFTER_ROTATION: True` now actually works
- **SECRET_KEY** — Raises `RuntimeError` in production (DEBUG=False) if `SECRET_KEY` env var is missing
- **Dead dependencies removed** — Celery + Redis stripped from requirements.txt and settings.py (were never wired up)

### Data Integrity
- **Dashboard monthly_revenue** — Replaced `timedelta(days=i*30)` with real calendar month boundaries
- **Estimate → Job service matching** — Now matches by `service_id` first, falls back to name lookup

### Email
- **Production email backend** — `EMAIL_BACKEND` auto-switches from console (DEBUG) to SMTP (production)

### Reports API (NEW)
- **`GET /api/reports/`** — Returns monthly revenue (current + previous year), jobs by status, revenue by category, crew productivity, summary stats
- **ReportsPage wired to live API** — Uses React Query with demo data fallback. Loading skeleton while fetching

### Leads Backend (NEW)
- **Lead model** — `apps.customers.models.Lead` with fields: business_name, contact_name, phone, email, address, type, source, score, status, services_needed (JSON), convert_to_customer action
- **`/leads/` API** — Full CRUD with search/filter by status, type, source, city. `POST /leads/{id}/convert_to_customer/` creates a Customer and marks lead as converted
- **LeadsPage wired to API** — React Query with demo fallback. Status changes and conversions call the API when not in demo mode

### Company Profile (NEW)
- **CompanyProfile model** — Singleton at `apps.accounts.models.CompanyProfile` (pk=1, get_or_create). Fields: name, address, phone, email, tax_rate, invoice_prefix, invoice_terms
- **`/auth/company-profile/` API** — GET/PATCH
- **SettingsPage wired to API** — Loads from API, saves via PATCH. Falls back to localStorage in demo mode

### Backend Test Suite (NEW) — 51 tests
- **Auth**: Login, bad password, token refresh, /me requires auth, toggle dark mode
- **Company Profile**: GET creates default, PATCH updates, singleton behavior, auth required
- **Customers**: CRUD, soft delete, search
- **Notes**: Add, list, version history (new note marks previous not-current)
- **Leads**: CRUD, filter by status, search, convert to customer, double-convert blocked
- **Services**: Anon read OK, anon write blocked, auth write OK
- **Jobs**: CRUD, start/complete status transitions, reschedule, today filter, auth required
- **Estimates**: Create, accept creates jobs
- **Invoices**: Auto-number, partial payment, full payment, outstanding/overdue filters, balance_due property
- **Dashboard**: Returns expected shape, handles empty DB
- **Reports**: Returns expected shape, auth required

### Frontend Test Suite (NEW) — 7 smoke tests
- Vitest + Testing Library + jsdom configured
- Login, Dashboard, Reports, Leads, Invoices page smoke tests
- `npm test` script added to package.json

### Invoice Fixes (VERIFIED)
- **`jobs` field** — Frontend sends `jobs: [...]` and serializer accepts it correctly (was flagged as `job_ids` in old audit — already fixed)
- **Auto-number** — `Invoice.save()` override generates `INV-YYYY-NNNN` correctly

---

## Previous: 8-Feature Enhancement Sprint (COMPLETED 2026-02-13)

All 8 features implemented, built, deployed, and verified:

1. Calendar View (FullCalendar)
2. Weather Integration (OpenWeatherMap)
3. Crew Mobile View (/crew)
4. Photo Documentation (IndexedDB)
5. Reports & Analytics (Recharts)
6. PDF Invoice Generation (jsPDF)
7. Toast Notifications (Sonner)
8. UI Overhaul (Framer Motion) + Form Pages + Market Leads
9. Customer Page Redesign

## What's Working

- **Frontend** (Vercel): All 16+ pages render correctly, SPA routing, dark mode, mobile responsive
- **Backend** (Railway): Django 5 + DRF, PostgreSQL, gunicorn — health check returns 200
- **Auth enforced**: JWT auth with ProtectedRoute on frontend, IsAuthenticated default on backend
- **Service Catalog**: 5 categories, 24 services. Public read, auth-protected write
- **Reports**: Live API data with demo fallback, 5 chart types, date range filtering
- **Leads**: Backend-persisted with full CRUD, search/filter, convert-to-customer flow
- **Company Settings**: Server-persisted via CompanyProfile model
- **Invoice auto-numbering**: INV-YYYY-NNNN format on backend
- **Demo mode**: Full offline experience when no backend configured
- **Test suites**: 51 backend + 7 frontend tests

## What's Not Working / Pending

- **Photos**: Stored in IndexedDB only (no server upload yet)
- **Recurring jobs**: Model fields exist but no auto-generation engine
- **Weather API key**: Using demo data without `VITE_WEATHER_API_KEY`
- **No custom domain**: Currently on `outdoor-services-crm.vercel.app`

## Architecture

```
Frontend (Vercel)                    Backend (Railway)
React 19 + Vite + TypeScript        Django 5 + DRF
Tailwind CSS + Framer Motion         PostgreSQL (Railway addon)
React Query + FullCalendar           gunicorn + WhiteNoise
Recharts + jsPDF + Sonner            SimpleJWT + token blacklist
Vitest + Testing Library             51 Django tests
outdoor-services-crm.vercel.app      motivated-vitality-production.up.railway.app
```
