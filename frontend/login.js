import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { auth } from "./firebase-init.js";

const form = document.getElementById("auth-form");
const resultBox = document.getElementById("result");
const submitButton = document.getElementById("submit-button");
const tabs = document.querySelectorAll(".tab");

let mode = "login";

const ERROR_MESSAGES = {
  "auth/invalid-email": "E-mail inválido.",
  "auth/user-disabled": "Esta conta foi desativada.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Este e-mail já está cadastrado.",
  "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
};

function showResult(message, type) {
  resultBox.textContent = message;
  resultBox.className = `result ${type}`;
}

function setMode(newMode) {
  mode = newMode;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  submitButton.textContent = mode === "login" ? "Entrar" : "Cadastrar";
  form.password.autocomplete = mode === "login" ? "current-password" : "new-password";
  resultBox.className = "result hidden";
}

tabs.forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "index.html";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;

  const email = form.email.value;
  const password = form.password.value;

  try {
    if (mode === "login") {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }
    window.location.href = "index.html";
  } catch (error) {
    showResult(ERROR_MESSAGES[error.code] || "Não foi possível autenticar. Tente novamente.", "error");
  } finally {
    submitButton.disabled = false;
  }
});
