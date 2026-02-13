from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegionViewSet, CustomerViewSet

router = DefaultRouter()
router.register(r'regions', RegionViewSet)
router.register(r'customers', CustomerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
