# CRM System

A modern, mobile-optimized CRM system built with Django and React, inspired by Salesforce best practices.

## Features

- **Customer Management**: Search, sort, paginate, and manage customer records
- **Activity Logging**: Track phone calls, emails, meetings, text messages, cold calls, and card drops
- **Notes with History**: Add and view notes with full version history
- **Follow-up Reminders**: 30-business-day default reminders with snooze and complete options
- **Dashboard**: View overdue, today, this week, and 30-day upcoming tasks
- **Route Planning**: Optimize routes for visiting multiple customers (nearest neighbor algorithm)
- **Import/Export**: Import from Excel/CSV, export to Excel/CSV
- **Dark Mode**: Toggle between light and dark themes
- **iPad/Mobile Optimized**: 48px touch targets, responsive design

## Tech Stack

### Backend
- Django 4.2+
- Django REST Framework
- JWT Authentication (SimpleJWT)
- SQLite (development) / PostgreSQL (production ready)
- Celery + Redis (for scheduled email summaries)

### Frontend
- React 18 with TypeScript
- Vite build tool
- Tailwind CSS v4
- React Query for data fetching
- React Router for navigation
- Leaflet for maps
- Lucide icons

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 20+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Import initial data (customers from Excel)
python manage.py setup_initial_data --excel-file "../Customer_List_By_Region_CRM_Dropdowns.xlsx"

# Run server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Default Login

- **Username**: jlischer
- **Password**: crm2024!

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Get JWT tokens
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user
- `POST /api/auth/toggle-dark-mode/` - Toggle dark mode

### Customers
- `GET /api/customers/` - List customers (with search, filter, pagination)
- `POST /api/customers/` - Create customer
- `GET /api/customers/{id}/` - Get customer details
- `PUT /api/customers/{id}/` - Update customer
- `DELETE /api/customers/{id}/` - Soft delete customer
- `GET /api/customers/{id}/notes/` - Get customer notes
- `POST /api/customers/{id}/notes/` - Add note (auto-versions)
- `GET /api/customers/{id}/activities/` - Get customer activities
- `GET /api/customers/{id}/reminders/` - Get customer reminders

### Regions
- `GET /api/regions/` - List regions

### Activities
- `GET /api/activities/` - List activities
- `POST /api/activities/` - Log activity
- `GET /api/activities/types/` - Get activity types
- `GET /api/activities/recent/` - Get last 7 days
- `GET /api/activities/by_type/` - Get counts by type

### Reminders
- `GET /api/reminders/` - List reminders
- `POST /api/reminders/` - Create reminder
- `GET /api/reminders/overdue/` - Get overdue reminders
- `GET /api/reminders/today/` - Get today's reminders
- `GET /api/reminders/week/` - Get this week's reminders
- `GET /api/reminders/next_week/` - Get next week's reminders
- `GET /api/reminders/next_30_days/` - Get next 30 days
- `GET /api/reminders/dashboard_summary/` - Get counts summary
- `POST /api/reminders/{id}/complete/` - Mark complete
- `POST /api/reminders/{id}/snooze/` - Snooze reminder
- `POST /api/reminders/{id}/cancel/` - Cancel reminder

### Routes
- `GET /api/routes/` - List routes
- `GET /api/routes/{id}/` - Get route details
- `POST /api/routes/create_optimized/` - Create optimized route
- `POST /api/routes/{id}/complete_stop/` - Mark stop complete
- `POST /api/routes/{id}/skip_stop/` - Skip stop

### Import/Export
- `POST /api/import/preview/` - Preview import
- `POST /api/import/execute/` - Execute import
- `GET /api/import/export/customers/` - Export customers

## Project Structure

```
CRM/
├── backend/
│   ├── crm_project/          # Django settings
│   ├── apps/
│   │   ├── accounts/         # User auth + profiles
│   │   ├── customers/        # Customer CRUD
│   │   ├── activities/       # Activity logging
│   │   ├── reminders/        # Follow-up system
│   │   ├── routing/          # Route optimization
│   │   └── imports/          # Excel/CSV import
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/       # React components
│   │   ├── context/          # Auth context
│   │   ├── pages/            # Page components
│   │   └── types/            # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── Customer_List_By_Region_CRM_Dropdowns.xlsx
└── README.md
```

## Activity Types

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| Phone Call | phone | Blue | Inbound/outbound calls |
| Text Message | message-square | Green | SMS communications |
| Email | mail | Indigo | Email correspondence |
| Meeting | calendar | Orange | In-person meetings |
| Cold Call | phone-outgoing | Red | Prospecting calls |
| Card Drop | id-card | Purple | Left business card/brochure |

## Business Day Calculation

Reminders default to 30 business days (Monday-Friday). The system:
- Skips weekends when calculating reminder dates
- Supports custom reminder days (7, 14, 30, 60, 90)
- Allows snoozing by business days

## Environment Variables

### Backend (.env)
```
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
CELERY_BROKER_URL=redis://localhost:6379/0
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-password
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api
```

## License

Private - All rights reserved
