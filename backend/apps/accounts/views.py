from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer, CompanyProfileSerializer
from .models import CompanyProfile


class CurrentUserView(APIView):
    """Get or update the current authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ToggleDarkModeView(APIView):
    """Quick toggle for dark mode preference."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        profile.dark_mode = not profile.dark_mode
        profile.save()
        return Response({'dark_mode': profile.dark_mode})


class CompanyProfileView(APIView):
    """GET/PATCH the singleton company profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = CompanyProfile.load()
        return Response(CompanyProfileSerializer(profile).data)

    def patch(self, request):
        profile = CompanyProfile.load()
        serializer = CompanyProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
