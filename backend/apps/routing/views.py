from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from math import radians, cos, sin, asin, sqrt
from .models import Route, RouteStop
from .serializers import RouteSerializer, RouteStopSerializer, RouteCreateSerializer
from apps.customers.models import Customer


def haversine(lon1, lat1, lon2, lat2):
    """Calculate the great circle distance between two points in miles."""
    # Convert to radians
    lon1, lat1, lon2, lat2 = map(radians, [float(lon1), float(lat1), float(lon2), float(lat2)])

    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    miles = 3956 * c  # Earth radius in miles
    return miles


def optimize_route_nearest_neighbor(customers):
    """Optimize route using nearest neighbor algorithm."""
    if not customers:
        return []

    # Filter customers with valid coordinates
    valid_customers = [c for c in customers if c.latitude and c.longitude]
    if not valid_customers:
        return list(customers)  # Return original order if no geocoded customers

    # Start with first customer
    route = [valid_customers[0]]
    remaining = valid_customers[1:]

    while remaining:
        current = route[-1]
        # Find nearest neighbor
        nearest = min(
            remaining,
            key=lambda c: haversine(
                current.longitude, current.latitude,
                c.longitude, c.latitude
            )
        )
        route.append(nearest)
        remaining.remove(nearest)

    # Add any customers without coordinates at the end
    no_coords = [c for c in customers if c not in valid_customers]
    route.extend(no_coords)

    return route


class RouteViewSet(viewsets.ModelViewSet):
    """API endpoint for routes."""
    queryset = Route.objects.prefetch_related('stops__customer').select_related('created_by')
    serializer_class = RouteSerializer
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by date
        date = self.request.query_params.get('date', None)
        if date:
            queryset = queryset.filter(date=date)

        return queryset

    @action(detail=False, methods=['post'])
    def create_optimized(self, request):
        """Create an optimized route from selected customers."""
        serializer = RouteCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        customer_ids = data['customer_ids']

        # Get customers
        customers = list(Customer.objects.filter(id__in=customer_ids, is_active=True))
        if not customers:
            return Response(
                {'error': 'No valid customers found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Optimize route if requested
        if data.get('optimize', True):
            customers = optimize_route_nearest_neighbor(customers)

        # Create route
        route = Route.objects.create(
            name=data['name'],
            date=data['date'],
            notes=data.get('notes', ''),
            created_by=request.user
        )

        # Create stops and calculate distances
        total_distance = 0
        for i, customer in enumerate(customers):
            distance = None
            if i > 0 and customers[i-1].latitude and customer.latitude:
                distance = haversine(
                    customers[i-1].longitude, customers[i-1].latitude,
                    customer.longitude, customer.latitude
                )
                total_distance += distance

            RouteStop.objects.create(
                route=route,
                customer=customer,
                stop_order=i + 1,
                distance_from_previous_miles=distance
            )

        route.total_distance_miles = total_distance
        route.estimated_duration_minutes = len(customers) * 30 + int(total_distance * 2)  # Rough estimate
        route.save()

        return Response(RouteSerializer(route).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def complete_stop(self, request, pk=None):
        """Mark a route stop as completed."""
        route = self.get_object()
        stop_id = request.data.get('stop_id')

        try:
            stop = route.stops.get(id=stop_id)
        except RouteStop.DoesNotExist:
            return Response(
                {'error': 'Stop not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        stop.is_completed = True
        stop.completed_at = timezone.now()
        stop.actual_arrival = timezone.now().time()
        stop.save()

        # Check if all stops are completed
        if route.stops.filter(is_completed=False, skipped=False).count() == 0:
            route.is_completed = True
            route.completed_at = timezone.now()
            route.save()

        return Response(RouteStopSerializer(stop).data)

    @action(detail=True, methods=['post'])
    def skip_stop(self, request, pk=None):
        """Skip a route stop."""
        route = self.get_object()
        stop_id = request.data.get('stop_id')
        reason = request.data.get('reason', '')

        try:
            stop = route.stops.get(id=stop_id)
        except RouteStop.DoesNotExist:
            return Response(
                {'error': 'Stop not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        stop.skipped = True
        stop.skip_reason = reason
        stop.save()

        return Response(RouteStopSerializer(stop).data)
