/**
 * KARD - Script de Autenticação (Login e Registro)
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // LOGIN
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('password').value;
        const msg = document.getElementById('error-msg');

        try {
            const res = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao entrar');

            localStorage.setItem('kard_token', data.token);
            window.location.href = '/index.html';
        } catch (err) {
            showError(msg, err.message);
        }
    });

    // REGISTRO
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const senha = document.getElementById('reg-password').value;
        const confirmSenha = document.getElementById('reg-confirm').value;
        const msg = document.getElementById('auth-msg');

        // Validações Locais
        if (senha.length < 6) {
            showError(msg, "A senha precisa ter pelo menos 6 caracteres.");
            return;
        }

        if (senha !== confirmSenha) {
            showError(msg, "As senhas não conferem.");
            return;
        }

        try {
            const res = await fetch('/auth/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao registrar');

            msg.innerText = "Conta criada com sucesso! Redirecionando...";
            msg.className = "text-center text-sm mt-4 text-emerald-400 font-bold animate-pulse";
            msg.classList.remove('hidden');

            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);

        } catch (err) {
            showError(msg, err.message);
        }
    });

    function showError(element, message) {
        if (!element) return;
        element.innerText = message;
        element.className = "text-center text-sm mt-4 text-red-400 font-bold";
        element.classList.remove('hidden');
    }
});

// Função Global para alternar visibilidade da senha
function togglePass(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === "password") {
        input.type = "text";
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />`;
        icon.parentElement.classList.add('text-indigo-400');
    } else {
        input.type = "password";
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`;
        icon.parentElement.classList.remove('text-indigo-400');
    }
}

function logout() {
    localStorage.removeItem('kard_token');
    window.location.href = '/login.html';
}