from django.db import models
from django.contrib.auth.models import User


class Region(models.Model):
    """Geographic region for organizing customers."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color for UI
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Customer(models.Model):
    """Core customer model for the CRM."""
    # Basic Information
    business_name = models.CharField(max_length=255, db_index=True)
    bill_to_address = models.TextField(blank=True)
    city = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)

    # Contact Information
    primary_contact = models.CharField(max_length=255, blank=True)
    main_email = models.CharField(max_length=255, blank=True)  # Changed from EmailField for flexibility
    main_phone = models.CharField(max_length=100, blank=True)
    secondary_phone = models.CharField(max_length=100, blank=True)
    fax = models.CharField(max_length=100, blank=True)

    # Business Details
    fleet_description = models.TextField(blank=True)
    region = models.ForeignKey(
        Region,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customers'
    )

    # Geolocation for routing
    latitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True
    )

    # Call tracking
    last_call_date = models.DateField(null=True, blank=True)
    next_call_date = models.DateField(null=True, blank=True)

    # Extensibility
    custom_fields = models.JSONField(default=dict, blank=True)

    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_customers'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['business_name']
        indexes = [
            models.Index(fields=['business_name']),
            models.Index(fields=['region', 'business_name']),
            models.Index(fields=['next_call_date']),
        ]

    def __str__(self):
        return self.business_name

    @property
    def full_address(self):
        """Return formatted full address."""
        parts = [self.bill_to_address]
        city_state_zip = ', '.join(filter(None, [self.city, self.state, self.zip_code]))
        if city_state_zip:
            parts.append(city_state_zip)
        return '\n'.join(filter(None, parts))


class Lead(models.Model):
    """Pre-customer leads for business development."""
    TYPE_CHOICES = [
        ('residential', 'Residential'),
        ('commercial', 'Commercial'),
        ('hoa', 'HOA'),
        ('municipal', 'Municipal'),
    ]
    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('interested', 'Interested'),
        ('quoted', 'Quoted'),
        ('converted', 'Converted'),
        ('not_interested', 'Not Interested'),
    ]
    SOURCE_CHOICES = [
        ('chamber_of_commerce', 'Chamber of Commerce'),
        ('new_llc', 'New LLC Filing'),
        ('building_permits', 'Building Permits'),
        ('google_maps', 'Google Maps'),
        ('referral', 'Referral'),
        ('municipal_rfp', 'Municipal RFP'),
        ('property_mgmt', 'Property Management'),
        ('cold_outreach', 'Cold Outreach'),
        ('news_announcement', 'News / Announcement'),
    ]

    business_name = models.CharField(max_length=255, db_index=True)
    contact_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=100, blank=True)
    email = models.CharField(max_length=255, blank=True)
    website = models.CharField(max_length=255, blank=True)
    address = models.CharField(max_length=500, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=50, blank=True, default='IA')
    zip_code = models.CharField(max_length=20, blank=True)
    type = models.CharField(max_length=15, choices=TYPE_CHOICES, default='commercial')
    category = models.CharField(max_length=255, blank=True)
    source = models.CharField(max_length=25, choices=SOURCE_CHOICES, default='cold_outreach')
    source_detail = models.TextField(blank=True)
    score = models.IntegerField(default=3, help_text='1-5 hot score')
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', db_index=True)
    services_needed = models.JSONField(default=list, blank=True)
    last_contacted = models.DateField(null=True, blank=True)
    converted_customer = models.ForeignKey(
        'Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='source_leads'
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-score', '-created_at']
        indexes = [
            models.Index(fields=['status', '-score']),
            models.Index(fields=['city', 'state']),
        ]

    def __str__(self):
        return f"{self.business_name} ({self.get_status_display()})"


class Note(models.Model):
    """Notes with version history for customers."""
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='notes'
    )
    content = models.TextField()
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='customer_notes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_current = models.BooleanField(default=True)
    parent_note = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revisions'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note for {self.customer.business_name} at {self.created_at}"

    def save(self, *args, **kwargs):
        # If this is a new note for a customer, mark previous current notes as not current
        if not self.pk and self.is_current:
            Note.objects.filter(
                customer=self.customer,
                is_current=True
            ).update(is_current=False)
        super().save(*args, **kwargs)
