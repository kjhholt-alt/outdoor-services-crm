from django.urls import path
from . import views

urlpatterns = [
    path('scan/', views.trigger_scan, name='scanner-trigger'),
    path('scan/<int:job_id>/', views.scan_status, name='scanner-status'),
    path('results/', views.scan_results, name='scanner-results'),
    path('history/', views.scan_history, name='scanner-history'),
    path('stats/', views.scan_stats, name='scanner-stats'),
]
