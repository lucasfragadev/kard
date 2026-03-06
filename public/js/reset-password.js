/**
 * Reset Password Page JavaScript
 */

// Obter token da URL
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');

// Validar se o token existe
if (!resetToken) {
    showMessage('Token de recuperação não encontrado. Solicite um novo link de recuperação.', 'error');
    setTimeout(() => {
        window.location.href = '/recuperar-senha.html';
    }, 3000);
}

// Elementos do DOM
const resetForm = document.getElementById('reset-password-form');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const messageDiv = document.getElementById('message');

/**
 * Validar senha
 */
function validatePassword(password) {
    if (!password || password.length < 6) {
        return {
            valid: false,
            message: 'A senha deve ter pelo menos 6 caracteres.'
        };
    }
    
    return { valid: true };
}

/**
 * Validar senhas coincidem
 */
function validatePasswordsMatch(password, confirmPassword) {
    if (password !== confirmPassword) {
        return {
            valid: false,
            message: 'As senhas não coincidem.'
        };
    }
    
    return { valid: true };
}

/**
 * Exibir mensagem
 */
function showMessage(message, type = 'error', duration = 5000) {
    messageDiv.textContent = message;
    messageDiv.className = `text-sm mt-4 text-center ${
        type === 'error' 
            ? 'text-red-500 dark:text-red-400' 
            : type === 'success'
            ? 'text-green-500 dark:text-green-400'
            : 'text-yellow-500 dark:text-yellow-400'
    }`;
    messageDiv.classList.remove('hidden');

    if (duration > 0) {
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, duration);
    }
}

/**
 * Mostrar erro de campo
 */
function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
    
    if (inputElement) {
        inputElement.classList.add('border-red-500');
    }
}

/**
 * Limpar erro de campo
 */
function clearFieldError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
    
    if (inputElement) {
        inputElement.classList.remove('border-red-500');
    }
}

/**
 * Configurar validação inline
 */
function setupValidation() {
    // Validação de senha
    passwordInput.addEventListener('blur', () => {
        const password = passwordInput.value;
        clearFieldError('password');
        
        const validation = validatePassword(password);
        if (!validation.valid) {
            showFieldError('password', validation.message);
        }
    });

    passwordInput.addEventListener('input', () => {
        clearFieldError('password');
    });

    // Validação de confirmação de senha
    confirmPasswordInput.addEventListener('blur', () => {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        clearFieldError('confirm-password');
        
        if (confirmPassword) {
            const validation = validatePasswordsMatch(password, confirmPassword);
            if (!validation.valid) {
                showFieldError('confirm-password', validation.message);
            }
        }
    });

    confirmPasswordInput.addEventListener('input', () => {
        clearFieldError('confirm-password');
    });
}

/**
 * Submeter formulário
 */
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const submitBtn = resetForm.querySelector('button[type="submit"]');

    // Limpar erros anteriores
    clearFieldError('password');
    clearFieldError('confirm-password');
    messageDiv.classList.add('hidden');

    // Validações
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        showFieldError('password', passwordValidation.message);
        return;
    }

    const matchValidation = validatePasswordsMatch(password, confirmPassword);
    if (!matchValidation.valid) {
        showFieldError('confirm-password', matchValidation.message);
        return;
    }

    // Desabilitar botão durante requisição
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Redefinindo...';

    try {
        const response = await fetch('/api/v1/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: resetToken,
                novaSenha: password,
                confirmacaoSenha: confirmPassword
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showMessage(data.message || 'Senha redefinida com sucesso!', 'success', 0);
            
            // Redirecionar para login após 2 segundos
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } else {
            showMessage(data.error || 'Erro ao redefinir senha. Tente novamente.', 'error');
        }
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        showMessage('Erro ao conectar com o servidor. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Redefinir Senha';
    }
});

// Inicializar validações
setupValidation();