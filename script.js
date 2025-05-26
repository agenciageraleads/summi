document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const connectForm = document.getElementById('connect-form');
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const nameError = document.getElementById('name-error');
    const phoneError = document.getElementById('phone-error');
    const qrcodeModal = document.getElementById('qrcode-modal');
    const qrcodeImage = document.getElementById('qrcode-image');
    const closeButton = document.querySelector('.close-button');
    const loadingOverlay = document.getElementById('loading-overlay');
    const connectionStatus = document.getElementById('connection-status');
    const successMessage = document.getElementById('success-message');

    // Endpoints
    const connectEndpoint = 'https://n8n.gera-leads.com/webhook-test/recebe-chamada';
    const statusEndpoint = 'https://webhookn8n.gera-leads.com/webhook/verifica-status';
    
    // Variável para armazenar a instância
    let instanceName = '';
    
    // Variável para controlar o intervalo de verificação
    let statusCheckInterval = null;

    // Máscara para o campo de telefone
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

    // Validação do formulário
    function validateForm() {
        let isValid = true;
        
        // Validação do nome
        if (nameInput.value.trim() === '') {
            nameError.textContent = 'Por favor, digite seu nome';
            isValid = false;
        } else if (nameInput.value.trim().length < 3) {
            nameError.textContent = 'O nome deve ter pelo menos 3 caracteres';
            isValid = false;
        } else {
            nameError.textContent = '';
        }
        
        // Validação do telefone
        const phoneValue = phoneInput.value.replace(/\D/g, '');
        if (phoneValue === '') {
            phoneError.textContent = 'Por favor, digite seu telefone';
            isValid = false;
        } else if (phoneValue.length < 10 || phoneValue.length > 11) {
            phoneError.textContent = 'Digite um número de telefone válido com DDD';
            isValid = false;
        } else {
            phoneError.textContent = '';
        }
        
        return isValid;
    }

    // Verificar status da conexão
    function checkConnectionStatus() {
        if (!instanceName) {
            connectionStatus.textContent = 'Instância não disponível';
            return;
        }
        
        connectionStatus.textContent = 'Verificando...';
        
        // Preparar dados para envio
        const postData = {
            instancia: instanceName
        };
        
        // Fazer requisição POST para o endpoint de status
        fetch(statusEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Resposta do servidor (status):', JSON.stringify(data, null, 2));
            
            try {
                // Verificar se é um array
                if (Array.isArray(data) && data.length > 0) {
                    const firstItem = data[0];
                    console.log('Primeiro item do array:', JSON.stringify(firstItem, null, 2));
                    
                    // Verificar se tem success e data
                    if (firstItem && firstItem.success === true && Array.isArray(firstItem.data) && firstItem.data.length > 0) {
                        const connectionData = firstItem.data[0];
                        console.log('Dados de conexão:', JSON.stringify(connectionData, null, 2));
                        console.log('Status de conexão:', connectionData.connectionStatus);
                        
                        // Verificar o status da conexão
                        if (connectionData.connectionStatus && connectionData.connectionStatus === 'open') {
                            console.log('Status OPEN detectado! Fechando modal...');
                            connectionStatus.textContent = 'Conectado';
                            connectionStatus.classList.add('connected');
                            successMessage.classList.add('active');
                            
                            // Parar o intervalo de verificação
                            if (statusCheckInterval) {
                                clearInterval(statusCheckInterval);
                                statusCheckInterval = null;
                            }
                            
                            // Fechar o modal após 2 segundos
                            setTimeout(() => {
                                qrcodeModal.classList.remove('active');
                            }, 2000);
                            
                            return;
                        } else {
                            connectionStatus.textContent = connectionData.connectionStatus || 'Aguardando conexão...';
                            connectionStatus.classList.remove('connected');
                            successMessage.classList.remove('active');
                        }
                    } else {
                        console.log('Estrutura de dados não corresponde ao esperado');
                    }
                } else {
                    console.log('Resposta não é um array ou está vazia');
                }
                
                // Se chegou aqui, não encontrou o status esperado
                connectionStatus.textContent = 'Aguardando conexão...';
                connectionStatus.classList.remove('connected');
                successMessage.classList.remove('active');
                
            } catch (error) {
                console.error('Erro ao processar resposta de status:', error);
                connectionStatus.textContent = 'Verificando...';
                connectionStatus.classList.remove('connected');
                successMessage.classList.remove('active');
            }
        })
        .catch(error => {
            console.error('Erro ao verificar status:', error);
            connectionStatus.textContent = 'Verificando...';
            connectionStatus.classList.remove('connected');
            successMessage.classList.remove('active');
        });
    }

    // Iniciar verificação automática a cada 2 segundos
    function startStatusCheck() {
        // Limpar qualquer intervalo existente
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
        }
        
        // Verificar imediatamente
        checkConnectionStatus();
        
        // Configurar verificação a cada 2 segundos
        statusCheckInterval = setInterval(checkConnectionStatus, 2000);
    }

    // Envio do formulário
    connectForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Resetar status
        connectionStatus.textContent = 'Verificando...';
        connectionStatus.classList.remove('connected');
        successMessage.classList.remove('active');
        
        // Mostrar loading
        loadingOverlay.classList.add('active');
        
        // Preparar dados para envio
        const phoneValue = phoneInput.value.replace(/\D/g, '');
        const formData = {
            nome: nameInput.value.trim(),
            telefone: phoneValue
        };
        
        // Enviar dados para o endpoint
        fetch(connectEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Resposta do servidor (conexão):', JSON.stringify(data, null, 2));
            
            // Processar a resposta - verificação mais flexível
            try {
                // Verificar se é um array
                if (Array.isArray(data) && data.length > 0) {
                    const firstItem = data[0];
                    
                    // Verificar se tem a propriedade data
                    if (firstItem && firstItem.data) {
                        const responseData = firstItem.data;
                        
                        // Salvar a instância para verificação posterior
                        if (firstItem.Instancia) {
                            instanceName = firstItem.Instancia;
                            console.log('Instância encontrada:', instanceName);
                        } else if (responseData.Instancia) {
                            instanceName = responseData.Instancia;
                            console.log('Instância encontrada:', instanceName);
                        }
                        
                        // Exibir o QR Code
                        if (responseData.base64) {
                            qrcodeImage.src = responseData.base64;
                            
                            // Mostrar o modal com o QR Code
                            qrcodeModal.classList.add('active');
                            
                            // Iniciar verificação automática
                            startStatusCheck();
                            
                            return; // Sucesso, sair da função
                        }
                    }
                } 
                // Verificar se é um objeto direto (não array)
                else if (data && typeof data === 'object') {
                    // Salvar a instância para verificação posterior
                    if (data.Instancia) {
                        instanceName = data.Instancia;
                        console.log('Instância encontrada:', instanceName);
                    }
                    
                    // Verificar se tem a propriedade data
                    if (data.data) {
                        const responseData = data.data;
                        
                        // Salvar a instância para verificação posterior
                        if (responseData.Instancia) {
                            instanceName = responseData.Instancia;
                            console.log('Instância encontrada:', instanceName);
                        }
                        
                        // Exibir o QR Code
                        if (responseData.base64) {
                            qrcodeImage.src = responseData.base64;
                            
                            // Mostrar o modal com o QR Code
                            qrcodeModal.classList.add('active');
                            
                            // Iniciar verificação automática
                            startStatusCheck();
                            
                            return; // Sucesso, sair da função
                        }
                    }
                    // Verificar se tem as propriedades diretamente no objeto raiz
                    else if (data.base64) {
                        // Exibir o QR Code
                        qrcodeImage.src = data.base64;
                        
                        // Mostrar o modal com o QR Code
                        qrcodeModal.classList.add('active');
                        
                        // Iniciar verificação automática
                        startStatusCheck();
                        
                        return; // Sucesso, sair da função
                    }
                }
                
                // Se chegou aqui, não encontrou o formato esperado
                throw new Error('Formato de resposta não reconhecido');
            } catch (error) {
                console.error('Erro ao processar resposta:', error);
                throw new Error('Erro ao processar a resposta do servidor');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.');
        })
        .finally(() => {
            // Esconder loading
            loadingOverlay.classList.remove('active');
        });
    });

    // Fechar o modal
    closeButton.addEventListener('click', function() {
        // Parar o intervalo de verificação
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            statusCheckInterval = null;
        }
        
        qrcodeModal.classList.remove('active');
        successMessage.classList.remove('active');
    });

    // Fechar o modal ao clicar fora dele
    window.addEventListener('click', function(e) {
        if (e.target === qrcodeModal) {
            // Parar o intervalo de verificação
            if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
                statusCheckInterval = null;
            }
            
            qrcodeModal.classList.remove('active');
            successMessage.classList.remove('active');
        }
    });
});
