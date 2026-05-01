# CLAUDE.md - Outdoor CRM (AATOS)

## ⛔ PARKED 2026-04-30 — DO NOT MODIFY AUTONOMOUSLY

This project is parked. **Do not edit files, run installs, run migrations,
commit, push, or deploy from this directory** without explicit, in-the-moment
approval from Kruz. There are 34 uncommitted production-hardening files in
the working tree that Kruz has not yet reviewed. See `PARKED.md` in this
directory for the full hard rules and unpark procedure.

If you are an autonomous agent / Claude session and your task involves this
folder, **stop and ask Kruz first**.

## Project Overview

CRM for All Around Town Outdoor Services (AATOS), a general outdoor services company in Davenport, Iowa. Stack: React 19 + Vite frontend, Django 5 + DRF backend.

## Architecture

### Backend (Django 5 + DRF)

**Apps:**
- `accounts` - User auth (JWT via SimpleJWT), UserProfile with dark_mode preference, CompanyProfile singleton
- `customers` - Customer CRUD with soft-delete, Notes with version history, Lead model with convert-to-customer flow
- `activities` - ActivityType + Activity logging with outcomes
- `reminders` - Reminder system with business day math, snooze, recurrence
- `routing` - Route + RouteStop with nearest-neighbor optimization
- `imports` - CSV/Excel customer import/export
- `services` - ServiceCategory, Service, Job, Estimate, Invoice, Dashboard, Reports

**Key Models:**
- `Job` - FK to Customer + Service, status workflow (scheduled/in_progress/completed/cancelled), billing fields
- `Invoice` - FK to Customer, M2M to Jobs, auto-increment invoice_number (INV-YYYY-NNNN), balance_due property
- `Estimate` - FK to Customer, JSON line_items, accept action creates Jobs (matches by service_id first, then name)
- `Lead` - Pre-customer prospects with status workflow, hot score, services_needed JSON, convert_to_customer action
- `CompanyProfile` - Singleton (pk=1) for company name, address, tax rate, invoice terms

**Auth:**
- JWT via SimpleJWT with token blacklist. Access token: 12 hours. Refresh: 7 days.
- Default permission: `IsAuthenticated`
- Service catalog endpoints use `ReadOnlyOrAuthenticated` (anon can read, auth required to write)
- Login: `POST /auth/login/`, Refresh: `POST /auth/refresh/`
- SECRET_KEY fails loud if not set when DEBUG=False

**API URL Structure:**
- `/auth/` - Authentication (login, refresh, me, dark-mode, company-profile)
- `/customers/`, `/regions/`, `/leads/` - Customer/Lead CRUD
- `/activities/` - Activity logging
- `/reminders/` - Reminder CRUD with filter endpoints
- `/routes/` - Route planning
- `/import/` - Import/export
- `/api/` - Services, Jobs, Estimates, Invoices, Dashboard, Reports

### Frontend (React 19 + Vite + TypeScript)

**Key Files:**
- `src/api/client.ts` - Axios client with JWT interceptor, token refresh, demo mode fallback, reportsApi, leadsApi, companyProfileApi
- `src/data/demo.ts` - Full demo dataset. `isDemoMode` = true when VITE_API_URL is empty or "demo"
- `src/types/index.ts` - All TypeScript interfaces
- `src/lib/pdf.ts` - Client-side invoice PDF generation (jsPDF)

**Pages:**
- Dashboard, Jobs (with calendar), Customers (list + detail + form), Services, Estimates, Invoices, Reports, Reminders, Routes, Import/Export, Crew View, Leads, Settings

**Patterns:**
- React Query for all data fetching with `queryKey` conventions
- `withDemo()` helper wraps API calls with demo data fallback
- Forms use controlled state (not react-hook-form for most)
- Toast notifications via `sonner`
- Page transitions via `framer-motion`
- Common components: Button, Card, Input, Modal, FAB, Skeleton

## Deployment

### Backend (Railway)
```bash
cd backend
railway up --detach
```
Procfile runs: migrate, collectstatic, seed_services, seed_demo_customers, gunicorn

### Frontend (Vercel)
Push to GitHub triggers auto-deploy. SPA rewrite in vercel.json.

### Required Environment Variables
- Backend: `DATABASE_URL`, `SECRET_KEY`, `FRONTEND_URL`, `DEBUG=False`
- Backend (optional email): `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- Frontend: `VITE_API_URL` (Railway backend URL)

## Database Commands
```bash
cd backend
python manage.py migrate
python manage.py seed_services           # Seeds 5 categories, 24 services
python manage.py seed_demo_customers     # Seeds 8 customers with jobs, invoices, estimates
python manage.py createsuperuser         # Create admin account
```

## Known Quirks
- Invoice PDF is generated client-side (jsPDF), not server-side
- Photos are stored in IndexedDB (client-only), not uploaded to server
- Weather widget may use static/demo data without `VITE_WEATHER_API_KEY`

## Testing
```bash
# Backend (51 tests)
cd backend && python manage.py test apps.services apps.customers apps.accounts

# Frontend (7 smoke tests via Vitest)
cd frontend && npm test
```
