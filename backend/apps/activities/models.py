from django.db import models
from django.contrib.auth.models import User


class ActivityType(models.Model):
    """Configurable activity types with icons and colors."""
    name = models.CharField(max_length=50, unique=True)  # Internal name
    display_name = models.CharField(max_length=100)      # User-facing name
    icon = models.CharField(max_length=50)               # Icon identifier
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    is_calendar_event = models.BooleanField(default=False)
    default_duration_minutes = models.PositiveIntegerField(default=30)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'display_name']

    def __str__(self):
        return self.display_name


class Activity(models.Model):
    """Activity log for customer interactions."""
    OUTCOME_CHOICES = [
        ('completed', 'Completed'),
        ('no_answer', 'No Answer'),
        ('left_message', 'Left Message'),
        ('callback_requested', 'Callback Requested'),
        ('not_interested', 'Not Interested'),
        ('interested', 'Interested'),
        ('follow_up_needed', 'Follow Up Needed'),
        ('other', 'Other'),
    ]

    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.CASCADE,
        related_name='activities'
    )
    activity_type = models.ForeignKey(
        ActivityType,
        on_delete=models.PROTECT,
        related_name='activities'
    )
    subject = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    outcome = models.CharField(
        max_length=20,
        choices=OUTCOME_CHOICES,
        default='completed'
    )
    activity_datetime = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)

    # Extensibility
    custom_fields = models.JSONField(default=dict, blank=True)

    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='activities'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-activity_datetime']
        verbose_name_plural = 'Activities'
        indexes = [
            models.Index(fields=['customer', '-activity_datetime']),
            models.Index(fields=['-activity_datetime']),
        ]

    def __str__(self):
        return f"{self.activity_type.display_name} with {self.customer.business_name}"

    def save(self, *args, **kwargs):
        # Set default duration from activity type if not specified
        if self.duration_minutes is None and self.activity_type:
            self.duration_minutes = self.activity_type.default_duration_minutes
        super().save(*args, **kwargs)
