from decimal import Decimal
from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.customers.models import Customer
from apps.services.models import ServiceCategory, Service, Job, Estimate, Invoice


class BaseAPITestCase(TestCase):
    """Shared setup: create a user, auth client, and basic fixtures."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.category = ServiceCategory.objects.create(
            name='Lawn Care', icon='leaf', color='#16a34a'
        )
        self.service = Service.objects.create(
            category=self.category, name='Basic Mowing',
            default_price=Decimal('75.00'), estimated_duration_minutes=45,
        )
        self.customer = Customer.objects.create(
            business_name='Test Business', city='Davenport',
            state='IA', zip_code='52801', created_by=self.user,
        )


class ServiceCatalogPermissionsTest(TestCase):
    """Verify service catalog is read-only for unauthenticated users."""

    def setUp(self):
        self.anon = APIClient()
        self.auth = APIClient()
        user = User.objects.create_user(username='authed', password='pass')
        self.auth.force_authenticate(user=user)
        self.category = ServiceCategory.objects.create(name='Snow Removal')

    def test_anon_can_list_categories(self):
        resp = self.anon.get('/api/categories/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_anon_cannot_create_category(self):
        resp = self.anon.post('/api/categories/', {'name': 'New Cat'})
        self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_anon_cannot_delete_category(self):
        resp = self.anon.delete(f'/api/categories/{self.category.id}/')
        self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_auth_can_create_category(self):
        resp = self.auth.post('/api/categories/', {'name': 'Landscaping'})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class JobViewSetTest(BaseAPITestCase):

    def _create_job(self, **overrides):
        data = {
            'customer': self.customer.id,
            'service': self.service.id,
            'scheduled_date': str(date.today()),
            'price': '75.00',
        }
        data.update(overrides)
        return self.client.post('/api/jobs/', data)

    def test_create_job(self):
        resp = self._create_job()
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Job.objects.count(), 1)

    def test_list_jobs(self):
        self._create_job()
        resp = self.client.get('/api/jobs/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_start_job(self):
        self._create_job()
        job = Job.objects.first()
        resp = self.client.post(f'/api/jobs/{job.id}/start/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        job.refresh_from_db()
        self.assertEqual(job.status, 'in_progress')

    def test_complete_job(self):
        self._create_job()
        job = Job.objects.first()
        job.status = 'in_progress'
        job.save()
        resp = self.client.post(f'/api/jobs/{job.id}/complete/', {'notes': 'Done'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        job.refresh_from_db()
        self.assertEqual(job.status, 'completed')
        self.assertIsNotNone(job.completed_at)

    def test_reschedule_job(self):
        self._create_job()
        job = Job.objects.first()
        new_date = str(date.today() + timedelta(days=7))
        resp = self.client.post(f'/api/jobs/{job.id}/reschedule/', {'date': new_date})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Job.objects.count(), 2)

    def test_reschedule_requires_date(self):
        self._create_job()
        job = Job.objects.first()
        resp = self.client.post(f'/api/jobs/{job.id}/reschedule/', {})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_today_filter(self):
        from django.utils import timezone as tz
        today_str = str(tz.now().date())
        future_str = str(tz.now().date() + timedelta(days=5))
        self._create_job(scheduled_date=today_str)
        self._create_job(scheduled_date=future_str)
        resp = self.client.get('/api/jobs/today/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_unauthenticated_blocked(self):
        anon = APIClient()
        resp = anon.get('/api/jobs/')
        self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class EstimateViewSetTest(BaseAPITestCase):

    def _create_estimate(self):
        return self.client.post('/api/estimates/', {
            'customer': self.customer.id,
            'title': 'Spring Package',
            'line_items': [
                {'service': 'Basic Mowing', 'service_id': self.service.id, 'price': 75},
            ],
            'total': '75.00',
        }, format='json')

    def test_create_estimate(self):
        resp = self._create_estimate()
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_accept_creates_jobs(self):
        self._create_estimate()
        estimate = Estimate.objects.first()
        resp = self.client.post(f'/api/estimates/{estimate.id}/accept/', {
            'create_jobs': True,
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['jobs_created'], 1)
        estimate.refresh_from_db()
        self.assertEqual(estimate.status, 'accepted')
        self.assertTrue(estimate.converted_to_jobs)


class InvoiceViewSetTest(BaseAPITestCase):

    def _create_invoice(self):
        return self.client.post('/api/invoices/', {
            'customer': self.customer.id,
            'subtotal': '200.00',
            'tax_rate': '7.00',
            'tax_amount': '14.00',
            'total': '214.00',
            'status': 'draft',
            'issued_date': str(date.today()),
            'due_date': str(date.today() + timedelta(days=15)),
        })

    def test_create_invoice_auto_number(self):
        resp = self._create_invoice()
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        invoice = Invoice.objects.first()
        self.assertTrue(invoice.invoice_number.startswith('INV-'))

    def test_record_payment_partial(self):
        self._create_invoice()
        inv = Invoice.objects.first()
        resp = self.client.post(f'/api/invoices/{inv.id}/record_payment/', {'amount': '100.00'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        inv.refresh_from_db()
        self.assertEqual(inv.status, 'partial')
        self.assertEqual(inv.amount_paid, Decimal('100.00'))

    def test_record_payment_full(self):
        self._create_invoice()
        inv = Invoice.objects.first()
        resp = self.client.post(f'/api/invoices/{inv.id}/record_payment/', {'amount': '214.00'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        inv.refresh_from_db()
        self.assertEqual(inv.status, 'paid')
        self.assertIsNotNone(inv.paid_date)

    def test_record_payment_requires_amount(self):
        self._create_invoice()
        inv = Invoice.objects.first()
        resp = self.client.post(f'/api/invoices/{inv.id}/record_payment/', {})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_outstanding_filter(self):
        self._create_invoice()
        resp = self.client.get('/api/invoices/outstanding/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_overdue_filter(self):
        self.client.post('/api/invoices/', {
            'customer': self.customer.id, 'subtotal': '100.00',
            'tax_rate': '0', 'tax_amount': '0', 'total': '100.00',
            'status': 'sent', 'issued_date': str(date.today() - timedelta(days=30)),
            'due_date': str(date.today() - timedelta(days=5)),
        })
        resp = self.client.get('/api/invoices/overdue/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_balance_due_property(self):
        self._create_invoice()
        inv = Invoice.objects.first()
        self.assertEqual(inv.balance_due, Decimal('214.00'))
        inv.amount_paid = Decimal('100.00')
        inv.save()
        self.assertEqual(inv.balance_due, Decimal('114.00'))


class DashboardSummaryTest(BaseAPITestCase):

    def test_dashboard_returns_expected_shape(self):
        resp = self.client.get('/api/dashboard/summary/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data
        self.assertIn('today', data)
        self.assertIn('this_week', data)
        self.assertIn('this_month', data)
        self.assertIn('outstanding', data)
        self.assertIn('monthly_revenue', data)
        self.assertEqual(len(data['monthly_revenue']), 12)

    def test_dashboard_handles_empty_db(self):
        resp = self.client.get('/api/dashboard/summary/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['today']['total_jobs'], 0)
        self.assertEqual(resp.data['today']['revenue'], 0)


class ReportsEndpointTest(BaseAPITestCase):

    def test_reports_returns_expected_shape(self):
        resp = self.client.get('/api/reports/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data
        self.assertIn('monthly_revenue_current', data)
        self.assertIn('monthly_revenue_previous', data)
        self.assertIn('jobs_by_status', data)
        self.assertIn('revenue_by_category', data)
        self.assertIn('crew_productivity', data)
        self.assertIn('summary', data)
        self.assertEqual(len(data['monthly_revenue_current']), 12)

    def test_reports_requires_auth(self):
        anon = APIClient()
        resp = anon.get('/api/reports/')
        self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
