# Build Plan: All Around Town Outdoor Services CRM

## The Mission

Build a fully functional CRM for **All Around Town Outdoor Services** (Davenport, Iowa) to replace **ClientTether** ($300/month). Our version runs on Railway + Vercel for ~$25/month total.

## Why We Can Do This Fast

We already have a **production-ready CRM** at `C:\Users\Kruz\Desktop\Projects\CRM` (repo: `kjhholt-alt/CRM`) built with Django + React. It already has:
- Customer management (full CRUD, search, filter, pagination)
- Route optimization (nearest-neighbor algorithm, Haversine distance, Leaflet maps)
- Activity logging (6 configurable types, outcomes, durations)
- Follow-up reminders (business day math, snooze, priority levels, dashboard)
- Data import/export (Excel/CSV)
- Notes with version history
- Dark mode, iPad/mobile optimized (48px touch targets)
- JWT auth, multi-user support

**We fork this and add outdoor services features on top.** That's 60-70% of the work already done.

---

## Client Profile

**Business:** All Around Town Outdoor Services
**Location:** Davenport, Iowa
**Owner:** User's uncle
**Current CRM:** ClientTether ($300/month)
**Services likely offered:** Lawn mowing, landscaping, snow removal, leaf cleanup, yard maintenance, seasonal cleanups, possibly hardscaping/fencing

---

## What ClientTether Does (What We're Replacing)

Based on research, ClientTether provides:
- Lead capture + automated follow-up (SMS, email, calls)
- Customer database
- Quoting/estimates
- Payment processing
- Reporting/analytics
- Review automation
- Multi-channel communication
- QuickBooks integration

**What the uncle actually NEEDS from a CRM for a local outdoor services company:**
1. Customer list with property addresses and service history
2. Job scheduling — who's getting serviced today/this week
3. Route planning — optimize driving between jobs
4. Service tracking — what was done, when, how much
5. Invoicing — who owes what
6. Reminders — follow up on quotes, seasonal service renewals
7. Mobile access — check schedule in the truck

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              VERCEL (Frontend)              │
│    React 19 + TypeScript + Tailwind CSS     │
│    Vite build, Leaflet maps, mobile-first   │
│    URL: allaroundtown-crm.vercel.app        │
├─────────────────────────────────────────────┤
│             RAILWAY (Backend)               │
│    Django 5 + DRF + PostgreSQL              │
│    Celery + Redis (scheduled tasks)         │
│    REST API with JWT auth                   │
├─────────────────────────────────────────────┤
│    Cost: Railway ~$5-10/mo + Vercel free    │
│    vs ClientTether: $300/mo                 │
│    Savings: ~$275/month ($3,300/year)       │
└─────────────────────────────────────────────┘
```

---

## Agent Execution Plan

### Team Structure (3 agents, 2 days)

| Agent | Role | Focus |
|-------|------|-------|
| **backend-lead** | Django backend | Models, APIs, business logic, data seeding |
| **frontend-lead** | React frontend | Pages, components, branding, mobile UX |
| **deploy-ops** | DevOps + polish | Railway/Vercel deploy, testing, data import |

---

### PHASE 1: Fork + Rebrand + New Models (Day 1, Morning)

**Both agents start in parallel.**

#### Agent: backend-lead

**Task 1.1: Fork and set up new repo**
```
1. Copy C:\Users\Kruz\Desktop\Projects\CRM to C:\Users\Kruz\Desktop\Projects\outdoor-crm
2. Initialize new git repo
3. Create GitHub repo: kjhholt-alt/outdoor-services-crm
4. Update Django settings:
   - Project name → outdoor_crm
   - SITE_NAME = "All Around Town Outdoor Services"
   - Default admin user: uncle's email
```

**Task 1.2: Add Service Catalog model**
```python
# backend/apps/services/models.py

class ServiceCategory(models.Model):
    """Groups of related services"""
    name = models.CharField(max_length=100)  # "Lawn Care", "Snow Removal", "Landscaping"
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50)  # Lucide icon name
    color = models.CharField(max_length=7)  # Hex color
    is_seasonal = models.BooleanField(default=False)
    season_start = models.IntegerField(null=True)  # Month number (4 = April)
    season_end = models.IntegerField(null=True)    # Month number (10 = October)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

