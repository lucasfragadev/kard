/**
 * KARD - Script de Gerenciamento de Perfil
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = '/api/v1';
    
    // Elementos do formulário
    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');
    const deleteAccountBtn = document.getElementById('btn-delete-account');
    
    // Carregar dados do usuário ao iniciar
    loadUserData();
    
    // Configurar validação inline
    if (profileForm) {
        setupProfileValidation();
    }
    
    if (passwordForm) {
        setupPasswordValidation();
    }
    
    /**
     * Carregar dados do usuário
     */
    async function loadUserData() {
        const token = localStorage.getItem('kard_token');
        
        if (!token) {
            window.location.href = '/login.html';
            return;
        }
        
        showLoading();
        
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 401) {
                localStorage.removeItem('kard_token');
                window.location.href = '/login.html';
                return;
            }
            
            if (!response.ok) {
                throw new Error('Erro ao carregar dados do usuário');
            }
            
            const data = await response.json();
            
            if (data.success && data.data) {
                document.getElementById('user-name').value = data.data.nome || '';
                document.getElementById('user-email').value = data.data.email || '';
            }
        } catch (error) {
            console.error('Erro:', error);
            showFeedback('Erro ao carregar dados do perfil', 'error');
        } finally {
            hideLoading();
        }
    }
    
    /**
     * Configurar validação do formulário de perfil
     */
    function setupProfileValidation() {
        const nameInput = document.getElementById('user-name');
        const emailInput = document.getElementById('user-email');
        
        createInlineError(nameInput, 'user-name-error');
        createInlineError(emailInput, 'user-email-error');
        
        nameInput.addEventListener('blur', () => {
            validateFieldName(nameInput);
            updateSubmitButton(profileForm);
        });
        
        nameInput.addEventListener('input', () => {
            if (nameInput.classList.contains('invalid')) {
                validateFieldName(nameInput);
                updateSubmitButton(profileForm);
            }
        });
        
        emailInput.addEventListener('blur', () => {
            validateFieldEmail(emailInput);
            updateSubmitButton(profileForm);
        });
        
        emailInput.addEventListener('input', () => {
            if (emailInput.classList.contains('invalid')) {
                validateFieldEmail(emailInput);
                updateSubmitButton(profileForm);
            }
        });
        
        updateSubmitButton(profileForm);
    }
    
    /**
     * Configurar validação do formulário de senha
     */
    function setupPasswordValidation() {
        const currentPasswordInput = document.getElementById('current-password');
        const newPasswordInput = document.getElementById('new-password');
        const confirmPasswordInput = document.getElementById('confirm-new-password');
        
        createInlineError(currentPasswordInput, 'current-password-error');
        createInlineError(newPasswordInput, 'new-password-error');
        createInlineError(confirmPasswordInput, 'confirm-new-password-error');
        
        currentPasswordInput.addEventListener('blur', () => {
            validateFieldPassword(currentPasswordInput);
            updateSubmitButton(passwordForm);
        });
        
        newPasswordInput.addEventListener('blur', () => {
            validateFieldPassword(newPasswordInput, true);
            updateSubmitButton(passwordForm);
        });
        
        newPasswordInput.addEventListener('input', () => {
            validateFieldPassword(newPasswordInput, true);
            if (confirmPasswordInput.value) {
                validateFieldConfirmPassword(confirmPasswordInput, newPasswordInput);
            }
            updateSubmitButton(passwordForm);
        });
        
        confirmPasswordInput.addEventListener('blur', () => {
            validateFieldConfirmPassword(confirmPasswordInput, newPasswordInput);
            updateSubmitButton(passwordForm);
        });
        
        confirmPasswordInput.addEventListener('input', () => {
            if (confirmPasswordInput.classList.contains('invalid')) {
                validateFieldConfirmPassword(confirmPasswordInput, newPasswordInput);
                updateSubmitButton(passwordForm);
            }
        });
        
        updateSubmitButton(passwordForm);
    }
    
    /**
     * Atualizar dados do perfil
     */
    profileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('user-name').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const submitBtn = profileForm.querySelector('button[type="submit"]');
        
        if (!nome || nome.length < 3) {
            showFeedback('O nome deve ter pelo menos 3 caracteres', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showFeedback('Por favor, insira um e-mail válido', 'error');
            return;
        }
        
        const token = localStorage.getItem('kard_token');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Salvando...';
        
        try {
            const response = await fetch(`${API_BASE}/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nome, email })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao atualizar perfil');
            }
            
            showFeedback('Perfil atualizado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro:', error);
            showFeedback(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Salvar Alterações';
        }
    });
    
    /**
     * Alterar senha
     */
    passwordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const senhaAtual = document.getElementById('current-password').value;
        const novaSenha = document.getElementById('new-password').value;
        const confirmSenha = document.getElementById('confirm-new-password').value;
        const submitBtn = passwordForm.querySelector('button[type="submit"]');
        
        if (!senhaAtual || senhaAtual.length < 6) {
            showFeedback('Senha atual é obrigatória', 'error');
            return;
        }
        
        if (!novaSenha || novaSenha.length < 6) {
            showFeedback('A nova senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }
        
        if (novaSenha !== confirmSenha) {
            showFeedback('As senhas não conferem', 'error');
            return;
        }
        
        if (senhaAtual === novaSenha) {
            showFeedback('A nova senha deve ser diferente da senha atual', 'error');
            return;
        }
        
        const token = localStorage.getItem('kard_token');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Alterando...';
        
        try {
            const response = await fetch(`${API_BASE}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ senhaAtual, novaSenha })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao alterar senha');
            }
            
            showFeedback('Senha alterada com sucesso!', 'success');
            passwordForm.reset();
            
        } catch (error) {
            console.error('Erro:', error);
            showFeedback(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Alterar Senha';
        }
    });
    
    /**
     * Excluir conta
     */
    deleteAccountBtn?.addEventListener('click', () => {
        const modal = document.getElementById('confirmation-modal');
        if (!modal) return;
        
        document.getElementById('modal-title').textContent = 'Excluir Conta';
        document.getElementById('modal-message').textContent = 'Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos. Tem certeza que deseja continuar?';
        modal.classList.remove('hidden');
        
        document.getElementById('modal-confirm').onclick = async () => {
            modal.classList.add('hidden');
            
            const token = localStorage.getItem('kard_token');
            showLoading();
            
            try {
                const response = await fetch(`${API_BASE}/auth/delete-account`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    localStorage.clear();
                    window.location.href = '/registro.html';
                } else {
                    throw new Error('Erro ao excluir conta');
                }
            } catch (error) {
                console.error('Erro:', error);
                showFeedback('Erro ao excluir conta', 'error');
            } finally {
                hideLoading();
            }
        };
        
        document.getElementById('modal-cancel').onclick = () => {
            modal.classList.add('hidden');
        };
    });
    
    /**
     * Criar elemento de erro inline
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
     * Exibir feedback
     */
    function showFeedback(message, type = 'error', duration = 5000) {
        const feedbackElement = document.getElementById('feedback-message');
        if (!feedbackElement) return;
        
        feedbackElement.className = 'mb-6 p-4 rounded-lg transition-all duration-300 transform';
        
        const typeClasses = {
            error: 'bg-red-900/20 border border-red-800 text-red-400',
            success: 'bg-emerald-900/20 border border-emerald-800 text-emerald-400',
            warning: 'bg-yellow-900/20 border border-yellow-800 text-yellow-400'
        };
        
        const icons = {
            error: '❌',
            success: '✅',
            warning: '⚠️'
        };
        
        feedbackElement.className += ` ${typeClasses[type] || typeClasses.error}`;
        feedbackElement.innerHTML = `<span class="inline-block mr-2">${icons[type] || icons.error}</span>${message}`;
        
        feedbackElement.classList.remove('hidden');
        feedbackElement.style.opacity = '0';
        feedbackElement.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            feedbackElement.style.opacity = '1';
            feedbackElement.style.transform = 'translateY(0)';
        }, 10);
        
        if (duration > 0) {
            setTimeout(() => {
                dismissFeedback(feedbackElement);
            }, duration);
        }
    }
    
    /**
     * Ocultar feedback
     */
    function dismissFeedback(element) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            element.classList.add('hidden');
        }, 300);
    }
    
    /**
     * Mostrar loading
     */
    function showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
    }
    
    /**
     * Ocultar loading
     */
    function hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }
    
    // Tornar funções disponíveis globalmente
    window.showFeedback = showFeedback;
    window.dismissFeedback = dismissFeedback;
});