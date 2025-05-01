console.log("firebase_auth.js carregado!");
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCU8VUf9yNIgY3BiqsENRdHuaFqWri-WjA",
    authDomain: "capita-3da27.firebaseapp.com",
    projectId: "capita-3da27",
    storageBucket: "capita-3da27.appspot.com",
    messagingSenderId: "235088314894",
    appId: "1:235088314894:web:9e7acbd6183d3e0b9bb25f",
    measurementId: "G-9TRKQQKF1X"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
    const resultDiv = document.getElementById('registerResult');
    resultDiv.className = "msg loading";
    resultDiv.innerText = "Verificando e-mail...";
    
    try {
        const response = await fetch('/api/check-email/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': getCSRFToken()
            },
            body: `email=${encodeURIComponent(email)}`
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro desconhecido');
        }
        
        switch(data.status) {
            case 'valid':
                return true;
                
            case 'invalid':
                resultDiv.className = "msg error";
                switch(data.code) {
                    case 'email_already_exists':
                        resultDiv.innerText = "Este e-mail já está cadastrado!";
                        break;
                    case 'invalid_format':
                        resultDiv.innerText = "Por favor, insira um e-mail válido";
                        break;
                    case 'email_verification_failed':
                        resultDiv.innerText = data.message;
                        break;
                    default:
                        resultDiv.innerText = "E-mail inválido";
                }
                return false;
                
            case 'error':
                resultDiv.className = "msg error";
                resultDiv.innerText = data.message || "Erro no servidor";
                return false;
                
            default:
                resultDiv.className = "msg error";
                resultDiv.innerText = "Digite um e-mail válido";
                return false;
        }
        
    } catch (error) {
        console.error('Erro ao verificar e-mail:', error);
        resultDiv.className = "msg error";
        
        if (error.message.includes('Failed to fetch')) {
            resultDiv.innerText = "Erro de conexão. Verifique sua internet.";
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