class Service(models.Model):
    """Individual services offered"""
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)  # "Weekly Lawn Mowing", "Driveway Snow Plowing"
    description = models.TextField(blank=True)
    default_price = models.DecimalField(max_digits=10, decimal_places=2)
    price_type = models.CharField(choices=[
        ('flat', 'Flat Rate'),
        ('hourly', 'Per Hour'),
        ('sqft', 'Per Sq Ft'),
        ('custom', 'Custom Quote'),
    ])
    estimated_duration_minutes = models.IntegerField(default=60)
    is_recurring = models.BooleanField(default=False)
    recurring_frequency = models.CharField(choices=[
        ('weekly', 'Weekly'),
        ('biweekly', 'Every 2 Weeks'),
        ('monthly', 'Monthly'),
        ('seasonal', 'Seasonal'),
        ('one_time', 'One Time'),
    ], default='one_time')
    is_active = models.BooleanField(default=True)
```

**Task 1.3: Add Job/WorkOrder model**
```python
class Job(models.Model):
    """A scheduled or completed service job"""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='jobs')
    service = models.ForeignKey(Service, on_delete=models.CASCADE)

    # Scheduling
    scheduled_date = models.DateField(db_index=True)
    scheduled_time = models.TimeField(null=True, blank=True)
    estimated_duration = models.IntegerField()  # minutes

    # Assignment
    assigned_to = models.CharField(max_length=200, blank=True)  # Crew name or person

    # Status workflow
    status = models.CharField(choices=[
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
        ('weather_delay', 'Weather Delay'),
    ], default='scheduled', db_index=True)

    # Completion details
    actual_duration = models.IntegerField(null=True)  # minutes
    completed_at = models.DateTimeField(null=True)
    completion_notes = models.TextField(blank=True)

    # Billing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_invoiced = models.BooleanField(default=False)
    is_paid = models.BooleanField(default=False)

    # Recurring
    is_recurring = models.BooleanField(default=False)
    recurring_parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)

    # Meta
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Task 1.4: Add Estimate/Quote model**
```python
class Estimate(models.Model):
    """Price quotes for potential work"""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='estimates')

    # Details
    title = models.CharField(max_length=200)  # "Spring Cleanup + Weekly Mowing"
    description = models.TextField(blank=True)

    # Line items stored as JSON
    line_items = models.JSONField(default=list)
    # [{"service": "Weekly Mowing", "price": 45, "frequency": "weekly", "notes": "Front + back yard"}]

    total = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(choices=[
        ('draft', 'Draft'),
        ('sent', 'Sent to Customer'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ], default='draft')

    valid_until = models.DateField(null=True)
    sent_at = models.DateTimeField(null=True)
    responded_at = models.DateTimeField(null=True)

    # If accepted, auto-create jobs
    converted_to_jobs = models.BooleanField(default=False)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Task 1.5: Add Invoice tracking model**
```python
class Invoice(models.Model):
    """Track what's owed and paid"""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=20, unique=True)

    # Link to completed jobs
    jobs = models.ManyToManyField(Job, blank=True)

    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    status = models.CharField(choices=[
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('partial', 'Partially Paid'),
        ('overdue', 'Overdue'),
        ('void', 'Void'),
    ], default='draft')

    issued_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Task 1.6: Seed outdoor services data**
