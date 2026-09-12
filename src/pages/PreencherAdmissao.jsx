import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { mapAdminStepsToWizardSteps, isFieldDynamicallyRequired } from '@/lib/admissionSteps';
import {
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Camera,
  FileText,
  Calendar, 
  Mail,
  Phone,
  ListChecks,
  AlignLeft,
  CheckSquare,
  AlertCircle,
  X,
  Save,
  Users,
  Plus,
  Trash2,
  Lock,
  PenLine,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// CONFIGURAÇÃO — ajuste estes valores conforme o seu schema no Supabase
// ---------------------------------------------------------------------------
const TABLE_ADMISSIONS = 'employee_admissions';
const STORAGE_BUCKET = 'admissao-documentos';

// IMPORTANTE: estas strings precisam ser IDÊNTICAS às usadas em
// admin_Admissao.jsx (na criação da admissão e no filtro das abas
// "Em andamento" / "Concluídos"). Antes este arquivo usava
// 'em_preenchimento' / 'preenchido', que não batiam com 'Em andamento' /
// 'Concluído' do painel — por isso o registro sumia das duas abas assim
// que o colaborador salvava qualquer etapa.
const STATUS = {
  EM_PREENCHIMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
};

// Ícone padrão por tipo de campo (ajuda o colaborador a reconhecer o que é
// pedido em cada linha do formulário).
const ICON_BY_TYPE = {
  text: AlignLeft,
  textarea: AlignLeft,
  select: ListChecks,
  radio: ListChecks,
  date: Calendar,
  email: Mail,
  tel: Phone,
  file: FileText,
  photo: Camera,
  checkbox: CheckSquare,
  dependents: Users,
  signature: PenLine,
};

function getFieldIcon(field) {
  return ICON_BY_TYPE[field.type] || AlignLeft;
}

function isValueEmpty(value) {
  if (value === undefined || value === null || value === '') return true;
  // Lista vazia (ex.: "Dependentes" sem nenhum cadastrado) é uma resposta
  // válida, não um campo em branco — só `undefined` (nunca tocado) conta
  // como vazio. handleNext() grava explicitamente `[]` ao avançar se o
  // colaborador não tocou no campo, pra registrar essa resposta.
  if (Array.isArray(value)) return false;
  if (typeof value === 'object') return !value.url && !value.path;
  return false;
}

function formatCPF(raw) {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function PreencherAdmissao({ admissionId: admissionIdProp }) {
  // Aceita o id tanto por prop quanto por parâmetro de rota (/admissao/:id
  // ou /admissao/:admissionId). Ajuste conforme suas rotas.
  const routeParams = useParams ? useParams() : {};
  const admissionId = admissionIdProp || routeParams.admissionId || routeParams.id;

  // Ao fechar o popup de sucesso, redireciona para a tela de bate-ponto.
  // Usa location.href (em vez de navigate()) porque é o comportamento mais
  // seguro/garantido independentemente de como as rotas do app estão
  // montadas, já que a regra de negócio pede especificamente essa URL.
  function handleGoToClock() {
    window.location.href = 'https://wiaponto.vercel.app/ponto';
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [admission, setAdmission] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploadingKey, setUploadingKey] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Gate de código de acesso: quem abre o link precisa confirmar o código
  // de 6 dígitos enviado pelo gestor antes de ver qualquer campo do
  // formulário. Protege contra o link ser aberto por outra pessoa que não
  // o colaborador designado.
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    if (!admissionId) {
      setErrorMsg('Não foi possível identificar o processo de admissão. Verifique o link acessado.');
      setLoading(false);
      return;
    }
    fetchAdmission(admissionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admissionId]);

  async function fetchAdmission(id) {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from(TABLE_ADMISSIONS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Processo de admissão não encontrado.');

      // `template_steps` já vem gravado no formato "wizard" (uma pergunta
      // por etapa) pelo admin_Admissao.jsx no momento em que a admissão é
      // criada — ver mapAdminStepsToWizardSteps em '@/lib/admissionSteps'.
      let loadedSteps =
        Array.isArray(data.template_steps) && data.template_steps.length > 0
          ? data.template_steps
          : null;

      // Fallback para admissões criadas antes desse ajuste (registros sem
      // template_steps salvo): busca o template original pelo template_id
      // e monta o snapshot em tempo real a partir dele.
      if (!loadedSteps && data.template_id) {
        const { data: tmpl, error: tmplError } = await supabase
          .from('admission_templates')
          .select('steps')
          .eq('id', data.template_id)
          .single();

        if (!tmplError && tmpl?.steps) {
          const rebuilt = mapAdminStepsToWizardSteps(tmpl.steps);
          if (rebuilt.length > 0) {
            loadedSteps = rebuilt;
            // Best-effort: grava o snapshot agora para não precisar
            // recalcular nas próximas vezes que este link for aberto.
            supabase
              .from(TABLE_ADMISSIONS)
              .update({ template_steps: rebuilt })
              .eq('id', id)
              .then(() => {});
          }
        }
      }

      if (!Array.isArray(loadedSteps) || loadedSteps.length === 0) {
        throw new Error('Este processo ainda não tem etapas configuradas no template.');
      }

      setAdmission(data);
      setSteps(loadedSteps);
      setFormData(data.progress_data || {});
      setCompleted(data.status === STATUS.CONCLUIDO);

      // Sem código de acesso salvo (admissão criada antes desse recurso
      // existir): não bloqueia, mantém compatível com links já enviados.
      // Com código: só libera se já foi validado nesta mesma aba antes
      // (sessionStorage), pra não pedir de novo a cada "Salvar rascunho".
      if (!data.access_code) {
        setAccessGranted(true);
      } else {
        try {
          const remembered = sessionStorage.getItem(`admissao_access_${id}`);
          setAccessGranted(remembered === data.access_code);
        } catch (e) {
          setAccessGranted(false);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao carregar o seu processo de admissão.');
    } finally {
      setLoading(false);
    }
  }

  const step = steps[currentStep];
  const totalSteps = steps.length;
  const progressPercent = totalSteps
    ? Math.round(((completed ? totalSteps : currentStep) / totalSteps) * 100)
    : 0;

  function updateField(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleFileSelect(field, file) {
    if (!file) return;
    setUploadingKey(field.key);
    setErrorMsg('');
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `${admissionId}/${field.key}-${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

      updateField(field.key, {
        path,
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      });

      // Assinatura: além de ficar em progress_data (como qualquer outro
      // campo, pro gestor ver na visualização), grava o path também direto
      // no cadastro do colaborador. É esse registro em Employees que outras
      // partes do sistema (assinatura do contrato, espelho de ponto mensal)
      // vão usar futuramente — não faz sentido elas terem que ir buscar
      // dentro do JSON de uma admissão específica.
      if (field.key === 'assinatura' && admission?.employee_id) {
        const { error: empError } = await supabase
          .from('Employees')
          .update({ signature_path: urlData.publicUrl })
          .eq('id', admission.employee_id);
        if (empError) {
          // Best-effort: não bloqueia o formulário do colaborador por causa
          // disso, só loga pra investigar depois.
          console.error('Erro ao gravar assinatura no cadastro do colaborador:', empError);
        }
      }
    } catch (err) {
      console.error(err);
      setFieldErrors((prev) => ({ ...prev, [field.key]: 'Falha no upload. Tente novamente.' }));
    } finally {
      setUploadingKey(null);
    }
  }

  function removeFile(field) {
    updateField(field.key, null);
  }

  function validateStep(stepToValidate) {
    const errs = {};
    (stepToValidate.fields || []).forEach((field) => {
      const required = field.required || isFieldDynamicallyRequired(field, formData);
      if (required && isValueEmpty(formData[field.key])) {
        errs[field.key] = 'Campo obrigatório.';
      }
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function persistProgress(nextStatus, dataOverride) {
    setSaving(true);
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from(TABLE_ADMISSIONS)
        .update({
          progress_data: dataOverride || formData,
          status: nextStatus || admission?.status || STATUS.EM_PREENCHIMENTO,
          updated_at: new Date().toISOString(),
        })
        .eq('id', admissionId);
      if (error) throw error;
      setLastSavedAt(new Date());
      return true;
    } catch (err) {
      console.error(err);
      setErrorMsg('Não foi possível salvar suas respostas agora. Tente novamente em instantes.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    if (!validateStep(step)) return;

    // Campos tipo "dependents" (Dependentes) contam como respondidos mesmo
    // com zero dependentes — uma lista vazia é uma resposta, não um campo
    // em branco. Se o colaborador passou pela etapa sem tocar no campo,
    // grava explicitamente uma lista vazia ao avançar.
    const defaults = {};
    (step.fields || []).forEach((field) => {
      if (field.type === 'dependents' && formData[field.key] === undefined) {
        defaults[field.key] = [];
      }
    });
    const nextFormData = Object.keys(defaults).length > 0 ? { ...formData, ...defaults } : formData;
    if (nextFormData !== formData) setFormData(nextFormData);

    const isLastStep = currentStep === totalSteps - 1;
    const ok = await persistProgress(isLastStep ? STATUS.CONCLUIDO : STATUS.EM_PREENCHIMENTO, nextFormData);
    if (!ok) return;
    if (isLastStep) {
      setCompleted(true);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handlePrev() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  async function handleSaveDraft() {
    await persistProgress(STATUS.EM_PREENCHIMENTO);
  }

  function handleVerifyAccessCode(e) {
    e.preventDefault();
    setAccessError('');
    const normalizedInput = accessCodeInput.replace(/\D/g, '');
    if (!normalizedInput) {
      setAccessError('Digite o código de acesso.');
      return;
    }
    if (normalizedInput === admission?.access_code) {
      setAccessGranted(true);
      try {
        sessionStorage.setItem(`admissao_access_${admissionId}`, admission.access_code);
      } catch (e) {
        // sessionStorage indisponível (ex.: modo anônimo restrito) — sem
        // problema, só vai pedir o código de novo se a aba for recarregada.
      }
    } else {
      setAccessError('Código incorreto. Confira o código enviado por quem te mandou o link.');
    }
  }

  // ---------------------------------------------------------------------
  // ESTADOS DE TELA: carregando / erro / concluído
  // ---------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#fc9314' }} />
          <p className="text-sm">Carregando seu processo de admissão...</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !admission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-slate-800 mb-1">Não foi possível abrir o formulário</h1>
          <p className="text-sm text-slate-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (admission?.access_code && !accessGranted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #fc9314, #ff8b00)' }}
          >
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-slate-800 mb-1">Confirme seu acesso</h1>
          <p className="text-sm text-slate-500 mb-5">
            Este formulário é pessoal. Digite o código de acesso que você recebeu junto com o link.
          </p>

          <form onSubmit={handleVerifyAccessCode} className="space-y-3 text-left">
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              placeholder="000000"
              value={accessCodeInput}
              onChange={(e) => {
                setAccessCodeInput(e.target.value);
                setAccessError('');
              }}
              className="w-full text-center tracking-[0.3em] text-lg font-semibold rounded-lg border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ '--tw-ring-color': '#fc9314' }}
            />
            {accessError && <p className="text-xs text-red-500 text-center">{accessError}</p>}
            <button
              type="submit"
              className="w-full text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #fc9314, #ff8b00)' }}
            >
              Confirmar
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="relative max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <button
            type="button"
            onClick={handleGoToClock}
            aria-label="Fechar e ir para o bate-ponto"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #fc9314, #ff8b00)' }}
          >
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 mb-1">Admissão enviada!</h1>
          <p className="text-sm text-slate-500 mb-6">
            Suas informações foram registradas com sucesso. Nosso time de RH vai analisar tudo em breve.
          </p>

          <button
            type="button"
            onClick={handleGoToClock}
            className="w-full text-sm font-semibold text-white px-4 py-3 rounded-xl transition active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #fc9314, #ff8b00)' }}
          >
            Ir para o bate-ponto
          </button>
        </div>
      </div>
    );
  }

  if (!step) return null;

  const fields = step.fields || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Processo de admissão</p>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
            {admission?.employee_name || 'Bem-vindo(a) ao seu formulário'}
          </h1>

          {/* Barra de progresso geral */}
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #fc9314, #ff8b00)',
              }}
            />
          </div>

          {/* Navegação entre etapas */}
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
            {steps.map((s, idx) => {
              const isActive = idx === currentStep;
              const isDone = idx < currentStep;
              return (
                <div
                  key={s.id || idx}
                  className="flex items-center gap-1.5 shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{
                    background: isActive ? '#fff7ec' : isDone ? '#fff7ec' : '#f8fafc',
                    color: isActive || isDone ? '#c96f0a' : '#94a3b8',
                    border: isActive ? '1px solid #fc9314' : '1px solid transparent',
                  }}
                >
                  <span
                    className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] text-white"
                    style={{
                      background: isActive || isDone ? 'linear-gradient(135deg, #fc9314, #ff8b00)' : '#cbd5e1',
                    }}
                  >
                    {isDone ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                  </span>
                  {s.title}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Conteúdo da etapa atual */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-8">
            <div className="mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">{step.title}</h2>
              {step.description && <p className="text-sm text-slate-500 mt-1">{step.description}</p>}
            </div>

            {errorMsg && (
              <div className="mb-5 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {fields.map((field) => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={formData[field.key]}
                  error={fieldErrors[field.key]}
                  uploading={uploadingKey === field.key}
                  required={field.required || isFieldDynamicallyRequired(field, formData)}
                  onChange={(val) => updateField(field.key, val)}
                  onFile={(file) => handleFileSelect(field, file)}
                  onRemoveFile={() => removeFile(field)}
                />
              ))}
            </div>
          </div>

          {/* Ações — agora coladas ao próprio card do formulário, em vez de
              fixas no rodapé da tela (ficavam distantes em telas com pouco
              conteúdo, como campos de data/seleção única). */}
          <div className="border-t border-slate-200 bg-slate-50/60 px-5 sm:px-8 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0 || saving}
              className="flex items-center gap-1 text-sm font-medium text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-lg hover:bg-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-500 px-3 py-2 rounded-lg hover:bg-white transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Salvar rascunho
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2.5 rounded-xl shadow-sm disabled:opacity-70 transition active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #fc9314, #ff8b00)' }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentStep === totalSteps - 1 ? (
                  'Enviar admissão'
                ) : (
                  <>
                    Avançar
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RENDERIZADOR DE CAMPOS — decide o input certo a partir de field.type
// ---------------------------------------------------------------------------
function FieldRenderer({ field, value, error, uploading, required, onChange, onFile, onRemoveFile }) {
  const Icon = getFieldIcon(field);
  const isWide = field.type === 'textarea' || field.type === 'file' || field.type === 'photo' || field.type === 'dependents' || field.type === 'signature';
  const isRequired = required ?? field.required;

  return (
    <div className={isWide ? 'sm:col-span-2' : ''}>
      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        {field.label}
        {isRequired && <span style={{ color: '#ff8b00' }}>*</span>}
      </label>

      {renderInput(field, value, onChange, onFile, onRemoveFile, uploading)}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function renderInput(field, value, onChange, onFile, onRemoveFile, uploading) {
  const baseClasses =
    'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition';
  const focusStyle = { '--tw-ring-color': '#fc9314' };

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          className={baseClasses}
          style={focusStyle}
          rows={3}
          placeholder={field.placeholder || ''}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'select':
      return (
        <select
          className={baseClasses}
          style={focusStyle}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            Selecione...
          </option>
          {(field.options || []).map((opt) => {
            const optValue = typeof opt === 'string' ? opt : opt.value;
            const optLabel = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={optValue} value={optValue}>
                {optLabel}
              </option>
            );
          })}
        </select>
      );

    case 'radio':
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options || []).map((opt) => {
            const optValue = typeof opt === 'string' ? opt : opt.value;
            const optLabel = typeof opt === 'string' ? opt : opt.label;
            const active = value === optValue;
            return (
              <button
                type="button"
                key={optValue}
                onClick={() => onChange(optValue)}
                className="text-sm font-medium px-3.5 py-2 rounded-lg border transition"
                style={
                  active
                    ? { background: '#fff7ec', borderColor: '#fc9314', color: '#c96f0a' }
                    : { background: '#fff', borderColor: '#e2e8f0', color: '#475569' }
                }
              >
                {optLabel}
              </button>
            );
          })}
        </div>
      );

    case 'checkbox':
      return (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className="flex items-center gap-2 text-sm font-medium px-3.5 py-2.5 rounded-lg border w-full"
          style={
            value
              ? { background: '#fff7ec', borderColor: '#fc9314', color: '#c96f0a' }
              : { background: '#fff', borderColor: '#e2e8f0', color: '#475569' }
          }
        >
          <CheckSquareIndicator checked={!!value} />
          {field.placeholder || 'Confirmo'}
        </button>
      );

    case 'date':
      return (
        <input
          type="date"
          className={baseClasses}
          style={focusStyle}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'email':
      return (
        <input
          type="email"
          className={baseClasses}
          style={focusStyle}
          placeholder={field.placeholder || 'nome@email.com'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'tel':
      return (
        <input
          type="tel"
          className={baseClasses}
          style={focusStyle}
          placeholder={field.placeholder || '(00) 00000-0000'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'photo':
      return (
        <SelfieCapture
          field={field}
          value={value}
          uploading={uploading}
          onFile={onFile}
          onRemove={onRemoveFile}
        />
      );

    case 'file':
      return (
        <FileUploadBox
          field={field}
          value={value}
          uploading={uploading}
          onFile={onFile}
          onRemove={onRemoveFile}
          accept={field.accept || 'image/*,.pdf'}
        />
      );

    case 'dependents':
      return <DependentsRepeater value={value} onChange={onChange} />;

    case 'signature':
      return (
        <SignaturePad field={field} value={value} uploading={uploading} onFile={onFile} onRemove={onRemoveFile} />
      );

    case 'text':
    default:
      return (
        <input
          type="text"
          className={baseClasses}
          style={focusStyle}
          placeholder={field.placeholder || ''}
          value={value || ''}
          onChange={(e) => onChange(field.mask === 'cpf' ? formatCPF(e.target.value) : e.target.value)}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// DEPENDENTES — lista dinâmica de nome/CPF/data de nascimento. Guardado em
// progress_data como array: [{ name, cpf, birth_date }, ...]
// ---------------------------------------------------------------------------
function DependentsRepeater({ value, onChange }) {
  const dependents = Array.isArray(value) ? value : [];

  function updateDependent(index, patch) {
    const next = dependents.map((dep, i) => (i === index ? { ...dep, ...patch } : dep));
    onChange(next);
  }

  function addDependent() {
    onChange([...dependents, { name: '', cpf: '', birth_date: '' }]);
  }

  function removeDependent(index) {
    onChange(dependents.filter((_, i) => i !== index));
  }

  const inputClasses =
    'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition';

  return (
    <div className="space-y-3">
      {dependents.length === 0 && (
        <p className="text-xs text-slate-400">
          Se você não possui dependentes, pode deixar em branco e avançar.
        </p>
      )}

      {dependents.map((dep, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Dependente {index + 1}</span>
            <button
              type="button"
              onClick={() => removeDependent(index)}
              className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-red-500 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Nome completo"
              className={inputClasses}
              value={dep.name || ''}
              onChange={(e) => updateDependent(index, { name: e.target.value })}
            />
            <input
              type="text"
              placeholder="CPF"
              className={inputClasses}
              value={dep.cpf || ''}
              onChange={(e) => updateDependent(index, { cpf: formatCPF(e.target.value) })}
            />
            <input
              type="date"
              className={inputClasses}
              value={dep.birth_date || ''}
              onChange={(e) => updateDependent(index, { birth_date: e.target.value })}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addDependent}
        className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg border border-dashed border-slate-300 text-slate-600 hover:border-[#fc9314] hover:text-[#c96f0a] transition"
      >
        <Plus className="w-4 h-4" />
        Adicionar dependente
      </button>
    </div>
  );
}

function CheckSquareIndicator({ checked }) {
  return (
    <span
      className="w-4 h-4 rounded flex items-center justify-center border shrink-0"
      style={{
        background: checked ? 'linear-gradient(135deg, #fc9314, #ff8b00)' : '#fff',
        borderColor: checked ? 'transparent' : '#cbd5e1',
      }}
    >
      {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ASSINATURA — desenho livre com o dedo (touch) ou mouse, num canvas. Ao
// confirmar, vira um PNG e sobe pelo mesmo pipeline de upload dos outros
// campos (handleFileSelect -> onFile).
// ---------------------------------------------------------------------------
function SignaturePad({ field, value, uploading, onFile, onRemove }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [redoing, setRedoing] = useState(false);

  // Prepara o canvas com fundo branco (assinatura precisa ficar legível
  // depois, impressa no contrato/espelho de ponto — PNG transparente sobre
  // fundo escuro ficaria ilegível).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [redoing]);

  function getCanvasPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasPoint(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawn) setHasDrawn(true);
  }

  function stopDraw(e) {
    drawingRef.current = false;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function handleConfirm() {
    const canvas = canvasRef.current;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `assinatura-${Date.now()}.png`, { type: 'image/png' });
        onFile(file);
      },
      'image/png',
      1
    );
  }

  // Assinatura já enviada: mostra preview e permite refazer.
  if (value?.url && !redoing) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
        <img
          src={value.url}
          alt={field.label}
          className="w-32 h-16 rounded-lg object-contain border border-slate-200 bg-white"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">Assinatura salva</p>
          <p className="text-xs text-slate-400">Enviada com sucesso</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setRedoing(true);
            setHasDrawn(false);
          }}
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-red-500 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 space-y-3">
      <p className="text-xs text-slate-500">
        Desenhe sua assinatura na área abaixo, igual à do seu documento. Ela será usada para assinar
        seu contrato e o espelho de ponto todo mês.
      </p>
      <canvas
        ref={canvasRef}
        width={600}
        height={220}
        className="w-full rounded-lg border border-slate-200 bg-white touch-none"
        style={{ touchAction: 'none' }}
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={stopDraw}
        onPointerLeave={stopDraw}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={uploading}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!hasDrawn || uploading}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white px-4 py-2.5 rounded-xl disabled:opacity-50 transition active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #fc9314, #ff8b00)' }}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
          {uploading ? 'Salvando...' : 'Confirmar assinatura'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SELFIE — captura ao vivo pela câmera (sem opção de anexar da galeria)
// ---------------------------------------------------------------------------
function SelfieCapture({ field, value, uploading, onFile, onRemove }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    // Garante que a câmera é desligada ao trocar de etapa ou sair da página.
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O elemento <video> só existe no DOM quando `cameraActive` é true (ele
  // fica dentro do bloco condicional do JSX). Por isso a conexão do stream
  // ao <video> precisa acontecer DEPOIS que o React renderiza esse bloco,
  // e não dentro de startCamera() — nesse momento videoRef.current ainda
  // é null, então o stream era obtido mas nunca chegava a ser exibido
  // (tela preta) e capturePhoto() não tinha frame nenhum para capturar
  // (botão "Tirar foto" não fazia nada).
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch((err) => {
      console.error(err);
      setCameraError('Não foi possível iniciar a pré-visualização da câmera. Tente novamente.');
      setCameraActive(false);
    });
  }, [cameraActive]);

  async function startCamera() {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Este navegador não permite acesso à câmera. Tente pelo Chrome ou Safari atualizados.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      // Ativa o estado primeiro: isso faz o React renderizar o <video>,
      // e o useEffect acima conecta o stream a ele assim que existir.
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      setCameraError('Não foi possível acessar a câmera. Verifique se você permitiu o uso da câmera para este site.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Desfaz o espelhamento do preview (câmera frontal) para a foto salva
    // não sair invertida.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onFile(file);
        stopCamera();
      },
      'image/jpeg',
      0.9
    );
  }

  // Selfie já enviada: mostra preview e permite refazer.
  if (value?.url) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
        <img
          src={value.url}
          alt={field.label}
          className="w-14 h-14 rounded-lg object-cover border border-slate-200"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">Selfie enviada</p>
          <p className="text-xs text-slate-400">Enviada com sucesso</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-red-500 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 p-4">
      {cameraActive ? (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              className="w-full aspect-[4/3] object-cover"
              style={{ transform: 'scaleX(-1)' }}
              playsInline
              muted
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={capturePhoto}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white px-4 py-2.5 rounded-xl disabled:opacity-70 transition active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #fc9314, #ff8b00)' }}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {uploading ? 'Enviando...' : 'Tirar foto'}
            </button>
            <button
              type="button"
              onClick={stopCamera}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
          <Camera className="w-6 h-6 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">A selfie precisa ser tirada na hora</span>
          <span className="text-xs text-slate-400 mb-1">Não é possível anexar uma foto da galeria</span>
          <button
            type="button"
            onClick={startCamera}
            className="mt-1 text-sm font-semibold px-4 py-2 rounded-lg text-white transition active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #fc9314, #ff8b00)' }}
          >
            Abrir câmera
          </button>
          {cameraError && <p className="text-xs text-red-500 mt-2 max-w-xs">{cameraError}</p>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UPLOAD DE ARQUIVO — usado apenas para campos do tipo "file" (documentos)
// ---------------------------------------------------------------------------
function FileUploadBox({ field, value, uploading, onFile, onRemove, accept, capture, isPhoto }) {
  const inputId = `upload-${field.key}`;
  const isImagePreview = value?.type?.startsWith('image/');

  if (value?.url) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
        {isImagePreview ? (
          <img src={value.url} alt={field.label} className="w-14 h-14 rounded-lg object-cover border border-slate-200" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">{value.name}</p>
          <p className="text-xs text-slate-400">Enviado com sucesso</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-red-500 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      htmlFor={inputId}
      className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 px-4 cursor-pointer hover:border-[#fc9314] hover:bg-orange-50/30 transition text-center"
    >
      {uploading ? (
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#fc9314' }} />
      ) : isPhoto ? (
        <Camera className="w-6 h-6 text-slate-400" />
      ) : (
        <FileText className="w-6 h-6 text-slate-400" />
      )}
      <span className="text-sm font-medium text-slate-600">
        {uploading ? 'Enviando...' : isPhoto ? 'Tirar ou enviar uma selfie' : 'Selecionar arquivo'}
      </span>
      <span className="text-xs text-slate-400">{isPhoto ? 'JPG ou PNG' : 'PDF, JPG ou PNG'}</span>
      <input
        id={inputId}
        type="file"
        accept={accept}
        capture={capture}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </label>
  );
}
