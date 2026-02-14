import threading

from django.db.models import Count, Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import ScanJob, ScanResult
from .serializers import (
    ScanJobSerializer,
    ScanJobListSerializer,
    ScanResultSerializer,
    TriggerScanSerializer,
)
from .scraper import run_scan


@api_view(['POST'])
def trigger_scan(request):
    """Start a new scan job. Runs in a background thread."""
    serializer = TriggerScanSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    cities = serializer.validated_data['cities']

    job = ScanJob.objects.create()

    # Run scan in background thread
    thread = threading.Thread(
        target=run_scan,
        args=(job, cities),
        daemon=True,
    )
    thread.start()

    return Response(
        ScanJobSerializer(job).data,
        status=status.HTTP_202_ACCEPTED,
    )


@api_view(['GET'])
def scan_status(request, job_id):
    """Get status and results of a scan job."""
    try:
        job = ScanJob.objects.get(pk=job_id)
    except ScanJob.DoesNotExist:
        return Response(
            {'error': 'Scan job not found'},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response(ScanJobSerializer(job).data)


@api_view(['GET'])
def scan_results(request):
    """Get all scan results with optional filters."""
    qs = ScanResult.objects.all()

    # Filters
    city = request.query_params.get('city')
    if city:
        qs = qs.filter(city__iexact=city)

    state_param = request.query_params.get('state')
    if state_param:
        qs = qs.filter(state__iexact=state_param)

    keyword = request.query_params.get('keyword')
    if keyword:
        qs = qs.filter(keyword__icontains=keyword)

    date_from = request.query_params.get('date_from')
    if date_from:
        qs = qs.filter(found_at__date__gte=date_from)

    date_to = request.query_params.get('date_to')
    if date_to:
        qs = qs.filter(found_at__date__lte=date_to)

    search = request.query_params.get('search')
    if search:
        qs = qs.filter(
            Q(snippet__icontains=search) |
            Q(page_title__icontains=search) |
            Q(city__icontains=search) |
            Q(keyword__icontains=search)
        )

    serializer = ScanResultSerializer(qs[:200], many=True)
    return Response(serializer.data)


@api_view(['GET'])
def scan_history(request):
    """Get past scan jobs (without full results)."""
    jobs = ScanJob.objects.all()[:50]
    serializer = ScanJobListSerializer(jobs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def scan_stats(request):
    """Aggregate stats for dashboard cards."""
    total_mentions = ScanResult.objects.count()
    cities_with_hits = ScanResult.objects.values('city', 'state').distinct().count()
    last_scan = ScanJob.objects.first()  # ordered by -started_at
    unique_keywords = ScanResult.objects.values('keyword').distinct().count()

    return Response({
        'total_mentions': total_mentions,
        'cities_with_hits': cities_with_hits,
        'last_scan': ScanJobListSerializer(last_scan).data if last_scan else None,
        'active_keywords': unique_keywords,
    })
