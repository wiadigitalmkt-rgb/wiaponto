// /api/admission-file-url.mjs
//
// Gera um link temporário (assinado, expira em minutos) pra um arquivo de
// uma admissão — só depois de validar o código de acesso no servidor.
// É o mesmo princípio do login.mjs: o navegador do candidato nunca tem
// permissão direta de ler o bucket; só esse endpoint, com a service_role
// key, consegue.
//
// Corpo esperado (POST): { admissionId, accessCode, path }
// Resposta: { url }

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const BUCKET = 'admissao-documentos';
const SIGNED_URL_TTL_SECONDS = 300; // 5 minutos — gerado sob demanda sempre que precisa exibir

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
    const { admissionId, accessCode, path } = req.body || {};

    if (!admissionId || !path) {
      return res.status(400).json({ error: 'Dados incompletos.' });
    }

    const { data: admission } = await supabaseAdmin
      .from('employee_admissions')
      .select('access_code, employee_id')
      .eq('id', admissionId)
      .maybeSingle();

    if (!admission) {
      return res.status(404).json({ error: 'Processo de admissão não encontrado.' });
    }

    // O caminho pedido tem que estar dentro da pasta dessa admissão OU da
    // pasta do colaborador dela (é onde a assinatura fica salva, no mesmo
    // padrão usado por MinhaAssinatura.jsx) — evita que alguém peça
    // qualquer outro arquivo só trocando o "path" na chamada.
    const validAdmissionPath = path.startsWith(`${admissionId}/`);
    const validEmployeePath = admission.employee_id && path.startsWith(`${admission.employee_id}/`);
    if (!validAdmissionPath && !validEmployeePath) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    if (admission.access_code && admission.access_code !== accessCode) {
      return res.status(403).json({ error: 'Código de acesso incorreto.' });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      console.error('Erro ao gerar signed URL:', error);
      return res.status(500).json({ error: 'Não foi possível gerar o link do arquivo.' });
    }

    return res.status(200).json({ url: data.signedUrl });
  } catch (err) {
    console.error('Erro em admission-file-url:', err);
    return res.status(500).json({ error: 'Falha na conexão com o servidor.' });
  }
}
