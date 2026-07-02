from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.customers.models import Customer, Note, Lead


class CustomerAPITest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _make_customer(self, **overrides):
        """Create a customer directly via ORM for reliable test setup."""
        defaults = {
            'business_name': 'Acme Landscaping',
            'city': 'Davenport', 'state': 'IA', 'zip_code': '52801',
            'created_by': self.user, 'is_active': True,
        }
        defaults.update(overrides)
        return Customer.objects.create(**defaults)

    def _create_customer(self, **overrides):
        data = {
            'business_name': 'Acme Landscaping',
            'city': 'Davenport', 'state': 'IA', 'zip_code': '52801',
        }
        data.update(overrides)
        return self.client.post('/customers/', data)

    def test_create_customer(self):
        resp = self._create_customer()
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Customer.objects.count(), 1)

    def test_list_customers(self):
        self._create_customer()
        resp = self.client.get('/customers/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_get_customer_detail(self):
        cust = self._make_customer()
        resp = self.client.get(f'/customers/{cust.id}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['business_name'], 'Acme Landscaping')

    def test_update_customer(self):
        cust = self._make_customer()
        resp = self.client.patch(f'/customers/{cust.id}/', {'city': 'Bettendorf'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        cust.refresh_from_db()
        self.assertEqual(cust.city, 'Bettendorf')

    def test_soft_delete_customer(self):
        cust = self._make_customer()
        resp = self.client.delete(f'/customers/{cust.id}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        cust.refresh_from_db()
        self.assertFalse(cust.is_active)

    def test_search_customers(self):
        self._make_customer(business_name='Alpha Services')
        self._make_customer(business_name='Beta Corp')
        resp = self.client.get('/customers/', {'search': 'Alpha'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get('results', resp.data)
        names = [c['business_name'] for c in results]
        self.assertIn('Alpha Services', names)
        self.assertNotIn('Beta Corp', names)


class CustomerNotesTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            business_name='Test Biz', created_by=self.user,
        )

    def test_add_note(self):
        resp = self.client.post(
            f'/customers/{self.customer.id}/notes/',
            {'content': 'First note'},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Note.objects.count(), 1)

    def test_list_notes(self):
        Note.objects.create(
            customer=self.customer, content='Note 1', created_by=self.user,
        )
        resp = self.client.get(f'/customers/{self.customer.id}/notes/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_new_note_marks_previous_not_current(self):
        Note.objects.create(
            customer=self.customer, content='Old note', created_by=self.user, is_current=True,
        )
        self.client.post(
            f'/customers/{self.customer.id}/notes/',
            {'content': 'New note'},
        )
        notes = Note.objects.filter(customer=self.customer).order_by('-created_at')
        self.assertTrue(notes[0].is_current)
        self.assertFalse(notes[1].is_current)


class LeadAPITest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _create_lead(self, **overrides):
        data = {
            'business_name': 'New Lead LLC',
            'city': 'LeClaire', 'state': 'IA', 'zip_code': '52753',
            'type': 'commercial', 'source': 'chamber_of_commerce',
            'score': 4, 'services_needed': ['Snow Removal', 'Lawn Care'],
        }
        data.update(overrides)
        return self.client.post('/leads/', data, format='json')

    def test_create_lead(self):
        resp = self._create_lead()
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Lead.objects.count(), 1)

    def test_list_leads(self):
        self._create_lead()
        resp = self.client.get('/leads/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_filter_by_status(self):
        self._create_lead(business_name='New One', status='new')
        self._create_lead(business_name='Contacted One', status='contacted')
        resp = self.client.get('/leads/', {'status': 'new'})
        results = resp.data.get('results', resp.data)
        self.assertTrue(all(l['status'] == 'new' for l in results))

    def test_search_leads(self):
        self._create_lead(business_name='Alpha Lead')
        self._create_lead(business_name='Beta Lead')
        resp = self.client.get('/leads/', {'search': 'Alpha'})
        results = resp.data.get('results', resp.data)
        self.assertEqual(len(results), 1)

    def test_convert_to_customer(self):
        self._create_lead()
        lead = Lead.objects.first()
        resp = self.client.post(f'/leads/{lead.id}/convert_to_customer/')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        lead.refresh_from_db()
        self.assertEqual(lead.status, 'converted')
        self.assertIsNotNone(lead.converted_customer)
        customer = Customer.objects.get(id=lead.converted_customer_id)
        self.assertEqual(customer.business_name, 'New Lead LLC')

    def test_convert_already_converted_fails(self):
        self._create_lead()
        lead = Lead.objects.first()
        self.client.post(f'/leads/{lead.id}/convert_to_customer/')
        resp = self.client.post(f'/leads/{lead.id}/convert_to_customer/')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_lead_status(self):
        self._create_lead()
        lead = Lead.objects.first()
        resp = self.client.patch(f'/leads/{lead.id}/', {'status': 'contacted'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        lead.refresh_from_db()
        self.assertEqual(lead.status, 'contacted')
