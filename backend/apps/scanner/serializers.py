from rest_framework import serializers
from .models import ScanJob, ScanResult


class ScanResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanResult
        fields = [
            'id', 'city', 'state', 'keyword', 'snippet',
            'source_url', 'page_title', 'meeting_date',
            'document_type', 'found_at',
        ]


class ScanJobSerializer(serializers.ModelSerializer):
    results = ScanResultSerializer(many=True, read_only=True)

    class Meta:
        model = ScanJob
        fields = [
            'id', 'started_at', 'completed_at', 'status',
            'cities_scanned', 'total_results', 'error_message',
            'results',
        ]


class ScanJobListSerializer(serializers.ModelSerializer):
    """Lighter serializer for history list (no nested results)."""
    class Meta:
        model = ScanJob
        fields = [
            'id', 'started_at', 'completed_at', 'status',
            'cities_scanned', 'total_results', 'error_message',
        ]


class TriggerScanSerializer(serializers.Serializer):
    cities = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),
        min_length=1,
        help_text='List of {city, state} objects to scan',
    )

    def validate_cities(self, value):
        for item in value:
            if 'city' not in item or 'state' not in item:
                raise serializers.ValidationError(
                    'Each city must have "city" and "state" fields.'
                )
        return value
