console.log("firebase_auth.js carregado!");
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
console.log("Script totalmente carregado e executando");
console.log("Firebase Config:", firebaseConfig);


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

getRedirectResult(auth)
  .then((result) => {
    console.log("Resultado do redirect:", result);
    if (result && result.user) {
      console.log("Usuário autenticado pelo redirect:", result.user);
      window.location.href = "/firebase_test/";
    } else {
      // Log extra para investigar
      console.log("Nenhum usuário retornado pelo redirect.");
      console.log("Usuário atual do Firebase Auth:", auth.currentUser);
      // Mostra a URL atual
      console.log("URL atual:", window.location.href);
    }
  })
  .catch((error) => {
    console.error("Erro no redirect do Google:", error);
    // Log detalhado do erro
    if (error.code) console.error("Código do erro:", error.code);
    if (error.message) console.error("Mensagem do erro:", error.message);
    if (error.email) console.error("E-mail relacionado:", error.email);
    if (error.credential) console.error("Credencial:", error.credential);
  });

document.getElementById('googleSignIn').addEventListener('click', async () => {
    await auth.signOut();
    signInWithRedirect(auth, provider);
});
document.getElementById('googleRegister').addEventListener('click', async () => {
    await auth.signOut();
    signInWithRedirect(auth, provider);
});

document.getElementById('showLogin').onclick = () => {
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = '';
    document.getElementById('registerResult').innerText = '';
};
document.getElementById('showRegister').onclick = () => {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = '';
    document.getElementById('loginResult').innerText = '';
};

async function verifyEmail(email) {
    console.log("[DEBUG] Iniciando verificação de e-mail para:", email);
    const resultDiv = document.getElementById('registerResult');
    resultDiv.className = "msg loading";
    resultDiv.innerText = "Verificando e-mail...";
    
    try {
        console.log("[DEBUG] Enviando requisição para /api/check-email/");
        const response = await fetch('/api/check-email/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': getCSRFToken()
            },
            body: `email=${encodeURIComponent(email)}`
        });

        console.log("[DEBUG] Status da resposta:", response.status);
        const data = await response.json();
        console.log("[DEBUG] Resposta completa da API:", JSON.stringify(data, null, 2));
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro desconhecido na API');
        }
        
        if (data.exists) {
            console.log("[DEBUG] E-mail já existe");
            resultDiv.className = "msg error";
            resultDiv.innerText = "Este e-mail já está cadastrado!";
            return false;
        }

        if (data.status === "verified" && data.valid) {
            console.log("[DEBUG] E-mail verificado e válido");
            return true;
        }

        if (data.status === "rejected" || !data.valid) {
            console.log("[DEBUG] E-mail rejeitado");
            resultDiv.className = "msg error";
            resultDiv.innerText = "E-mail inválido";
            return false;
        }

        console.warn("[DEBUG] Status não tratado:", data.status);
        resultDiv.className = "msg error";
        resultDiv.innerText = "Não foi possível verificar o e-mail";
        return false;
        
    } catch (error) {
        console.error('[DEBUG] Erro completo na verificação:', {
            error: error,
            message: error.message,
            stack: error.stack
        });
        
        resultDiv.className = "msg error";
        
        if (error.message.includes('Failed to fetch')) {
            resultDiv.innerText = "Erro de conexão. Verifique sua internet.";
        } else if (error.message.includes('Resposta da API mal formatada')) {
            resultDiv.innerText = "Problema no servidor. Tente novamente mais tarde.";
        } else {
            resultDiv.innerText = error.message || "Erro ao verificar e-mail. Tente novamente.";
        }
        
        return false;
    }
}

function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || '';
}

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const registerBtn = document.getElementById('registerBtn');
    const originalBtnText = registerBtn.innerText;
    registerBtn.disabled = true;
    registerBtn.innerText = "Processando...";
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const resultDiv = document.getElementById('registerResult');
    
    const isEmailValid = await verifyEmail(email);
    
    if (!isEmailValid) {
        registerBtn.disabled = false;
        registerBtn.innerText = originalBtnText;
        return;
    }
    
    resultDiv.className = "msg loading";
    resultDiv.innerText = "Cadastrando...";

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        resultDiv.className = "msg success";
        resultDiv.innerText = "Usuário cadastrado com sucesso!";
        
        setTimeout(() => {
            document.getElementById('showLogin').click();
        }, 1200);
        
    } catch (error) {
        resultDiv.className = "msg error";
        resultDiv.innerText = "Erro no cadastro: " + error.message;
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerText = originalBtnText;
    }
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const resultDiv = document.getElementById('loginResult');
    resultDiv.className = "msg";
    resultDiv.innerText = "Entrando...";

    console.log("Tentando login com:", {email, password}); // Log dos dados de entrada

    try {
        await signInWithEmailAndPassword(auth, email, password);
        resultDiv.className = "msg success";
        resultDiv.innerText = "Login realizado com sucesso!";
        setTimeout(() => {
            window.location.href = "/home/";
        }, 1000);
    } catch (error) {
        resultDiv.className = "msg error";
        if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
            resultDiv.innerText = "E-mail ou senha incorretos.";
        } else {
            resultDiv.innerText = "Erro: " + error.message;
        }
    }
});
