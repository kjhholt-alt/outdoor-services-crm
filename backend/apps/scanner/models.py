from django.db import models


class ScanJob(models.Model):
    STATUS_CHOICES = [
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='running')
    cities_scanned = models.IntegerField(default=0)
    total_results = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"ScanJob #{self.pk} ({self.status}) — {self.started_at:%Y-%m-%d %H:%M}"


class ScanResult(models.Model):
    DOC_TYPE_CHOICES = [
        ('html', 'HTML'),
        ('pdf', 'PDF'),
    ]

    scan_job = models.ForeignKey(ScanJob, on_delete=models.CASCADE, related_name='results')
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    keyword = models.CharField(max_length=100)
    snippet = models.TextField(max_length=300)
    source_url = models.URLField(max_length=500)
    page_title = models.CharField(max_length=300, blank=True, default='')
    meeting_date = models.DateField(null=True, blank=True)
    document_type = models.CharField(max_length=4, choices=DOC_TYPE_CHOICES, default='html')
    found_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-found_at']
        indexes = [
            models.Index(fields=['city', 'state']),
            models.Index(fields=['keyword']),
        ]

    def __str__(self):
        return f"{self.keyword} — {self.city}, {self.state} ({self.source_url[:60]})"
