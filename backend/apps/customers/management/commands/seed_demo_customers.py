"""Seed realistic demo customers in the Davenport, Iowa area with jobs and invoices."""
from datetime import date, time, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone as tz
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
    # --- 7 additional customers to reach 15 total ---
    {"business_name": "Moline Auto Group", "primary_contact": "Greg Sanders",
     "bill_to_address": "5200 John Deere Rd", "city": "Moline", "state": "IL", "zip_code": "61265",
     "main_phone": "(309) 555-0147", "main_email": "gsanders@molineauto.com",
     "latitude": Decimal("41.4697"), "longitude": Decimal("-90.5153")},
    {"business_name": "Valley View Apartments", "primary_contact": "Diane Kowalski",
     "bill_to_address": "3800 Eastern Ave", "city": "Davenport", "state": "IA", "zip_code": "52807",
     "main_phone": "(563) 555-0263", "main_email": "dkowalski@valleyviewapts.com",
     "latitude": Decimal("41.5580"), "longitude": Decimal("-90.5340")},
    {"business_name": "Rock Island Brewing Co", "primary_contact": "Jake Morrison",
     "bill_to_address": "1815 2nd Ave", "city": "Rock Island", "state": "IL", "zip_code": "61201",
     "main_phone": "(309) 555-0418", "main_email": "jake@ribrewingco.com",
     "latitude": Decimal("41.5092"), "longitude": Decimal("-90.5716")},
    {"business_name": "Davenport Pediatrics", "primary_contact": "Dr. Rachel Kim",
     "bill_to_address": "1520 E Rusholme St", "city": "Davenport", "state": "IA", "zip_code": "52803",
     "main_phone": "(563) 555-0592", "main_email": "rkim@davenportpeds.com",
     "latitude": Decimal("41.5350"), "longitude": Decimal("-90.5610")},
    {"business_name": "Midwest Storage Solutions", "primary_contact": "Tom Wheeler",
     "bill_to_address": "7100 N Brady St", "city": "Davenport", "state": "IA", "zip_code": "52806",
     "main_phone": "(563) 555-0776", "main_email": "tom@midweststorage.com",
     "latitude": Decimal("41.5720"), "longitude": Decimal("-90.5550")},
    {"business_name": "Johnson Family Farm", "primary_contact": "Bill Johnson",
     "bill_to_address": "12400 N Hickory Grove Rd", "city": "Davenport", "state": "IA", "zip_code": "52804",
     "main_phone": "(563) 555-0834", "main_email": "bjohnson@jffarm.com",
     "latitude": Decimal("41.5890"), "longitude": Decimal("-90.6120")},
    {"business_name": "LeClaire Veterinary Clinic", "primary_contact": "Dr. Sarah Bennett",
     "bill_to_address": "210 N Cody Rd", "city": "LeClaire", "state": "IA", "zip_code": "52753",
     "main_phone": "(563) 555-0901", "main_email": "sbennett@leclairevet.com",
     "latitude": Decimal("41.5983"), "longitude": Decimal("-90.3465")},
]


