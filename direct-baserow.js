// Arquivo direct-baserow.js - Integração direta com Baserow (cadastro & login)

document.addEventListener("DOMContentLoaded", function() {
  /* ========= Configurações ========= */
  const BASEROW_API_URL = "https://baserow.borgesai.com/api";
  const BASEROW_API_KEY = "dIkBVLKuBMKf1lOhUALfhdJQYUNJNdht";
  const USERS_TABLE_ID  = 696;   // Tabela Usuários
  const CONVERSATIONS_TABLE_ID = 695; // Tabela Conversas

  /* ========= Elementos de interface ========= */
  const registerForm = document.getElementById("register-form");
  const loginForm    = document.getElementById("login-form");
  const loading      = document.getElementById("loading-overlay");

  /* ========= Helpers ========= */
  function showLoading(on=true) {
    if (loading) loading.classList[on ? "add" : "remove"]("active");
  }

  function formatPhoneToNumber(str) {
    return parseInt(str.replace(/\D/g, ""), 10);
  }

  /* ========= Registro ========= */
  async function register(name, phone, password) {
    try {
      showLoading(true);
      const phoneNumber = formatPhoneToNumber(phone);
      if (isNaN(phoneNumber)) {
        alert("Número de telefone inválido"); return;
      }

      // Checa duplicidade
      const dup = await fetch(`${BASEROW_API_URL}/database/rows/table/${USERS_TABLE_ID}/?user_field_names=true&filter__field_Numero__equal=${phoneNumber}`, {
        headers: { Authorization: `Token ${BASEROW_API_KEY}` }
      }).then(r => r.json());

      if (dup.count && dup.count > 0) {
        alert("Este telefone já está em uso. Faça login ou use outro.");
        return;
      }

      // Cria usuário
      await fetch(`${BASEROW_API_URL}/database/rows/table/${USERS_TABLE_ID}/?user_field_names=true`, {
        method: "POST",
        headers: {
          Authorization: `Token ${BASEROW_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "Nome": name,
          "Número": phoneNumber,
          "senha": password,
          "Status": "ativo"
        })
      });

      alert("Usuário criado! Faça login agora.");
      window.location.href = "login.html";

    } catch (err) {
      console.error(err);
      alert("Erro no registro: " + err.message);
    } finally { showLoading(false); }
  }

  /* ========= Login ========= */
  async function login(phone, password) {
    try {
      showLoading(true);
      const phoneNumber = formatPhoneToNumber(phone);
      const res = await fetch(`${BASEROW_API_URL}/database/rows/table/${USERS_TABLE_ID}/?user_field_names=true&filter__field_Numero__equal=${phoneNumber}`, {
        headers: { Authorization: `Token ${BASEROW_API_KEY}` }
      }).then(r => r.json());

      if (res.count === 0) { alert("Usuário não encontrado"); return; }
      const user = res.results[0];
      if (user.senha !== password) { alert("Senha incorreta"); return; }

      localStorage.setItem("currentUser", JSON.stringify({
        id: user.id, name: user.Nome, phone: phoneNumber.toString()
      }));
      window.location.href = "dashboard.html";

    } catch (err) {
      console.error(err);
      alert("Erro no login: " + err.message);
    } finally { showLoading(false); }
  }

  /* ========= Eventos ========= */
  if (registerForm) {
    registerForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const phone = document.getElementById("phone").value;
      const password = document.getElementById("password").value;
      register(name, phone, password);
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      const phone = document.getElementById("phone").value;
      const password = document.getElementById("password").value;
      login(phone, password);
    });
  }
});
