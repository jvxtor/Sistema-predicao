"""Entrypoint do Firebase Cloud Functions.

Converte a app FastAPI (ASGI) em um callable WSGI via a2wsgi e a expõe
como uma única HTTPS function.
"""
from a2wsgi import ASGIMiddleware
from firebase_functions import https_fn, options

from app.api import app as fastapi_app

wsgi_app = ASGIMiddleware(fastapi_app)


@https_fn.on_request(
    memory=options.MemoryOption.GB_1,
    timeout_sec=60,
    region="us-central1",
)
def api(req: https_fn.Request) -> https_fn.Response:
    return https_fn.Response.from_app(wsgi_app, req.environ)
