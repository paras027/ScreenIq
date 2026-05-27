from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Application(models.Model):
    job_description = models.TextField()
    candidate_name = models.CharField(max_length=255)
    resume = models.TextField()
    ai_score = models.FloatField()
    ai_reasons = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    