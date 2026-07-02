from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import CompanyProfile


class AuthFlowTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='jlischer', password='crm2024!',
            email='john@aatos.com', first_name='John', last_name='Lischer',
        )

    def test_login_success(self):
        client = APIClient()
        resp = client.post('/auth/login/', {
            'username': 'jlischer', 'password': 'crm2024!',
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)

    def test_login_bad_password(self):
        client = APIClient()
        resp = client.post('/auth/login/', {
            'username': 'jlischer', 'password': 'wrong',
        })
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        client = APIClient()
        login = client.post('/auth/login/', {
            'username': 'jlischer', 'password': 'crm2024!',
        })
        refresh = login.data['refresh']
        resp = client.post('/auth/refresh/', {'refresh': refresh})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', resp.data)

    def test_me_requires_auth(self):
        client = APIClient()
        resp = client.get('/auth/me/')
        self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_me_returns_user_data(self):
        client = APIClient()
        client.force_authenticate(user=self.user)
        resp = client.get('/auth/me/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['username'], 'jlischer')
        self.assertIn('profile', resp.data)

    def test_toggle_dark_mode(self):
        client = APIClient()
        client.force_authenticate(user=self.user)
        resp = client.post('/auth/toggle-dark-mode/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data['dark_mode'])
        resp2 = client.post('/auth/toggle-dark-mode/')
        self.assertFalse(resp2.data['dark_mode'])


class CompanyProfileTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='admin', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_creates_default_profile(self):
        resp = self.client.get('/auth/company-profile/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['name'], 'All Around Town Outdoor Services')

    def test_patch_updates_profile(self):
        self.client.get('/auth/company-profile/')
        resp = self.client.patch('/auth/company-profile/', {
            'name': 'Updated Name',
            'phone': '563-555-9999',
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['name'], 'Updated Name')
        self.assertEqual(resp.data['phone'], '563-555-9999')

    def test_profile_is_singleton(self):
        self.client.get('/auth/company-profile/')
        self.client.patch('/auth/company-profile/', {'name': 'X'})
        self.assertEqual(CompanyProfile.objects.count(), 1)

    def test_requires_auth(self):
        anon = APIClient()
        resp = anon.get('/auth/company-profile/')
        self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
