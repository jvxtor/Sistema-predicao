// URL base da API — escolhida automaticamente pelo domínio em que a página está sendo servida.
// Local (localhost/127.0.0.1): aponta pro backend rodando na sua máquina (uvicorn ou emulador).
// Hospedado (Firebase Hosting): aponta pra Cloud Function de produção.
const IS_LOCAL = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE_URL = IS_LOCAL
  ? "http://127.0.0.1:8000"
  : "https://us-central1-akad-fbe7e.cloudfunctions.net/api";
