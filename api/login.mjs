// /api/login.mjs
//
// Login seguro, rodando no SERVIDOR (Vercel Serverless Function) — nunca no
// navegador do colaborador. Reescrito em ES Modules (import/export) com
// extensão .mjs, que é a forma oficialmente suportada pela Vercel para
// Node Functions fora do padrão CommonJS, independente do que estiver no
// package.json do projeto.
//
// Variáveis de ambiente necessárias na Vercel (Project Settings → Environment Variables):
//   SUPABASE_SERVICE_ROLE_KEY  -> Supabase → Project Settings → API → "Secret keys" (sb_secret_...)
//   SUPABASE_URL ou VITE_SUPABASE_URL          -> já deve existir
//   SUPABASE_ANON_KEY ou VITE_SUPABASE_ANON_KEY -> já deve existir
//
// IMPORTANTE: SUPABASE_SERVICE_ROLE_KEY NUNCA deve começar com "VITE_".

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente com poderes de administrador — só existe aqui, no servidor.
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
// Cliente comum, só pra tentar o login nativo do Supabase Auth (quando o
// colaborador tiver uma conta cadastrada lá).
const supabaseAuth = createClient(supabaseUrl, anonKey);

const isInactive = (status) => String(status || '').toLowerCase() === 'inativo';
const isBcryptHash = (hash) => typeof hash === 'string' && /^\$2[aby]\$/.test(hash);

const buildSession = (emp, fallbackEmail) => ({
  id: emp.id,
  full_name: emp.full_name || fallbackEmail || '',
  cpf: emp.cpf || '',
  email: emp.email || fallbackEmail || '',
  role: emp.role || 'colaborador',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas na Vercel.');
    return res.status(500).json({ error: 'Configuração do servidor incompleta. Fale com o suporte.' });
  }

  try {
    const { userInput, password } = req.body || {};

    if (!userInput || !password) {
      return res.status(400).json({ error: 'Usuário ou senha incorretos.' });
    }

    const rawInput = String(userInput).trim();
    const cleanCPF = rawInput.replace(/\D/g, '');
    let loginEmail = rawInput;

    // Se digitou CPF em vez de e-mail, resolve o e-mail correspondente
    let empByCpf = null;
    if (!rawInput.includes('@') && cleanCPF.length > 0) {
      const { data } = await supabaseAdmin
        .from('Employees')
        .select('id, email, password_hash, role, full_name, cpf, status')
        .or(`cpf.eq.${cleanCPF},cpf.eq.${rawInput}`)
        .maybeSingle();

      empByCpf = data;
      if (empByCpf?.email) loginEmail = empByCpf.email;
    }

    // 1. Tenta o login nativo do Supabase Auth (se o colaborador tiver conta lá)
    if (loginEmail.includes('@')) {
      const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (!authError && authData?.user) {
        const { data: emp } = await supabaseAdmin
          .from('Employees')
          .select('id, full_name, cpf, email, role, status')
          .eq('email', loginEmail)
          .maybeSingle();

        if (emp && isInactive(emp.status)) {
          return res.status(403).json({ error: 'Este usuário está inativo. Fale com o gestor da sua empresa.' });
        }

        // Mantém o password_hash sincronizado, sempre como hash bcrypt (nunca texto puro)
        const newHash = await bcrypt.hash(password, 10);
        await supabaseAdmin.from('Employees').update({ password_hash: newHash }).eq('email', loginEmail);

        return res.status(200).json({ session: buildSession(emp || {}, authData.user.email) });
      }
    }

    // 2. Fallback: login próprio via Employees.password_hash
    let emp = empByCpf;
    if (!emp) {
      const orFilter = cleanCPF.length > 0
        ? `cpf.eq.${cleanCPF},email.eq.${rawInput}`
        : `email.eq.${rawInput}`;

      const { data } = await supabaseAdmin
        .from('Employees')
        .select('id, email, password_hash, role, full_name, cpf, status')
        .or(orFilter)
        .maybeSingle();

      emp = data;
    }

    if (!emp || !emp.password_hash) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    const storedHash = emp.password_hash;
    let passwordMatches = false;

    if (isBcryptHash(storedHash)) {
      passwordMatches = await bcrypt.compare(password, storedHash);
    } else {
      // Compatibilidade com senhas antigas salvas em texto puro. Se bater,
      // migra pra bcrypt automaticamente, nesse mesmo login.
      passwordMatches = storedHash === password;
      if (passwordMatches) {
        const newHash = await bcrypt.hash(password, 10);
        await supabaseAdmin.from('Employees').update({ password_hash: newHash }).eq('id', emp.id);
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    if (isInactive(emp.status)) {
      return res.status(403).json({ error: 'Este usuário está inativo. Fale com o gestor da sua empresa.' });
    }

    return res.status(200).json({ session: buildSession(emp) });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Falha na conexão com o servidor. Tente novamente.' });
  }
}
