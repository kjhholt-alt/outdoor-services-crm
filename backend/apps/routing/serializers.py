from rest_framework import serializers
from .models import Route, RouteStop


class RouteStopSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.business_name', read_only=True)
    customer_address = serializers.CharField(source='customer.full_address', read_only=True)
    customer_phone = serializers.CharField(source='customer.main_phone', read_only=True)
    customer_latitude = serializers.DecimalField(
        source='customer.latitude', max_digits=10, decimal_places=7, read_only=True
    )
    customer_longitude = serializers.DecimalField(
        source='customer.longitude', max_digits=10, decimal_places=7, read_only=True
    )

    class Meta:
        model = RouteStop
        fields = [
            'id', 'customer', 'customer_name', 'customer_address', 'customer_phone',
            'customer_latitude', 'customer_longitude', 'stop_order', 'notes',
            'estimated_arrival', 'actual_arrival', 'estimated_duration_minutes',
            'distance_from_previous_miles', 'is_completed', 'completed_at',
            'skipped', 'skip_reason'
        ]


class RouteSerializer(serializers.ModelSerializer):
    stops = RouteStopSerializer(many=True, read_only=True)
    stop_count = serializers.IntegerField(read_only=True)
    completed_stop_count = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Route
        fields = [
            'id', 'name', 'date', 'notes', 'total_distance_miles',
            'estimated_duration_minutes', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'is_completed', 'completed_at',
            'stops', 'stop_count', 'completed_stop_count'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class RouteCreateSerializer(serializers.Serializer):
    """Serializer for creating an optimized route."""
    name = serializers.CharField(max_length=255)
    date = serializers.DateField()
    customer_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    optimize = serializers.BooleanField(default=True)
