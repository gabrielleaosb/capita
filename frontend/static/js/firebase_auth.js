console.log("firebase_auth.js carregado!");
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider
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
    measurementId: "G-9TRKQQKF1X"
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
  registerForm: document.getElementById('registerForm'),
  loginForm: document.getElementById('loginForm'),
  googleSignIn: document.getElementById('googleSignIn'),
  googleRegister: document.getElementById('googleRegister'),
  showLogin: document.getElementById('showLogin'),
  showRegister: document.getElementById('showRegister'),
  screens: {
    register: document.getElementById('registerScreen'),
    login: document.getElementById('loginScreen')
  }
};

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
  const response = await fetch('/verify_google_token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRFToken': getCSRFToken()
    },
    body: `token=${token}`
  });
  
  const data = await response.json();
  if (data.status === 'success') {
    window.location.href = data.redirect_url || '/home/';
  } else {
    throw new Error(data.message || 'Erro no backend');
  }
}

function getFirebaseErrorMessage(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'Este e-mail já está cadastrado.';
        case 'auth/invalid-email':
            return 'E-mail inválido.';
        case 'auth/weak-password':
            return 'A senha deve ter pelo menos 6 caracteres.';
        case 'auth/user-not-found':
            return 'Usuário não encontrado.';
        case 'auth/wrong-password':
            return 'Senha incorreta.';
        case 'auth/too-many-requests':
            return 'Muitas tentativas. Tente novamente mais tarde.';
        case 'auth/invalid-credential':
            return 'E-mail ou senha inválidos.'; 
        default:
        return error.message || 'Ocorreu um erro. Tente novamente.';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
  
    const resp = await fetch('/api/check_email/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCSRFToken()
      },
      body: new URLSearchParams({ email })
    });
    const data = await resp.json();
  
    if (!data.valid) {
      document.getElementById('registerResult').textContent = data.reason || 'E-mail inválido';
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        formData.get('password')
      );
      await updateProfile(userCredential.user, {
        displayName: formData.get('name')
      });
      await sendTokenToBackend(await userCredential.user.getIdToken());
    } catch (error) {
      document.getElementById('registerResult').textContent = getFirebaseErrorMessage(error);
    }
  }
  
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
        const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.get('email'),
        formData.get('password')
        );
        await sendTokenToBackend(await userCredential.user.getIdToken());
    } catch (error) {
        document.getElementById('loginResult').textContent = getFirebaseErrorMessage(error);
    }
}

async function handleLogout(e) {
    e.preventDefault();
    try {
      await auth.signOut();
      await fetch('/logout/', {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCSRFToken()
        }
      });
      window.location.href = '/firebase-test/?logout=1';
    } catch (error) {
      alert('Erro ao deslogar: ' + error.message);
    }
  }

  function initListeners() {
    uiElements.showLogin?.addEventListener('click', () => {
      const slideContainer = document.getElementById('slideContainer');
      if (slideContainer) {
        slideContainer.style.transform = "translateX(0%)";
      } else {
        console.error("Elemento 'slideContainer' não encontrado.");
      }
    });
  
    uiElements.showRegister?.addEventListener('click', () => {
      const slideContainer = document.getElementById('slideContainer');
      if (slideContainer) {
        slideContainer.style.transform = "translateX(-50%)";
      } else {
        console.error("Elemento 'slideContainer' não encontrado.");
      }
    });
  
    uiElements.registerForm?.addEventListener('submit', handleRegister);
    uiElements.loginForm?.addEventListener('submit', handleLogin);
  
    uiElements.googleSignIn?.addEventListener('click', () => signInWithRedirect(auth, provider));
    uiElements.googleRegister?.addEventListener('click', () => signInWithRedirect(auth, provider));
  
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
  }

document.addEventListener('DOMContentLoaded', async () => {
  initListeners();
  await handleAuthRedirect();
});