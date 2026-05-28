from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..models import Application
from ..serializers import ApplicationSerializer
from ..score_utils import normalize_score


class ScreenCandidateView(APIView):
    """
    Accepts pre-computed AI results from the Next.js streaming route handler
    and saves them to the database. Gemini is called in the Next.js layer,
    not here — this endpoint is purely for persistence.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        job_description = request.data.get('job_description')
        resume = request.data.get('resume')
        candidate_name = request.data.get('candidate_name', '')
        ai_score = request.data.get('ai_score')
        ai_reasons = request.data.get('ai_reasons')

        if not job_description or not resume:
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if ai_score is None or not ai_reasons:
            return Response(
                {'error': 'Missing ai_score or ai_reasons'},
                status=status.HTTP_400_BAD_REQUEST
            )

        score = normalize_score(ai_score)

        application = Application.objects.create(
            job_description=job_description,
            candidate_name=candidate_name,
            resume=resume,
            ai_score=score,
            ai_reasons=ai_reasons,
            created_by=request.user,
        )

        return Response(
            ApplicationSerializer(application).data,
            status=status.HTTP_201_CREATED
        )
