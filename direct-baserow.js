// Arquivo direct-baserow.js - Integração direta com Baserow sem setup complexo
document.addEventListener("DOMContentLoaded", function() {
    // Configurações do Baserow
    const BASEROW_API_URL = "https://baserow.borgesai.com/api";
    const BASEROW_API_KEY = "dIkBVLKuBMKf1lOhUALfhdJQYUNJNdht";
    
    // IDs fixos do Baserow
    const DATABASE_ID = 201;
    const USERS_TABLE_ID = 696;
    const CONNECTIONS_TABLE_ID = 695;
    
    // Elementos do DOM
    const registerForm = document.getElementById("register-form");
    const loginForm = document.getElementById("login-form");
    const loadingOverlay = document.getElementById("loading-overlay");
    
    // Salvar configuração no localStorage para uso em outras páginas
    const config = {
        database_id: DATABASE_ID,
        users_table_id: USERS_TABLE_ID,
        connections_table_id: CONNECTIONS_TABLE_ID
    };
    localStorage.setItem("baserow_config", JSON.stringify(config));
    
    // Função para registrar novo usuário
    async function register(name, phone, password) {
        try {
            // Mostrar loading
            if (loadingOverlay) loadingOverlay.classList.add("active");
            
            // Formatar o telefone (remover caracteres não numéricos)
            const formattedPhoneString = phone.replace(/\D/g, "");
            const formattedPhoneNumber = parseInt(formattedPhoneString, 10);

            if (isNaN(formattedPhoneNumber)) {
                alert("Número de telefone inválido.");
                return;
            }

            console.log(`Verificando telefone (número): ${formattedPhoneNumber}`);
            
            // Verificar se o telefone já existe - usando sintaxe correta e tipo número
            const checkResponse = await fetch(`${BASEROW_API_URL}/database/rows/table/${USERS_TABLE_ID}/?user_field_names=true&filter__field_Número__equal=${formattedPhoneNumber}`, {
                method: "GET",
                headers: {
                    "Authorization": `Token ${BASEROW_API_KEY}`,
                    "Content-Type": "application/json"
                }
            });
            
            if (!checkResponse.ok) {
                console.error("Erro na resposta da API:", await checkResponse.text());
                throw new Error(`Erro ao verificar telefone: ${checkResponse.status}`);
            }
            
            const checkData = await checkResponse.json();
            console.log("Resposta da verificação de telefone:", checkData);
            
            // A lógica de checagem parece correta, o problema era o tipo de dado no filtro
            if (checkData.count > 0) {
                alert("Este telefone já está em uso. Por favor, use outro telefone ou faça login.");
                return;
            }
            
            // Criar novo usuário no Baserow - enviando Número como número
            const userData = {
                "Nome": name,
                "Número": formattedPhoneNumber, // Enviar como número
                "Status": "ativo",
                "senha": password // Campo criado manualmente pelo usuário
            };
            
            console.log("Enviando dados para o Baserow:", userData);
            
            const response = await fetch(`${BASEROW_API_URL}/database/rows/table/${USERS_TABLE_ID}/?user_field_names=true`, {
                method: "POST",
                headers: {
                    "Authorization": `Token ${BASEROW_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });
            
            const responseText = await response.text();
            console.log("Resposta bruta do Baserow:", responseText);
            
            if (!response.ok) {
                throw new Error(`Erro ao criar usuário: ${response.status} ${responseText}`);
            }
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error("Erro ao parsear resposta JSON:", e);
                throw new Error("Resposta inválida do servidor");
            }
            
            console.log("Resposta do registro de usuário:", data);
            
            // Salvar dados do usuário no localStorage
            const userDataForStorage = {
                id: data.id,
                name: name,
                phone: formattedPhoneString // Guardar como string no localStorage
            };
            
            localStorage.setItem("currentUser", JSON.stringify(userDataForStorage));
            
            // Redirecionar para a página de login (ou dashboard, a ser definido)
            // window.location.href = "index.html"; // Alterado na próxima etapa
            alert("Registro realizado com sucesso! Você será redirecionado para o login.");
            window.location.href = "login.html"; 

        } catch (error) {
            console.error("Erro ao registrar:", error);
            alert("Ocorreu um erro ao registrar: " + error.message);
        } finally {
            // Esconder loading
            if (loadingOverlay) loadingOverlay.classList.remove("active");
        }
    }
    
    // Função para fazer login
    async function login(phone, password) {
        try {
            // Mostrar loading
            if (loadingOverlay) loadingOverlay.classList.add("active");
            
            // Formatar o telefone (remover caracteres não numéricos)
            const formattedPhoneString = phone.replace(/\D/g, "");
            const formattedPhoneNumber = parseInt(formattedPhoneString, 10);

            if (isNaN(formattedPhoneNumber)) {
                alert("Número de telefone inválido.");
                return;
            }

            console.log(`Buscando usuário (número): ${formattedPhoneNumber}`);

            // Buscar usuário no Baserow pelo telefone - usando sintaxe correta e tipo número
            const response = await fetch(`${BASEROW_API_URL}/database/rows/table/${USERS_TABLE_ID}/?user_field_names=true&filter__field_Número__equal=${formattedPhoneNumber}`, {
                method: "GET",
                headers: {
                    "Authorization": `Token ${BASEROW_API_KEY}`,
                    "Content-Type": "application/json"
                }
            });
            
            if (!response.ok) {
                console.error("Erro na resposta da API:", await response.text());
                throw new Error(`Erro ao buscar usuário: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Resposta da busca de usuário:", data);
            
            // Verificar se encontrou o usuário
            if (data.count > 0 && data.results && data.results.length > 0) {
                const user = data.results[0];
                
                // Verificar senha (campo criado manualmente pelo usuário)
                if (user.senha === password) {
                    // Salvar dados do usuário no localStorage
                    const userData = {
                        id: user.id,
                        name: user.Nome || "",
                        phone: user.Número ? user.Número.toString() : formattedPhoneString // Guardar como string
                    };
                    
                    localStorage.setItem("currentUser", JSON.stringify(userData));
                    
                    // Redirecionar para o dashboard (alterado na próxima etapa)
                    window.location.href = "dashboard.html"; 
                } else {
                    alert("Senha incorreta");
                }
            } else {
                alert("Usuário não encontrado");
            }
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            alert("Ocorreu um erro ao fazer login: " + error.message);
        } finally {
            // Esconder loading
            if (loadingOverlay) loadingOverlay.classList.remove("active");
        }
    }
    
    // Validação do formulário de registro
    function validateRegisterForm() {
        let isValid = true;
        const nameInput = document.getElementById("name");
        const phoneInput = document.getElementById("phone");
        const passwordInput = document.getElementById("password");
        const confirmPasswordInput = document.getElementById("confirm-password");
        
        const nameError = document.getElementById("name-error");
        const phoneError = document.getElementById("phone-error");
        const passwordError = document.getElementById("password-error");
        const confirmPasswordError = document.getElementById("confirm-password-error");
        
        // Validação do nome
        if (nameInput && nameInput.value.trim() === "") {
            if (nameError) nameError.textContent = "Por favor, digite seu nome";
            isValid = false;
        } else {
            if (nameError) nameError.textContent = "";
        }
        
        // Validação do telefone
        if (phoneInput && phoneInput.value.trim() === "") {
            if (phoneError) phoneError.textContent = "Por favor, digite seu telefone";
            isValid = false;
        } else {
             const phoneValue = phoneInput.value.replace(/\D/g, "");
             if (phoneValue.length < 10 || phoneValue.length > 11) {
                 if (phoneError) phoneError.textContent = "Digite um número de telefone válido (10 ou 11 dígitos com DDD)";
                 isValid = false;
             } else {
                 if (phoneError) phoneError.textContent = "";
             }
        }
        
        // Validação da senha
        if (passwordInput && passwordInput.value === "") {
            if (passwordError) passwordError.textContent = "Por favor, digite sua senha";
            isValid = false;
        } else {
            if (passwordError) passwordError.textContent = "";
        }
        
        // Validação da confirmação de senha
        if (confirmPasswordInput && confirmPasswordInput.value === "") {
            if (confirmPasswordError) confirmPasswordError.textContent = "Por favor, confirme sua senha";
            isValid = false;
        } else if (confirmPasswordInput && passwordInput && confirmPasswordInput.value !== passwordInput.value) {
            if (confirmPasswordError) confirmPasswordError.textContent = "As senhas não coincidem";
            isValid = false;
        } else {
            if (confirmPasswordError) confirmPasswordError.textContent = "";
        }
        
        return isValid;
    }
    
    // Validação do formulário de login
    function validateLoginForm() {
        let isValid = true;
        const phoneInput = document.getElementById("phone");
        const passwordInput = document.getElementById("password");
        
        const phoneError = document.getElementById("phone-error");
        const passwordError = document.getElementById("password-error");
        
        // Validação do telefone
        if (phoneInput && phoneInput.value.trim() === "") {
            if (phoneError) phoneError.textContent = "Por favor, digite seu telefone";
            isValid = false;
        } else {
            if (phoneError) phoneError.textContent = "";
        }
        
        // Validação da senha
        if (passwordInput && passwordInput.value === "") {
            if (passwordError) passwordError.textContent = "Por favor, digite sua senha";
            isValid = false;
        } else {
            if (passwordError) passwordError.textContent = "";
        }
        
        return isValid;
    }
    
    // Event listeners
    if (registerForm) {
        registerForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            if (!validateRegisterForm()) {
                return;
            }
            
            const name = document.getElementById("name").value;
            const phone = document.getElementById("phone").value;
            const password = document.getElementById("password").value;
            
            register(name, phone, password);
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            if (!validateLoginForm()) {
                return;
            }
            
            const phone = document.getElementById("phone").value;
            const password = document.getElementById("password").value;
            
            login(phone, password);
        });
    }
    
    // Adicionar máscara ao campo de telefone
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", function(e) {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 11) {
                value = value.substring(0, 11);
            }
            
            // Formata o número conforme vai digitando
            if (value.length > 2) {
                value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
            }
            if (value.length > 9 && value.length < 11) { // Celular sem 9º dígito
                 value = `${value.substring(0, 9)}-${value.substring(9)}`;
            } else if (value.length >= 11) { // Celular com 9º dígito
                 value = `${value.substring(0, 10)}-${value.substring(10)}`;
            }
            
            e.target.value = value;
        });
    }
});

