// Arquivo dashboard.js - Gerencia o painel do usuário e conexões WhatsApp
document.addEventListener("DOMContentLoaded", function() {
    // Configurações do Baserow (mantidas para logout e futuras funcionalidades)
    const baserowConfig = localStorage.getItem("baserow_config");
    const config = baserowConfig ? JSON.parse(baserowConfig) : {};
    const BASEROW_API_URL = "https://baserow.borgesai.com/api";
    const BASEROW_API_KEY = "dIkBVLKuBMKf1lOhUALfhdJQYUNJNdht"; // Usar o token correto
    const CONNECTIONS_TABLE_ID = config.connections_table_id || 695; // Usar ID fixo como fallback

    // Elementos do DOM - Dashboard
    const userNameElement = document.getElementById("user-name");
    const logoutBtn = document.getElementById("logout-btn");
    const connectionsContainer = document.getElementById("connections-container");
    
    // Elementos do DOM - Conexão WhatsApp (movido para cá)
    const connectForm = document.getElementById("connect-form");
    const connectNameInput = document.getElementById("connect-name");
    const connectPhoneInput = document.getElementById("connect-phone");
    const connectNameError = document.getElementById("connect-name-error");
    const connectPhoneError = document.getElementById("connect-phone-error");
    const qrcodeModal = document.getElementById("qrcode-modal");
    const qrcodeImage = document.getElementById("qrcode-image");
    const closeButton = document.querySelector(".close-button");
    const loadingOverlay = document.getElementById("loading-overlay");
    const connectionStatusElement = document.getElementById("connection-status"); // Renomeado para evitar conflito
    const successMessage = document.getElementById("success-message");

    // Endpoints
    const connectEndpoint = "https://n8n.gera-leads.com/webhook-test/recebe-chamada";
    const statusEndpoint = "https://webhookn8n.gera-leads.com/webhook/verifica-status";
    
    // Variáveis de estado da conexão
    let instanceName = "";
    let statusCheckInterval = null;
    let currentConnectionName = ""; // Para salvar no Baserow
    let currentConnectionPhone = ""; // Para salvar no Baserow

    // --- Autenticação (Temporariamente Desabilitada para Teste) ---
    const currentUser = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")) : null;
    /*
    // Descomentar para habilitar autenticação obrigatória
    if (!currentUser) {
        console.log("Usuário não logado, redirecionando para login...");
        window.location.href = "login.html";
        return; // Impede a execução do restante do script
    }
    */

    // Exibir nome do usuário (se logado)
    if (userNameElement) {
        userNameElement.textContent = currentUser ? currentUser.name : "Visitante (Teste)";
    }

    // --- Lógica do Dashboard (Carregar Conexões Existentes) ---
    async function loadConnections() {
        if (!currentUser || !connectionsContainer) return; // Só carrega se logado e o container existe

        connectionsContainer.innerHTML = `<div class="empty-state"><p>Carregando suas conexões...</p></div>`; // Estado inicial

        try {
            console.log(`Buscando conexões para o telefone: ${currentUser.phone}`);
            const userPhoneAsNumber = parseInt(currentUser.phone.replace(/\D/g, ""), 10);
            if (isNaN(userPhoneAsNumber)) {
                 console.error("Telefone do usuário inválido para busca de conexões");
                 updateConnectionsUI([]);
                 return;
            }

            // Buscar conexões do usuário no Baserow (Tabela Conversas, filtrando por Número)
            const response = await fetch(`${BASEROW_API_URL}/database/rows/table/${CONNECTIONS_TABLE_ID}/?user_field_names=true&filter__field_Número__equal=${userPhoneAsNumber}`, {
                method: "GET",
                headers: {
                    "Authorization": `Token ${BASEROW_API_KEY}`,
                    "Content-Type": "application/json"
                }
            });
            
            if (!response.ok) {
                console.error("Erro ao buscar conexões:", await response.text());
                throw new Error("Erro ao buscar conexões");
            }
            
            const data = await response.json();
            console.log("Resposta da busca de conexões:", data);
            updateConnectionsUI(data.results || []);
        } catch (error) {
            console.error("Erro ao carregar conexões:", error);
            updateConnectionsUI([]); // Mostrar estado vazio em caso de erro
        }
    }
    
    function updateConnectionsUI(connections) {
        if (!connectionsContainer) return;
        
        if (connections.length === 0) {
            connectionsContainer.innerHTML = `
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <p>Você ainda não tem conexões WhatsApp ativas.</p>
                </div>
            `;
        } else {
            let html = `<ul class="connections-list">`;
            connections.forEach(connection => {
                const statusClass = connection.Status === "open" ? "status-connected" : 
                                   connection.Status === "disconnected" ? "status-disconnected" : "status-pending";
                const statusText = connection.Status === "open" ? "Conectado" : 
                                  connection.Status === "disconnected" ? "Desconectado" : "Pendente";
                
                html += `
                    <li class="connection-item">
                        <div class="connection-info">
                            <span class="connection-name">${connection.Nome || "Conexão WhatsApp"}</span>
                            <span class="connection-phone">${connection.Número || ""}</span>
                        </div>
                        <span class="connection-status ${statusClass}">${statusText}</span>
                    </li>
                `;
            });
            html += `</ul>`;
            connectionsContainer.innerHTML = html;
        }
    }

    // --- Lógica de Conexão WhatsApp (Movida de script.js) ---

    // Máscara para o campo de telefone da conexão
    if (connectPhoneInput) {
        connectPhoneInput.addEventListener("input", function(e) {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 11) {
                value = value.substring(0, 11);
            }
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

    // Validação do formulário de conexão
    function validateConnectForm() {
        let isValid = true;
        const phoneValue = connectPhoneInput.value.replace(/\D/g, "");
        
        if (phoneValue === "") {
            if(connectPhoneError) connectPhoneError.textContent = "Por favor, digite seu telefone";
            isValid = false;
        } else if (phoneValue.length < 10 || phoneValue.length > 11) {
            if(connectPhoneError) connectPhoneError.textContent = "Digite um número de telefone válido com DDD";
            isValid = false;
        } else {
            if(connectPhoneError) connectPhoneError.textContent = "";
        }
        
        // Validação do nome (opcional)
        if(connectNameError) connectNameError.textContent = ""; // Limpa erro anterior

        return isValid;
    }

    // Verificar status da conexão
    async function checkConnectionStatus() {
        if (!instanceName) {
            if(connectionStatusElement) connectionStatusElement.textContent = "Instância não disponível";
            return;
        }
        
        if(connectionStatusElement) connectionStatusElement.textContent = "Verificando...";
        
        const postData = { instancia: instanceName };
        
        try {
            const response = await fetch(statusEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postData)
            });

            if (!response.ok) {
                throw new Error(`Erro na resposta do servidor: ${response.status}`);
            }
            const data = await response.json();
            console.log("Resposta do servidor (status):", JSON.stringify(data, null, 2));

            if (Array.isArray(data) && data.length > 0) {
                const firstItem = data[0];
                if (firstItem && firstItem.success === true && Array.isArray(firstItem.data) && firstItem.data.length > 0) {
                    const connectionData = firstItem.data[0];
                    console.log("Status de conexão:", connectionData.connectionStatus);

                    if (connectionData.connectionStatus === "open") {
                        console.log("Status OPEN detectado! Fechando modal...");
                        if(connectionStatusElement) {
                             connectionStatusElement.textContent = "Conectado";
                             connectionStatusElement.classList.add("connected");
                        }
                        if(successMessage) successMessage.classList.add("active");
                        
                        // Salvar a conexão no Baserow (se usuário logado)
                        if (currentUser) {
                            saveConnection(connectionData);
                        }
                        
                        if (statusCheckInterval) {
                            clearInterval(statusCheckInterval);
                            statusCheckInterval = null;
                        }
                        
                        setTimeout(() => {
                            if(qrcodeModal) qrcodeModal.classList.remove("active");
                            if (currentUser) loadConnections(); // Recarrega lista se logado
                        }, 2000);
                        return;
                    } else {
                        if(connectionStatusElement) connectionStatusElement.textContent = connectionData.connectionStatus || "Aguardando conexão...";
                    }
                } else {
                     if(connectionStatusElement) connectionStatusElement.textContent = "Aguardando conexão...";
                }
            } else {
                 if(connectionStatusElement) connectionStatusElement.textContent = "Aguardando conexão...";
            }
            if(connectionStatusElement) connectionStatusElement.classList.remove("connected");
            if(successMessage) successMessage.classList.remove("active");

        } catch (error) {
            console.error("Erro ao verificar status:", error);
            if(connectionStatusElement) {
                 connectionStatusElement.textContent = "Erro ao verificar";
                 connectionStatusElement.classList.remove("connected");
            }
            if(successMessage) successMessage.classList.remove("active");
        }
    }

    // Função para salvar conexão no Baserow
    async function saveConnection(connectionData) {
        if (!currentUser) return; // Só salva se estiver logado

        try {
            const userPhoneAsNumber = parseInt(currentUser.phone.replace(/\D/g, ""), 10);
             if (isNaN(userPhoneAsNumber)) {
                 console.error("Telefone do usuário inválido para salvar conexão");
                 return;
            }

            const connectionPayload = {
                "Nome": currentConnectionName || connectionData.name || `Conexão ${currentUser.name}`,
                "Número": userPhoneAsNumber, // Salvar como número
                "Status": connectionData.connectionStatus || "open",
                "Instância": connectionData.id || instanceName || ""
            };
            
            console.log("Salvando conexão no Baserow:", connectionPayload);

            const response = await fetch(`${BASEROW_API_URL}/database/rows/table/${CONNECTIONS_TABLE_ID}/?user_field_names=true`, {
                method: "POST",
                headers: {
                    "Authorization": `Token ${BASEROW_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(connectionPayload)
            });
            
            if (!response.ok) {
                 console.error("Erro ao salvar conexão:", await response.text());
                 throw new Error("Erro ao salvar conexão");
            }
            
            console.log("Conexão salva com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar conexão:", error);
            // Não alertar o usuário, apenas logar
        }
    }

    // Iniciar verificação automática a cada 2 segundos
    function startStatusCheck() {
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
        }
        checkConnectionStatus();
        statusCheckInterval = setInterval(checkConnectionStatus, 2000);
    }

    // Envio do formulário de conexão
    if (connectForm) {
        connectForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            if (!validateConnectForm()) {
                return;
            }
            
            if(connectionStatusElement) connectionStatusElement.textContent = "Gerando QR Code...";
            if(connectionStatusElement) connectionStatusElement.classList.remove("connected");
            if(successMessage) successMessage.classList.remove("active");
            if(loadingOverlay) loadingOverlay.classList.add("active");
            
            const phoneValue = connectPhoneInput.value.replace(/\D/g, "");
            currentConnectionName = connectNameInput.value.trim(); // Salva nome para usar depois
            currentConnectionPhone = phoneValue; // Salva telefone para usar depois

            const formData = {
                nome: currentConnectionName || `User_${phoneValue}`, // Usa nome ou um padrão
                telefone: phoneValue
            };
            
            try {
                const response = await fetch(connectEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    throw new Error(`Erro na resposta do servidor: ${response.status}`);
                }
                const data = await response.json();
                console.log("Resposta do servidor (conexão):", JSON.stringify(data, null, 2));

                let base64QrCode = null;
                instanceName = ""; // Reset instance name

                // Processar a resposta - verificação flexível
                if (Array.isArray(data) && data.length > 0) {
                    const firstItem = data[0];
                    if (firstItem) {
                        instanceName = firstItem.Instancia || (firstItem.data ? firstItem.data.Instancia : "");
                        base64QrCode = firstItem.data ? firstItem.data.base64 : null;
                    }
                } else if (data && typeof data === "object") {
                    instanceName = data.Instancia || (data.data ? data.data.Instancia : "");
                    base64QrCode = data.base64 || (data.data ? data.data.base64 : null);
                }

                if (base64QrCode && instanceName) {
                    console.log("Instância encontrada:", instanceName);
                    qrcodeImage.src = base64QrCode;
                    if(qrcodeModal) qrcodeModal.classList.add("active");
                    startStatusCheck();
                } else {
                    throw new Error("QR Code ou Instância não encontrados na resposta");
                }

            } catch (error) {
                console.error("Erro ao conectar:", error);
                alert("Ocorreu um erro ao gerar o QR Code: " + error.message);
            } finally {
                if(loadingOverlay) loadingOverlay.classList.remove("active");
            }
        });
    }

    // --- Event Listeners Gerais do Dashboard ---
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function() {
            // Tenta chamar a função de logout do direct-baserow.js
            if (window.authUtils && typeof window.authUtils.logout === 'function') {
                 window.authUtils.logout();
            } else {
                 // Fallback: Limpa localStorage e redireciona
                 localStorage.removeItem("currentUser");
                 localStorage.removeItem("baserow_config");
                 window.location.href = "login.html";
            }
        });
    }
    
    // Fechar o modal QR Code
    if (closeButton) {
        closeButton.addEventListener("click", function() {
            if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
                statusCheckInterval = null;
            }
            if(qrcodeModal) qrcodeModal.classList.remove("active");
            if(successMessage) successMessage.classList.remove("active");
        });
    }
    
    // Fechar o modal ao clicar fora dele
    window.addEventListener("click", function(e) {
        if (e.target === qrcodeModal) {
            if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
                statusCheckInterval = null;
            }
            if(qrcodeModal) qrcodeModal.classList.remove("active");
            if(successMessage) successMessage.classList.remove("active");
        }
    });
    
    // Carregar conexões ao iniciar (apenas se logado)
    if (currentUser) {
        loadConnections();
    }
});

