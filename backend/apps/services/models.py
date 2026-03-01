from django.db import models
from django.contrib.auth.models import User
from apps.customers.models import Customer


class ServiceCategory(models.Model):
    """Groups of related services (Lawn Care, Snow Removal, etc.)"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='leaf')
    color = models.CharField(max_length=7, default='#22c55e')
    is_seasonal = models.BooleanField(default=False)
    season_start = models.IntegerField(null=True, blank=True, help_text='Month number (1-12)')
    season_end = models.IntegerField(null=True, blank=True, help_text='Month number (1-12)')
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name_plural = 'Service categories'

    def __str__(self):
        return self.name


class Service(models.Model):
    """Individual services offered"""
    PRICE_TYPE_CHOICES = [
        ('flat', 'Flat Rate'),
        ('hourly', 'Per Hour'),
        ('sqft', 'Per Sq Ft'),
        ('custom', 'Custom Quote'),
    ]
    FREQUENCY_CHOICES = [
        ('weekly', 'Weekly'),
        ('biweekly', 'Every 2 Weeks'),
        ('monthly', 'Monthly'),
        ('seasonal', 'Seasonal'),
        ('one_time', 'One Time'),
    ]

    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    default_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_type = models.CharField(max_length=10, choices=PRICE_TYPE_CHOICES, default='flat')
    estimated_duration_minutes = models.IntegerField(default=60)
    is_recurring = models.BooleanField(default=False)
    recurring_frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default='one_time')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class Job(models.Model):
    """A scheduled or completed service job"""
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
        ('weather_delay', 'Weather Delay'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='jobs')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='jobs')

    # Scheduling
    scheduled_date = models.DateField(db_index=True)
    scheduled_time = models.TimeField(null=True, blank=True)
    estimated_duration = models.IntegerField(default=60, help_text='Minutes')

    # Assignment
    assigned_to = models.CharField(max_length=200, blank=True)

    # Status
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='scheduled', db_index=True)

    # Completion
    actual_duration = models.IntegerField(null=True, blank=True, help_text='Minutes')
    completed_at = models.DateTimeField(null=True, blank=True)
    completion_notes = models.TextField(blank=True)

    # Billing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_invoiced = models.BooleanField(default=False)
    is_paid = models.BooleanField(default=False)

    # Recurring
    is_recurring = models.BooleanField(default=False)
    recurring_parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='recurrences')

    # Meta
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_date', 'scheduled_time']
        indexes = [
            models.Index(fields=['scheduled_date', 'status']),
            models.Index(fields=['customer', 'scheduled_date']),
        ]

    def __str__(self):
        return f"{self.service.name} - {self.customer.business_name} ({self.scheduled_date})"


class Estimate(models.Model):
    """Price quotes for potential work"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent to Customer'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='estimates')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    line_items = models.JSONField(default=list)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    valid_until = models.DateField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    converted_to_jobs = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.customer.business_name}"


class Invoice(models.Model):
    """Track what's owed and paid"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('partial', 'Partially Paid'),
        ('overdue', 'Overdue'),
        ('void', 'Void'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=20, unique=True, blank=True)
    jobs = models.ManyToManyField(Job, blank=True, related_name='invoices')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    issued_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issued_date']

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.customer.business_name}"

    @property
    def balance_due(self):
        return self.total - self.amount_paid

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            from django.utils import timezone
            year = timezone.now().year
            last = Invoice.objects.filter(
                invoice_number__startswith=f'INV-{year}-'
            ).order_by('-invoice_number').first()
            if last:
                try:
                    last_num = int(last.invoice_number.split('-')[-1])
                except (ValueError, IndexError):
                    last_num = 0
                self.invoice_number = f'INV-{year}-{last_num + 1:04d}'
            else:
                self.invoice_number = f'INV-{year}-0001'
        super().save(*args, **kwargs)
