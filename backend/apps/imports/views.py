from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from .services import ImportService, export_customers_to_excel, export_customers_to_csv
from apps.customers.models import Customer


class ImportPreviewView(APIView):
    """Preview import data before executing."""

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine file type
        file_name = file.name.lower()
        if file_name.endswith('.xlsx') or file_name.endswith('.xls'):
            file_type = 'xlsx'
        elif file_name.endswith('.csv'):
            file_type = 'csv'
        else:
            return Response(
                {'error': 'Unsupported file type. Use .xlsx or .csv'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = ImportService(file, file_type)
            field_mapping = request.data.get('field_mapping', None)
            preview = service.preview(field_mapping)
            return Response(preview)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ImportExecuteView(APIView):
    """Execute the import."""

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        field_mapping = request.data.get('field_mapping')
        if not field_mapping:
            return Response(
                {'error': 'Field mapping required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        duplicate_action = request.data.get('duplicate_action', 'skip')
        if duplicate_action not in ['skip', 'update', 'create_new']:
            return Response(
                {'error': 'Invalid duplicate_action. Use: skip, update, or create_new'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine file type
        file_name = file.name.lower()
        if file_name.endswith('.xlsx') or file_name.endswith('.xls'):
            file_type = 'xlsx'
        elif file_name.endswith('.csv'):
            file_type = 'csv'
        else:
            return Response(
                {'error': 'Unsupported file type'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = ImportService(file, file_type)
            results = service.execute(field_mapping, request.user, duplicate_action)
            return Response(results)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ExportCustomersView(APIView):
    """Export customers to Excel or CSV."""

    def get(self, request):
        format_type = request.query_params.get('format', 'xlsx')
        region_id = request.query_params.get('region', None)

        queryset = Customer.objects.filter(is_active=True).select_related('region')
        if region_id:
            queryset = queryset.filter(region_id=region_id)

        if format_type == 'csv':
            output = export_customers_to_csv(queryset)
            response = HttpResponse(output.read(), content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="customers.csv"'
        else:
            output = export_customers_to_excel(queryset)
            response = HttpResponse(
                output.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="customers.xlsx"'

        return response
