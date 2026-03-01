from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import CurrentUserView, ToggleDarkModeView

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(permission_classes=[AllowAny]), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(permission_classes=[AllowAny]), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('toggle-dark-mode/', ToggleDarkModeView.as_view(), name='toggle_dark_mode'),
]
