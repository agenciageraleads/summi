// Arquivo setup.js – Configuração automática do ambiente Baserow
// Esta versão cria (se necessário) e mapeia as tabelas Usuários e Conversas,
// salvando os IDs e campos essenciais no localStorage.
//
// ► Mantém escalabilidade: basta mudar os valores de DATABASE_NAME, USERS_TABLE_NAME
//   e CONVERSATIONS_TABLE_NAME se quiser usar outro workspace.
//
document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    /* ====================== CONFIGURÁVEIS ====================== */
    const BASEROW_API_URL = 'https://baserow.borgesai.com/api';
    const BASEROW_API_KEY = 'dIkBVLKuBMKf1lOhUALfhdJQYUNJNdht';

    // IDs já conhecidos (caso você recrie a base mude aqui)
    const DATABASE_ID          = 201;
    const USERS_TABLE_ID       = 696;
    const CONVERSATIONS_TABLE_ID = 695;

    // Nomes esperados (usados apenas se for preciso criar tabelas/ campos)
    const USERS_TABLE_NAME       = 'Usuários';
    const CONVERSATIONS_TABLE_NAME = 'Conversas';

    // Campos obrigatórios para cada tabela.
    const REQUIRED_USER_FIELDS = [
      { name: 'Nome',   type: 'text'  },
      { name: 'Número', type: 'number' },
      { name: 'senha',  type: 'text'  },
      { name: 'Status', type: 'single_select', select_options: [{value: 'ativo'}] }
    ];

    const REQUIRED_CONV_FIELDS = [
      { name: 'remoteJid', type: 'text' },
      { name: 'Nome',      type: 'text' },
      { name: 'Prioridade',type: 'number' },
      { name: 'Contexto',  type: 'long_text' }
    ];
    /* =========================================================== */

    async function api(path, method = 'GET', body = null) {
      const opts = {
        method,
        headers: {
          'Authorization': `Token ${BASEROW_API_KEY}`,
          'Content-Type': 'application/json'
        }
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${BASEROW_API_URL}${path}`, opts);
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      return res.json();
    }

    async function ensureTable(id, name) {
      try {
        return await api(`/database/tables/${id}/`);
      } catch {
        // Cria tabela se não existir
        return await api(`/database/tables/database/${DATABASE_ID}/`, 'POST', {
          name,
          order: 0
        });
      }
    }

    async function listFields(tableId) {
      return await api(`/database/fields/table/${tableId}/`);
    }

    async function ensureFields(tableId, required) {
      const existing = await listFields(tableId);
      for (const field of required) {
        if (!existing.find(f => f.name === field.name)) {
          await api(`/database/fields/table/${tableId}/`, 'POST', field);
        }
      }
    }

    try {
      // 1. Garante tabelas
      const usersTable = await ensureTable(USERS_TABLE_ID, USERS_TABLE_NAME);
      const convTable  = await ensureTable(CONVERSATIONS_TABLE_ID, CONVERSATIONS_TABLE_NAME);

      // 2. Garante campos
      await ensureFields(usersTable.id, REQUIRED_USER_FIELDS);
      await ensureFields(convTable.id,  REQUIRED_CONV_FIELDS);

      // 3. Salva mapeamento
      localStorage.setItem('baserow_config', JSON.stringify({
        database_id: DATABASE_ID,
        users_table_id: usersTable.id,
        conversations_table_id: convTable.id
      }));

      // 4. Redireciona
      window.location.href = 'login.html';
    } catch (err) {
      console.error('Erro no setup Baserow:', err);
      alert(`Erro ao configurar Baserow: ${err.message}`);
      // Mantém na página para permitir tentar novamente
    }
  })();
});
