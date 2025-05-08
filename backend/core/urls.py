from django.urls import path, include
from django.views.generic.base import RedirectView
from users import views as users_views

urlpatterns = [
    path('', RedirectView.as_view(url='/home/')),
    path('home/', users_views.home, name='home'),
    path('', include('users.urls')), 
    path('chat/', include('chat.urls', namespace='chat')), 
]