```python
# Seed data for service categories and services
SEED_DATA = {
    "Lawn Care": {
        "icon": "leaf",
        "color": "#22c55e",
        "is_seasonal": True,
        "season_start": 4,  # April
        "season_end": 10,   # October
        "services": [
            {"name": "Weekly Lawn Mowing", "price": 45, "type": "flat", "recurring": "weekly", "duration": 45},
            {"name": "Bi-Weekly Lawn Mowing", "price": 55, "type": "flat", "recurring": "biweekly", "duration": 45},
            {"name": "Lawn Edging & Trimming", "price": 30, "type": "flat", "recurring": "weekly", "duration": 20},
            {"name": "Lawn Aeration", "price": 150, "type": "flat", "recurring": "seasonal", "duration": 90},
            {"name": "Lawn Fertilization", "price": 75, "type": "flat", "recurring": "seasonal", "duration": 30},
            {"name": "Overseeding", "price": 120, "type": "flat", "recurring": "one_time", "duration": 60},
        ]
    },
    "Landscaping": {
        "icon": "trees",
        "color": "#16a34a",
        "is_seasonal": True,
        "season_start": 3,
        "season_end": 11,
        "services": [
            {"name": "Mulch Installation", "price": 65, "type": "hourly", "recurring": "seasonal", "duration": 120},
            {"name": "Bush/Hedge Trimming", "price": 50, "type": "hourly", "recurring": "monthly", "duration": 60},
            {"name": "Tree Trimming", "price": 75, "type": "hourly", "recurring": "one_time", "duration": 120},
            {"name": "Flower Bed Maintenance", "price": 45, "type": "hourly", "recurring": "biweekly", "duration": 60},
            {"name": "Landscape Design & Install", "price": 0, "type": "custom", "recurring": "one_time", "duration": 480},
        ]
    },
    "Snow Removal": {
        "icon": "snowflake",
        "color": "#3b82f6",
        "is_seasonal": True,
        "season_start": 11,
        "season_end": 3,
        "services": [
            {"name": "Driveway Snow Plowing", "price": 50, "type": "flat", "recurring": "one_time", "duration": 20},
            {"name": "Sidewalk Shoveling", "price": 30, "type": "flat", "recurring": "one_time", "duration": 15},
            {"name": "Parking Lot Plowing", "price": 150, "type": "flat", "recurring": "one_time", "duration": 60},
            {"name": "Salt/Sand Application", "price": 35, "type": "flat", "recurring": "one_time", "duration": 15},
            {"name": "Seasonal Snow Contract", "price": 500, "type": "flat", "recurring": "seasonal", "duration": 0},
        ]
    },
    "Cleanups": {
        "icon": "trash-2",
        "color": "#f59e0b",
        "is_seasonal": True,
        "season_start": 3,
        "season_end": 11,
        "services": [
            {"name": "Spring Cleanup", "price": 200, "type": "flat", "recurring": "seasonal", "duration": 180},
            {"name": "Fall Leaf Cleanup", "price": 175, "type": "flat", "recurring": "seasonal", "duration": 150},
            {"name": "Gutter Cleaning", "price": 125, "type": "flat", "recurring": "seasonal", "duration": 90},
            {"name": "Yard Debris Removal", "price": 60, "type": "hourly", "recurring": "one_time", "duration": 120},
            {"name": "Storm Cleanup", "price": 75, "type": "hourly", "recurring": "one_time", "duration": 120},
        ]
    },
    "Additional Services": {
        "icon": "wrench",
        "color": "#8b5cf6",
        "is_seasonal": False,
        "services": [
            {"name": "Pressure Washing", "price": 150, "type": "flat", "recurring": "one_time", "duration": 120},
            {"name": "Fence Repair", "price": 65, "type": "hourly", "recurring": "one_time", "duration": 180},
            {"name": "Small Hauling/Dump Runs", "price": 100, "type": "flat", "recurring": "one_time", "duration": 90},
        ]
    }
}
```

**Task 1.7: Build all API endpoints for new models**
- CRUD for Services, Jobs, Estimates, Invoices
- `GET /api/jobs/today/` — Today's schedule
- `GET /api/jobs/week/` — This week's jobs
- `GET /api/jobs/by-status/` — Filter by status
- `POST /api/jobs/{id}/start/` — Mark in-progress
- `POST /api/jobs/{id}/complete/` — Mark completed with notes/duration
- `POST /api/jobs/{id}/reschedule/` — Reschedule with reason
- `POST /api/jobs/generate-recurring/` — Generate next week's recurring jobs
- `GET /api/estimates/{id}/` — Estimate detail
- `POST /api/estimates/{id}/accept/` — Convert to jobs
- `GET /api/invoices/outstanding/` — Unpaid invoices
- `GET /api/invoices/overdue/` — Past-due invoices
- `GET /api/dashboard/summary/` — Revenue, job counts, outstanding balance

