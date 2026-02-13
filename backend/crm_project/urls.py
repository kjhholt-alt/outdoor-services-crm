"""
URL configuration for outdoor-crm project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def health_check(request):
    return Response({'status': 'ok', 'service': 'All Around Town Outdoor Services CRM'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health-check'),
    path('auth/', include('apps.accounts.urls')),
    path('', include('apps.customers.urls')),
    path('activities/', include('apps.activities.urls')),
    path('reminders/', include('apps.reminders.urls')),
    path('routes/', include('apps.routing.urls')),
    path('import/', include('apps.imports.urls')),
    path('api/', include('apps.services.urls')),
]
