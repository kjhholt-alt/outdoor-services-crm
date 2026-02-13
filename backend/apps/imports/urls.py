from django.urls import path
from .views import ImportPreviewView, ImportExecuteView, ExportCustomersView

urlpatterns = [
    path('preview/', ImportPreviewView.as_view(), name='import_preview'),
    path('execute/', ImportExecuteView.as_view(), name='import_execute'),
    path('export/customers/', ExportCustomersView.as_view(), name='export_customers'),
]
