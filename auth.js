// auth.js — Autenticação via Supabase
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://rekpbwechuaagvfooedu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJla3Bid2VjaHVhYWd2Zm9vZWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMzI3ODIsImV4cCI6MjA2MTcwODc4Mn0.osz79TnIHSc6_XeH-nLl7Mdw18uk5LZ_4P7zdkqcbyQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* Helpers */
const phoneDigits = br => Number(br.replace(/\D/g, ""));

/* ---------- REGISTRO ---------- */
export async function register(nome, email, senha, telefoneBR) {
  /* 1. Supabase Auth */
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } }
  });
  if (error) throw error;

  /* 2. Inserir linha em "usuarios" */
  await supabase.from("usuarios").insert({
    id_usuario: data.user.id,
    Nome: nome,
    Numero: phoneDigits(telefoneBR),
    email,
    Status: "ativo"
  });

  return data.user;
}

/* ---------- LOGIN ---------- */
export async function login(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  });
  if (error) throw error;
  return data.user;
}

/* ---------- LOGOUT ---------- */
export async function logout() {
  await supabase.auth.signOut();
  localStorage.clear();
  location.href = "login.html";
}
