from django.shortcuts import render
from django.http import JsonResponse
from core.firebase import get_user_data, create_or_update_user
from django.views.decorators.csrf import csrf_exempt
from firebase_admin import auth
from .utils.email_verifier import verify_email_with_hunter
import logging

logger = logging.getLogger(__name__)

def firebase_test(request):
    if request.method == 'POST':
        if 'test' in request.GET:
            return JsonResponse({'status': 'ready'})
            
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({
                'status': 'error',
                'message': 'Token não fornecido'
            }, status=401)
        
        try:
            token = auth_header.split('Bearer ')[1]
            user_data = get_user_data(token)
            
            if not user_data:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Token inválido'
                }, status=401)
            
            firebase_user = create_or_update_user(user_data)
            if not firebase_user:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Erro ao processar usuário'
                }, status=500)
            
            return JsonResponse({
                'status': 'success',
                'user': user_data
            })
            
        except Exception as e:
            logger.error(f"Erro na autenticação Firebase: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    return render(request, 'firebase_test.html')

@csrf_exempt
def check_email(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método não permitido'}, status=405)
    
    email = request.POST.get('email')
    if not email:
        return JsonResponse({'error': 'E-mail não fornecido'}, status=400)
    
    # 1. Verificar formato básico
    if '@' not in email or '.' not in email.split('@')[1]:
        return JsonResponse({
            'valid': False,
            'reason': 'Formato de e-mail inválido',
            'exists': False
        })
    
    try:
        user = auth.get_user_by_email(email)
        return JsonResponse({
            'status': 'invalid',
            'code': 'email_already_exists',
            'valid': False,
            'reason': 'E-mail já cadastrado',
            'exists': True
        })
    except auth.UserNotFoundError:
        pass  
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
    is_valid, reason, score = verify_email_with_hunter(email)
    
    return JsonResponse({
        'valid': is_valid,
        'reason': reason,
        'score': score,
        'exists': False,
        'status': 'verified' if is_valid else 'rejected'
    })

def home(request):
    return render(request, 'home.html')
