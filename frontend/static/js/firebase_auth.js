console.log("firebase_auth.js carregado!");
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Verificação EXTRA robusta
if (!window.firebaseConfig) {
  console.error("ERRO: Configuração do Firebase não encontrada no window");
  window.firebaseConfig = {
    apiKey: "AIzaSyCU8VUf9yNIgY3BiqsENRdHuaFqWri-WjA",
    authDomain: "capita-3da27.firebaseapp.com",
    projectId: "capita-3da27",
    storageBucket: "capita-3da27.appspot.com",
    messagingSenderId: "235088314894",
    appId: "1:235088314894:web:9e7acbd6183d3e0b9bb25f",
    measurementId: "G-9TRKQQKF1X",
  };
  console.warn("Usando configuração fallback hardcoded");
}

console.log("Configuração que será usada:", window.firebaseConfig);

const firebaseConfig = window.firebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

console.log("Firebase Config:", window.firebaseConfig);

const uiElements = {
  registerForm: document.getElementById("registerForm"),
  loginForm: document.getElementById("loginForm"),
  googleSignIn: document.getElementById("googleSignIn"),
  googleRegister: document.getElementById("googleRegister"),
  showLogin: document.getElementById("showLogin"),
  showRegister: document.getElementById("showRegister"),
  forgotPasswordBtn: document.getElementById("forgotPasswordBtn"),
  backToLogin: document.querySelector(".back-to-login"),
  screens: {
    register: document.getElementById("registerScreen"),
    login: document.getElementById("loginScreen"),
  },
};

// Função utilitária para mensagens animadas e coloridas
function showMessage(element, message, type = "info") {
  element.textContent = message;
  element.classList.remove("text-red-600", "text-green-600", "animate-pulse-grow");
  element.style.color = "";
  element.style.fontWeight = "";

  // Azul para sucesso, vermelho para erro, verde para info
  if (type === "success") {
    element.classList.add("animate-pulse-grow");
    element.style.color = "#06A3DA";
    element.style.fontWeight = "bold";
  } else if (type === "error") {
    element.classList.add("animate-pulse-grow");
    element.style.color = "#e11d48"; // vermelho-600
    element.style.fontWeight = "bold";
  } else if (type === "info") {
    element.classList.add("animate-pulse-grow");
    element.style.color = "#22c55e"; // verde-500
    element.style.fontWeight = "bold";
  }
}

function getCSRFToken() {
  return document.querySelector('meta[name="csrf-token"]').content;
}

async function handleAuthRedirect() {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      const token = await result.user.getIdToken();
      await sendTokenToBackend(token);
    }
  } catch (error) {
    console.error("Erro no redirect:", error);
    alert(`Erro na autenticação: ${error.message}`);
  }
}

async function sendTokenToBackend(token) {
  const response = await fetch("/verify_google_token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRFToken": getCSRFToken(),
    },
    body: `token=${token}`,
  });

  const data = await response.json();
  if (data.status === "success") {
    const loginDiv = document.getElementById("loginResult");
    const registerDiv = document.getElementById("registerResult");
    let targetDiv = loginDiv || registerDiv;
    if (targetDiv) {
      showMessage(
        targetDiv,
        loginDiv ? "Logado com sucesso!" : "Conta criada com sucesso!",
        "success"
      );
      setTimeout(() => {
        window.location.href = data.redirect_url || "/home/";
      }, 2200);
    } else {
      setTimeout(() => {
        window.location.href = data.redirect_url || "/home/";
      }, 2200);
    }
  } else {
    throw new Error(data.message || "Erro no backend");
  }
}

function getFirebaseErrorMessage(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Este e-mail já está cadastrado.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/weak-password":
      return "A senha deve ter pelo menos 6 caracteres.";
    case "auth/user-not-found":
      return "Usuário não encontrado.";
    case "auth/wrong-password":
      return "Senha incorreta.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente mais tarde.";
    case "auth/invalid-credential":
      return "E-mail ou senha inválidos.";
    default:
      return error.message || "Ocorreu um erro. Tente novamente.";
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const email = formData.get("email");
  const resultElement = document.getElementById("registerResult");

  const resp = await fetch("/api/check_email/", {
    method: "POST",
    headers: {
      "X-CSRFToken": getCSRFToken(),
    },
    body: new URLSearchParams({ email }),
  });
  const data = await resp.json();

  if (!data.valid) {
    showMessage(resultElement, data.reason || "E-mail inválido", "error");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      formData.get("password")
    );
    await updateProfile(userCredential.user, {
      displayName: formData.get("name"),
    });
    showMessage(resultElement, "Conta criada com sucesso!", "success");
    await sendTokenToBackend(await userCredential.user.getIdToken());
  } catch (error) {
    showMessage(resultElement, getFirebaseErrorMessage(error), "error");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const resultElement = document.getElementById("loginResult");
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      formData.get("email"),
      formData.get("password")
    );
    await sendTokenToBackend(await userCredential.user.getIdToken());
  } catch (error) {
    showMessage(resultElement, getFirebaseErrorMessage(error), "error");
  }
}

