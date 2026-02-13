from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Region, Customer, Note
from .serializers import (
    RegionSerializer,
    CustomerListSerializer,
    CustomerDetailSerializer,
    CustomerCreateUpdateSerializer,
    NoteSerializer,
)


class RegionViewSet(viewsets.ModelViewSet):
    """API endpoint for regions."""
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name']
    ordering = ['name']
    pagination_class = None  # Return all regions without pagination


class CustomerViewSet(viewsets.ModelViewSet):
    """API endpoint for customers."""
    queryset = Customer.objects.filter(is_active=True).select_related('region', 'created_by')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['region', 'is_active', 'state', 'city']
    search_fields = ['business_name', 'primary_contact', 'main_email', 'main_phone', 'city']
    ordering_fields = ['business_name', 'city', 'state', 'last_call_date', 'next_call_date', 'created_at']
    ordering = ['business_name']

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CustomerCreateUpdateSerializer
        return CustomerDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Include inactive if requested
        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() == 'true':
            queryset = Customer.objects.select_related('region', 'created_by')

        # Filter by overdue calls
        overdue = self.request.query_params.get('overdue', None)
        if overdue == 'true':
            from django.utils import timezone
            queryset = queryset.filter(
                next_call_date__lt=timezone.now().date()
            )

        return queryset

    def destroy(self, request, *args, **kwargs):
        """Soft delete customers."""
        customer = self.get_object()
        customer.is_active = False
        customer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get', 'post'])
    def notes(self, request, pk=None):
        """Get or add notes for a customer."""
        customer = self.get_object()

        if request.method == 'GET':
            notes = customer.notes.all()
            serializer = NoteSerializer(notes, many=True)
            return Response(serializer.data)

        if request.method == 'POST':
            serializer = NoteSerializer(data=request.data)
            if serializer.is_valid():
                # Get current note to set as parent
                current_note = customer.notes.filter(is_current=True).first()
                serializer.save(
                    customer=customer,
                    created_by=request.user,
                    parent_note=current_note
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def activities(self, request, pk=None):
        """Get activities for a customer."""
        customer = self.get_object()
        from apps.activities.serializers import ActivitySerializer
        activities = customer.activities.all()
        serializer = ActivitySerializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def reminders(self, request, pk=None):
        """Get reminders for a customer."""
        customer = self.get_object()
        from apps.reminders.serializers import ReminderSerializer
        reminders = customer.reminders.filter(status='pending')
        serializer = ReminderSerializer(reminders, many=True)
        return Response(serializer.data)