---

#### Agent: frontend-lead

**Task 1.8: Rebrand entire frontend**
```
Company: All Around Town Outdoor Services
Location: Davenport, Iowa
Color scheme:
  - Primary: Forest green (#16a34a)
  - Secondary: Earth brown (#92400e)
  - Accent: Sky blue (#0ea5e9)
  - Background: Clean white (#fafaf9) / Dark: (#1c1917)
Typography: Clean, professional, easy to read on mobile
Logo: Text-based "AATOS" or full name with leaf/tree icon
```

**Task 1.9: Build new pages**

1. **Dashboard (redesign)** — Today's jobs list, weather widget area, quick stats (jobs today, this week, revenue this month, outstanding invoices), upcoming reminders
2. **Jobs Page** — Calendar/list view of all jobs, filter by status/date/crew/service, quick status update buttons
3. **Job Detail Page** — Customer info, service details, status workflow buttons, completion form (duration, notes), navigation to customer
4. **Services Page** — Service catalog management, categories with seasonal indicators, add/edit services with pricing
5. **Estimates Page** — Create quotes with line items, send to customer (email), track status, convert accepted quotes to jobs
6. **Invoices Page** — List of invoices, filter by status (outstanding/paid/overdue), create from completed jobs, payment tracking
7. **Reports Page** — Revenue by month/service/customer, job completion rates, seasonal trends (Recharts)

**Task 1.10: Update existing pages**
- **Customer Detail** — Add tabs: Jobs History, Active Services, Estimates, Invoices, Property Notes
- **Customers List** — Add "Active Services" column, filter by service type
- **Routes Page** — Pull from today's scheduled jobs automatically (not manual customer selection)

---

### PHASE 2: Core Business Logic (Day 1, Afternoon)

#### Agent: backend-lead

**Task 2.1: Recurring job generation**
```
Management command: python manage.py generate_recurring_jobs
- Looks at all active recurring services
- Generates Job records for the next week
- Skips dates that already have jobs
- Respects seasonal windows (no mowing in December)
- Can be triggered manually or via Celery scheduled task
```

**Task 2.2: Invoice generation from completed jobs**
```
- Auto-generate invoice from completed, un-invoiced jobs for a customer
- Group by date range (weekly/monthly billing)
- Auto-number invoices (AATOS-2026-0001)
- Calculate tax (Iowa sales tax if applicable to services)
```

**Task 2.3: Dashboard summary API**
```python
GET /api/dashboard/summary/
{
    "today": {
        "total_jobs": 12,
        "completed": 5,
        "in_progress": 2,
        "scheduled": 5,
        "revenue_today": 540.00
    },
    "this_week": {
        "total_jobs": 48,
        "completed": 22,
        "revenue": 2160.00
    },
    "this_month": {
        "revenue": 8450.00,
        "jobs_completed": 89,
        "new_customers": 3
    },
    "outstanding": {
        "invoices_count": 7,
        "total_owed": 1250.00,
        "overdue_count": 2,
        "overdue_amount": 340.00
    },
    "upcoming_reminders": [...]
}
```

#### Agent: frontend-lead

**Task 2.4: Job scheduling calendar view**
- Week view showing jobs per day
- Color-coded by service category
- Drag to reschedule (stretch goal)
- Click to open job detail
- "Add Job" button per day
- Show crew assignments

**Task 2.5: Mobile-optimized job view**
```
For crews in the field:
- Large touch targets
- Today's route with addresses
- One-tap "Start Job" / "Complete Job"
- Quick notes field
- Next job preview with map link (opens Google Maps/Apple Maps)
- Works offline-ish (shows cached schedule)
```

