from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from .models import ActivityType, Activity
from .serializers import ActivityTypeSerializer, ActivitySerializer, ActivityCreateSerializer


class ActivityTypeViewSet(viewsets.ModelViewSet):
    """API endpoint for activity types."""
    queryset = ActivityType.objects.filter(is_active=True)
    serializer_class = ActivityTypeSerializer
    filter_backends = [filters.OrderingFilter]
    ordering = ['sort_order', 'display_name']
    pagination_class = None  # Return all types without pagination


class ActivityViewSet(viewsets.ModelViewSet):
    """API endpoint for activities."""
    queryset = Activity.objects.select_related(
        'customer', 'activity_type', 'created_by'
    ).all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'activity_type', 'outcome']
    search_fields = ['subject', 'notes', 'customer__business_name']
    ordering_fields = ['activity_datetime', 'created_at']
    ordering = ['-activity_datetime']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ActivityCreateSerializer
        return ActivitySerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)

        if start_date:
            queryset = queryset.filter(activity_datetime__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(activity_datetime__date__lte=end_date)

        return queryset

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get activities from the last 7 days."""
        week_ago = timezone.now() - timedelta(days=7)
        activities = self.get_queryset().filter(activity_datetime__gte=week_ago)
        serializer = ActivitySerializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get activity counts grouped by type."""
        from django.db.models import Count

        # Optional date range
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)

        queryset = Activity.objects.all()
        if start_date:
            queryset = queryset.filter(activity_datetime__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(activity_datetime__date__lte=end_date)

        counts = queryset.values(
            'activity_type__display_name',
            'activity_type__icon',
            'activity_type__color'
        ).annotate(count=Count('id')).order_by('-count')

        return Response(list(counts))
