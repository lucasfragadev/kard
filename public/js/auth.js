/**
 * KARD - Script de Autenticação (Login e Registro)
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Configurar validação inline para login
    if (loginForm) {
        setupLoginValidation();
    }

    // Configurar validação inline para registro
    if (registerForm) {
        setupRegisterValidation();
    }

    // LOGIN
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('password').value;
        const msg = document.getElementById('error-msg');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        // Validar antes de enviar
        if (!validateEmail(email)) {
            showMessage(msg, 'Por favor, insira um e-mail válido.', 'error');
            return;
        }

        if (!senha || senha.length < 6) {
            showMessage(msg, 'A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }

        // Desabilitar botão durante requisição
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Entrando...';

        try {
            const res = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao entrar');

            showMessage(msg, 'Login realizado com sucesso!', 'success');
            localStorage.setItem('kard_token', data.token);
            
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        } catch (err) {
            showMessage(msg, err.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Entrar';
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
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        // Validações Locais
        if (!nome || nome.trim().length < 3) {
            showMessage(msg, "O nome deve ter pelo menos 3 caracteres.", 'error');
            return;
        }

        if (!validateEmail(email)) {
            showMessage(msg, "Por favor, insira um e-mail válido.", 'error');
            return;
        }

        if (senha.length < 6) {
            showMessage(msg, "A senha precisa ter pelo menos 6 caracteres.", 'error');
            return;
        }

        if (senha !== confirmSenha) {
            showMessage(msg, "As senhas não conferem.", 'error');
            return;
        }

        // Desabilitar botão durante requisição
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Criando conta...';

        try {
            const res = await fetch('/auth/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao registrar');

            showMessage(msg, "Conta criada com sucesso! Redirecionando...", 'success');

            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);

        } catch (err) {
            showMessage(msg, err.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Criar Conta';
        }
    });

    /**
     * Configurar validação inline para formulário de login
     */
    function setupLoginValidation() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        // Criar elementos de mensagem de erro inline
        createInlineError(emailInput, 'email-error');
        createInlineError(passwordInput, 'password-error');

        // Validação em tempo real
        emailInput.addEventListener('blur', () => {
            validateFieldEmail(emailInput);
            updateSubmitButton(loginForm);
        });

        emailInput.addEventListener('input', () => {
            if (emailInput.classList.contains('invalid')) {
                validateFieldEmail(emailInput);
                updateSubmitButton(loginForm);
            }
        });

        passwordInput.addEventListener('blur', () => {
            validateFieldPassword(passwordInput);
            updateSubmitButton(loginForm);
        });

        passwordInput.addEventListener('input', () => {
            if (passwordInput.classList.contains('invalid')) {
                validateFieldPassword(passwordInput);
                updateSubmitButton(loginForm);
            }
        });

        // Validação inicial ao carregar a página
        updateSubmitButton(loginForm);
    }

    /**
     * Configurar validação inline para formulário de registro
     */
    function setupRegisterValidation() {
        const nameInput = document.getElementById('reg-name');
        const emailInput = document.getElementById('reg-email');
        const passwordInput = document.getElementById('reg-password');
        const confirmInput = document.getElementById('reg-confirm');
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        // Criar elementos de mensagem de erro inline
        createInlineError(nameInput, 'reg-name-error');
        createInlineError(emailInput, 'reg-email-error');
        createInlineError(passwordInput, 'reg-password-error');
        createInlineError(confirmInput, 'reg-confirm-error');

        // Validação em tempo real
        nameInput.addEventListener('blur', () => {
            validateFieldName(nameInput);
            updateSubmitButton(registerForm);
        });

        nameInput.addEventListener('input', () => {
            if (nameInput.classList.contains('invalid')) {
                validateFieldName(nameInput);
                updateSubmitButton(registerForm);
            }
        });

        emailInput.addEventListener('blur', () => {
            validateFieldEmail(emailInput);
            updateSubmitButton(registerForm);
        });

        emailInput.addEventListener('input', () => {
            if (emailInput.classList.contains('invalid')) {
                validateFieldEmail(emailInput);
                updateSubmitButton(registerForm);
            }
        });

        passwordInput.addEventListener('blur', () => {
            validateFieldPassword(passwordInput, true);
            updateSubmitButton(registerForm);
        });

        passwordInput.addEventListener('input', () => {
            validateFieldPassword(passwordInput, true);
            if (confirmInput.value) {
                validateFieldConfirmPassword(confirmInput, passwordInput);
            }
            updateSubmitButton(registerForm);
        });

        confirmInput.addEventListener('blur', () => {
            validateFieldConfirmPassword(confirmInput, passwordInput);
            updateSubmitButton(registerForm);
        });

        confirmInput.addEventListener('input', () => {
            if (confirmInput.classList.contains('invalid')) {
                validateFieldConfirmPassword(confirmInput, passwordInput);
                updateSubmitButton(registerForm);
            }
        });

        // Validação inicial ao carregar a página
        updateSubmitButton(registerForm);
    }

    /**
     * Criar elemento de erro inline abaixo do campo
     */
    function createInlineError(inputElement, errorId) {
        if (!inputElement || document.getElementById(errorId)) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.id = errorId;
        errorDiv.className = 'inline-error hidden text-xs text-red-400 mt-1 transition-all duration-300';
        inputElement.parentElement.appendChild(errorDiv);
    }

    /**
     * Validar campo de nome
     */
    function validateFieldName(input) {
        const value = input.value.trim();
        const errorElement = document.getElementById(input.id + '-error');

        if (!value || value.length < 3) {
            setFieldInvalid(input, errorElement, 'O nome deve ter pelo menos 3 caracteres');
            return false;
        }

        setFieldValid(input, errorElement);
        return true;
    }

    /**
     * Validar campo de email
     */
    function validateFieldEmail(input) {
        const value = input.value.trim();
        const errorElement = document.getElementById(input.id + '-error');

        if (!value) {
            setFieldInvalid(input, errorElement, 'E-mail é obrigatório');
            return false;
        }

        if (!validateEmail(value)) {
            setFieldInvalid(input, errorElement, 'E-mail inválido');
            return false;
        }

        setFieldValid(input, errorElement);
        return true;
    }

    /**
     * Validar campo de senha
     */
    function validateFieldPassword(input, showStrength = false) {
        const value = input.value;
        const errorElement = document.getElementById(input.id + '-error');

        if (!value) {
            setFieldInvalid(input, errorElement, 'Senha é obrigatória');
            return false;
        }

        if (value.length < 6) {
            setFieldInvalid(input, errorElement, 'A senha deve ter pelo menos 6 caracteres');
            return false;
        }

        if (showStrength) {
            const strength = getPasswordStrength(value);
            if (strength === 'fraca') {
                setFieldWarning(input, errorElement, 'Senha fraca. Considere adicionar números e caracteres especiais');
            } else if (strength === 'média') {
                setFieldWarning(input, errorElement, 'Senha média. Considere adicionar caracteres especiais');
            } else {
                setFieldValid(input, errorElement, 'Senha forte');
            }
        } else {
            setFieldValid(input, errorElement);
        }

        return true;
    }

    /**
     * Validar campo de confirmação de senha
     */
    function validateFieldConfirmPassword(confirmInput, passwordInput) {
        const confirmValue = confirmInput.value;
        const passwordValue = passwordInput.value;
        const errorElement = document.getElementById(confirmInput.id + '-error');

        if (!confirmValue) {
            setFieldInvalid(confirmInput, errorElement, 'Confirmação de senha é obrigatória');
            return false;
        }

        if (confirmValue !== passwordValue) {
            setFieldInvalid(confirmInput, errorElement, 'As senhas não conferem');
            return false;
        }

        setFieldValid(confirmInput, errorElement, 'As senhas conferem');
        return true;
    }

    /**
     * Marcar campo como inválido
     */
    function setFieldInvalid(input, errorElement, message) {
        input.classList.remove('valid');
        input.classList.add('invalid');
        input.classList.add('border-red-400');
        input.classList.remove('border-green-400');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden', 'text-yellow-400', 'text-green-400');
            errorElement.classList.add('text-red-400');
        }
    }

    /**
     * Marcar campo como válido
     */
    function setFieldValid(input, errorElement, message = '') {
        input.classList.remove('invalid', 'border-red-400', 'border-yellow-400');
        input.classList.add('valid', 'border-green-400');
        
        if (errorElement) {
            if (message) {
                errorElement.textContent = message;
                errorElement.classList.remove('hidden', 'text-red-400', 'text-yellow-400');
                errorElement.classList.add('text-green-400');
            } else {
                errorElement.classList.add('hidden');
            }
        }
    }

    /**
     * Marcar campo com warning
     */
    function setFieldWarning(input, errorElement, message) {
        input.classList.remove('invalid', 'border-red-400', 'border-green-400');
        input.classList.add('valid', 'border-yellow-400');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden', 'text-red-400', 'text-green-400');
            errorElement.classList.add('text-yellow-400');
        }
    }

    /**
     * Atualizar estado do botão de submit
     */
    function updateSubmitButton(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const inputs = form.querySelectorAll('input[required], input[type="email"], input[type="password"]');
        let allValid = true;

        inputs.forEach(input => {
            if (input.classList.contains('invalid') || (!input.value && input.hasAttribute('required'))) {
                allValid = false;
            }
        });

        submitBtn.disabled = !allValid;
        
        if (!allValid) {
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    /**
     * Validar formato de e-mail
     */
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Calcular força da senha
     */
    function getPasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

        if (strength <= 2) return 'fraca';
        if (strength <= 3) return 'média';
        return 'forte';
    }

    /**
     * Exibir mensagem com tipo (error/success/warning)
     * @param {HTMLElement} element - Elemento onde exibir a mensagem
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo da mensagem (error, success, warning)
     * @param {number} duration - Duração em ms antes de auto-dismiss (0 = não dismissar)
     */
    function showMessage(element, message, type = 'error', duration = 5000) {
        if (!element) return;

        // Limpar classes anteriores
        element.className = 'text-center text-sm mt-4 font-bold transition-all duration-300 transform';

        // Aplicar classes baseadas no tipo
        const typeClasses = {
            error: 'text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3',
            success: 'text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded-lg p-3',
            warning: 'text-yellow-400 bg-yellow-900/20 border border-yellow-800 rounded-lg p-3'
        };

        // Adicionar ícone baseado no tipo
        const icons = {
            error: '❌',
            success: '✅',
            warning: '⚠️'
        };

        element.className += ` ${typeClasses[type] || typeClasses.error}`;
        element.innerHTML = `<span class="inline-block mr-2">${icons[type] || icons.error}</span>${message}`;
        
        // Animação de entrada
        element.classList.remove('hidden');
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 10);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                dismissMessage(element);
            }, duration);
        }
    }

    /**
     * Ocultar mensagem com animação
     */
    function dismissMessage(element) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            element.classList.add('hidden');
        }, 300);
    }

    // Tornar funções disponíveis globalmente se necessário
    window.showMessage = showMessage;
    window.dismissMessage = dismissMessage;
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