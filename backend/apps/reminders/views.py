from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from .models import Reminder
from .serializers import ReminderSerializer, ReminderCreateSerializer


class ReminderViewSet(viewsets.ModelViewSet):
    """API endpoint for reminders."""
    queryset = Reminder.objects.select_related(
        'customer', 'activity', 'created_by', 'completed_by'
    ).all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'status', 'priority']
    search_fields = ['title', 'description', 'customer__business_name']
    ordering_fields = ['reminder_date', 'reminder_time', 'priority', 'created_at']
    ordering = ['reminder_date', 'reminder_time']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ReminderCreateSerializer
        return ReminderSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by status (default to pending)
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue reminders."""
        today = timezone.now().date()
        reminders = self.get_queryset().filter(
            status='pending',
            reminder_date__lt=today
        )
        serializer = ReminderSerializer(reminders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get reminders due today."""
        today = timezone.now().date()
        reminders = self.get_queryset().filter(
            status='pending',
            reminder_date=today
        )
        serializer = ReminderSerializer(reminders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def week(self, request):
        """Get reminders due this week."""
        today = timezone.now().date()
        week_end = today + timedelta(days=(6 - today.weekday()))  # Sunday
        reminders = self.get_queryset().filter(
            status='pending',
            reminder_date__gte=today,
            reminder_date__lte=week_end
        )
        serializer = ReminderSerializer(reminders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def next_week(self, request):
        """Get reminders due next week."""
        today = timezone.now().date()
        next_monday = today + timedelta(days=(7 - today.weekday()))
        next_sunday = next_monday + timedelta(days=6)
        reminders = self.get_queryset().filter(
            status='pending',
            reminder_date__gte=next_monday,
            reminder_date__lte=next_sunday
        )
        serializer = ReminderSerializer(reminders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def next_30_days(self, request):
        """Get reminders due in the next 30 days."""
        today = timezone.now().date()
        end_date = today + timedelta(days=30)
        reminders = self.get_queryset().filter(
            status='pending',
            reminder_date__gte=today,
            reminder_date__lte=end_date
        )
        serializer = ReminderSerializer(reminders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard_summary(self, request):
        """Get summary counts for dashboard."""
        today = timezone.now().date()
        week_end = today + timedelta(days=(6 - today.weekday()))
        next_monday = today + timedelta(days=(7 - today.weekday()))
        next_sunday = next_monday + timedelta(days=6)
        end_30_days = today + timedelta(days=30)

        pending = self.get_queryset().filter(status='pending')

        return Response({
            'overdue': pending.filter(reminder_date__lt=today).count(),
            'today': pending.filter(reminder_date=today).count(),
            'this_week': pending.filter(
                reminder_date__gte=today,
                reminder_date__lte=week_end
            ).count(),
            'next_week': pending.filter(
                reminder_date__gte=next_monday,
                reminder_date__lte=next_sunday
            ).count(),
            'next_30_days': pending.filter(
                reminder_date__gte=today,
                reminder_date__lte=end_30_days
            ).count(),
            'total_pending': pending.count(),
        })

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a reminder as completed."""
        reminder = self.get_object()
        reminder.mark_complete(user=request.user)
        serializer = ReminderSerializer(reminder)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def snooze(self, request, pk=None):
        """Snooze a reminder."""
        reminder = self.get_object()
        days = int(request.data.get('days', 1))
        use_business_days = request.data.get('use_business_days', True)
        reminder.snooze(days=days, use_business_days=use_business_days)
        serializer = ReminderSerializer(reminder)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a reminder."""
        reminder = self.get_object()
        reminder.status = 'cancelled'
        reminder.save()
        serializer = ReminderSerializer(reminder)
        return Response(serializer.data)