async function handleLogout(e) {
  e.preventDefault();
  try {
    await auth.signOut();
    await fetch("/logout/", {
      method: "POST",
      headers: {
        "X-CSRFToken": getCSRFToken(),
      },
    });
    window.location.href = "/firebase-test/?logout=1";
  } catch (error) {
    alert("Erro ao deslogar: " + error.message);
  }
}

function initListeners() {
  uiElements.showLogin?.addEventListener("click", () => {
    const slideContainer = document.getElementById("slideContainer");
    if (slideContainer) {
      slideContainer.style.transform = "translateX(0%)";
    } else {
      console.error("Elemento 'slideContainer' não encontrado.");
    }
  });

  uiElements.showRegister?.addEventListener("click", () => {
    const slideContainer = document.getElementById("slideContainer");
    if (slideContainer) {
      slideContainer.style.transform = "translateX(-50%)";
    } else {
      console.error("Elemento 'slideContainer' não encontrado.");
    }
  });

  uiElements.registerForm?.addEventListener("submit", handleRegister);
  uiElements.loginForm?.addEventListener("submit", handleLogin);
  uiElements.forgotPasswordForm?.addEventListener('submit', handleForgotPassword);

  uiElements.googleSignIn?.addEventListener("click", () =>
    signInWithRedirect(auth, provider)
  );
  uiElements.googleRegister?.addEventListener("click", () =>
    signInWithRedirect(auth, provider)
  );

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
}

// LÓGICA DE REDEFINIÇÃO DE SENHA
async function handleForgotPassword(e) {
  e.preventDefault();
  const emailInput = document.getElementById("resetEmail");
  const resultElement = document.getElementById("forgotResult");
  const email = emailInput?.value.trim();

  // Limpa mensagens anteriores
  resultElement.textContent = "";
  resultElement.classList.remove("text-green-600", "text-red-600", "animate-pulse-grow");
  resultElement.style.color = "";
  resultElement.style.fontWeight = "";

  if (!email) {
    showMessage(resultElement, "Por favor, insira um e-mail válido.", "error");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showMessage(resultElement, "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.", "info");
    emailInput.value = "";
  } catch (error) {
    showMessage(resultElement, "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.", "info");
  }
}

// Garante que o listener está correto (não duplique!)
document.getElementById("forgotPasswordForm")?.addEventListener("submit", handleForgotPassword);

function setupFormSwitching() {
  const formContainer = document.querySelector('.form-container');
  const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
  const backToLogin = document.querySelector('.back-to-login');

  forgotPasswordBtn?.addEventListener('click', function(e) {
    e.preventDefault();
    formContainer.classList.add('slide-left');
    const loginEmail = document.getElementById('loginEmail')?.value;
    if (loginEmail && document.getElementById('resetEmail')) {
      document.getElementById('resetEmail').value = loginEmail;
    }
  });

  backToLogin?.addEventListener('click', function() {
    formContainer.classList.remove('slide-left');
  });
}

function setupPasswordToggle() {
  const passwordInput = document.getElementById('loginPassword');
  const togglePassword = document.getElementById('togglePassword');
  const eyeIcon = document.getElementById('eyeIcon');
  let visible = false;

  if (togglePassword && passwordInput && eyeIcon) {
    togglePassword.addEventListener('click', function () {
      visible = !visible;
      passwordInput.type = visible ? 'text' : 'password';
      eyeIcon.src = visible
        ? "/static/images/icons/visibility_off_black.svg"
        : "/static/images/icons/visibility_on_black.svg";
      eyeIcon.alt = visible ? "Ocultar senha" : "Mostrar senha";
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  setupFormSwitching();
  setupPasswordToggle();
  initListeners();
  await handleAuthRedirect();
});