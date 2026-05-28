from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Application
from .score_utils import normalize_score


class NormalizeScoreTest(TestCase):
    """Unit tests for score normalisation — covers the AI output edge cases."""

    def test_integer_score(self):
        self.assertEqual(normalize_score(8), 8)

    def test_float_score_rounds(self):
        self.assertEqual(normalize_score(7.3), 7)

    def test_word_score(self):
        self.assertEqual(normalize_score("Seven"), 7)

    def test_numeric_string(self):
        self.assertEqual(normalize_score("8/10"), 8)

    def test_decimal_string(self):
        self.assertEqual(normalize_score("7.3"), 7)

    def test_clamps_above_ten(self):
        self.assertEqual(normalize_score(11), 10)

    def test_clamps_below_one(self):
        self.assertEqual(normalize_score(0), 1)

    def test_invalid_returns_zero(self):
        self.assertEqual(normalize_score(None), 0)


class ApplicationIsolationTest(TestCase):
    """Ensures users can only see their own screening records (BOLA fix)."""

    def setUp(self):
        self.user_a = User.objects.create_user(username='alice', password='pass123')
        self.user_b = User.objects.create_user(username='bob', password='pass123')

        Application.objects.create(
            candidate_name='Candidate A',
            job_description='JD A',
            resume='Resume A',
            ai_score=7.0,
            ai_reasons=['r1', 'r2', 'r3'],
            created_by=self.user_a,
        )
        Application.objects.create(
            candidate_name='Candidate B',
            job_description='JD B',
            resume='Resume B',
            ai_score=5.0,
            ai_reasons=['r1', 'r2', 'r3'],
            created_by=self.user_b,
        )

        self.client = APIClient()

    def test_user_sees_only_own_applications(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get('/api/applications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [a['candidate_name'] for a in response.data['results']]
        self.assertIn('Candidate A', names)
        self.assertNotIn('Candidate B', names)


class ScreenViewAuthTest(TestCase):
    """Ensures unauthenticated requests to /screen/ are rejected."""

    def setUp(self):
        self.client = APIClient()

    def test_unauthenticated_request_rejected(self):
        response = self.client.post('/api/screen/', {
            'candidate_name': 'Test',
            'job_description': 'Some JD',
            'resume': 'Some resume',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_fields_returns_400(self):
        user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_authenticate(user=user)
        response = self.client.post('/api/screen/', {
            'candidate_name': 'Test',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_saves_with_precomputed_score(self):
        user = User.objects.create_user(username='tester2', password='pass123')
        self.client.force_authenticate(user=user)
        response = self.client.post('/api/screen/', {
            'candidate_name': 'Test',
            'job_description': 'Some JD',
            'resume': 'Some resume',
            'ai_score': 8,
            'ai_reasons': ['reason 1', 'reason 2', 'reason 3'],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['ai_score'], 8.0)
