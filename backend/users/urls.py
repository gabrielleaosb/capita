from django.urls import path
from .views import firebase_test, home,check_email

urlpatterns = [
    path('home/', home, name='home'),
    path('firebase-test/', firebase_test, name='firebase_test'),
    path('api/check-email/', check_email, name='check_email')
]