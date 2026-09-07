import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { mapAdminStepsToWizardSteps, mapAdminStepsToAllFields, isFieldValueEmpty } from '@/lib/admissionSteps';
import {
  Search,
  ArrowLeft,
  Plus,
  CheckCircle2, 
  XCircle,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  Link as LinkIcon, 
  Share2,
  FileText,
  ExternalLink,
  Trash2,
  AlertTriangle,
  X,
  Upload,
} from 'lucide-react';

// Mesmo bucket usado em PreencherAdmissao.jsx para o upload de selfie/anexos.
const STORAGE_BUCKET = 'admissao-documentos';

const IMAGE_EXT_REGEX = /\.(jpe?g|png|gif|webp|bmp|heic)(\?.*)?$/i;

// Um valor de campo de anexo pode ser: { url, path, name, type } (formato
// gravado pelo upload em PreencherAdmissao.jsx). Considera "imagem" quando o
// campo é do tipo foto, ou quando o arquivo anexado é uma imagem (pelo
// mime-type salvo ou pela extensão da URL/nome).
function isImageLikeValue(field, value) {
  if (!value || typeof value !== 'object') return false;
  if (field?.type === 'photo') return true;
  const mime = value.type || '';
  const nameOrUrl = value.name || value.url || value.path || '';
  return mime.startsWith('image/') || IMAGE_EXT_REGEX.test(nameOrUrl);
}

// Duração da URL temporária de acesso aos arquivos (em segundos). Documentos
// de admissão são dados pessoais (LGPD) — nunca expostos por URL pública.
const SIGNED_URL_TTL_SECONDS = 3600; // 1 hora

