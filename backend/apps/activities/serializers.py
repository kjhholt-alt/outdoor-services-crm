from rest_framework import serializers
from .models import ActivityType, Activity


class ActivityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityType
        fields = [
            'id', 'name', 'display_name', 'icon', 'color',
            'is_calendar_event', 'default_duration_minutes', 'is_active', 'sort_order'
        ]


class ActivitySerializer(serializers.ModelSerializer):
    activity_type_name = serializers.CharField(source='activity_type.display_name', read_only=True)
    activity_type_icon = serializers.CharField(source='activity_type.icon', read_only=True)
    activity_type_color = serializers.CharField(source='activity_type.color', read_only=True)
    customer_name = serializers.CharField(source='customer.business_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Activity
        fields = [
            'id', 'customer', 'customer_name', 'activity_type',
            'activity_type_name', 'activity_type_icon', 'activity_type_color',
            'subject', 'notes', 'outcome', 'activity_datetime', 'duration_minutes',
            'custom_fields', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class ActivityCreateSerializer(serializers.ModelSerializer):
    create_reminder = serializers.BooleanField(default=True, write_only=True)
    reminder_days = serializers.IntegerField(default=30, write_only=True)

    class Meta:
        model = Activity
        fields = [
            'id', 'customer', 'activity_type', 'subject', 'notes', 'outcome',
            'activity_datetime', 'duration_minutes', 'custom_fields',
            'create_reminder', 'reminder_days'
        ]

    def create(self, validated_data):
        create_reminder = validated_data.pop('create_reminder', True)
        reminder_days = validated_data.pop('reminder_days', 30)
        validated_data['created_by'] = self.context['request'].user

        activity = super().create(validated_data)

        # Update customer's last call date
        customer = activity.customer
        if activity.activity_datetime.date() > (customer.last_call_date or activity.activity_datetime.date()):
            customer.last_call_date = activity.activity_datetime.date()

        # Create follow-up reminder if requested
        if create_reminder:
            from apps.reminders.models import Reminder, add_business_days
            from django.utils import timezone

            reminder_date = add_business_days(timezone.now().date(), reminder_days)
            Reminder.objects.create(
                customer=customer,
                activity=activity,
                title=f"Follow up: {activity.activity_type.display_name}",
                description=f"Follow up on {activity.activity_type.display_name} from {activity.activity_datetime.strftime('%Y-%m-%d')}",
                reminder_date=reminder_date,
                created_by=self.context['request'].user
            )
            customer.next_call_date = reminder_date

        customer.save()
        return activity
