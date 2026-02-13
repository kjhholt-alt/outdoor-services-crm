from django.contrib import admin
from .models import ServiceCategory, Service, Job, Estimate, Invoice


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'color', 'is_seasonal', 'is_active', 'sort_order']
    list_filter = ['is_seasonal', 'is_active']


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'default_price', 'price_type', 'is_recurring', 'is_active']
    list_filter = ['category', 'price_type', 'is_recurring', 'is_active']
    search_fields = ['name']


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['service', 'customer', 'scheduled_date', 'status', 'price', 'assigned_to']
    list_filter = ['status', 'scheduled_date', 'service__category']
    search_fields = ['customer__business_name', 'service__name']
    date_hierarchy = 'scheduled_date'


@admin.register(Estimate)
class EstimateAdmin(admin.ModelAdmin):
    list_display = ['title', 'customer', 'total', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['title', 'customer__business_name']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer', 'total', 'amount_paid', 'status', 'due_date']
    list_filter = ['status']
    search_fields = ['invoice_number', 'customer__business_name']
