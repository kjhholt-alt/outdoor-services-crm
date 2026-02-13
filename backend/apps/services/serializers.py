from rest_framework import serializers
from .models import ServiceCategory, Service, Job, Estimate, Invoice


class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'category', 'category_name', 'name', 'description',
            'default_price', 'price_type', 'estimated_duration_minutes',
            'is_recurring', 'recurring_frequency', 'is_active',
        ]


class ServiceCategorySerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    service_count = serializers.SerializerMethodField()

    class Meta:
        model = ServiceCategory
        fields = [
            'id', 'name', 'description', 'icon', 'color',
            'is_seasonal', 'season_start', 'season_end',
            'is_active', 'sort_order', 'services', 'service_count',
        ]

    def get_service_count(self, obj):
        return obj.services.filter(is_active=True).count()


class JobListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.business_name', read_only=True)
    customer_address = serializers.SerializerMethodField()
    customer_phone = serializers.CharField(source='customer.main_phone', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    category_name = serializers.CharField(source='service.category.name', read_only=True)
    category_color = serializers.CharField(source='service.category.color', read_only=True)
    category_icon = serializers.CharField(source='service.category.icon', read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'customer', 'customer_name', 'customer_address', 'customer_phone',
            'service', 'service_name', 'category_name', 'category_color', 'category_icon',
            'scheduled_date', 'scheduled_time', 'estimated_duration',
            'assigned_to', 'status', 'price', 'is_invoiced', 'is_paid',
            'is_recurring', 'completed_at', 'actual_duration',
        ]

    def get_customer_address(self, obj):
        c = obj.customer
        parts = [c.bill_to_address, ', '.join(filter(None, [c.city, c.state, c.zip_code]))]
        return ', '.join(filter(None, parts))


class JobDetailSerializer(JobListSerializer):
    class Meta(JobListSerializer.Meta):
        fields = JobListSerializer.Meta.fields + [
            'completion_notes', 'created_by', 'created_at', 'updated_at',
        ]


class JobCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            'customer', 'service', 'scheduled_date', 'scheduled_time',
            'estimated_duration', 'assigned_to', 'status', 'price',
            'actual_duration', 'completion_notes', 'is_recurring',
        ]

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class EstimateListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.business_name', read_only=True)

    class Meta:
        model = Estimate
        fields = [
            'id', 'customer', 'customer_name', 'title', 'total',
            'status', 'valid_until', 'created_at',
        ]


class EstimateDetailSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.business_name', read_only=True)

    class Meta:
        model = Estimate
        fields = [
            'id', 'customer', 'customer_name', 'title', 'description',
            'line_items', 'total', 'status', 'valid_until',
            'sent_at', 'responded_at', 'converted_to_jobs',
            'created_by', 'created_at', 'updated_at',
        ]


class EstimateCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estimate
        fields = [
            'customer', 'title', 'description', 'line_items',
            'total', 'status', 'valid_until',
        ]

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class InvoiceListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.business_name', read_only=True)
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'customer', 'customer_name', 'invoice_number',
            'total', 'amount_paid', 'balance_due', 'status',
            'issued_date', 'due_date', 'paid_date',
        ]


class InvoiceDetailSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.business_name', read_only=True)
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    job_details = JobListSerializer(source='jobs', many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'customer', 'customer_name', 'invoice_number',
            'subtotal', 'tax_rate', 'tax_amount', 'total',
            'amount_paid', 'balance_due', 'status',
            'issued_date', 'due_date', 'paid_date',
            'notes', 'job_details', 'created_at', 'updated_at',
        ]


class InvoiceCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            'customer', 'invoice_number', 'jobs', 'subtotal',
            'tax_rate', 'tax_amount', 'total', 'amount_paid',
            'status', 'issued_date', 'due_date', 'paid_date', 'notes',
        ]
