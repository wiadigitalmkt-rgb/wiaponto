import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { mapAdminStepsToWizardSteps } from '@/lib/admissionSteps';
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
} from 'lucide-react';

// ---------------------------------------------------------------------------
// CONFIGURAÇÃO — ajuste estes valores conforme o seu schema no Supabase
// ---------------------------------------------------------------------------
const TABLE_ADMISSIONS = 'employee_admissions';
const STORAGE_BUCKET = 'admissao-documentos';

const STATUS = {
  EM_PREENCHIMENTO: 'em_preenchimento',
  CONCLUIDO: 'preenchido',
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
};

function getFieldIcon(field) {
  return ICON_BY_TYPE[field.type] || AlignLeft;
}

function isValueEmpty(value) {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value === 'object') return !value.url;
  return false;
}

export default function PreencherAdmissao({ admissionId: admissionIdProp }) {
  // Aceita o id tanto por prop quanto por parâmetro de rota (/admissao/:id
  // ou /admissao/:admissionId). Ajuste conforme suas rotas.
  const routeParams = useParams ? useParams() : {};
  const admissionId = admissionIdProp || routeParams.admissionId || routeParams.id;

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
      if (field.required && isValueEmpty(formData[field.key])) {
        errs[field.key] = 'Campo obrigatório.';
      }
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function persistProgress(nextStatus) {
    setSaving(true);
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from(TABLE_ADMISSIONS)
        .update({
          progress_data: formData,
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
    const isLastStep = currentStep === totalSteps - 1;
    const ok = await persistProgress(isLastStep ? STATUS.CONCLUIDO : STATUS.EM_PREENCHIMENTO);
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

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #fc9314, #ff8b00)' }}
          >
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 mb-1">Admissão enviada!</h1>
          <p className="text-sm text-slate-500">
            Suas informações foram registradas com sucesso. Nosso time de RH vai analisar tudo em breve.
          </p>
        </div>
      </div>
    );
  }

  if (!step) return null;

  const fields = step.fields || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8">
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
                onChange={(val) => updateField(field.key, val)}
                onFile={(file) => handleFileSelect(field, file)}
                onRemoveFile={() => removeFile(field)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Rodapé fixo com ações */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0 || saving}
            className="flex items-center gap-1 text-sm font-medium text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-lg hover:bg-slate-50 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-500 px-3 py-2 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
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
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RENDERIZADOR DE CAMPOS — decide o input certo a partir de field.type
// ---------------------------------------------------------------------------
function FieldRenderer({ field, value, error, uploading, onChange, onFile, onRemoveFile }) {
  const Icon = getFieldIcon(field);
  const isWide = field.type === 'textarea' || field.type === 'file' || field.type === 'photo';

  return (
    <div className={isWide ? 'sm:col-span-2' : ''}>
      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        {field.label}
        {field.required && <span style={{ color: '#ff8b00' }}>*</span>}
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

    case 'text':
    default:
      return (
        <input
          type="text"
          className={baseClasses}
          style={focusStyle}
          placeholder={field.placeholder || ''}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
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