class Command(BaseCommand):
    help = "Seed 15 demo customers with 30+ jobs, 10 invoices, and 3 estimates"

    def handle(self, *args, **options):
        user = User.objects.filter(is_superuser=True).first()
        if not user:
            user = User.objects.first()

        # Ensure service categories and services exist
        cat_lawn, _ = ServiceCategory.objects.get_or_create(
            name="Lawn Care", defaults={"icon": "leaf", "color": "#22c55e", "is_seasonal": True,
                                         "season_start": 4, "season_end": 10})
        svc_mow, _ = Service.objects.get_or_create(
            category=cat_lawn, name="Weekly Mowing",
            defaults={"default_price": Decimal("45.00"), "price_type": "flat",
                       "estimated_duration_minutes": 45, "is_recurring": True,
                       "recurring_frequency": "weekly"})
        svc_trim, _ = Service.objects.get_or_create(
            category=cat_lawn, name="Hedge Trimming",
            defaults={"default_price": Decimal("85.00"), "price_type": "flat",
                       "estimated_duration_minutes": 60, "is_recurring": False,
                       "recurring_frequency": "one_time"})
        svc_cleanup, _ = Service.objects.get_or_create(
            category=cat_lawn, name="Spring Cleanup",
            defaults={"default_price": Decimal("175.00"), "price_type": "flat",
                       "estimated_duration_minutes": 120, "is_recurring": False,
                       "recurring_frequency": "one_time"})

        cat_snow, _ = ServiceCategory.objects.get_or_create(
            name="Snow Removal", defaults={"icon": "snowflake", "color": "#38bdf8",
                                            "is_seasonal": True, "season_start": 11, "season_end": 3})
        svc_snow, _ = Service.objects.get_or_create(
            category=cat_snow, name="Parking Lot Plowing",
            defaults={"default_price": Decimal("150.00"), "price_type": "flat",
                       "estimated_duration_minutes": 90, "is_recurring": False,
                       "recurring_frequency": "one_time"})
        svc_salt, _ = Service.objects.get_or_create(
            category=cat_snow, name="Sidewalk Salting",
            defaults={"default_price": Decimal("65.00"), "price_type": "flat",
                       "estimated_duration_minutes": 30, "is_recurring": False,
                       "recurring_frequency": "one_time"})

        cat_tree, _ = ServiceCategory.objects.get_or_create(
            name="Tree Service", defaults={"icon": "tree-pine", "color": "#a3e635",
                                            "is_seasonal": False})
        svc_tree, _ = Service.objects.get_or_create(
            category=cat_tree, name="Tree Trimming",
            defaults={"default_price": Decimal("250.00"), "price_type": "flat",
                       "estimated_duration_minutes": 180, "is_recurring": False,
                       "recurring_frequency": "one_time"})

        all_services = [svc_mow, svc_trim, svc_cleanup, svc_snow, svc_salt, svc_tree]
        crew = ["John", "Mike", "Carlos"]
        today = date.today()
        job_count = 0
        inv_count = 0

        for i, cdata in enumerate(CUSTOMERS):
            cust, created = Customer.objects.get_or_create(
                business_name=cdata["business_name"],
                defaults={**cdata, "created_by": user})
            label = "Created" if created else "Exists"
            self.stdout.write(f"  {label}: {cust.business_name}")

            if not created:
                continue

            # Create 2-3 jobs per customer (~30+ total across 15 customers)
            num_jobs = 2 if i % 3 == 0 else 3 if i % 3 == 1 else 2
            for j in range(num_jobs):
                svc = all_services[(i + j) % len(all_services)]
                # Spread jobs: some past (completed), some today, some future
                day_offset = -14 + (i * 2) + (j * 3)
                sched = today + timedelta(days=day_offset)
                if day_offset < -3:
                    status_choice = "completed"
                elif day_offset < 0:
                    status_choice = "completed" if j == 0 else "in_progress"
                elif day_offset == 0:
                    status_choice = "scheduled"
                else:
                    status_choice = "scheduled"

                job = Job.objects.create(
                    customer=cust, service=svc,
                    scheduled_date=sched,
                    scheduled_time=time(7 + (j * 2), 0 if j % 2 == 0 else 30),
                    estimated_duration=svc.estimated_duration_minutes,
                    assigned_to=crew[(i + j) % len(crew)],
                    status=status_choice,
                    price=svc.default_price + Decimal(i * 5),
                    is_recurring=svc.is_recurring,
                    created_by=user)
                if status_choice == "completed":
                    job.completed_at = tz.make_aware(
                        tz.datetime(sched.year, sched.month, sched.day, 14, 0))
                    job.actual_duration = svc.estimated_duration_minutes
                    job.save()
                job_count += 1

            # Create invoices for 10 customers (every customer except indices 2, 5, 8, 11, 14)
            if i % 3 != 2 and inv_count < 10:
                inv_count += 1
                inv_statuses = ["sent", "paid", "paid", "overdue", "partial",
                                "paid", "sent", "draft", "paid", "overdue"]
                inv_status = inv_statuses[inv_count - 1]
                base_total = Decimal("195.00") + Decimal(i * 15)
                tax = (base_total * Decimal("0.07")).quantize(Decimal("0.01"))
                total = base_total + tax
                if inv_status == "paid":
                    paid = total
                elif inv_status == "partial":
                    paid = Decimal("50.00")
                else:
                    paid = Decimal("0")
                Invoice.objects.create(
                    customer=cust,
                    invoice_number=f"INV-2026-{inv_count:04d}",
                    subtotal=base_total,
                    tax_rate=Decimal("7.00"),
                    tax_amount=tax,
                    total=total,
                    amount_paid=paid,
                    status=inv_status,
                    issued_date=today - timedelta(days=21 - i),
                    due_date=today + timedelta(days=9 + i) if inv_status != "overdue" else today - timedelta(days=5))

        # Create 3 sample estimates
        est_customers = list(Customer.objects.all()[:3])
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

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(CUSTOMERS)} demo customers, {job_count} jobs, "
            f"{inv_count} invoices & 3 estimates"
        ))
