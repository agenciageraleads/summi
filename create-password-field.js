// Arquivo create-password-field.js - Cria o campo 'senha' na tabela de usuários do Baserow

async function createPasswordFieldIfNotExists() {
    const BASEROW_API_URL = 'https://baserow.borgesai.com/api';
    const BASEROW_API_KEY = 'dIkBVLKuBMKf1lOhUALfhdJQYUNJNdht';
    const USERS_TABLE_ID = 696;
    const FIELD_NAME = 'senha';

    console.log(`Verificando se o campo '${FIELD_NAME}' existe na tabela ${USERS_TABLE_ID}...`);

    try {
        // 1. Listar campos da tabela
        const listFieldsResponse = await fetch(`${BASEROW_API_URL}/database/fields/table/${USERS_TABLE_ID}/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${BASEROW_API_KEY}`
            }
        });

        if (!listFieldsResponse.ok) {
            const errorText = await listFieldsResponse.text();
            console.error(`Erro ao listar campos: ${listFieldsResponse.status}`, errorText);
            throw new Error(`Erro ao listar campos da tabela ${USERS_TABLE_ID}: ${listFieldsResponse.status}`);
        }

        const fields = await listFieldsResponse.json();
        const fieldExists = fields.some(field => field.name === FIELD_NAME);

        if (fieldExists) {
            console.log(`Campo '${FIELD_NAME}' já existe.`);
            return true; // Campo já existe
        } else {
            console.log(`Campo '${FIELD_NAME}' não encontrado. Criando...`);
            // 2. Criar o campo se não existir
            const createFieldResponse = await fetch(`${BASEROW_API_URL}/database/fields/table/${USERS_TABLE_ID}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${BASEROW_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: FIELD_NAME,
                    type: 'text' // Criar como campo de texto simples
                })
            });

            if (!createFieldResponse.ok) {
                const errorText = await createFieldResponse.text();
                console.error(`Erro ao criar campo: ${createFieldResponse.status}`, errorText);
                throw new Error(`Erro ao criar o campo '${FIELD_NAME}': ${createFieldResponse.status}`);
            }

            const newField = await createFieldResponse.json();
            console.log(`Campo '${FIELD_NAME}' criado com sucesso:`, newField);
            return true; // Campo criado
        }
    } catch (error) {
        console.error(`Falha ao verificar/criar o campo '${FIELD_NAME}':`, error);
        // Opcional: Mostrar um erro para o usuário ou tentar novamente?
        // Por enquanto, apenas logamos o erro e continuamos, 
        // o registro/login provavelmente falhará se o campo for necessário.
        alert(`Ocorreu um erro crítico ao configurar o campo de senha no banco de dados: ${error.message}. Por favor, contate o suporte.`);
        return false; // Falha na criação/verificação
    }
}

// Executar a verificação/criação ao carregar o script
// Isso garante que o campo exista antes que as funções de registro/login sejam chamadas
createPasswordFieldIfNotExists();

// O restante do código de direct-baserow.js continua aqui...
// (Conteúdo original omitido para brevidade, será adicionado na próxima etapa)

