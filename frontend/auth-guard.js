import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { auth } from "./firebase-init.js";

const userEmailLabel = document.getElementById("user-email");
const logoutButton = document.getElementById("logout-button");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  userEmailLabel.textContent = user.email;
  document.body.classList.remove("auth-pending");
});

logoutButton.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
