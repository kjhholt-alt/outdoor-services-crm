# Outdoor CRM (AATOS) - Status

**Last Updated**: 2026-02-13 ~3:00 AM

## What's Working

- **Frontend LIVE**: https://outdoor-services-crm.vercel.app
  - Full CRM dashboard with demo data (8 customers, 9 jobs, 5 invoices)
  - All pages working: Dashboard, Jobs, Customers, Services, Estimates, Invoices, Routes, Reminders, Reports, Import/Export
  - SPA routing works (direct URL navigation)
  - Dark mode toggle
  - Demo mode banner shows when no backend connected
  - Mobile responsive with sidebar drawer

- **GitHub**: https://github.com/kjhholt-alt/outdoor-services-crm
  - All code committed and pushed (2 commits on main)

- **Backend Code Complete** (not deployed yet):
  - Django 5 + DRF API with: ServiceCategory, Service, Job, Estimate, Invoice models
  - Job workflow: scheduled -> in_progress -> completed/cancelled/rescheduled/weather_delay
  - Estimate -> Job conversion
  - Invoice payment tracking
  - Dashboard summary endpoint
  - Health check endpoint
  - Seed data management command (outdoor services catalog)
  - Railway deployment config (railway.json)

## What's Not Working / Pending

- **Backend not deployed**: Railway CLI requires interactive login (can't do in Claude Code). See `DEPLOY.md` for one-command setup guide.
- **No custom domain yet**: Currently on `outdoor-services-crm.vercel.app`
- **Auth not connected**: JWT auth endpoints exist in backend but frontend doesn't enforce login (fine for now)

## Next Steps

1. **Deploy backend to Railway** (follow DEPLOY.md - just needs `railway login` then `railway up`)
2. Set `VITE_API_URL` on Vercel to point to Railway backend
3. Redeploy frontend to switch from demo data to real data
4. Add custom domain if desired
5. Import real customer data via Import/Export page

## Architecture

```
Frontend (Vercel)           Backend (Railway - pending)
React 19 + Vite             Django 5 + DRF
Tailwind CSS                PostgreSQL
React Query                 gunicorn
                            WhiteNoise (static files)
```

## Branding

- **Company**: All Around Town Outdoor Services (AATOS)
- **Location**: Davenport, Iowa
- **Colors**: Forest green (#16a34a) primary
- **Logo**: TreePine icon in green circle
