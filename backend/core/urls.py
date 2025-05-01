from django.urls import path, include
from django.views.generic.base import RedirectView

urlpatterns = [
    path('', RedirectView.as_view(url='/firebase-test/')),
    path('', include('users.urls')),  
]