from rest_framework import serializers
from .models import Region, Customer, Note


class RegionSerializer(serializers.ModelSerializer):
    customer_count = serializers.SerializerMethodField()

    class Meta:
        model = Region
        fields = ['id', 'name', 'description', 'color', 'is_active', 'customer_count']

    def get_customer_count(self, obj):
        return obj.customers.filter(is_active=True).count()


class NoteSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Note
        fields = [
            'id', 'content', 'created_by', 'created_by_name',
            'created_at', 'is_current', 'parent_note'
        ]
        read_only_fields = ['created_by', 'created_at', 'is_current']


class CustomerListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for customer list views."""
    region_name = serializers.CharField(source='region.name', read_only=True)
    current_note = serializers.SerializerMethodField()
    pending_reminders_count = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            'id', 'business_name', 'city', 'state', 'primary_contact',
            'main_phone', 'main_email', 'region', 'region_name',
            'last_call_date', 'next_call_date', 'current_note',
            'pending_reminders_count', 'is_active'
        ]

    def get_current_note(self, obj):
        note = obj.notes.filter(is_current=True).first()
        if note:
            return {
                'id': note.id,
                'content': note.content[:200] + '...' if len(note.content) > 200 else note.content,
                'created_at': note.created_at
            }
        return None

    def get_pending_reminders_count(self, obj):
        return obj.reminders.filter(status='pending').count()


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Full serializer for customer detail views."""
    region_name = serializers.CharField(source='region.name', read_only=True)
    notes = NoteSerializer(many=True, read_only=True)
    current_note = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    activity_count = serializers.SerializerMethodField()
    pending_reminders_count = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            'id', 'business_name', 'bill_to_address', 'city', 'state', 'zip_code',
            'primary_contact', 'main_email', 'main_phone', 'secondary_phone', 'fax',
            'fleet_description', 'region', 'region_name',
            'latitude', 'longitude',
            'last_call_date', 'next_call_date',
            'custom_fields', 'notes', 'current_note',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'is_active', 'activity_count', 'pending_reminders_count'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def get_current_note(self, obj):
        note = obj.notes.filter(is_current=True).first()
        if note:
            return NoteSerializer(note).data
        return None

    def get_activity_count(self, obj):
        return obj.activities.count()

    def get_pending_reminders_count(self, obj):
        return obj.reminders.filter(status='pending').count()


class CustomerCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating customers."""

    class Meta:
        model = Customer
        fields = [
            'id', 'business_name', 'bill_to_address', 'city', 'state', 'zip_code',
            'primary_contact', 'main_email', 'main_phone', 'secondary_phone', 'fax',
            'fleet_description', 'region',
            'latitude', 'longitude',
            'last_call_date', 'next_call_date',
            'custom_fields', 'is_active'
        ]

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
