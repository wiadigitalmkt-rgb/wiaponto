// /api/create-employee.mjs
//
// Cadastra um colaborador no servidor — usada tanto pelo cadastro individual
// quanto pela importação em massa (um colaborador por chamada). Substitui os
// `supabase.from('Employees').insert(...)` que gravavam password_hash em
// texto puro direto do navegador.
//
// O navegador continua montando o "payload" (nome, cargo, CPF, etc.) do
// jeito que já fazia — só a senha e a gravação em si passam a acontecer
// aqui, com a service_role key.
//
// Corpo esperado (POST):
//   {
//     payload: { full_name, first_name, last_name, email, cpf, ... },
//     password: "senha inicial em texto puro (ex: o CPF ou a senha digitada)"
//   }
//
// Variáveis de ambiente necessárias (as mesmas do /api/login.mjs):
//   SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL (ou VITE_SUPABASE_URL)

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

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
    const { payload, password } = req.body || {};

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Dados do colaborador ausentes.' });
    }
    if (!payload.full_name) {
      return res.status(400).json({ error: 'Nome do colaborador é obrigatório.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Senha inicial é obrigatória.' });
    }

    // Confere se o CPF já existe (mesma regra que a tela de importação já
    // aplicava, só que agora só compara o CPF desse colaborador, sem
    // precisar baixar a lista inteira pro navegador).
    const cpfDigits = String(payload.cpf || '').replace(/\D/g, '');
    if (cpfDigits) {
      const { data: existingRows } = await supabaseAdmin.from('Employees').select('cpf');
      const alreadyExists = (existingRows || []).some(
        (row) => String(row.cpf || '').replace(/\D/g, '') === cpfDigits
      );
      if (alreadyExists) {
        return res.status(409).json({ error: 'CPF já cadastrado no sistema.' });
      }
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    // Cria a conta no Supabase Auth ANTES de gravar em Employees (se houver
    // e-mail), pra já poder vincular auth_user_id na mesma linha — é essa
    // coluna que as políticas de RLS da Fase D vão usar pra saber "quem é
    // quem" de verdade.
    let authUserId = null;
    const email = (payload.email || '').toLowerCase().trim();

    if (email) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: String(password),
        email_confirm: true,
        user_metadata: {
          full_name: payload.full_name,
          role: payload.role || 'colaborador',
        },
      });

      if (authError) {
        const alreadyRegistered = String(authError.message || '').toLowerCase().includes('already been registered');
        if (!alreadyRegistered) {
          console.warn('Aviso ao criar usuário no Supabase Auth:', authError.message);
        } else {
          // E-mail já tem conta no Auth (ex: recriando um colaborador) —
          // busca o ID existente pra vincular do mesmo jeito.
          const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
          const found = usersList?.users?.find((u) => u.email?.toLowerCase() === email);
          if (found) authUserId = found.id;
        }
      } else if (authData?.user?.id) {
        authUserId = authData.user.id;
      }
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('Employees')
      .insert([{ ...payload, password_hash: passwordHash, auth_user_id: authUserId }])
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir colaborador:', insertError);
      return res.status(500).json({ error: 'Erro ao salvar colaborador: ' + insertError.message });
    }

    return res.status(200).json({ employee: inserted });
  } catch (err) {
    console.error('Erro ao cadastrar colaborador:', err);
    return res.status(500).json({ error: 'Falha na conexão com o servidor. Tente novamente.' });
  }
}
