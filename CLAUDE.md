# CLAUDE.md - Outdoor CRM (AATOS)

## Project Overview

CRM for All Around Town Outdoor Services (AATOS), a general outdoor services company in Davenport, Iowa. Stack: React 19 + Vite frontend, Django 5 + DRF backend.

## Architecture

### Backend (Django 5 + DRF)

**Apps:**
- `accounts` - User auth (JWT via SimpleJWT), UserProfile with dark_mode preference
- `customers` - Customer CRUD with soft-delete, Notes with version history
- `activities` - ActivityType + Activity logging with outcomes
- `reminders` - Reminder system with business day math, snooze, recurrence
- `routing` - Route + RouteStop with nearest-neighbor optimization
- `imports` - CSV/Excel customer import/export
- `services` - ServiceCategory, Service, Job, Estimate, Invoice

**Key Models:**
- `Job` - FK to Customer + Service, status workflow (scheduled/in_progress/completed/cancelled), billing fields
- `Invoice` - FK to Customer, M2M to Jobs, auto-increment invoice_number (INV-YYYY-NNNN), balance_due property
- `Estimate` - FK to Customer, JSON line_items, accept action creates Jobs

**Auth:**
- JWT via SimpleJWT. Access token: 12 hours. Refresh: 7 days.
- Default permission: `IsAuthenticated` (changed from AllowAny in audit)
- Login: `POST /auth/login/`, Refresh: `POST /auth/refresh/`
- Service catalog endpoints are `AllowAny` for public viewing
- Auth token endpoints are explicitly `AllowAny`

**API URL Structure:**
- `/auth/` - Authentication (login, refresh, me, dark-mode)
- `/customers/`, `/regions/` - Customer CRUD
- `/activities/` - Activity logging
- `/reminders/` - Reminder CRUD with filter endpoints
- `/routes/` - Route planning
- `/import/` - Import/export
- `/api/` - Services, Jobs, Estimates, Invoices, Dashboard

### Frontend (React 19 + Vite + TypeScript)

**Key Files:**
- `src/api/client.ts` - Axios client with JWT interceptor, token refresh, demo mode fallback
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
- Reports page uses demo data (demoReports.ts), not live queries
- Email backend defaults to console (not production SMTP)
- Company settings (name, address, tax rate) stored in localStorage via Settings page
- Weather widget may use static/demo data
- Dashboard revenue chart uses demo data from demoReports.ts

## Testing
```bash
# Backend
cd backend && python manage.py check
cd backend && python manage.py test

# Frontend
cd frontend && npx tsc --noEmit
cd frontend && npm run build
```
