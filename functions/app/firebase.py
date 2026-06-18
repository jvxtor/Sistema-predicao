"""Inicialização do Firebase Admin SDK.

Em produção (deployado como Cloud Function) e dentro do emulador, usa as
credenciais/hosts que o próprio ambiente já injeta automaticamente.
Localmente (uvicorn puro, fora do emulador), usa o arquivo apontado por
LOCAL_SERVICE_ACCOUNT_PATH (ver .env). Não usamos a variável padrão
GOOGLE_APPLICATION_CREDENTIALS porque o emulador a sobrescreve com um
arquivo stub próprio.
"""
import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials


def init_firebase() -> None:
    if firebase_admin._apps:
        return

    cred_path = os.environ.get("LOCAL_SERVICE_ACCOUNT_PATH")
    if cred_path and Path(cred_path).exists():
        firebase_admin.initialize_app(credentials.Certificate(cred_path))
    else:
        firebase_admin.initialize_app()
