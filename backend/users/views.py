from django.shortcuts import render, redirect
from django.http import JsonResponse
from core.firebase import get_user_data, create_or_update_user
from django.views.decorators.csrf import csrf_exempt
from firebase_admin import auth
from .utils.email_verifier import verify_email_with_hunter
import logging
from django.conf import settings
from django.urls import reverse


FB_API_KEY = settings.FB_API_KEY
FB_AUTH_DOMAIN = settings.FB_AUTH_DOMAIN
FB_PROJECT_ID = settings.FB_PROJECT_ID
FB_STORAGE_BUCKET = settings.FB_STORAGE_BUCKET
FB_MESSAGING_SENDER_ID = settings.FB_MESSAGING_SENDER_ID
FB_APP_ID = settings.FB_APP_ID
FB_MEASUREMENT_ID = settings.FB_MEASUREMENT_ID

logger = logging.getLogger(__name__)

def register(request):
    if request.session.get('firebase_token'):
        return redirect('home')
    if request.method == 'POST':
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
            logger.error(f"Erro no registro Firebase: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    return render(request, 'register.html', {
        'FB_API_KEY': FB_API_KEY,
        'FB_AUTH_DOMAIN': FB_AUTH_DOMAIN,
        'FB_PROJECT_ID': FB_PROJECT_ID,
        'FB_STORAGE_BUCKET': FB_STORAGE_BUCKET,
        'FB_MESSAGING_SENDER_ID': FB_MESSAGING_SENDER_ID,
        'FB_APP_ID': FB_APP_ID,
        'FB_MEASUREMENT_ID': FB_MEASUREMENT_ID,
    })

def login(request):
    if request.session.get('firebase_token'):
        return redirect('home')
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
    
    return render(request, 'login.html', {
        'FB_API_KEY': FB_API_KEY,
        'FB_AUTH_DOMAIN': FB_AUTH_DOMAIN,
        'FB_PROJECT_ID': FB_PROJECT_ID,
        'FB_STORAGE_BUCKET': FB_STORAGE_BUCKET,
        'FB_MESSAGING_SENDER_ID': FB_MESSAGING_SENDER_ID,
        'FB_APP_ID': FB_APP_ID,
        'FB_MEASUREMENT_ID': FB_MEASUREMENT_ID,
    })

@csrf_exempt
def check_email(request):
    logger.info(f"Recebida requisição para verificar e-mail. Método: {request.method}")

    if request.method != 'POST':
        return JsonResponse({'error': 'Método não permitido'}, status=405)
    
    email = request.POST.get('email')
    logger.info(f"E-mail recebido para verificação: {email}")

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
        'reason': reason if is_valid else 'E-mail inválido', 
        'score': score,
        'exists': False,
        'status': 'verified' if is_valid else 'rejected'
    })

@csrf_exempt
def verify_google_token(request):
    if request.method == 'POST':
        token = request.POST.get('token')
        try:
            decoded_token = auth.verify_id_token(token)
            request.session['firebase_token'] = token
            request.session['user_uid'] = decoded_token['uid']
            
            # Cria ou atualiza usuário no seu sistema
            user = auth.get_user(decoded_token['uid'])
            create_or_update_user({
                'uid': user.uid,
                'email': user.email,
                'display_name': user.display_name,
                'photo_url': user.photo_url
            })
            
            return JsonResponse({
                'status': 'success',
                'redirect_url': '/home/'
            })
            
        except Exception as e:
            logger.error(f"Erro na verificação do token Google: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': 'Falha na autenticação com Google'
            }, status=400)
    return JsonResponse({'error': 'Método não permitido'}, status=405)

def home(request):
    user_data = None
    if request.session.get('firebase_token'):
        try:
            decoded_token = auth.verify_id_token(request.session['firebase_token'])
            user = auth.get_user(decoded_token['uid'])
            user_data = {
                'name': user.display_name,
                'email': user.email,
            }
        except auth.RevokedSessionCookieError:
            request.session.flush()
            user_data = None
        except Exception as e:
            logger.error(f"Erro na home: {str(e)}")
            request.session.flush()
            user_data = None
    return render(request, 'home.html', {
        'user': user_data,
        'FB_API_KEY': FB_API_KEY,
        'FB_AUTH_DOMAIN': FB_AUTH_DOMAIN,
        'FB_PROJECT_ID': FB_PROJECT_ID,
        'FB_STORAGE_BUCKET': FB_STORAGE_BUCKET,
        'FB_MESSAGING_SENDER_ID': FB_MESSAGING_SENDER_ID,
        'FB_APP_ID': FB_APP_ID,
        'FB_MEASUREMENT_ID': FB_MEASUREMENT_ID,
    })

@csrf_exempt
def logout(request):
    if request.method == 'POST':
        try:
            logger.info("Iniciando logout...")
            request.session.flush()
            logger.info("Sessão limpa com sucesso.")
            response = JsonResponse({
                'status': 'success',
                'redirect_url': reverse('login') + '?logout=1'
            })
            response.delete_cookie('sessionid')
            logger.info("Logout concluído com sucesso.")
            return response
        except Exception as e:
            logger.error(f"Erro no logout: {str(e)}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'error': 'Método não permitido'}, status=405)
