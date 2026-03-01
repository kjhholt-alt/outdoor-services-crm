from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes as perm_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta
from .models import ServiceCategory, Service, Job, Estimate, Invoice
from .serializers import (
    ServiceCategorySerializer, ServiceSerializer,
    JobListSerializer, JobDetailSerializer, JobCreateUpdateSerializer,
    EstimateListSerializer, EstimateDetailSerializer, EstimateCreateUpdateSerializer,
    InvoiceListSerializer, InvoiceDetailSerializer, InvoiceCreateUpdateSerializer,
)


class ServiceCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer
    pagination_class = None

    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class ServiceViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Service.objects.filter(is_active=True).select_related('category')
    serializer_class = ServiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'price_type', 'is_recurring']
    search_fields = ['name']
    pagination_class = None


class JobViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Job.objects.select_related('customer', 'service', 'service__category')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'customer', 'service', 'assigned_to', 'is_invoiced']
    search_fields = ['customer__business_name', 'service__name', 'assigned_to']
    ordering_fields = ['scheduled_date', 'status', 'price']
    ordering = ['scheduled_date', 'scheduled_time']

    def get_serializer_class(self):
        if self.action == 'list':
            return JobListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return JobCreateUpdateSerializer
        return JobDetailSerializer

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's jobs"""
        today = timezone.now().date()
        jobs = self.get_queryset().filter(scheduled_date=today)
        serializer = JobListSerializer(jobs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def week(self, request):
        """Get this week's jobs"""
        today = timezone.now().date()
        week_end = today + timedelta(days=7)
        jobs = self.get_queryset().filter(
            scheduled_date__gte=today,
            scheduled_date__lt=week_end,
        )
        serializer = JobListSerializer(jobs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Mark job as in-progress"""
        job = self.get_object()
        job.status = 'in_progress'
        job.save()
        return Response(JobDetailSerializer(job).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark job as completed"""
        job = self.get_object()
        job.status = 'completed'
        job.completed_at = timezone.now()
        job.actual_duration = request.data.get('actual_duration', job.estimated_duration)
        job.completion_notes = request.data.get('notes', '')
        job.save()
        return Response(JobDetailSerializer(job).data)

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """Reschedule a job"""
        job = self.get_object()
        new_date = request.data.get('date')
        if not new_date:
            return Response({'error': 'date is required'}, status=status.HTTP_400_BAD_REQUEST)
        job.status = 'rescheduled'
        job.save()
        # Create new job for the new date
        new_job = Job.objects.create(
            customer=job.customer,
            service=job.service,
            scheduled_date=new_date,
            scheduled_time=request.data.get('time', job.scheduled_time),
            estimated_duration=job.estimated_duration,
            assigned_to=job.assigned_to,
            price=job.price,
            is_recurring=job.is_recurring,
            recurring_parent=job.recurring_parent or job,
            created_by=request.user,
        )
        return Response(JobDetailSerializer(new_job).data, status=status.HTTP_201_CREATED)


class EstimateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Estimate.objects.select_related('customer')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'customer']
    search_fields = ['title', 'customer__business_name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return EstimateListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return EstimateCreateUpdateSerializer
        return EstimateDetailSerializer

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept estimate and optionally convert to jobs"""
        estimate = self.get_object()
        estimate.status = 'accepted'
        estimate.responded_at = timezone.now()
        estimate.save()

        created_jobs = []
        if request.data.get('create_jobs', True):
            for item in estimate.line_items:
                service = Service.objects.filter(name=item.get('service')).first()
                if service:
                    job = Job.objects.create(
                        customer=estimate.customer,
                        service=service,
                        scheduled_date=request.data.get('start_date', timezone.now().date()),
                        estimated_duration=service.estimated_duration_minutes,
                        price=item.get('price', service.default_price),
                        is_recurring=service.is_recurring,
                        created_by=request.user,
                    )
                    created_jobs.append(job)
            estimate.converted_to_jobs = True
            estimate.save()

        return Response({
            'estimate': EstimateDetailSerializer(estimate).data,
            'jobs_created': len(created_jobs),
        })


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Invoice.objects.select_related('customer')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'customer']
    search_fields = ['invoice_number', 'customer__business_name']
    ordering = ['-issued_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return InvoiceCreateUpdateSerializer
        return InvoiceDetailSerializer

    @action(detail=False, methods=['get'])
    def outstanding(self, request):
        """Get unpaid invoices"""
        invoices = self.get_queryset().exclude(status__in=['paid', 'void'])
        serializer = InvoiceListSerializer(invoices, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue invoices"""
        today = timezone.now().date()
        invoices = self.get_queryset().filter(
            due_date__lt=today,
        ).exclude(status__in=['paid', 'void'])
        serializer = InvoiceListSerializer(invoices, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        """Record a payment on an invoice"""
        from decimal import Decimal, InvalidOperation
        invoice = self.get_object()
        amount = request.data.get('amount')
        if not amount:
            return Response({'error': 'amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            amount = Decimal(str(amount))
        except (InvalidOperation, ValueError):
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        invoice.amount_paid += amount
        if invoice.amount_paid >= invoice.total:
            invoice.status = 'paid'
            invoice.paid_date = timezone.now().date()
        else:
            invoice.status = 'partial'
        invoice.save()
        return Response(InvoiceDetailSerializer(invoice).data)


@api_view(['GET'])
@perm_classes([IsAuthenticated])
def dashboard_summary(request):
    """Dashboard summary with job counts, revenue, and outstanding invoices"""
    today = timezone.now().date()
    week_start = today
    week_end = today + timedelta(days=7)
    month_start = today.replace(day=1)

    # Today's jobs
    today_jobs = Job.objects.filter(scheduled_date=today)
    today_completed = today_jobs.filter(status='completed')
    today_revenue = today_completed.aggregate(total=Sum('price'))['total'] or 0

    # This week
    week_jobs = Job.objects.filter(scheduled_date__gte=week_start, scheduled_date__lt=week_end)
    week_completed = week_jobs.filter(status='completed')
    week_revenue = week_completed.aggregate(total=Sum('price'))['total'] or 0

    # This month
    month_jobs = Job.objects.filter(scheduled_date__gte=month_start, scheduled_date__lte=today)
    month_completed = month_jobs.filter(status='completed')
    month_revenue = month_completed.aggregate(total=Sum('price'))['total'] or 0

    # Outstanding invoices
    outstanding = Invoice.objects.exclude(status__in=['paid', 'void'])
    outstanding_total = outstanding.aggregate(
        total=Sum('total'), paid=Sum('amount_paid')
    )
    total_owed = (outstanding_total['total'] or 0) - (outstanding_total['paid'] or 0)
    overdue = outstanding.filter(due_date__lt=today)
    overdue_total = overdue.aggregate(
        total=Sum('total'), paid=Sum('amount_paid')
    )
    overdue_amount = (overdue_total['total'] or 0) - (overdue_total['paid'] or 0)

    # Monthly revenue (last 12 months)
    monthly_revenue = []
    for i in range(11, -1, -1):
        m_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        if m_start.month == 12:
            m_end = m_start.replace(year=m_start.year + 1, month=1)
        else:
            m_end = m_start.replace(month=m_start.month + 1)
        rev = Job.objects.filter(
            scheduled_date__gte=m_start, scheduled_date__lt=m_end, status='completed'
        ).aggregate(total=Sum('price'))['total'] or 0
        inv_rev = Invoice.objects.filter(
            issued_date__gte=m_start, issued_date__lt=m_end, status='paid'
        ).aggregate(total=Sum('total'))['total'] or 0
        monthly_revenue.append({
            'month': m_start.strftime('%b %Y'),
            'revenue': float(max(rev, inv_rev)),
        })

    return Response({
        'today': {
            'total_jobs': today_jobs.count(),
            'completed': today_completed.count(),
            'in_progress': today_jobs.filter(status='in_progress').count(),
            'scheduled': today_jobs.filter(status='scheduled').count(),
            'revenue': float(today_revenue),
        },
        'this_week': {
            'total_jobs': week_jobs.count(),
            'completed': week_completed.count(),
            'revenue': float(week_revenue),
        },
        'this_month': {
            'revenue': float(month_revenue),
            'jobs_completed': month_completed.count(),
        },
        'outstanding': {
            'invoices_count': outstanding.count(),
            'total_owed': float(total_owed),
            'overdue_count': overdue.count(),
            'overdue_amount': float(overdue_amount),
        },
        'monthly_revenue': monthly_revenue,
    })
