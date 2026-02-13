# Outdoor CRM (AATOS) - Status

**Last Updated**: 2026-02-13 ~6:40 AM

## FULLY DEPLOYED - Both Frontend & Backend Live

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | LIVE | https://outdoor-services-crm.vercel.app |
| Backend | LIVE | https://motivated-vitality-production.up.railway.app |
| Health Check | PASSING | https://motivated-vitality-production.up.railway.app/health/ |
| GitHub | LIVE | https://github.com/kjhholt-alt/outdoor-services-crm |

## What's Working

- **Frontend** (Vercel): All 10 pages render correctly, SPA routing, dark mode, mobile responsive
- **Backend** (Railway): Django 5 + DRF, PostgreSQL, gunicorn — health check returns 200
- **Service Catalog**: 5 categories, 24 services seeded from management command
  - Lawn Care (6 services), Landscaping (5), Snow Removal (5), Cleanups (5), Additional Services (3)
- **API Endpoints**: categories, services, jobs, estimates, invoices, dashboard summary — all working
- **Frontend connected to backend**: `VITE_API_URL` set on Vercel, builds pull real data
- **Demo data fallback**: If backend goes down, frontend shows sample data automatically

## What's Not Working / Pending

- **No custom domain yet**: Currently on `outdoor-services-crm.vercel.app`
- **Auth not enforced**: JWT auth endpoints exist in backend but frontend doesn't require login
- **No real customer data yet**: Service catalog is seeded, but customers/jobs/invoices are empty (need to be created or imported)

## Next Steps

1. Import real customer data via the Import/Export page
2. Create first jobs and invoices
3. Add custom domain if desired
4. Enable JWT auth if multi-user access needed

## Architecture

```
Frontend (Vercel)                    Backend (Railway)
React 19 + Vite + TypeScript        Django 5 + DRF
Tailwind CSS                         PostgreSQL (Railway addon)
React Query                          gunicorn + WhiteNoise
outdoor-services-crm.vercel.app      motivated-vitality-production.up.railway.app
```

## Railway Project

- **Project**: beautiful-quietude
- **Service**: motivated-vitality
- **Database**: PostgreSQL (auto-provisioned)
- **Environment**: production
- **Start command**: migrate → collectstatic → seed_services → gunicorn

## Branding

- **Company**: All Around Town Outdoor Services (AATOS)
- **Location**: Davenport, Iowa
- **Colors**: Forest green (#16a34a) primary
- **Logo**: TreePine icon in green circle