**Task 2.6: Estimate builder**
- Select customer
- Add line items from service catalog
- Adjust prices per item
- Add notes/terms
- Calculate total
- "Send to Customer" button (email)
- Status tracking (sent → accepted/declined)

---

### PHASE 3: Communication + Polish (Day 2, Morning)

#### Agent: backend-lead

**Task 3.1: Email notifications**
```
Using Django's email backend (Resend or SMTP):
- Job completion notification to customer
- Estimate sent to customer (with details)
- Invoice sent to customer
- Upcoming service reminder (day before)
- Payment received confirmation
```

**Task 3.2: Automated reminders**
```
Celery scheduled tasks:
- Morning: Send today's schedule to assigned crews (email)
- After job completion: Send "service completed" to customer
- Monthly: Generate invoices for completed uninvoiced work
- Weekly: Generate next week's recurring jobs
- When overdue: Send payment reminder emails
```

#### Agent: frontend-lead

**Task 3.3: Final UI polish**
- Responsive testing (phone, tablet, desktop)
- Loading states and error handling
- Empty states ("No jobs scheduled today")
- Print-friendly invoice view
- Quick-action buttons throughout (call customer, get directions, email)

---

### PHASE 4: Deploy + Data Import (Day 2, Afternoon)

#### Agent: deploy-ops

**Task 4.1: Deploy backend to Railway**
```
1. Create Railway project: outdoor-services-crm
2. Add PostgreSQL database
3. Add Redis (for Celery)
4. Set environment variables:
   - DJANGO_SECRET_KEY
   - DATABASE_URL (auto from Railway Postgres)
   - CELERY_BROKER_URL (auto from Railway Redis)
   - ALLOWED_HOSTS
   - CORS_ALLOWED_ORIGINS (Vercel URL)
   - EMAIL config (Resend API key or SMTP)
5. Deploy via git push
6. Run migrations
7. Create superuser
8. Seed service catalog data
```

**Task 4.2: Deploy frontend to Vercel**
```
1. Connect GitHub repo to Vercel
2. Set VITE_API_URL to Railway backend URL
3. Deploy
4. Verify all pages load
5. Test on mobile
```

**Task 4.3: Import uncle's existing data**
```
1. Get customer list from uncle (Excel/CSV from ClientTether export)
2. Map columns to our Customer model
3. Use existing import/preview/execute flow
4. Verify data imported correctly
5. Geocode addresses for route optimization
```

**Task 4.4: Create admin account + training doc**
```
1. Create uncle's admin account
2. Write simple "How to use" guide:
   - Adding customers
   - Scheduling jobs
   - Completing jobs
   - Creating estimates
   - Checking invoices
   - Running routes
   - Viewing reports
```

---

## Feature Comparison: ClientTether vs Our Build

