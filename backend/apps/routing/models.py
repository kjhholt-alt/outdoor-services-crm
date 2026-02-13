from django.db import models
from django.contrib.auth.models import User


class Route(models.Model):
    """Saved route for visiting multiple customers."""
    name = models.CharField(max_length=255)
    date = models.DateField()
    notes = models.TextField(blank=True)

    # Route statistics
    total_distance_miles = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    estimated_duration_minutes = models.PositiveIntegerField(null=True, blank=True)

    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='routes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.name} - {self.date}"

    @property
    def stop_count(self):
        return self.stops.count()

    @property
    def completed_stop_count(self):
        return self.stops.filter(is_completed=True).count()


class RouteStop(models.Model):
    """Individual stop in a route."""
    route = models.ForeignKey(
        Route,
        on_delete=models.CASCADE,
        related_name='stops'
    )
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.CASCADE,
        related_name='route_stops'
    )
    stop_order = models.PositiveIntegerField()
    notes = models.TextField(blank=True)

    # Stop details
    estimated_arrival = models.TimeField(null=True, blank=True)
    actual_arrival = models.TimeField(null=True, blank=True)
    estimated_duration_minutes = models.PositiveIntegerField(default=30)
    distance_from_previous_miles = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    # Completion tracking
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    skipped = models.BooleanField(default=False)
    skip_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['route', 'stop_order']
        unique_together = [['route', 'stop_order']]

    def __str__(self):
        return f"Stop {self.stop_order}: {self.customer.business_name}"
