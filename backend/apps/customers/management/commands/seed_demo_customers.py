"""Seed realistic demo customers in the Davenport, Iowa area with jobs and invoices."""
from datetime import date, time, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.customers.models import Customer
from apps.services.models import ServiceCategory, Service, Job, Invoice, Estimate


CUSTOMERS = [
    {"business_name": "Riverside Property Management", "primary_contact": "Karen Mitchell",
     "bill_to_address": "1847 River Dr", "city": "Davenport", "state": "IA", "zip_code": "52803",
     "main_phone": "(563) 555-0142", "main_email": "karen@riversidepm.com",
     "latitude": Decimal("41.5236"), "longitude": Decimal("-90.5776")},
    {"business_name": "QC Family Dental", "primary_contact": "Dr. James Harmon",
     "bill_to_address": "3220 Brady St", "city": "Davenport", "state": "IA", "zip_code": "52806",
     "main_phone": "(563) 555-0298", "main_email": "office@qcfamilydental.com",
     "latitude": Decimal("41.5440"), "longitude": Decimal("-90.5590")},
    {"business_name": "Bettendorf Senior Living", "primary_contact": "Linda Torres",
     "bill_to_address": "2100 Middle Rd", "city": "Bettendorf", "state": "IA", "zip_code": "52722",
     "main_phone": "(563) 555-0374", "main_email": "ltorres@bettendorfsl.com",
     "latitude": Decimal("41.5406"), "longitude": Decimal("-90.4993")},
    {"business_name": "Heritage Church", "primary_contact": "Pastor Steve Allen",
     "bill_to_address": "901 W Kimberly Rd", "city": "Davenport", "state": "IA", "zip_code": "52806",
     "main_phone": "(563) 555-0511", "main_email": "office@heritagechurchqc.org",
     "latitude": Decimal("41.5525"), "longitude": Decimal("-90.6050")},
    {"business_name": "Hawkeye Convenience #12", "primary_contact": "Raj Patel",
     "bill_to_address": "4410 N Division St", "city": "Davenport", "state": "IA", "zip_code": "52806",
     "main_phone": "(563) 555-0689", "main_email": "raj.patel@hawkeyeconv.com",
     "latitude": Decimal("41.5630"), "longitude": Decimal("-90.5880")},
    {"business_name": "Quad City Montessori", "primary_contact": "Amy Chen",
     "bill_to_address": "1730 W 12th St", "city": "Davenport", "state": "IA", "zip_code": "52804",
     "main_phone": "(563) 555-0733", "main_email": "achen@qcmontessori.edu",
     "latitude": Decimal("41.5310"), "longitude": Decimal("-90.5940")},
    {"business_name": "Thompson Residence", "primary_contact": "Mark Thompson",
     "bill_to_address": "2456 E 38th St", "city": "Davenport", "state": "IA", "zip_code": "52807",
     "main_phone": "(563) 555-0821", "main_email": "mthompson22@gmail.com",
     "latitude": Decimal("41.5670"), "longitude": Decimal("-90.5430")},
    {"business_name": "Depot District Lofts HOA", "primary_contact": "Susan Wright",
     "bill_to_address": "400 Pershing Ave", "city": "Davenport", "state": "IA", "zip_code": "52801",
     "main_phone": "(563) 555-0955", "main_email": "hoa@depotlofts.com",
     "latitude": Decimal("41.5190"), "longitude": Decimal("-90.5780")},
]


