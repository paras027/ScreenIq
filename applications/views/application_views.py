from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..ai_utils import screen_candidate
from ..models import Application
from ..serializers import ApplicationSerializer
from ..pagination import ApplicationPagination

class ApplicationListView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = ApplicationPagination

    def get(self, request):
        applications = Application.objects.filter(
            created_by=request.user
        ).order_by('-created_at')
        paginator = ApplicationPagination()
        paginated_applications = paginator.paginate_queryset(applications, request)
        serializer = ApplicationSerializer(
            paginated_applications,
            many=True
        )

        return paginator.get_paginated_response(
                serializer.data
            )

