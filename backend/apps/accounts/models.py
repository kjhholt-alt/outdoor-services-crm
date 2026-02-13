from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """Extended user profile with CRM preferences."""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )

    # Display preferences
    dark_mode = models.BooleanField(default=False)
    default_region = models.ForeignKey(
        'customers.Region',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    items_per_page = models.PositiveIntegerField(default=25)

    # Email preferences
    receive_weekly_summary = models.BooleanField(default=True)
    weekly_summary_email = models.EmailField(blank=True)  # Alternate email for summaries
    weekly_summary_day = models.PositiveSmallIntegerField(default=4)  # 0=Mon, 4=Fri
    weekly_summary_time = models.TimeField(default='16:00')  # 4 PM

    # Notification preferences
    reminder_notifications = models.BooleanField(default=True)
    overdue_notifications = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.username}"

    @property
    def summary_email(self):
        """Get the email to send summaries to."""
        return self.weekly_summary_email or self.user.email


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile when a new User is created."""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the UserProfile when the User is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()
