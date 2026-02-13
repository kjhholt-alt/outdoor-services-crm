# Outdoor CRM - Deployment Guide

## Current Status

| Component | Status | URL |
|-----------|--------|-----|
| Frontend  | LIVE   | https://outdoor-services-crm.vercel.app |
| Backend   | NOT DEPLOYED | Needs Railway login |
| GitHub    | LIVE   | https://github.com/kjhholt-alt/outdoor-services-crm |

The frontend is live with **demo data** (sample customers, jobs, invoices from Davenport, Iowa).
Once the backend is deployed on Railway, set `VITE_API_URL` on Vercel and redeploy to switch from demo data to real data.

---

## Deploy Backend to Railway (One-Time Setup)

### Step 1: Login to Railway
```bash
cd C:\Users\Kruz\Desktop\Projects\outdoor-crm\backend
railway login
```
This opens a browser window. Click "Login" and authorize.

### Step 2: Create Project & Link
```bash
railway init
# Choose "Create new project" and name it "outdoor-crm-backend"

railway link
# Select the project you just created
```

### Step 3: Add PostgreSQL Database
```bash
railway add
# Select "PostgreSQL" from the list
```

### Step 4: Set Environment Variables
```bash
railway variables set SECRET_KEY="your-random-secret-key-here"
railway variables set ALLOWED_HOSTS=".railway.app,.vercel.app,localhost"
railway variables set FRONTEND_URL="https://outdoor-services-crm.vercel.app"
railway variables set CORS_ALLOWED_ORIGINS="https://outdoor-services-crm.vercel.app"
railway variables set DEBUG=false
```

### Step 5: Deploy
```bash
railway up
```
Railway will build with the `railway.json` config, which automatically runs:
- `python manage.py migrate`
- `python manage.py collectstatic --noinput`
- `python manage.py seed_services` (loads service catalog data)
- `gunicorn crm_project.wsgi`

### Step 6: Get Backend URL
```bash
railway domain
# Copy the generated URL (e.g., https://outdoor-crm-backend-production.up.railway.app)
```

### Step 7: Verify Health Check
```bash
curl https://YOUR-RAILWAY-URL/health/
# Should return: {"status": "ok"}
```

---

## Connect Frontend to Backend

### Step 1: Set API URL on Vercel
Go to Vercel Dashboard > outdoor-services-crm > Settings > Environment Variables

Add:
- `VITE_API_URL` = `https://YOUR-RAILWAY-URL` (no trailing slash)

### Step 2: Redeploy Frontend
```bash
cd C:\Users\Kruz\Desktop\Projects\outdoor-crm
mv .git .git_backup
cd frontend
npx vercel deploy --prod --yes --token YOUR_TOKEN
cd ..
mv .git_backup .git
```

Or trigger redeploy from Vercel dashboard.

---

## Custom Domain Setup

To access the CRM from your own domain:

1. Go to Vercel Dashboard > outdoor-services-crm > Settings > Domains
2. Add your domain (e.g., `crm.yourdomain.com`)
3. Add the DNS record Vercel provides (CNAME to `cname.vercel-dns.com`)
4. Wait for SSL certificate provisioning (usually <5 min)

---

## Tech Stack

- **Backend**: Django 5 + DRF, PostgreSQL, gunicorn
- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS, React Query
- **Deployment**: Vercel (frontend) + Railway (backend)
