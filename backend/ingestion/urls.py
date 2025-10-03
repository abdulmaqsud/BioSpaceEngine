from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'studies', views.StudyViewSet)
router.register(r'sections', views.SectionViewSet)
router.register(r'evidence', views.EvidenceSentenceViewSet)
router.register(r'entities', views.EntityViewSet)
router.register(r'triples', views.TripleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
