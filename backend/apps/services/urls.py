from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceCategoryViewSet, ServiceViewSet,
    JobViewSet, EstimateViewSet, InvoiceViewSet,
    dashboard_summary, reports_data,
)

router = DefaultRouter()
router.register(r'categories', ServiceCategoryViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'jobs', JobViewSet)
router.register(r'estimates', EstimateViewSet)
router.register(r'invoices', InvoiceViewSet)

urlpatterns = [
    path('dashboard/summary/', dashboard_summary, name='dashboard-summary'),
    path('reports/', reports_data, name='reports-data'),
    path('', include(router.urls)),
]
