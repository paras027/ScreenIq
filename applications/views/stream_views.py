import json
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from ..ai_utils import stream_candidate
from ..models import Application
from ..score_utils import normalize_score


class StreamCandidateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        job_description = request.data.get('job_description')
        resume = request.data.get('resume')
        candidate_name = request.data.get('candidate_name', '')

        if not job_description or not resume:
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        def event_stream():
            buffer = ''
            try:
                for chunk in stream_candidate(job_description, resume):
                    buffer += chunk
                    # Send each chunk as an SSE data event
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"

                # Clean up markdown fences if present
                content = buffer.strip()
                if content.startswith('```json'):
                    content = content.replace('```json', '').replace('```', '').strip()

                ai_response = json.loads(content)
                score = normalize_score(ai_response.get('score'))
                reasons = ai_response.get('reasons', [])

                # Save to DB after full response received
                application = Application.objects.create(
                    job_description=job_description,
                    candidate_name=candidate_name,
                    resume=resume,
                    ai_score=score,
                    ai_reasons=reasons,
                    created_by=request.user,
                )

                # Send final event with parsed result
                yield f"data: {json.dumps({'done': True, 'id': application.id, 'score': score, 'reasons': reasons, 'candidate_name': candidate_name})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response
