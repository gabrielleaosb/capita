import os
import firebase_admin
from firebase_admin import credentials, auth
from pathlib import Path
from dotenv import load_dotenv


load_dotenv()

def find_credentials():
    env_path = os.getenv("FIREBASE_CREDENTIALS")
    if env_path and Path(env_path).exists():
        return Path(env_path)
    
    backend_path = Path("firebase-credentials.json")
    if backend_path.exists():
        return backend_path
    
    current_dir_path = Path(__file__).parent / "firebase-credentials.json"
    if current_dir_path.exists():
        return current_dir_path
    
    raise FileNotFoundError(
        f"Não encontrado. Procurei em:\n"
        f"1. {env_path}\n"
        f"2. {backend_path.absolute()}\n"
        f"3. {current_dir_path.absolute()}"
    )

CREDENTIALS_PATH = find_credentials()
cred = credentials.Certificate(str(CREDENTIALS_PATH))
firebase_app = firebase_admin.initialize_app(cred)

def verify_token(token):
    """Verifica o token do Firebase e retorna os dados do usuário"""
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"Erro na verificação do token: {e}")
        return None
    

def get_user_data(token):
    """
    Extrai dados relevantes do usuário do token decodificado
    """
    decoded_token = verify_token(token)
    if not decoded_token:
        return None
    
    return {
        'uid': decoded_token.get('uid'),
        'email': decoded_token.get('email'),
        'name': decoded_token.get('name'),
        'picture': decoded_token.get('picture')
    }

def create_or_update_user(user_data):
    """
    Cria ou atualiza usuário no Firebase
    """
    try:
        try:
            user = auth.get_user_by_email(user_data['email'])
        except auth.UserNotFoundError:
            # Cria novo usuário
            user = auth.create_user(
                email=user_data['email'],
                email_verified=True,
                display_name=user_data.get('name'),
                photo_url=user_data.get('picture')
            )
        return user
    except Exception as e:
        print(f"Erro ao criar/atualizar usuário: {e}")
        return None

def revoke_token(uid):
    """
    Revoga todos os tokens de um usuário
    """
    try:
        auth.revoke_refresh_tokens(uid)
        return True
    except Exception as e:
        print(f"Erro ao revogar tokens: {e}")
        return False