// src/lib/admissionSteps.js
//
// Utilitário compartilhado entre admin.Admissao.jsx (gestor) e
// PreencherAdmissao.jsx (colaborador).
//
// O gestor grava o template em `admission_templates.steps` no formato
// "flat" (uma linha por campo, ex.: { id, name: 'Selfie', type: 'anexo/foto', active }).
// O formulário do colaborador precisa de um formato "wizard" (uma etapa
// por pergunta), com chaves estáveis para gravar em `progress_data`:
//   { id, title, description, fields: [{ key, label, type, required, options?, placeholder? }] }
//
// Este arquivo faz essa conversão em um único lugar, para que o snapshot
// gravado na criação da admissão (admin.Admissao.jsx) e o fallback usado
// ao abrir o formulário (PreencherAdmissao.jsx) nunca fiquem dessincronizados.

function stripAccents(str = '') {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeName(str = '') {
  return stripAccents(str).toLowerCase().trim();
}

function slugify(str = '') {
  return (
    stripAccents(str)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'campo'
  );
}

// Configuração conhecida dos 9 campos padrão do template "Admissão Matheus".
// A chave do objeto é o nome do campo normalizado (sem acento, minúsculo).
// Isso garante que "Número do RG", "número do rg" etc. caiam na mesma regra.
const KNOWN_FIELD_CONFIG = {
  selfie: {
    key: 'selfie',
    type: 'photo',
    required: true,
    description: 'Tire uma selfie pela câmera do seu dispositivo ou envie uma foto recente do seu rosto.',
  },
  'estado civil': {
    key: 'estado_civil',
    type: 'select',
    required: true,
    options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'],
  },
  telefone: {
    key: 'telefone',
    type: 'tel',
    required: true,
    placeholder: '(00) 00000-0000',
  },
  'e-mail': {
    key: 'email',
    type: 'email',
    required: true,
    placeholder: 'nome@email.com',
  },
  'numero do rg': {
    key: 'rg',
    type: 'text',
    required: true,
    placeholder: 'Digite o número do seu RG',
  },
  'numero do pis': {
    key: 'pis',
    type: 'text',
    required: true,
    placeholder: 'Digite o número do seu PIS/PASEP',
  },
  endereco: {
    key: 'endereco',
    type: 'textarea',
    required: true,
    placeholder: 'Rua, número, bairro, cidade, estado e CEP',
  },
  'dados bancarios': {
    key: 'dados_bancarios',
    type: 'textarea',
    required: false,
    placeholder: 'Banco, agência, conta e tipo de conta (opcional)',
  },
  'data de nascimento': {
    key: 'data_nascimento',
    type: 'date',
    required: true,
  },
};

// Para campos que o gestor criar fora da lista padrão (customSteps, tipo
// "campo personalizado"), usamos o `type` bruto salvo pelo gestor como pista.
const RAW_TYPE_FALLBACK = {
  'anexo/foto': 'file',
  'selecionar opção': 'select',
  'campo texto': 'text',
  'campo data': 'date',
  'campo personalizado': 'text',
};

/**
 * Converte o array "flat" de etapas do template (admin_Admissao.jsx /
 * admission_templates.steps) para o array de etapas "wizard" que
 * PreencherAdmissao.jsx consome (uma pergunta por etapa).
 *
 * Ignora etapas com `active: false` (etapas desativadas pelo gestor no
 * template não aparecem no formulário do colaborador).
 */
export function mapAdminStepsToWizardSteps(rawSteps) {
  if (!Array.isArray(rawSteps)) return [];

  return rawSteps
    .filter((step) => step && step.active !== false && step.name)
    .map((step, index) => {
      const known = KNOWN_FIELD_CONFIG[normalizeName(step.name)];
      const key = known?.key || slugify(step.name) || `campo_${index + 1}`;
      const type = known?.type || RAW_TYPE_FALLBACK[step.type] || 'text';

      return {
        id: step.id || key,
        title: step.name,
        description: known?.description,
        fields: [
          {
            key,
            label: step.name,
            type,
            required: known ? known.required : false,
            options: known?.options,
            placeholder: known?.placeholder,
          },
        ],
      };
    });
}

/**
 * Mesma regra usada em PreencherAdmissao.jsx para considerar um campo
 * "preenchido": string/número não vazio, ou objeto de upload com `url`.
 */
export function isFieldValueEmpty(value) {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value === 'object') return !value.url;
  return false;
}
