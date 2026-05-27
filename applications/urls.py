from django.urls import path
from .views.auth_views import RegisterView
from .views.application_views import ApplicationListView
from .views.screening_views import ScreenCandidateView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('applications/', ApplicationListView.as_view()),

    path('register/', RegisterView.as_view()),

    path('login/', TokenObtainPairView.as_view()),

    path('token/refresh/', TokenRefreshView.as_view()),
    path('screen/', ScreenCandidateView.as_view()),


]