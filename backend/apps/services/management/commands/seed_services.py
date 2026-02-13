from django.core.management.base import BaseCommand
from apps.services.models import ServiceCategory, Service


SEED_DATA = {
    "Lawn Care": {
        "icon": "leaf",
        "color": "#22c55e",
        "is_seasonal": True,
        "season_start": 4,
        "season_end": 10,
        "sort_order": 1,
        "services": [
            {"name": "Weekly Lawn Mowing", "price": 45, "type": "flat", "recurring": True, "frequency": "weekly", "duration": 45},
            {"name": "Bi-Weekly Lawn Mowing", "price": 55, "type": "flat", "recurring": True, "frequency": "biweekly", "duration": 45},
            {"name": "Lawn Edging & Trimming", "price": 30, "type": "flat", "recurring": True, "frequency": "weekly", "duration": 20},
            {"name": "Lawn Aeration", "price": 150, "type": "flat", "recurring": False, "frequency": "seasonal", "duration": 90},
            {"name": "Lawn Fertilization", "price": 75, "type": "flat", "recurring": False, "frequency": "seasonal", "duration": 30},
            {"name": "Overseeding", "price": 120, "type": "flat", "recurring": False, "frequency": "one_time", "duration": 60},
        ]
    },
    "Landscaping": {
        "icon": "trees",
        "color": "#16a34a",
        "is_seasonal": True,
        "season_start": 3,
        "season_end": 11,
        "sort_order": 2,
        "services": [
            {"name": "Mulch Installation", "price": 65, "type": "hourly", "recurring": False, "frequency": "seasonal", "duration": 120},
            {"name": "Bush/Hedge Trimming", "price": 50, "type": "hourly", "recurring": True, "frequency": "monthly", "duration": 60},
            {"name": "Tree Trimming", "price": 75, "type": "hourly", "recurring": False, "frequency": "one_time", "duration": 120},
            {"name": "Flower Bed Maintenance", "price": 45, "type": "hourly", "recurring": True, "frequency": "biweekly", "duration": 60},
            {"name": "Landscape Design & Install", "price": 0, "type": "custom", "recurring": False, "frequency": "one_time", "duration": 480},
        ]
    },
    "Snow Removal": {
        "icon": "snowflake",
        "color": "#3b82f6",
        "is_seasonal": True,
        "season_start": 11,
        "season_end": 3,
        "sort_order": 3,
        "services": [
            {"name": "Driveway Snow Plowing", "price": 50, "type": "flat", "recurring": False, "frequency": "one_time", "duration": 20},
            {"name": "Sidewalk Shoveling", "price": 30, "type": "flat", "recurring": False, "frequency": "one_time", "duration": 15},
            {"name": "Parking Lot Plowing", "price": 150, "type": "flat", "recurring": False, "frequency": "one_time", "duration": 60},
            {"name": "Salt/Sand Application", "price": 35, "type": "flat", "recurring": False, "frequency": "one_time", "duration": 15},
            {"name": "Seasonal Snow Contract", "price": 500, "type": "flat", "recurring": True, "frequency": "seasonal", "duration": 0},
        ]
    },
    "Cleanups": {
        "icon": "trash-2",
        "color": "#f59e0b",
        "is_seasonal": True,
        "season_start": 3,
        "season_end": 11,
        "sort_order": 4,
        "services": [
            {"name": "Spring Cleanup", "price": 200, "type": "flat", "recurring": False, "frequency": "seasonal", "duration": 180},
            {"name": "Fall Leaf Cleanup", "price": 175, "type": "flat", "recurring": False, "frequency": "seasonal", "duration": 150},
            {"name": "Gutter Cleaning", "price": 125, "type": "flat", "recurring": False, "frequency": "seasonal", "duration": 90},
            {"name": "Yard Debris Removal", "price": 60, "type": "hourly", "recurring": False, "frequency": "one_time", "duration": 120},
            {"name": "Storm Cleanup", "price": 75, "type": "hourly", "recurring": False, "frequency": "one_time", "duration": 120},
        ]
    },
    "Additional Services": {
        "icon": "wrench",
        "color": "#8b5cf6",
        "is_seasonal": False,
        "season_start": None,
        "season_end": None,
        "sort_order": 5,
        "services": [
            {"name": "Pressure Washing", "price": 150, "type": "flat", "recurring": False, "frequency": "one_time", "duration": 120},
            {"name": "Fence Repair", "price": 65, "type": "hourly", "recurring": False, "frequency": "one_time", "duration": 180},
            {"name": "Small Hauling/Dump Runs", "price": 100, "type": "flat", "recurring": False, "frequency": "one_time", "duration": 90},
        ]
    }
}


class Command(BaseCommand):
    help = 'Seed service categories and services for All Around Town Outdoor Services'

    def handle(self, *args, **options):
        created_categories = 0
        created_services = 0

        for cat_name, cat_data in SEED_DATA.items():
            category, created = ServiceCategory.objects.get_or_create(
                name=cat_name,
                defaults={
                    'icon': cat_data['icon'],
                    'color': cat_data['color'],
                    'is_seasonal': cat_data['is_seasonal'],
                    'season_start': cat_data.get('season_start'),
                    'season_end': cat_data.get('season_end'),
                    'sort_order': cat_data.get('sort_order', 0),
                }
            )
            if created:
                created_categories += 1

            for svc in cat_data['services']:
                _, svc_created = Service.objects.get_or_create(
                    category=category,
                    name=svc['name'],
                    defaults={
                        'default_price': svc['price'],
                        'price_type': svc['type'],
                        'is_recurring': svc['recurring'],
                        'recurring_frequency': svc['frequency'],
                        'estimated_duration_minutes': svc['duration'],
                    }
                )
                if svc_created:
                    created_services += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seeded {created_categories} categories, {created_services} services'
        ))
