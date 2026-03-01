# AATOS CRM - All Around Town Outdoor Services

A complete CRM for outdoor service businesses (lawn care, landscaping, snow removal, tree service). Manage customers, schedule jobs, send invoices, and track payments - all from your phone or desktop.

## Quick Start

**Live URL**: Set `VITE_API_URL` in Vercel to your Railway backend URL.

**Login**: Create a superuser via `python manage.py createsuperuser` or use the seeded demo account.

### How to Add Your First Customer and Create a Job

1. Log in and go to **Customers** > **New Customer**
2. Fill in name, phone, email, address
3. From the customer detail page, click **New Job**
4. Select the service type, date/time, and price
5. When the job is done, mark it **Complete** from the Jobs page
6. Click the invoice icon to generate an invoice from the completed job

## Features

- **Dashboard**: Today's jobs, revenue stats, overdue invoices, monthly revenue chart, weather
- **Customers**: Full CRUD with search, filter, notes, activity history, reminders
- **Jobs**: Schedule, assign, start/complete, calendar view (FullCalendar), photo capture
- **Invoices**: Create from jobs, PDF generation, mark as paid, outstanding/overdue views
- **Estimates**: Create quotes, accept to auto-generate jobs
- **Services**: 5 categories, 24 service types (lawn care, landscaping, snow, cleanups, additional)
- **Routes**: Plan optimized routes with nearest-neighbor algorithm
- **Reports**: Revenue trends, seasonal comparison, crew productivity, category breakdown
- **Reminders**: Priority-based follow-ups with snooze and business day logic
- **Import/Export**: CSV/Excel customer import with field mapping and preview
- **Settings**: Company info, tax rate, service type management
- **Global Search**: Ctrl+K to search across customers, jobs, invoices
- **Crew View**: Mobile-optimized daily job list for field crews
- **Dark Mode**: Toggle in sidebar
- **Demo Mode**: Preview with sample data when no backend is connected

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v3
- **Backend**: Django 5 + Django REST Framework + SimpleJWT
- **Database**: PostgreSQL (production) / SQLite (development)
- **Deploy**: Vercel (frontend) + Railway (backend)

## Development Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_services
python manage.py seed_demo_customers
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` in `frontend/.env` for local development.

## Environment Variables

### Backend (Railway)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | Django secret key |
| `DEBUG` | No | Set `False` in production |
| `FRONTEND_URL` | Yes | Vercel frontend URL for CORS |
| `EMAIL_HOST_USER` | No | SMTP email (for invoice sending) |
| `EMAIL_HOST_PASSWORD` | No | SMTP password |

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Railway backend URL |

## License

Private - All rights reserved. Built for All Around Town Outdoor Services, Davenport, Iowa.
