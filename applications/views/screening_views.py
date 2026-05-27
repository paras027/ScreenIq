from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..ai_utils import screen_candidate
from ..models import Application
from ..serializers import ApplicationSerializer
from ..score_utils import normalize_score

class ScreenCandidateView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        job_description = request.data.get('job_description')
        resume = request.data.get('resume')
        candidate_name = request.data.get('candidate_name')

        if not job_description or not resume:
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ai_response = screen_candidate(
            job_description,
            resume
        )

        raw_score = ai_response.get('score')

        score = normalize_score(raw_score)
        reasons = ai_response.get('reasons')

        application = Application.objects.create(
            job_description=job_description,
            candidate_name=candidate_name,
            resume=resume,
            ai_score=score,
            ai_reasons=reasons,
            created_by=request.user
        )

        serializer = ApplicationSerializer(application)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )