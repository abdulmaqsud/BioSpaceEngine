from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def api_info(request):
    """Root API information endpoint"""
    return JsonResponse({
        'message': 'BioSpace Knowledge Engine API',
        'version': '1.0.0',
        'status': 'operational',
        'endpoints': {
            'studies': '/api/studies/',
            'search': '/api/studies/search/',
            'facets': '/api/studies/facets/',
            'entities': '/api/entities/',
            'triples': '/api/triples/',
            'evidence': '/api/evidence/',
        },
        'total_studies': 572,
        'features': [
            'AI-powered semantic search',
            'FAISS vector search',
            'Entity extraction',
            'Knowledge graph',
            'REST API'
        ]
    })
