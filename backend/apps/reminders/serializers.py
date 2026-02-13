from rest_framework import serializers
from .models import Reminder


class ReminderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.business_name', read_only=True)
    customer_phone = serializers.CharField(source='customer.main_phone', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    is_today = serializers.BooleanField(read_only=True)

    class Meta:
        model = Reminder
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone', 'activity',
            'title', 'description', 'reminder_date', 'reminder_time',
            'priority', 'status', 'original_date', 'snooze_count',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'completed_at', 'completed_by', 'is_overdue', 'is_today'
        ]
        read_only_fields = [
            'created_by', 'created_at', 'updated_at',
            'completed_at', 'completed_by', 'original_date', 'snooze_count'
        ]


class ReminderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = [
            'id', 'customer', 'activity', 'title', 'description',
            'reminder_date', 'reminder_time', 'priority'
        ]

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