class Command(BaseCommand):
    help = "Seed demo customers with jobs and invoices for the Davenport, IA area"

    def handle(self, *args, **options):
        user = User.objects.filter(is_superuser=True).first()
        if not user:
            user = User.objects.first()

        # Ensure at least one service category + service exist
        cat, _ = ServiceCategory.objects.get_or_create(
            name="Lawn Care", defaults={"icon": "leaf", "color": "#22c55e", "is_seasonal": True,
                                         "season_start": 4, "season_end": 10})
        svc_mow, _ = Service.objects.get_or_create(
            category=cat, name="Weekly Mowing",
            defaults={"default_price": Decimal("45.00"), "price_type": "flat",
                       "estimated_duration_minutes": 45, "is_recurring": True,
                       "recurring_frequency": "weekly"})
        svc_trim, _ = Service.objects.get_or_create(
            category=cat, name="Hedge Trimming",
            defaults={"default_price": Decimal("85.00"), "price_type": "flat",
                       "estimated_duration_minutes": 60, "is_recurring": False,
                       "recurring_frequency": "one_time"})

        cat2, _ = ServiceCategory.objects.get_or_create(
            name="Snow Removal", defaults={"icon": "snowflake", "color": "#38bdf8",
                                            "is_seasonal": True, "season_start": 11, "season_end": 3})
        svc_snow, _ = Service.objects.get_or_create(
            category=cat2, name="Parking Lot Plowing",
            defaults={"default_price": Decimal("150.00"), "price_type": "flat",
                       "estimated_duration_minutes": 90, "is_recurring": False,
                       "recurring_frequency": "one_time"})

        today = date.today()
        inv_counter = Invoice.objects.count() + 1

        for i, cdata in enumerate(CUSTOMERS):
            cust, created = Customer.objects.get_or_create(
                business_name=cdata["business_name"],
                defaults={**cdata, "created_by": user})
            label = "Created" if created else "Exists"
            self.stdout.write(f"  {label}: {cust.business_name}")

            if not created:
                continue  # don't duplicate jobs on re-run

            # Create 1-3 jobs per customer
            services = [svc_mow, svc_trim, svc_snow]
            for j in range(min(i % 3 + 1, 3)):
                svc = services[j % len(services)]
                sched = today + timedelta(days=(i * 2 + j))
                status_choice = ["scheduled", "completed", "in_progress"][j % 3]
                job = Job.objects.create(
                    customer=cust, service=svc,
                    scheduled_date=sched,
                    scheduled_time=time(8 + j, 0),
                    estimated_duration=svc.estimated_duration_minutes,
                    assigned_to="John" if j % 2 == 0 else "Mike",
                    status=status_choice,
                    price=svc.default_price,
                    is_recurring=svc.is_recurring,
                    created_by=user)
                if status_choice == "completed":
                    job.completed_at = sched
                    job.actual_duration = svc.estimated_duration_minutes
                    job.save()

            # Create an invoice for every other customer
            if i % 2 == 0:
                inv_num = f"INV-{2026:04d}-{inv_counter:04d}"
                inv_counter += 1
                inv_status = ["sent", "paid", "overdue", "partial"][i % 4]
                total = Decimal("195.00") + Decimal(i * 10)
                paid = total if inv_status == "paid" else (Decimal("50.00") if inv_status == "partial" else Decimal("0"))
                Invoice.objects.create(
                    customer=cust, invoice_number=inv_num,
                    subtotal=total, total=total, amount_paid=paid,
                    status=inv_status,
                    issued_date=today - timedelta(days=14),
                    due_date=today + timedelta(days=16) if inv_status != "overdue" else today - timedelta(days=5))

        # Create sample estimates
        est_customers = Customer.objects.all()[:3]
        est_data = [
            {"title": "Full Landscape Renovation", "line_items": [
                {"service": "Landscape Design", "price": 500, "notes": "Custom design"},
                {"service": "Plant Material", "price": 1200, "notes": "12 shrubs, 24 perennials"},
                {"service": "Installation", "price": 1800, "notes": "3-day install"},
            ], "total": Decimal("3500"), "status": "sent"},
            {"title": "Annual Maintenance Contract", "line_items": [
                {"service": "Weekly Mowing (Apr-Oct)", "price": 1260, "notes": "28 weeks @ $45"},
                {"service": "Fertilization (5-step)", "price": 375, "notes": "5 applications"},
                {"service": "Spring/Fall Cleanup", "price": 375, "notes": "2 cleanups"},
            ], "total": Decimal("2010"), "status": "accepted"},
            {"title": "Parking Lot Snow Removal", "line_items": [
                {"service": "Plowing per event", "price": 150, "notes": "Est. 15 events"},
                {"service": "Salt application", "price": 75, "notes": "Per event"},
            ], "total": Decimal("3375"), "status": "draft"},
        ]
        for i, est in enumerate(est_data):
            if i < len(est_customers):
                Estimate.objects.get_or_create(
                    customer=est_customers[i], title=est["title"],
                    defaults={
                        "line_items": est["line_items"], "total": est["total"],
                        "status": est["status"],
                        "valid_until": today + timedelta(days=30),
                        "created_by": user,
                    })

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(CUSTOMERS)} demo customers with jobs, invoices & estimates"))