// Upload simples usado pelo GESTOR na tela de visualização (hoje só para o
// ASO). Diferente do FileUploadBox do colaborador: aqui não há preview de
// arrastar-e-soltar, é só um botão que abre o seletor de arquivo do sistema.
function ManagerFileUpload({ fieldKey, uploading, onFile, replace }) {
  const inputId = `manager-upload-${fieldKey}`;
  return (
    <label
      htmlFor={inputId}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-dashed border-[#ff8b00] text-[#ff8b00] hover:bg-[#ff8b00]/10 cursor-pointer transition"
    >
      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
      {uploading ? 'Enviando...' : replace ? 'Substituir arquivo do ASO' : 'Anexar ASO (PDF ou imagem)'}
      <input
        id={inputId}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </label>
  );
}

export default function Admissao() {
  const navigate = useNavigate();

  // Fluxos de navegação: 'list' | 'select_employees' | 'create_template' | 'select_template' | 'view_admission'
  const [viewState, setViewState] = useState('list');
  const [activeTab, setActiveTab] = useState('andamento'); // 'andamento' | 'concluidos' | 'templates'

  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Dados do banco
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Fluxo de Seleção de Colaborador e Template
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [activeAdmission, setActiveAdmission] = useState(null);

  // Estado para a criação de Novo Template
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templateSteps, setTemplateSteps] = useState([
    { id: '1', name: 'Selfie', type: 'anexo/foto', active: true },
    { id: '2', name: 'Estado civil', type: 'selecionar opção', active: true },
    { id: '3', name: 'Telefone', type: 'campo texto', active: true },
    { id: '4', name: 'E-mail', type: 'campo texto', active: true },
    { id: '5', name: 'Número do RG', type: 'campo texto', active: true },
    { id: '6', name: 'Número do PIS', type: 'campo texto', active: true },
    { id: '7', name: 'Endereço', type: 'campo texto', active: true },
    { id: '8', name: 'Dados bancários', type: 'campo texto', active: true },
    { id: '9', name: 'Data de nascimento', type: 'campo data', active: true },
    { id: '10', name: 'CPF', type: 'campo texto', active: true },
    { id: '11', name: 'Nome da Mãe', type: 'campo texto', active: true },
    { id: '12', name: 'Nacionalidade', type: 'campo texto', active: true },
    { id: '13', name: 'Naturalidade', type: 'campo texto', active: true },
    { id: '14', name: 'Grau de Instrução', type: 'selecionar opção', active: true },
    // employeeVisible: false -> este campo nunca aparece no formulário do
    // colaborador (mapAdminStepsToWizardSteps filtra por essa flag). É
    // preenchido pelo gestor, no painel, depois que o exame sai.
    { id: '15', name: 'ASO / Exame Admissional', type: 'anexo/arquivo', active: true, employeeVisible: false },
    { id: '16', name: 'Vale-Transporte', type: 'selecionar opção', active: true },
    { id: '17', name: 'Dependentes', type: 'lista de dependentes', active: true },
  ]);
  const [customSteps, setCustomSteps] = useState([]);

  // Accordion do modo Visualização
  const [expandedField, setExpandedField] = useState(null);

  // Menu de ações (⋯) por linha de template, e modal de confirmação de exclusão
  const [openTemplateMenuId, setOpenTemplateMenuId] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  // Signed URLs (temporárias) dos arquivos de admissão, por `path`, e modal
  // de preview de imagem/documento na tela de visualização do gestor.
  const [signedUrls, setSignedUrls] = useState({}); // { [path]: { url, expiresAt } }
  const [signedUrlLoading, setSignedUrlLoading] = useState({}); // { [path]: boolean }
  const [previewModal, setPreviewModal] = useState(null); // { url, label, isFile? } | null

  // Menu de ações (⋯) e modal de confirmação de exclusão de admissão (aba Concluídos)
  const [openAdmissionMenuId, setOpenAdmissionMenuId] = useState(null);
  const [admissionToDelete, setAdmissionToDelete] = useState(null);
  const [deletingAdmission, setDeletingAdmission] = useState(false);

  // Upload do ASO feito pelo gestor na tela de visualização
  const [managerUploading, setManagerUploading] = useState(false);

  // Toast simples de feedback (copiar link, etc.)
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 2500);
  };

  useEffect(() => {
    fetchData();
  }, [viewState, activeTab]);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // Carregar Templates
      const { data: tmplData } = await supabase
        .from('admission_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (tmplData) setTemplates(tmplData);

      // Carregar Colaboradores
      const { data: empData, error: empError } = await supabase
        .from('Employees')
        .select('*')
        .order('full_name', { ascending: true });
      if (empError) console.error('Erro ao carregar colaboradores:', empError);
      if (empData) setEmployees(empData);

      // Carregar Admissões
      const { data: admData } = await supabase
        .from('employee_admissions')
        .select(`
          id,
          status,
          template_name,
          template_id,
          template_steps,
          manager_template_steps,
          created_at,
          employee_id,
          progress_data,
          Employees (
            id,
            full_name,
            first_name,
            last_name,
            position,
            department
          )
        `)
        .order('created_at', { ascending: false });
      if (admData) setAdmissions(admData);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS E AÇÕES ---

  const handleToggleStep = (id) => {
    setTemplateSteps(prev =>
      prev.map(step => step.id === id ? { ...step, active: !step.active } : step)
    );
  };

  const handleAddCustomStep = () => {
    const title = prompt('Digite o nome da nova etapa/campo:');
    if (title) {
      setCustomSteps(prev => [
        ...prev,
        { id: Date.now().toString(), name: title, type: 'campo personalizado', active: true }
      ]);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Por favor, informe o nome do template.');
      return;
    }

    setLoading(true);
    const allSteps = [...templateSteps, ...customSteps];

    try {
      const { error } = await supabase.from('admission_templates').insert([
        {
          title: newTemplateName,
          description: `${allSteps.filter(s => s.active).length} campos configurados`,
          steps: allSteps,
          is_active: true
        }
      ]);

      if (!error) {
        setNewTemplateName('');
        setViewState('list');
        setActiveTab('templates');
        fetchData();
      } else {
        alert('Erro ao salvar template.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Abre o modal de confirmação (chamado a partir do menu ⋯ de cada linha)
  const handleRequestDeleteTemplate = (tmpl) => {
    setOpenTemplateMenuId(null);
    setTemplateToDelete(tmpl);
  };

  // Confirmação efetiva: apaga no Supabase e remove do estado local (sem F5)
  const handleConfirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setDeletingTemplate(true);
    try {
      const { error } = await supabase
        .from('admission_templates')
        .delete()
        .eq('id', templateToDelete.id);

      if (error) throw error;

      setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete.id));
      showToast('Template excluído com sucesso.');
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir template:', err);
      alert('Não foi possível excluir o template. Tente novamente.');
    } finally {
      setDeletingTemplate(false);
    }
  };

  // Abre a listagem de colaboradores (puxados da tabela Employees do Supabase)
  const handleOpenEmployeeSelection = () => {
    setSearchQuery('');
    setSelectedEmployees([]);
    setViewState('select_employees');
  };

  const handleToggleEmployeeSelection = (empId) => {
    setSelectedEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const handleStartAdmissionFlow = () => {
    if (selectedEmployees.length === 0) {
      alert('Selecione ao menos um colaborador.');
      return;
    }
    setViewState('select_template');
  };

  const handleConfirmTemplateSelection = async () => {
    if (!selectedTemplateId) {
      alert('Selecione um template.');
      return;
    }

    setLoading(true);
    const chosenTemplate = templates.find(t => t.id === selectedTemplateId);

    // Converte os steps "flat" do template (formato do gestor) para o
    // formato "wizard" (uma pergunta por etapa). Duas versões são gravadas:
    // - template_steps: SEM os campos employeeVisible:false (ex. ASO) — é o
    //   que PreencherAdmissao.jsx usa para montar o formulário do colaborador.
    // - manager_template_steps: COM todos os campos, inclusive os que só o
    //   gestor preenche — é o que a tela de visualização do gestor usa, para
    //   que o ASO apareça na lista mesmo não estando no formulário público.
    const wizardSteps = mapAdminStepsToWizardSteps(chosenTemplate?.steps);
    const managerSteps = mapAdminStepsToAllFields(chosenTemplate?.steps);

    if (wizardSteps.length === 0) {
      alert('O template selecionado não possui campos ativos configurados.');
      setLoading(false);
      return;
    }

    try {
      const inserts = selectedEmployees.map(empId => ({
        employee_id: empId,
        template_id: chosenTemplate?.id,
        template_name: chosenTemplate?.title || 'Template Padrão',
        template_steps: wizardSteps,
        manager_template_steps: managerSteps,
        status: 'Em andamento',
        progress_data: {}
      }));

      const { data, error } = await supabase.from('employee_admissions').insert(inserts).select(`
        id,
        status,
        template_name,
        template_id,
        template_steps,
        manager_template_steps,
        created_at,
        employee_id,
        progress_data,
        Employees (
          id,
          full_name,
          first_name,
          last_name,
          position,
          department
        )
      `);

      if (!error && data && data.length > 0) {
        setSelectedEmployees([]);
        setSelectedTemplateId(null);
        setActiveAdmission(data[0]);
        setViewState('view_admission');
        fetchData();
      } else if (error) {
        console.error(error);
        alert('Erro ao iniciar admissão.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdmissionView = (adm) => {
    setActiveAdmission(adm);
    setExpandedField(null);
    setViewState('view_admission');
  };

  // Gera (ou reaproveita, se ainda válida) uma Signed URL para o arquivo no
  // Storage. Nunca usamos getPublicUrl aqui — os documentos de admissão são
  // dados pessoais e o bucket deve estar configurado como privado.
  const ensureSignedUrl = async (path) => {
    if (!path) return null;
    const cached = signedUrls[path];
    if (cached && cached.expiresAt > Date.now()) return cached.url;

    setSignedUrlLoading((prev) => ({ ...prev, [path]: true }));
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      if (error) throw error;

      const url = data?.signedUrl || null;
      if (url) {
        // Guarda com uma margem de segurança de 60s antes do vencimento real,
        // para nunca usar uma URL que expire "no fio" durante o preview.
        setSignedUrls((prev) => ({
          ...prev,
          [path]: { url, expiresAt: Date.now() + (SIGNED_URL_TTL_SECONDS - 60) * 1000 },
        }));
      }
      return url;
    } catch (err) {
      console.error('Erro ao gerar link temporário do arquivo:', err);
      return null;
    } finally {
      setSignedUrlLoading((prev) => ({ ...prev, [path]: false }));
    }
  };

  // Deriva a lista de campos e o status "enviado/não enviado" da admissão
  // aberta. Usa `manager_template_steps` (snapshot COMPLETO, com ASO e
  // afins) — não `template_steps` (que é só o subconjunto do formulário do
  // colaborador). Cai para `template_steps` como fallback em admissões
  // criadas antes dessa coluna existir; o useEffect logo abaixo corrige
  // esses registros antigos automaticamente na primeira abertura.
  const admissionFieldItems = useMemo(() => {
    if (!activeAdmission) return [];
    const steps =
      Array.isArray(activeAdmission.manager_template_steps) && activeAdmission.manager_template_steps.length > 0
        ? activeAdmission.manager_template_steps
        : activeAdmission.template_steps || [];
    const admissionFields = steps.flatMap((s) => s.fields || []);
    const progressData = activeAdmission.progress_data || {};
    return admissionFields.map((field) => {
      const value = progressData[field.key];
      const sent = !isFieldValueEmpty(value);
      const displayValue = value && typeof value === 'object' ? value.name || value.url : value;
      const isImage = sent && isImageLikeValue(field, value);
      return { ...field, sent, displayValue, rawValue: value, isImage };
    });
  }, [activeAdmission]);

  // Backfill automático: admissões criadas antes de `manager_template_steps`
  // existir não têm campos como o ASO na lista. Ao abrir uma admissão nessa
  // situação, busca o template original (template_id) e recalcula o
  // snapshot completo, salvando para não precisar recalcular de novo.
  useEffect(() => {
    if (!activeAdmission) return;
    const hasManagerSteps =
      Array.isArray(activeAdmission.manager_template_steps) && activeAdmission.manager_template_steps.length > 0;
    if (hasManagerSteps || !activeAdmission.template_id) return;

    let cancelled = false;
    (async () => {
      const { data: tmpl, error } = await supabase
        .from('admission_templates')
        .select('steps')
        .eq('id', activeAdmission.template_id)
        .single();
      if (cancelled || error || !tmpl?.steps) return;

      const rebuilt = mapAdminStepsToAllFields(tmpl.steps);
      if (rebuilt.length === 0) return;

      const { error: updateError } = await supabase
        .from('employee_admissions')
        .update({ manager_template_steps: rebuilt })
        .eq('id', activeAdmission.id);
      if (updateError || cancelled) return;

      setActiveAdmission((prev) =>
        prev && prev.id === activeAdmission.id ? { ...prev, manager_template_steps: rebuilt } : prev
      );
      setAdmissions((prev) =>
        prev.map((a) => (a.id === activeAdmission.id ? { ...a, manager_template_steps: rebuilt } : a))
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [activeAdmission?.id, activeAdmission?.template_id]);

  // Assim que o gestor expande um campo de arquivo/foto, já dispara a
  // geração da Signed URL (em vez de esperar um clique extra).
  useEffect(() => {
    if (expandedField === null) return;
    const item = admissionFieldItems[expandedField];
    const path = item?.rawValue?.path;
    if (!path) return;
    const cached = signedUrls[path];
    if (cached && cached.expiresAt > Date.now()) return;
    ensureSignedUrl(path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedField, admissionFieldItems]);

  const getAdmissionLink = (adm) => `${window.location.origin}/preencher-admissao/${adm.id}`;

  // Varre progress_data e devolve os `path` de todo arquivo anexado (selfie,
  // documentos, ASO etc.) para poder apagá-los do Storage junto com o registro.
  const collectAdmissionStoragePaths = (admission) => {
    const progressData = admission?.progress_data || {};
    return Object.values(progressData)
      .filter((value) => value && typeof value === 'object' && !Array.isArray(value) && value.path)
      .map((value) => value.path);
  };

  const handleRequestDeleteAdmission = (adm) => {
    setOpenAdmissionMenuId(null);
    setAdmissionToDelete(adm);
  };

  const handleConfirmDeleteAdmission = async () => {
    if (!admissionToDelete) return;
    setDeletingAdmission(true);
    try {
      const paths = collectAdmissionStoragePaths(admissionToDelete);
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
        // Falha ao limpar arquivos não deve travar a exclusão do registro —
        // só loga para investigação manual depois, se precisar.
        if (storageError) console.error('Erro ao remover arquivos do Storage:', storageError);
      }

      const { error } = await supabase
        .from('employee_admissions')
        .delete()
        .eq('id', admissionToDelete.id);
      if (error) throw error;

      setAdmissions((prev) => prev.filter((a) => a.id !== admissionToDelete.id));
      if (activeAdmission?.id === admissionToDelete.id) {
        setActiveAdmission(null);
        setViewState('list');
      }
      showToast('Admissão excluída com sucesso.');
      setAdmissionToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir admissão:', err);
      alert('Não foi possível excluir a admissão. Tente novamente.');
    } finally {
      setDeletingAdmission(false);
    }
  };

  // Upload feito pelo GESTOR (não pelo colaborador) — usado hoje só para o
  // ASO, que só existe depois que o colaborador já concluiu a admissão.
  // Grava em progress_data com a mesma chave ('aso') usada no template, para
  // reaproveitar toda a lógica de exibição/preview já existente.
  const handleManagerFileUpload = async (field, file) => {
    if (!activeAdmission || !file) return;
    setManagerUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `${activeAdmission.id}/${field.key}-${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const newValue = {
        path,
        name: file.name,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'gestor',
      };
      const nextProgressData = { ...(activeAdmission.progress_data || {}), [field.key]: newValue };

      const { error: updateError } = await supabase
        .from('employee_admissions')
        .update({ progress_data: nextProgressData, updated_at: new Date().toISOString() })
        .eq('id', activeAdmission.id);
      if (updateError) throw updateError;

      setActiveAdmission((prev) => (prev ? { ...prev, progress_data: nextProgressData } : prev));
      setAdmissions((prev) =>
        prev.map((a) => (a.id === activeAdmission.id ? { ...a, progress_data: nextProgressData } : a))
      );
      showToast('Arquivo do ASO salvo com sucesso.');
    } catch (err) {
      console.error('Erro ao anexar ASO:', err);
      alert('Não foi possível salvar o arquivo do ASO. Tente novamente.');
    } finally {
      setManagerUploading(false);
    }
  };

  const handleCopyAdmissionLink = async (adm) => {
    const link = getAdmissionLink(adm);
    try {
      await navigator.clipboard.writeText(link);
      showToast('Link copiado para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar link:', err);
      alert('Não foi possível copiar automaticamente. Copie o link manualmente:\n' + link);
    }
  };

  const handleShareWhatsapp = (adm) => {
    const link = getAdmissionLink(adm);
    const text = `Olá! Segue o link para preenchimento dos seus dados de admissão na empresa: ${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Helpers de formatação
  const formatDate = (dateString) => {
    if (!dateString) return '09/08/2026';
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-BR');
  };

  const getInitials = (fullName, firstName, lastName) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (fullName) {
      const parts = fullName.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    }
    return 'WD';
  };

  // Filtros de busca
  const filteredAdmissions = admissions.filter(adm => {
    const emp = adm.Employees;
    const name = emp?.full_name || `${emp?.first_name || ''} ${emp?.last_name || ''}`;
    const matches = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (emp?.position || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'andamento') return matches && adm.status === 'Em andamento';
    if (activeTab === 'concluidos') return matches && adm.status === 'Concluído';
    return matches;
  });

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmployees = employees.filter(emp => {
    const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`;
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (emp.position || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (emp.department || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#f0f4f7] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Teste 11738" />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* BREADCRUMB */}
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <Link to="/admin" className="hover:text-[#ff8b00] transition-colors">Painel</Link>
          <span>&gt;</span>
          <span className="text-slate-600 font-medium">
            {viewState === 'select_employees' && (
              <>
                <button onClick={() => setViewState('list')} className="hover:text-[#ff8b00]">Admissão</button>
                <span> &gt; </span>
                <span className="text-[#ff8b00]">Selecionar colaboradores</span>
              </>
            )}
            {viewState === 'create_template' && (
              <>
                <button onClick={() => setViewState('list')} className="hover:text-[#ff8b00]">Admissão</button>
                <span> &gt; </span>
                <span className="text-[#ff8b00]">Novo Template</span>
              </>
            )}
            {viewState === 'select_template' && (
              <>
                <button onClick={() => setViewState('list')} className="hover:text-[#ff8b00]">Admissão</button>
                <span> &gt; </span>
                <span className="text-[#ff8b00]">Selecionar template</span>
              </>
            )}
            {viewState === 'view_admission' && (
              <>
                <button onClick={() => setViewState('list')} className="hover:text-[#ff8b00]">Admissão</button>
                <span> &gt; </span>
                <span className="text-[#ff8b00]">Visualização</span>
              </>
            )}
            {viewState === 'list' && 'Admissão'}
          </span>
        </div>

        {/* TÍTULO PRINCIPAL */}
        <h1 className="text-lg font-bold text-slate-800">Admissão</h1>

        {/* MODO 1: LISTAGEM PRINCIPAL */}
        {viewState === 'list' && (
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            {/* CABEÇALHO */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              {activeTab === 'templates' ? (
                <button
                  onClick={() => setViewState('create_template')}
                  className="border border-[#ff8b00] text-[#ff8b00] hover:bg-[#fc9314] hover:text-white hover:border-[#fc9314] text-xs font-semibold px-4 py-2 rounded transition-colors"
                >
                  Novo Template
                </button>
              ) : (
                <button
                  onClick={handleOpenEmployeeSelection}
                  className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-semibold px-4 py-2 rounded transition-colors shadow-sm"
                >
                  Iniciar admissão
                </button>
              )}
            </div>

            {/* NAVEGAÇÃO POR ABAS */}
            <div className="flex border-b border-slate-200 px-4 pt-2 gap-8 text-xs font-medium bg-white">
              <button
                onClick={() => setActiveTab('andamento')}
                className={`pb-3 transition-colors ${
                  activeTab === 'andamento'
                    ? 'border-b-2 border-[#ff8b00] text-[#ff8b00] font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Em andamento
              </button>
              <button
                onClick={() => setActiveTab('concluidos')}
                className={`pb-3 transition-colors ${
                  activeTab === 'concluidos'
                    ? 'border-b-2 border-[#ff8b00] text-[#ff8b00] font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Concluídos
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`pb-3 transition-colors ${
                  activeTab === 'templates'
                    ? 'border-b-2 border-[#ff8b00] text-[#ff8b00] font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Templates
              </button>
            </div>

            {/* BARRA DE PESQUISA */}
            <div className="p-4 bg-white border-b border-slate-100">
              <div className="relative max-w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'templates'
                      ? 'Buscar template...'
                      : 'Digite o nome do funcionário, cargo ou departamento'
                  }
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-[#ff8b00]"
                />
              </div>
            </div>

            {/* TABELAS DAS ABAS */}
            {activeTab !== 'templates' ? (
              <div className="overflow-x-auto min-h-[220px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-6">NOME</th>
                      <th className="py-3 px-4">STATUS ADMISSÃO</th>
                      <th className="py-3 px-4">TEMPLATE</th>
                      <th className="py-3 px-4">CARGO</th>
                      <th className="py-3 px-4">DEPARTAMENTO</th>
                      <th className="py-3 px-4 text-center">AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ff8b00]" />
                          Carregando...
                        </td>
                      </tr>
                    ) : filteredAdmissions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-500 font-medium">
                          Nenhum processo de admissão encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredAdmissions.map((adm) => {
                        const emp = adm.Employees || {};
                        const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Usuário Sem Nome';
                        const initials = getInitials(name, emp.first_name, emp.last_name);

                        // Progresso real: campos do snapshot template_steps
                        // que já têm valor preenchido em progress_data.
                        // (mesma lógica usada no MODO 4 - VISUALIZAÇÃO, para
                        // as duas telas nunca ficarem dessincronizadas)
                        const admFields = (adm.template_steps || []).flatMap((s) => s.fields || []);
                        const admProgressData = adm.progress_data || {};
                        const admSentCount = admFields.filter(
                          (field) => !isFieldValueEmpty(admProgressData[field.key])
                        ).length;
                        const admTotalCount = admFields.length;
                        const admProgressPercent = admTotalCount
                          ? Math.round((admSentCount / admTotalCount) * 100)
                          : 0;

                        return (
                          <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs">
                                  {initials}
                                </div>
                                <span className="font-bold text-slate-800">{name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#ff8b00] h-full"
                                    style={{ width: `${admProgressPercent}%` }}
                                  ></div>
                                </div>
                                <span className="text-[11px] font-medium text-slate-500">
                                  {admSentCount}/{admTotalCount}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{adm.template_name || 'Admissão Matheus'}</td>
                            <td className="py-3 px-4 text-slate-600">{emp.position || 'Atendente'}</td>
                            <td className="py-3 px-4 text-slate-600">{emp.department || '-'}</td>
                            <td className="py-3 px-4 relative">
                              <div className="flex items-center justify-center gap-1">
                                {adm.status === 'Em andamento' && (
                                  <>
                                    <button
                                      onClick={() => handleCopyAdmissionLink(adm)}
                                      title="Copiar link de preenchimento"
                                      className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-[#ff8b00] transition-colors"
                                    >
                                      <LinkIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleShareWhatsapp(adm)}
                                      title="Enviar link via WhatsApp"
                                      className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-[#25D366] transition-colors"
                                    >
                                      <Share2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() =>
                                    setOpenAdmissionMenuId((prev) => (prev === adm.id ? null : adm.id))
                                  }
                                  title="Mais ações"
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>

                              {openAdmissionMenuId === adm.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenAdmissionMenuId(null)}
                                  />
                                  <div className="absolute right-4 top-full mt-1 z-20 w-44 bg-white border border-slate-200 rounded-md shadow-lg py-1 text-left">
                                    <button
                                      onClick={() => {
                                        setOpenAdmissionMenuId(null);
                                        handleOpenAdmissionView(adm);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                      <ChevronRight className="w-3.5 h-3.5" />
                                      Ver detalhes
                                    </button>
                                    {adm.status === 'Concluído' && (
                                      <button
                                        onClick={() => handleRequestDeleteAdmission(adm)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Excluir Admissão
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* TABELA DE TEMPLATES */
              <div className="overflow-x-auto min-h-[220px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-6">NOME TEMPLATE</th>
                      <th className="py-3 px-6">DATA CRIAÇÃO</th>
                      <th className="py-3 px-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="3" className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ff8b00]" />
                          Carregando templates...
                        </td>
                      </tr>
                    ) : filteredTemplates.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-12 text-center text-slate-500 font-medium">
                          Nenhum template encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredTemplates.map((tmpl) => (
                        <tr key={tmpl.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-slate-800">{tmpl.title}</td>
                          <td className="py-3.5 px-6 text-slate-600">{formatDate(tmpl.created_at)}</td>
                          <td className="py-3.5 px-4 text-center relative">
                            <button
                              onClick={() =>
                                setOpenTemplateMenuId((prev) => (prev === tmpl.id ? null : tmpl.id))
                              }
                              className="p-1 hover:bg-slate-100 rounded text-slate-500"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {openTemplateMenuId === tmpl.id && (
                              <>
                                {/* Camada para fechar o menu ao clicar fora */}
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenTemplateMenuId(null)}
                                />
                                <div className="absolute right-4 top-full mt-1 z-20 w-44 bg-white border border-slate-200 rounded-md shadow-lg py-1 text-left">
                                  <button
                                    onClick={() => handleRequestDeleteTemplate(tmpl)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Excluir Template
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* RODAPÉ */}
            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>
                {activeTab === 'templates'
                  ? `${filteredTemplates.length} Resultado`
                  : `${filteredAdmissions.length} Resultado`}
              </span>
              <div className="flex items-center gap-2">
                <span>Itens por página</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-slate-200 rounded p-1 text-xs focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* MODO 1.5: SELEÇÃO DE COLABORADORES PARA INICIAR ADMISSÃO (tabela Employees do Supabase) */}
        {viewState === 'select_employees' && (
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <button
                onClick={() => setViewState('list')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <button
                onClick={handleStartAdmissionFlow}
                disabled={selectedEmployees.length === 0}
                className={`text-xs font-semibold px-6 py-2 rounded transition-colors ${
                  selectedEmployees.length > 0
                    ? 'bg-[#ff8b00] hover:bg-[#fc9314] text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Avançar {selectedEmployees.length > 0 ? `(${selectedEmployees.length})` : ''}
              </button>
            </div>

            <div className="p-4 bg-white border-b border-slate-100">
              <div className="relative max-w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite o nome do funcionário, cargo ou departamento"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-[#ff8b00]"
                />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-6"></th>
                    <th className="py-3 px-6">NOME</th>
                    <th className="py-3 px-4">CARGO</th>
                    <th className="py-3 px-4">DEPARTAMENTO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ff8b00]" />
                        Carregando colaboradores...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500 font-medium">
                        Nenhum colaborador encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Usuário Sem Nome';
                      const isSelected = selectedEmployees.includes(emp.id);

                      return (
                        <tr
                          key={emp.id}
                          onClick={() => handleToggleEmployeeSelection(emp.id)}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#ff8b00]/5' : ''
                          }`}
                        >
                          <td className="py-3 px-6">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleEmployeeSelection(emp.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#ff8b00] focus:ring-[#ff8b00] cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs">
                                {getInitials(name, emp.first_name, emp.last_name)}
                              </div>
                              <span className="font-bold text-slate-800">{name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{emp.position || '-'}</td>
                          <td className="py-3 px-4 text-slate-600">{emp.department || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>{filteredEmployees.length} Resultado</span>
              <div className="flex items-center gap-2">
                <span>Itens por página</span>
                <select className="border border-slate-200 rounded p-1 text-xs focus:outline-none">
                  <option value={10}>10</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* MODO 2: CRIAR NOVO TEMPLATE */}
        {viewState === 'create_template' && (
          <div className="space-y-4">
            <div className="bg-white rounded-md border border-slate-200 p-4">
              <button
                onClick={() => setViewState('list')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <div className="max-w-md">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome*
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Digite o nome do template"
                  className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-[#ff8b00]"
                />
              </div>
            </div>

            {/* CARD DAS ETAPAS PADRÃO */}
            <div className="bg-white rounded-md border border-slate-200 p-6 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Informações de cadastro (Padrão)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esses dados irão alterar a informação do perfil do colaborador, após ele preencher
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {templateSteps.map((step) => (
                  <div key={step.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{step.id}. {step.name}</span>
                      <span className="text-slate-500 ml-2">- {step.type}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={step.active}
                        onChange={() => handleToggleStep(step.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff8b00]"></div>
                      <span className="ml-2 text-xs font-medium text-slate-600">Etapa ativa</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD CAMPOS ADICIONAIS */}
            <div className="bg-white rounded-md border border-slate-200 p-6 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Campos Adicionais</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Campos adicionais alteram dados no perfil do usuário
                </p>
              </div>

              {customSteps.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 space-y-1">
                  <p>Nenhum campo customizado encontrado.</p>
                  <p className="text-slate-400">Clique em "Criar nova etapa" para adicionar campos.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {customSteps.map((cStep) => (
                    <div key={cStep.id} className="py-3 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{cStep.name}</span>
                      <span className="text-emerald-600 font-medium">Ativo</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleAddCustomStep}
                className="border border-[#ff8b00] text-[#ff8b00] hover:bg-[#ff8b00]/10 text-xs font-semibold px-4 py-2 rounded transition-colors"
              >
                Criar nova etapa
              </button>

              <button
                onClick={handleSaveTemplate}
                disabled={loading}
                className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-semibold px-6 py-2 rounded transition-colors shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Salvar Template'}
              </button>
            </div>
          </div>
        )}

        {/* MODO 3: SELECCIONAR TEMPLATE PARA COLABORADOR */}
        {viewState === 'select_template' && (
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <button
                onClick={() => setViewState('select_employees')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <button
                onClick={handleConfirmTemplateSelection}
                disabled={!selectedTemplateId || loading}
                className={`text-xs font-semibold px-6 py-2 rounded transition-colors ${
                  selectedTemplateId && !loading
                    ? 'bg-[#ff8b00] hover:bg-[#fc9314] text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Usar template'}
              </button>
            </div>

            <div className="p-4 bg-white border-b border-slate-100">
              <div className="relative max-w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar template..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-[#ff8b00]"
                />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-6">NOME DO TEMPLATE</th>
                    <th className="py-3 px-6">DATA DE CRIAÇÃO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTemplates.map((tmpl) => (
                    <tr
                      key={tmpl.id}
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        selectedTemplateId === tmpl.id ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="template_select"
                            checked={selectedTemplateId === tmpl.id}
                            onChange={() => setSelectedTemplateId(tmpl.id)}
                            className="text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                          <div>
                            <strong className="block text-slate-800 font-bold">{tmpl.title}</strong>
                            <span className="text-slate-400 text-[11px]">
                              {(tmpl.steps || []).filter((s) => s.active !== false).length} campos
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">{formatDate(tmpl.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>{filteredTemplates.length} Resultado</span>
              <div className="flex items-center gap-2">
                <span>Itens por página</span>
                <select className="border border-slate-200 rounded p-1 text-xs focus:outline-none">
                  <option value={10}>10</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* MODO 4: VISUALIZAÇÃO DO STATUS DA ADMISSÃO */}
        {viewState === 'view_admission' && activeAdmission && (
          <div className="space-y-4">
            <div className="bg-white rounded-md border border-slate-200 p-4 flex justify-between items-center">
              <button
                onClick={() => setViewState('list')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {activeAdmission.Employees?.full_name || 'Joquebede de Oliveira'} - Template "{activeAdmission.template_name || 'Admissão Matheus'}"
              </button>

              <button
                onClick={() => setViewState('create_template')}
                className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-semibold px-4 py-2 rounded transition-colors"
              >
                Editar Template
              </button>
            </div>

            {(() => {
              // admissionFieldItems já vem calculado no topo do componente
              // (useMemo), reaproveitado aqui e na tabela da listagem.
              const fieldItems = admissionFieldItems;
              const sentCount = fieldItems.filter((f) => f.sent).length;
              const progressPercent = Math.round((sentCount / (fieldItems.length || 1)) * 100);

              return (
                <>
                  {/* BARRA DE PROGRESSO */}
                  <div className="bg-white rounded-md border border-slate-200 p-4 space-y-2">
                    <span className="text-xs font-medium text-slate-600">
                      Progresso atual {progressPercent}% ({sentCount} de {fieldItems.length} campos preenchidos)
                    </span>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#ff8b00] h-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* LISTA DE CAMPOS PREENCHIDOS E PENDENTES */}
                  <div className="bg-white rounded-md border border-slate-200 p-6 space-y-4">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Informações de Cadastro</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Esses dados irão alterar a informação do perfil do colaborador, após ele preencher
                      </p>
                    </div>

                    {fieldItems.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        Nenhum campo configurado neste template.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 border-t border-slate-100">
                        {fieldItems.map((item, idx) => {
                          const filePath = item.rawValue?.path;
                          const cachedSigned = filePath ? signedUrls[filePath] : null;
                          const signedUrl =
                            cachedSigned && cachedSigned.expiresAt > Date.now() ? cachedSigned.url : null;
                          const loadingSignedUrl = filePath ? !!signedUrlLoading[filePath] : false;

                          return (
                            <div key={item.key || idx} className="py-3">
                              <div
                                onClick={() => setExpandedField(expandedField === idx ? null : idx)}
                                className="flex justify-between items-center text-xs cursor-pointer hover:bg-slate-50/50 p-1 rounded"
                              >
                                <div className="flex items-center gap-2">
                                  {expandedField === idx ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                  <span className="font-bold text-slate-800">{item.label}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-slate-500 text-[11px]">
                                    {item.sent ? 'Enviado' : 'Não enviado'}
                                  </span>
                                  {item.sent ? (
                                    <CheckCircle2 className="w-4 h-4 text-[#ff8b00]" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-slate-300" />
                                  )}
                                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                </div>
                              </div>

                              {expandedField === idx && (
                                <div className="mt-3 ml-6 p-4 bg-slate-50 border border-slate-100 rounded space-y-2">
                                  <label className="block text-[11px] font-semibold text-slate-600">
                                    {item.label}
                                  </label>

                                  {!item.sent ? (
                                    item.key === 'aso' ? (
                                      <ManagerFileUpload
                                        fieldKey={item.key}
                                        uploading={managerUploading}
                                        onFile={(file) => handleManagerFileUpload(item, file)}
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        disabled
                                        value="(Não enviado)"
                                        className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-400"
                                      />
                                    )
                                  ) : filePath ? (
                                    <div className="space-y-2">
                                      {loadingSignedUrl && !signedUrl ? (
                                        <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          Gerando link seguro...
                                        </div>
                                      ) : !signedUrl ? (
                                        <button
                                          type="button"
                                          onClick={() => ensureSignedUrl(filePath)}
                                          className="text-xs font-medium text-[#ff8b00] hover:underline"
                                        >
                                          Gerar link para visualizar
                                        </button>
                                      ) : item.isImage ? (
                                        <div className="flex items-center gap-3">
                                          <img
                                            src={signedUrl}
                                            alt={item.label}
                                            onClick={() => setPreviewModal({ url: signedUrl, label: item.label })}
                                            className="w-24 h-24 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-90 transition"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setPreviewModal({ url: signedUrl, label: item.label })}
                                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#ff8b00] hover:underline"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Abrir em tamanho real
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewModal({ url: signedUrl, label: item.displayValue || item.label, isFile: true })
                                          }
                                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#ff8b00] hover:underline"
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                          {item.displayValue || 'Abrir arquivo'}
                                        </button>
                                      )}

                                      {item.key === 'aso' && (
                                        <div className="pt-1">
                                          <ManagerFileUpload
                                            fieldKey={item.key}
                                            uploading={managerUploading}
                                            onFile={(file) => handleManagerFileUpload(item, file)}
                                            replace
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ) : Array.isArray(item.rawValue) ? (
                                    item.rawValue.length === 0 ? (
                                      <p className="text-xs text-slate-400">Nenhum dependente informado.</p>
                                    ) : (
                                      <ul className="space-y-1">
                                        {item.rawValue.map((dep, depIdx) => (
                                          <li
                                            key={depIdx}
                                            className="text-xs text-slate-600 bg-white border border-slate-200 rounded px-2 py-1.5"
                                          >
                                            <span className="font-semibold text-slate-800">
                                              {dep.name || 'Sem nome'}
                                            </span>
                                            {dep.cpf && <span className="text-slate-400"> — CPF: {dep.cpf}</span>}
                                            {dep.birth_date && (
                                              <span className="text-slate-400"> — Nasc.: {dep.birth_date}</span>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    )
                                  ) : (
                                    <input
                                      type="text"
                                      disabled
                                      value={item.displayValue ?? ''}
                                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-400"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </main>

      {/* MODAL DE CONFIRMAÇÃO — EXCLUIR TEMPLATE */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">Excluir template?</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Tem certeza que deseja excluir o template{' '}
              <span className="font-semibold text-slate-700">"{templateToDelete.title}"</span>? Essa
              ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTemplateToDelete(null)}
                disabled={deletingTemplate}
                className="px-4 py-2 rounded text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteTemplate}
                disabled={deletingTemplate}
                className="px-4 py-2 rounded text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center gap-1.5"
              >
                {deletingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO — EXCLUIR ADMISSÃO (aba Concluídos) */}
      {admissionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">Excluir admissão?</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Tem certeza que deseja excluir a admissão de{' '}
              <span className="font-semibold text-slate-700">
                {admissionToDelete.Employees?.full_name || 'este colaborador'}
              </span>
              ? Os dados preenchidos e os arquivos anexados (selfie, ASO, documentos) serão apagados
              permanentemente. Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAdmissionToDelete(null)}
                disabled={deletingAdmission}
                className="px-4 py-2 rounded text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteAdmission}
                disabled={deletingAdmission}
                className="px-4 py-2 rounded text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center gap-1.5"
              >
                {deletingAdmission ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PREVIEW — FOTO/DOCUMENTO DA ADMISSÃO (via Signed URL) */}
      {previewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setPreviewModal(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewModal(null)}
              aria-label="Fechar"
              className="absolute -top-10 right-0 sm:top-3 sm:right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition sm:z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {previewModal.isFile ? (
              <div className="bg-white rounded-lg p-8 text-center max-w-sm mx-auto">
                <FileText className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                <p className="text-sm text-slate-700 font-medium mb-1 break-all">{previewModal.label}</p>
                <p className="text-xs text-slate-400 mb-4">O link expira em 1 hora por segurança.</p>
                <a
                  href={previewModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-lg bg-[#ff8b00] hover:bg-[#fc9314] transition-colors"
                >
                  Abrir arquivo
                </a>
              </div>
            ) : (
              <img
                src={previewModal.url}
                alt={previewModal.label}
                className="w-full max-h-[85vh] object-contain rounded-lg bg-white"
              />
            )}
          </div>
        </div>
      )}

      {/* TOAST DE FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-medium px-4 py-2.5 rounded-md shadow-lg z-50 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#ff8b00]" />
          {toastMessage}
        </div>
      )}

      {/* RODAPÉ GLOBAL */}
      <footer className="text-center py-4 text-[11px] text-slate-400">
        © 2026 Wiaponto - Todos os direitos reservados.
      </footer>
    </div>
  );
}
