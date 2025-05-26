// Arquivo setup.js - Configura o ambiente Baserow para a aplicação
document.addEventListener('DOMContentLoaded', function() {
    // Configurações do Baserow
    const BASEROW_API_URL = 'https://baserow.borgesai.com/api';
    const BASEROW_API_KEY = 'e5362baf-c777-4d57-a609-6eaf1f9e87f6';
    
    // IDs conhecidos do Baserow (identificados na documentação e workspace)
    const KNOWN_DATABASE_ID = 201; // ID do banco de dados Summi
    const KNOWN_USERS_TABLE_ID = 696; // ID da tabela Usuários
    const KNOWN_CONNECTIONS_TABLE_ID = 695; // ID da tabela Conversas (usaremos para conexões)
    
    // Elemento para exibir status
    const setupStatus = document.getElementById('setup-status');
    const setupProgress = document.getElementById('setup-progress');
    const setupComplete = document.getElementById('setup-complete');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Mostrar loading
    if (loadingOverlay) loadingOverlay.classList.add('active');
    
    // Atualizar status
    function updateStatus(message, progress) {
        if (setupStatus) setupStatus.textContent = message;
        if (setupProgress) setupProgress.style.width = `${progress}%`;
        console.log(message);
    }
    
    // Verificar se o banco de dados já está configurado
    async function checkSetup() {
        try {
            updateStatus('Verificando configuração...', 10);
            
            // Verificar se já temos os IDs das tabelas salvos
            const config = localStorage.getItem('baserow_config');
            if (config) {
                const parsedConfig = JSON.parse(config);
                if (parsedConfig.database_id && parsedConfig.users_table_id && parsedConfig.connections_table_id) {
                    // Verificar se as tabelas realmente existem
                    try {
                        updateStatus('Verificando tabelas existentes...', 20);
                        
                        // Verificar tabela de usuários
                        const usersResponse = await fetch(`${BASEROW_API_URL}/database/tables/${parsedConfig.users_table_id}/`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Token ${BASEROW_API_KEY}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        // Verificar tabela de conexões
                        const connectionsResponse = await fetch(`${BASEROW_API_URL}/database/tables/${parsedConfig.connections_table_id}/`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Token ${BASEROW_API_KEY}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (usersResponse.ok && connectionsResponse.ok) {
                            updateStatus('Configuração existente verificada com sucesso!', 100);
                            setupComplete.classList.add('active');
                            
                            // Redirecionar após 2 segundos
                            setTimeout(() => {
                                window.location.href = 'login.html';
                            }, 2000);
                            
                            return true;
                        }
                    } catch (error) {
                        console.error('Erro ao verificar tabelas:', error);
                    }
                }
            }
            
            // Se chegou aqui, precisamos verificar as tabelas existentes
            return false;
        } catch (error) {
            console.error('Erro ao verificar configuração:', error);
            return false;
        }
    }
    
    // Verificar tabelas existentes
    async function verifyExistingTables() {
        try {
            updateStatus('Verificando tabelas existentes no Baserow...', 30);
            
            // Verificar tabela de usuários
            const usersResponse = await fetch(`${BASEROW_API_URL}/database/tables/${KNOWN_USERS_TABLE_ID}/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${BASEROW_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Verificar tabela de conexões
            const connectionsResponse = await fetch(`${BASEROW_API_URL}/database/tables/${KNOWN_CONNECTIONS_TABLE_ID}/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${BASEROW_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (usersResponse.ok && connectionsResponse.ok) {
                updateStatus('Tabelas existentes encontradas!', 50);
                
                // Verificar campos da tabela de usuários
                const usersData = await usersResponse.json();
                console.log('Tabela de usuários:', usersData);
                
                // Verificar campos da tabela de conexões
                const connectionsData = await connectionsResponse.json();
                console.log('Tabela de conexões:', connectionsData);
                
                // Salvar configuração
                const config = {
                    database_id: KNOWN_DATABASE_ID,
                    users_table_id: KNOWN_USERS_TABLE_ID,
                    connections_table_id: KNOWN_CONNECTIONS_TABLE_ID
                };
                
                localStorage.setItem('baserow_config', JSON.stringify(config));
                
                updateStatus('Configuração concluída com sucesso!', 100);
                setupComplete.classList.add('active');
                
                // Redirecionar após 2 segundos
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
                return true;
            } else {
                updateStatus('Tabelas não encontradas. Verificando alternativas...', 40);
                return false;
            }
        } catch (error) {
            console.error('Erro ao verificar tabelas existentes:', error);
            updateStatus('Erro ao verificar tabelas. Tentando método alternativo...', 40);
            return false;
        }
    }
    
    // Função principal para configurar o banco de dados
    async function setupDatabase() {
        try {
            // Verificar se já está configurado
            const isConfigured = await checkSetup();
            if (isConfigured) {
                return;
            }
            
            // Verificar tabelas existentes
            const tablesExist = await verifyExistingTables();
            if (tablesExist) {
                return;
            }
            
            // Se chegou aqui, não conseguimos usar as tabelas existentes
            // Vamos exibir uma mensagem de erro mais amigável
            updateStatus('Não foi possível conectar às tabelas existentes no Baserow. Por favor, verifique as configurações e tente novamente.', 0);
            
            // Mostrar botão para tentar novamente
            if (setupComplete) {
                setupComplete.innerHTML = `
                    <button class="retry-btn" id="retry-btn">Tentar Novamente</button>
                `;
                setupComplete.classList.add('active');
                
                // Adicionar evento ao botão
                document.getElementById('retry-btn').addEventListener('click', function() {
                    window.location.reload();
                });
            }
        } catch (error) {
            console.error('Erro ao configurar banco de dados:', error);
            updateStatus(`Erro: ${error.message}. Por favor, tente novamente.`, 0);
            
            // Mostrar botão para tentar novamente
            if (setupComplete) {
                setupComplete.innerHTML = `
                    <button class="retry-btn" id="retry-btn">Tentar Novamente</button>
                `;
                setupComplete.classList.add('active');
                
                // Adicionar evento ao botão
                document.getElementById('retry-btn').addEventListener('click', function() {
                    window.location.reload();
                });
            }
        } finally {
            // Esconder loading
            if (loadingOverlay) loadingOverlay.classList.remove('active');
        }
    }
    
    // Iniciar configuração
    setupDatabase();
});
