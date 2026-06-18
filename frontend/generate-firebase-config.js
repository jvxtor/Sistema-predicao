// Lê frontend/.env e gera firebase-config.js (consumido por <script> direto no navegador).
// Rodar: node generate-firebase-config.js
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
const outPath = path.join(__dirname, "firebase-config.js");

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx), line.slice(idx + 1)];
    })
);

const config = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  databaseURL: env.FIREBASE_DATABASE_URL,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

const content = `// Gerado automaticamente a partir de .env — rode "node generate-firebase-config.js" após editar o .env.
window.FIREBASE_CONFIG = ${JSON.stringify(config, null, 2)};
`;

fs.writeFileSync(outPath, content);
console.log(`Gerado ${outPath}`);
