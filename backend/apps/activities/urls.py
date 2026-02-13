from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActivityTypeViewSet, ActivityViewSet

router = DefaultRouter()
router.register(r'types', ActivityTypeViewSet)
router.register(r'', ActivityViewSet, basename='activity')

urlpatterns = [
    path('', include(router.urls)),
]
