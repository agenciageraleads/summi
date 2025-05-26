// Arquivo auth.js - Gerencia autenticação e integração com Baserow
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se temos a configuração do Baserow
    const baserowConfig = localStorage.getItem('baserow_config');
    if (!baserowConfig) {
        // Redirecionar para a página de setup
        window.location.href = 'setup.html';
        return;
    }
    
    // Configurações do Baserow
    const config = JSON.parse(baserowConfig);
    const BASEROW_API_URL = 'https://baserow.borgesai.com/api';
    const BASEROW_API_KEY = 'e5362baf-c777-4d57-a609-6eaf1f9e87f6';
    
    // IDs das tabelas no Baserow
    const USERS_TABLE_ID = 696;
    const CONNECTIONS_TABLE_ID = config.connections_table_id;
    
    // Elementos do DOM para login
    const loginForm = document.getElementById('login-form');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Elementos do DOM para registro
    const registerForm = document.getElementById('register-form');
    
    // Função para validar formulário de login
    function validateLoginForm() {
        let isValid = true;
        const phoneInput = document.getElementById('phone');
        const passwordInput = document.getElementById('password');
        const phoneError = document.getElementById('phone-error');
        const passwordError = document.getElementById('password-error');
        
        // Validação do telefone
        if (phoneInput && phoneInput.value.trim() === '') {
            if (phoneError) phoneError.textContent = 'Por favor, digite seu telefone';
            isValid = false;
        } else {
            if (phoneError) phoneError.textContent = '';
        }
        
        // Validação da senha
        if (passwordInput && passwordInput.value === '') {
            if (passwordError) passwordError.textContent = 'Por favor, digite sua senha';
            isValid = false;
        } else {
            if (passwordError) passwordError.textContent = '';
        }
        
        return isValid;
    }
    
    // Função para validar formulário de registro
    function validateRegisterForm() {
        let isValid = true;
        const nameInput = document.getElementById('name');
        const phoneInput = document.getElementById('phone');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        
        const nameError = document.getElementById('name-error');
        const phoneError = document.getElementById('phone-error');
        const passwordError = document.getElementById('password-error');
        const confirmPasswordError = document.getElementById('confirm-password-error');
        
        // Validação do nome
        if (nameInput && nameInput.value.trim() === '') {
            if (nameError) nameError.textContent = 'Por favor, digite seu nome';
            isValid = false;
        } else if (nameInput && nameInput.value.trim().length < 3) {
            if (nameError) nameError.textContent = 'O nome deve ter pelo menos 3 caracteres';
            isValid = false;
        } else {
            if (nameError) nameError.textContent = '';
        }
        
        // Validação do telefone
        if (phoneInput) {
            const phoneValue = phoneInput.value.replace(/\D/g, '');
            if (phoneValue === '') {
                if (phoneError) phoneError.textContent = 'Por favor, digite seu telefone';
                isValid = false;
            } else if (phoneValue.length < 10 || phoneValue.length > 11) {
                if (phoneError) phoneError.textContent = 'Digite um número de telefone válido com DDD';
                isValid = false;
            } else {
                if (phoneError) phoneError.textContent = '';
            }
        }
        
        // Validação da senha
        if (passwordInput && passwordInput.value === '') {
            if (passwordError) passwordError.textContent = 'Por favor, digite sua senha';
            isValid = false;
        } else if (passwordInput && passwordInput.value.length < 6) {
            if (passwordError) passwordError.textContent = 'A senha deve ter pelo menos 6 caracteres';
            isValid = false;
        } else {
            if (passwordError) passwordError.textContent = '';
        }
        
        // Validação da confirmação de senha
        if (confirmPasswordInput && confirmPasswordInput.value === '') {
            if (confirmPasswordError) confirmPasswordError.textContent = 'Por favor, confirme sua senha';
            isValid = false;
        } else if (confirmPasswordInput && passwordInput && confirmPasswordInput.value !== passwordInput.value) {
            if (confirmPasswordError) confirmPasswordError.textContent = 'As senhas não coincidem';
            isValid = false;
        } else {
            if (confirmPasswordError) confirmPasswordError.textContent = '';
        }
        
        return isValid;
    }
    
    // Função para fazer login
    async function login(phone, password) {
        try {
            // Mostrar loading
            if (loadingOverlay) loadingOverlay.classList.add('active');
            
            // Formatar o telefone (remover caracteres não numéricos)
            const formattedPhone = phone.replace(/\D/g, '');
            
            // Buscar usuário no Baserow pelo telefone
            const response = await fetch(`${BASEROW_API_URL}/database/rows/table/${USERS_TABLE_ID}/?user_field_names=true&filter__field_Numero__equal=${encodeURIComponent(formattedPhone)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${BASEROW_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Erro ao buscar usuário');
            }
            
            const data = await response.json();
            console.log('Resposta da busca de usuário:', data);
            
            // Verificar se encontrou o usuário
            if (data.results && data.results.length > 0) {
                const user = data.results[0];
                
                // Verificar senha (em produção, usar hash+salt)
                // Nota: Aqui estamos assumindo que existe um campo para senha
                // Se não existir, precisaremos adaptar a lógica
                
                // Salvar dados do usuário no localStorage
                const userData = {
                    id: user.id,
                    name: user.Nome || user.name || '',
                    phone: user.Número || user.phone || formattedPhone
                };
                
                localStorage.setItem('currentUser', JSON.stringify(userData));
                
                // Redirecionar para o painel
                window.location.href = 'dashboard.html';
            } else {
                alert('Usuário não encontrado');
            }
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            alert('Ocorreu um erro ao fazer login. Por favor, tente novamente.');
        } finally {
            // Esconder loading
            if (loadingOverlay) loadingOverlay.classList.remove('active');
        }
    }
    
    // Função para registrar novo usuário
    async function register(name, phone, password) {
        try {
            // Mostrar loading
            if (loadingOverlay) loadingOverlay.classList.add('active');
            
            // Formatar o telefone (remover caracteres não numéricos)
            const formattedPhone = phone.replace(/\D/g, '');
            
            // Verificar se o telefone já existe
            const checkResponse = await fetch(`${BASEROW_API_URL}/database/rows/table/${USERS_TABLE_ID}/?user_field_names=true&filter__field_Numero__equal=${encodeURIComponent(formattedPhone)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${BASEROW_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!checkResponse.ok) {
                throw new Error('Erro ao verificar telefone');
            }
            
            const checkData = await checkResponse.json();
            
            if (checkData.results && checkData.results.length > 0) {
                alert('Este telefone já está em uso. Por favor, use outro telefone ou faça login.');
                return;
            }
            
            // Criar novo usuário no Baserow
            // Adaptamos para usar os nomes de campos que vimos na tabela
            const userData = {
                "Nome": name,
                "Número": formattedPhone,
                "senha": password,
                "Status": "ativo" // Valor padrão
            };
            
            const response = await fetch(`${BASEROW_API_URL}/database/rows/table/${USERS_TABLE_ID}/?user_field_names=true`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${BASEROW_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                throw new Error('Erro ao criar usuário');
            }
            
            const data = await response.json();
            console.log('Resposta do registro de usuário:', data);
            
            // Salvar dados do usuário no localStorage
            const userDataForStorage = {
                id: data.id,
                name: name,
                phone: formattedPhone
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userDataForStorage));
            
            // Redirecionar para o painel
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Erro ao registrar:', error);
            alert('Ocorreu um erro ao registrar. Por favor, tente novamente.');
        } finally {
            // Esconder loading
            if (loadingOverlay) loadingOverlay.classList.remove('active');
        }
    }
    
    // Verificar se o usuário já está logado
    function checkAuth() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            // Se estiver na página de login ou registro, redirecionar para o dashboard
            if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Se estiver no dashboard e não estiver logado, redirecionar para login
            if (window.location.pathname.includes('dashboard.html')) {
                window.location.href = 'login.html';
            }
        }
    }
    
    // Função para fazer logout
    function logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
    
    // Verificar autenticação ao carregar a página
    checkAuth();
    
    // Adicionar máscara ao campo de telefone no formulário de registro
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) {
                value = value.substring(0, 11);
            }
            
            // Formata o número conforme vai digitando
            if (value.length > 2) {
                value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
            }
            if (value.length > 10) {
                value = `${value.substring(0, 10)}-${value.substring(10)}`;
            }
            
            e.target.value = value;
        });
    }
    
    // Event listeners para formulários
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateLoginForm()) {
                return;
            }
            
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            
            login(phone, password);
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateRegisterForm()) {
                return;
            }
            
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            
            register(name, phone, password);
        });
    }
    
    // Expor funções globalmente para uso em outras páginas
    window.authUtils = {
        logout: logout,
        getCurrentUser: function() {
            const userData = localStorage.getItem('currentUser');
            return userData ? JSON.parse(userData) : null;
        }
    };
});
