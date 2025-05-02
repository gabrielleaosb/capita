from django.urls import path
from . import views

urlpatterns = [
    path('firebase-test/', views.firebase_test, name='firebase_test'),
    path('verify_google_token/', views.verify_google_token, name='verify_google_token'),
    path('api/check_email/', views.check_email, name='check_email'),
    path('home/', views.home, name='home'),
    path('logout/', views.logout, name='logout'),
]