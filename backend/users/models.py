from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    firebase_uid = models.CharField(max_length=128, unique=True)
    email_verified = models.BooleanField(default=False)