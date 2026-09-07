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
  // ---------------------------------------------------------------
  // Campos padrão adicionados para atender ao eSocial/RH.
  // ---------------------------------------------------------------
  cpf: {
    key: 'cpf',
    type: 'text',
    required: true,
    placeholder: '000.000.000-00',
    mask: 'cpf',
  },
  'nome da mae': {
    key: 'nome_da_mae',
    type: 'text',
    required: true,
    placeholder: 'Nome completo da mãe',
  },
  nacionalidade: {
    key: 'nacionalidade',
    type: 'text',
    required: true,
    placeholder: 'Ex.: Brasileira',
  },
  naturalidade: {
    key: 'naturalidade',
    type: 'text',
    required: true,
    placeholder: 'Cidade/UF de nascimento',
  },
  'grau de instrucao': {
    key: 'grau_instrucao',
    type: 'select',
    required: true,
    options: [
      'Fundamental incompleto',
      'Fundamental completo',
      'Médio incompleto',
      'Médio completo',
      'Superior incompleto',
      'Superior completo',
      'Pós-graduação',
    ],
  },
  // ASO é preenchido pelo GESTOR depois que o exame sai — nunca aparece no
  // formulário do colaborador. O filtro que remove esse campo do wizard do
  // colaborador está em mapAdminStepsToWizardSteps, com base na flag
  // `employeeVisible: false` gravada no step (ver admin_Admissao.jsx).
  'aso / exame admissional': {
    key: 'aso',
    type: 'file',
    required: false,
  },
  'vale-transporte': {
    key: 'vale_transporte',
    type: 'select',
    required: false,
    options: ['Não utiliza', 'Utiliza - 1 condução', 'Utiliza - 2 conduções', 'Utiliza - Outro'],
  },
  dependentes: {
    key: 'dependentes',
    type: 'dependents',
    required: false,
    description: 'Se possuir dependentes, informe nome, CPF e data de nascimento de cada um.',
  },
  // ---------------------------------------------------------------
  // Documento com foto (frente/verso) e assinatura — sempre as últimas
  // etapas do formulário (nessa ordem): Selfie, Documento, Assinatura.
  // ---------------------------------------------------------------
  'documento (rg ou cnh) - frente': {
    key: 'documento_frente',
    type: 'file',
    required: true,
    description: 'Envie uma foto ou scan nítido da FRENTE do seu RG ou CNH.',
  },
  'documento (rg ou cnh) - verso': {
    key: 'documento_verso',
    type: 'file',
    required: true,
    description: 'Envie uma foto ou scan nítido do VERSO do seu RG ou CNH.',
  },
  assinatura: {
    key: 'assinatura',
    type: 'signature',
    required: true,
    description:
      'Desenhe sua assinatura com o dedo (ou o mouse), igual à do seu documento. Ela será usada para assinar seu contrato e o espelho de ponto todo mês.',
  },
};

// Para campos que o gestor criar fora da lista padrão (customSteps, tipo
// "campo personalizado"), usamos o `type` bruto salvo pelo gestor como pista.
const RAW_TYPE_FALLBACK = {
  'anexo/foto': 'file',
  'anexo/arquivo': 'file',
  'selecionar opção': 'select',
  'campo texto': 'text',
  'campo data': 'date',
  'campo personalizado': 'text',
};

/**
 * Converte UM step "flat" do template para o formato "wizard" (uma pergunta
 * por etapa). Função interna reaproveitada pelas duas variantes públicas
 * abaixo — a única diferença entre elas é o filtro aplicado antes de mapear.
 */
function buildWizardStep(step, index) {
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
        mask: known?.mask,
        // Campo que só o GESTOR preenche (ex.: ASO), nunca o colaborador.
        // Guardado como flag estrutural — não depende do texto exato do
        // nome bater com uma entrada do KNOWN_FIELD_CONFIG, então continua
        // funcionando mesmo se o gestor renomear o campo ao editar o
        // template.
        managerOnly: step.employeeVisible === false,
      },
    ],
  };
}

/**
 * Converte o array "flat" de etapas do template (admin_Admissao.jsx /
 * admission_templates.steps) para o array de etapas "wizard" que
 * PreencherAdmissao.jsx consome (uma pergunta por etapa).
 *
 * Ignora etapas com `active: false` (etapas desativadas pelo gestor no
 * template não aparecem no formulário do colaborador) e etapas com
 * `employeeVisible: false` (campos que só o gestor preenche depois, como
 * o ASO/Exame Admissional — nunca aparecem no formulário do colaborador).
 *
 * Usado para gravar `employee_admissions.template_steps` (o snapshot que o
 * FORMULÁRIO DO COLABORADOR lê).
 */
export function mapAdminStepsToWizardSteps(rawSteps) {
  if (!Array.isArray(rawSteps)) return [];

  return rawSteps
    .filter((step) => step && step.active !== false && step.name && step.employeeVisible !== false)
    .map(buildWizardStep);
}

/**
 * Mesma conversão, mas SEM remover os campos `employeeVisible: false`
 * (como o ASO). Usado para gravar `employee_admissions.manager_template_steps`
 * — o snapshot completo que a TELA DE VISUALIZAÇÃO DO GESTOR lê, para que
 * campos que só o gestor preenche continuem aparecendo na lista de
 * informações mesmo não estando no formulário do colaborador.
 */
export function mapAdminStepsToAllFields(rawSteps) {
  if (!Array.isArray(rawSteps)) return [];

  return rawSteps.filter((step) => step && step.active !== false && step.name).map(buildWizardStep);
}

/**
 * Mesma regra usada em PreencherAdmissao.jsx para considerar um campo
 * "preenchido": string/número não vazio, QUALQUER array já gravado (mesmo
 * vazio — ver nota abaixo), ou objeto de upload com `url` OU `path`.
 *
 * O `path` sozinho conta porque, desde que o preview passou a usar Signed
 * URL, uploads feitos pelo GESTOR (ex.: ASO) gravam só `path` — nunca uma
 * Public URL. Checar só `.url` fazia esses arquivos aparecerem como "Não
 * enviado" mesmo depois de subir com sucesso.
 *
 * Array vazio ([]) conta como PREENCHIDO, não vazio: para o campo
 * "Dependentes", uma lista vazia é a resposta legítima de quem não tem
 * dependentes — é uma resposta, não um campo em branco. O que continua
 * contando como "não enviado" é o valor `undefined` (o colaborador nunca
 * chegou a essa etapa) — ver o preenchimento automático em `handleNext` de
 * PreencherAdmissao.jsx, que grava `[]` ao avançar se o campo não foi tocado.
 */
export function isFieldValueEmpty(value) {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return false;
  if (typeof value === 'object') return !value.url && !value.path;
  return false;
}
