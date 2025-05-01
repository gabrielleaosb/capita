import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def verify_email_with_hunter(email):
    """
    Verifica um e-mail usando a API Hunter.io
    Retorna (is_valid, reason, score)
    """
    if not settings.HUNTER_API_KEY:
        logger.error("Chave da API Hunter não configurada")
        raise ValueError("Chave da API Hunter não configurada")
    
    try:
        logger.info(f"Verificando e-mail: {email}")
        response = requests.get(
            f'https://api.hunter.io/v2/email-verifier?email={email}&api_key={settings.HUNTER_API_KEY}'
        )
        data = response.json()
        logger.info(f"Resposta da API Hunter: {data}")

        
        if response.status_code == 200:
            result = data.get('data', {})
            status = result.get('status')
            
            is_valid = status in ['valid', 'accept_all', 'unknown']  
            reason = result.get('result', 'Sem motivo específico')
            score = result.get('score', 0)
            
            logger.info(f"Resultado verificação: status={status}, valid={is_valid}, reason={reason}")
            return (is_valid, reason, score)
        
        logger.error(f"Erro na API Hunter: Status {response.status_code}, Response: {data}")
        return (False, f"Erro na API (status {response.status_code})", 0)
    
    except Exception as e:
        logger.error(f"Exceção ao verificar e-mail: {str(e)}")
        return (False, f"Erro na comunicação com a API: {str(e)}", 0)