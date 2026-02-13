from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


def add_business_days(start_date, num_days):
    """Add business days (Mon-Fri) to a date."""
    current_date = start_date
    days_added = 0
    while days_added < num_days:
        current_date += timedelta(days=1)
        if current_date.weekday() < 5:  # Monday = 0, Friday = 4
            days_added += 1
    return current_date


def get_default_reminder_date():
    """Return date 30 business days from today."""
    return add_business_days(timezone.now().date(), 30)


class Reminder(models.Model):
    """Follow-up reminders for customers."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('snoozed', 'Snoozed'),
        ('cancelled', 'Cancelled'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.CASCADE,
        related_name='reminders'
    )
    activity = models.ForeignKey(
        'activities.Activity',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reminders'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    reminder_date = models.DateField(default=get_default_reminder_date)
    reminder_time = models.TimeField(null=True, blank=True)
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    # Snooze tracking
    original_date = models.DateField(null=True, blank=True)
    snooze_count = models.PositiveIntegerField(default=0)

    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_reminders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_reminders'
    )

    class Meta:
        ordering = ['reminder_date', 'reminder_time']
        indexes = [
            models.Index(fields=['status', 'reminder_date']),
            models.Index(fields=['customer', 'status']),
        ]

    def __str__(self):
        return f"{self.title} - {self.customer.business_name} ({self.reminder_date})"

    @property
    def is_overdue(self):
        """Check if reminder is past due."""
        if self.status != 'pending':
            return False
        return self.reminder_date < timezone.now().date()

    @property
    def is_today(self):
        """Check if reminder is due today."""
        return self.reminder_date == timezone.now().date() and self.status == 'pending'

    def mark_complete(self, user=None):
        """Mark reminder as completed."""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.completed_by = user
        self.save()

    def snooze(self, days=1, use_business_days=True):
        """Snooze reminder by specified days."""
        if self.original_date is None:
            self.original_date = self.reminder_date

        if use_business_days:
            self.reminder_date = add_business_days(timezone.now().date(), days)
        else:
            self.reminder_date = timezone.now().date() + timedelta(days=days)

        self.snooze_count += 1
        self.status = 'pending'
        self.save()