| Feature | ClientTether ($300/mo) | Our Build (~$25/mo) |
|---------|----------------------|---------------------|
| Customer database | ✅ | ✅ |
| Contact management | ✅ | ✅ |
| Activity logging | ✅ | ✅ |
| Follow-up reminders | ✅ | ✅ (with business day math) |
| Route optimization | ❌ (not built-in) | ✅ (nearest-neighbor algorithm) |
| Job scheduling | ✅ | ✅ (calendar + list view) |
| Service catalog | ❌ | ✅ (seasonal, recurring, pricing) |
| Estimates/quotes | ✅ | ✅ |
| Invoice tracking | ✅ | ✅ |
| Email notifications | ✅ | ✅ |
| SMS automation | ✅ | ❌ (add later with Twilio ~$20/mo) |
| Review automation | ✅ | ❌ (Phase 2) |
| QuickBooks integration | ✅ | ❌ (Phase 2) |
| Reporting/analytics | ✅ | ✅ (Recharts dashboard) |
| Data import/export | ✅ | ✅ (Excel/CSV) |
| Maps/routing | ❌ | ✅ (Leaflet + optimization) |
| Mobile access | ✅ (app) | ✅ (responsive web) |
| Dark mode | ❌ | ✅ |
| Multi-user | ✅ (unlimited) | ✅ (unlimited) |
| Weather-aware scheduling | ❌ | ✅ (weather delay status) |
| Recurring jobs | ✅ | ✅ (auto-generation) |
| Custom branding | ❌ | ✅ (it's HIS system) |

**We win on:** Route optimization, maps, custom branding, dark mode, weather awareness, cost
**They win on:** SMS automation, review management, QuickBooks (all addable later)

---

## Monthly Cost Breakdown

| Service | Cost |
|---------|------|
| Railway (backend + DB + Redis) | ~$10/mo |
| Vercel (frontend) | Free |
| Resend (email, <100/day) | Free |
| Domain (optional) | ~$1/mo ($12/yr) |
| **Total** | **~$11/month** |
| vs ClientTether | $300/month |
| **Annual savings** | **$3,468/year** |

Add later if needed:
- Twilio SMS: ~$20/mo
- Custom domain: $12/yr
- Vercel Pro: $20/mo (if needed)

---

## GitHub Repo

**Name:** `kjhholt-alt/outdoor-services-crm`
**Base:** Fork of `kjhholt-alt/CRM`
**Deploy:** Railway (backend) + Vercel (frontend)

---

## Success Criteria

1. Uncle can log in, see his customers, and schedule jobs
2. Daily job list shows what needs to be done today
3. Route optimization plans the driving order
4. Completed jobs track revenue
5. Invoices show who owes what
6. Works on uncle's phone/tablet in the truck
7. Costs less than $25/month to run
8. Uncle says "this is better than ClientTether"

---

## Timeline

| Day | Phase | Agents | Output |
|-----|-------|--------|--------|
| Day 1 AM | Fork + Models + APIs | backend-lead, frontend-lead | New repo, all models, core APIs, rebranded UI |
| Day 1 PM | Business Logic + UI | backend-lead, frontend-lead | Recurring jobs, invoicing, calendar view, mobile view |
| Day 2 AM | Communication + Polish | backend-lead, frontend-lead | Email notifications, responsive testing, error handling |
| Day 2 PM | Deploy + Import | deploy-ops | Railway + Vercel live, data imported, uncle has login |

---

## Agent Prompt Template

When handing this to the king bot, use this format:

```
Build an outdoor services CRM for "All Around Town Outdoor Services" in Davenport, Iowa.

BASE: Fork the existing CRM at C:\Users\Kruz\Desktop\Projects\CRM (repo: kjhholt-alt/CRM)
NEW REPO: kjhholt-alt/outdoor-services-crm
LOCAL: C:\Users\Kruz\Desktop\Projects\outdoor-crm

The existing CRM has Django 5 + DRF backend and React 19 + Vite + Tailwind frontend.
It already has customer management, route optimization, activities, reminders, import/export.

ADD these features on top:
1. Service catalog (lawn care, landscaping, snow removal, cleanups — with seasonal windows and pricing)
2. Job/work order scheduling (status workflow: scheduled → in_progress → completed)
3. Recurring job auto-generation (weekly mowing, etc.)
4. Estimates/quotes (line items from service catalog, send to customer, convert to jobs)
5. Invoice tracking (generate from completed jobs, payment tracking, overdue alerts)
6. Dashboard redesign (today's jobs, revenue stats, outstanding invoices, weather awareness)
7. Calendar view for job scheduling
8. Mobile-optimized crew view (today's route, one-tap start/complete, next job with map link)
9. Email notifications (job completion, estimates, invoices, reminders)
10. Reports page (revenue by month/service/customer, Recharts)

BRANDING:
- Company: All Around Town Outdoor Services
- Location: Davenport, Iowa
- Colors: Forest green (#16a34a) primary, earth brown (#92400e), sky blue (#0ea5e9) accent
- Professional, clean, mobile-first

DEPLOY:
- Backend → Railway (PostgreSQL + Redis)
- Frontend → Vercel
- Target cost: <$25/month (replacing $300/month ClientTether)

REFERENCE: Full build plan at C:\Users\Kruz\Desktop\Projects\OUTDOOR-CRM-BUILD-PLAN.md
```
