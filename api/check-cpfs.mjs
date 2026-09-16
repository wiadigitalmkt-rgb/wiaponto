// /api/check-cpfs.mjs
//
// Recebe uma lista de CPFs (só dígitos) e devolve quais deles JÁ estão
// cadastrados na tabela Employees. Usada na validação da planilha de
// importação em massa, no lugar de `supabase.from('Employees').select('cpf')`
// direto do navegador — que baixava o CPF de TODOS os colaboradores da
// empresa pro navegador só pra comparar.
//
// Corpo esperado (POST): { cpfs: ["12345678900", "..."] }
// Resposta: { existing: ["12345678900", "..."] }  (só os que já existem)

import { createClient } from '@supabase/supabase-js';

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
    const { cpfs } = req.body || {};
    if (!Array.isArray(cpfs)) {
      return res.status(400).json({ error: 'Envie uma lista de CPFs.' });
    }

    const wanted = new Set(cpfs.map((c) => String(c || '').replace(/\D/g, '')).filter(Boolean));

    const { data: rows, error } = await supabaseAdmin.from('Employees').select('cpf');
    if (error) {
      console.error('Erro ao checar CPFs:', error);
      return res.status(500).json({ error: 'Erro ao checar CPFs.' });
    }

    const registered = new Set(
      (rows || []).map((r) => String(r.cpf || '').replace(/\D/g, '')).filter(Boolean)
    );

    const existing = [...wanted].filter((cpf) => registered.has(cpf));

    return res.status(200).json({ existing });
  } catch (err) {
    console.error('Erro ao checar CPFs:', err);
    return res.status(500).json({ error: 'Falha na conexão com o servidor. Tente novamente.' });
  }
}
