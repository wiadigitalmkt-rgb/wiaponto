import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import {
  User,
  Clock,
  MapPin,
  Plane,
  Users,
  KeyRound,
  ArrowLeft,
  Settings,
  Plus,
  FileText,
  Loader2,
  Coffee,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Camera
} from 'lucide-react';

export default function Usuario() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: loggedInUser } = useAuth();
  const userId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('informacoes');
  const [profileSubTab, setProfileSubTab] = useState('dados');
  const [, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);
  const [showSenha, setShowSenha] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, confirmLabel, danger, requireText, onConfirm }
  const [confirmInput, setConfirmInput] = useState('');

  function openConfirm({ title, message, confirmLabel, danger, requireText, onConfirm }) {
    setConfirmInput('');
    setConfirmModal({ title, message, confirmLabel, danger, requireText, onConfirm });
  }
  function closeConfirmModal() {
    setConfirmModal(null);
    setConfirmInput('');
  }
  async function handleConfirmModalAction() {
    if (!confirmModal) return;
    const action = confirmModal.onConfirm;
    closeConfirmModal();
    await action();
  }

  // Estados dos Dados Principais
  const [usuarioData, setUsuarioData] = useState({
    primeiroNome: '',
    sobrenome: '',
    genero: '',
    email: '',
    telefone: '',
    estadoCivil: '',
    cpf: '',
    rg: '',
    pisPasep: '',
    departamento: '',
    dataNascimento: '',
    cargo: '',
    salario: '',
    fotoUrl: '',
    dataAdmissao: '',
    tipoContrato: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
    estado: '',
    cidade: '',
    idPonto: '',
    login: '',
    tipoAcesso: 'Colaborador',
    statusUsuario: 'Ativo'
  });

  // Estados dos Recursos Específicos
  const [customFields, setCustomFields] = useState([]);
  const [showConfigCampos, setShowConfigCampos] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('Texto livre');

  const [vacations, setVacations] = useState([]);
  const [dependents, setDependents] = useState([]);

  // Modais
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [newVacation, setNewVacation] = useState({ start_date: '', end_date: '' });

  const [showDependentModal, setShowDependentModal] = useState(false);
  const [newDependent, setNewDependent] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    relationship: 'Filho(a)',
    notes: ''
  });

  // Carregar dados iniciais do Supabase
  useEffect(() => {
    if (userId && supabase) {
      async function fetchData() {
        setLoading(true);

        // 1. Employee Info
        const { data: emp } = await supabase.from('Employees').select('*').eq('id', userId).single();
        if (emp) {
          setUsuarioData({
            primeiroNome: emp.first_name || emp.full_name?.split(' ')[0] || '',
            sobrenome: emp.last_name || emp.full_name?.split(' ').slice(1).join(' ') || '',
            genero: emp.gender || '',
            email: emp.email || '',
            telefone: emp.phone || '',
            estadoCivil: emp.marital_status || '',
            cpf: emp.cpf || '',
            rg: emp.rg || '',
            pisPasep: emp.pis_pasep || '',
            cargo: emp.position || '',
            salario: emp.salary || '',
            dataAdmissao: emp.admission_date || '',
            cep: emp.cep || '',
            rua: emp.street || '',
            numero: emp.number || '',
            bairro: emp.neighborhood || '',
            complemento: emp.complement || '',
            cidade: emp.city || '',
            estado: emp.state || '',
            idPonto: emp.point_id || '',
            // O campo "(Login)" no cadastro (admin_employees.jsx) é o
            // e-mail — é ele que deve aparecer aqui como LOGIN. Antes essa
            // linha sempre montava o login a partir do CPF, mesmo quando o
            // colaborador foi cadastrado com e-mail (ex.: Fulano Silva,
            // logava com fulanoteste@gmail.com mas a tela mostrava o CPF
            // como se fosse o login dele). O CPF só entra como último
            // recurso, se por algum motivo não houver e-mail cadastrado.
            login: emp.email || (emp.cpf ? emp.cpf.replace(/\D/g, '') : ''),
            senhaAtual: emp.password_hash || '',
            notasInternas: emp.internal_notes || '',
            fotoUrl: emp.photo_url || '',
            tipoAcesso: emp.role === 'gestor' || emp.role === 'admin' || emp.access_type === 'Gestor' ? 'Gestor' : 'Colaborador',
            statusUsuario: emp.status || 'Ativo'
          });
        }

        // 2. Sub-tabelas
        const { data: fields } = await supabase.from('employee_custom_fields').select('*').eq('employee_id', userId);
        if (fields) setCustomFields(fields);

        const { data: vacs } = await supabase.from('employee_vacations').select('*').eq('employee_id', userId);
        if (vacs) setVacations(vacs);

        const { data: deps } = await supabase.from('employee_dependents').select('*').eq('employee_id', userId);
        if (deps) setDependents(deps);

        setLoading(false);
      }
      fetchData();
    }
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUsuarioData(prev => ({ ...prev, [name]: value }));
  };

  // 1. Salvar Dados do Perfil
  const handleSaveProfile = async () => {
    if (!supabase || !userId) return;
    setSaving(true);
    try {
      const fullName = `${usuarioData.primeiroNome} ${usuarioData.sobrenome}`.trim();
      const payload = {
        full_name: fullName,
        first_name: usuarioData.primeiroNome,
        last_name: usuarioData.sobrenome,
        gender: usuarioData.genero,
        email: usuarioData.email,
        phone: usuarioData.telefone,
        marital_status: usuarioData.estadoCivil,
        cpf: usuarioData.cpf,
        rg: usuarioData.rg,
        pis_pasep: usuarioData.pisPasep,
        position: usuarioData.cargo,
        salary: usuarioData.salario.replace('R$', '').trim(),
        admission_date: usuarioData.dataAdmissao || null,
        cep: usuarioData.cep,
        street: usuarioData.rua,
        number: usuarioData.numero,
        neighborhood: usuarioData.bairro,
        complement: usuarioData.complemento,
        city: usuarioData.cidade,
        state: usuarioData.estado,
        point_id: usuarioData.idPonto,
        access_type: usuarioData.tipoAcesso,
        role: usuarioData.tipoAcesso === 'Gestor' ? 'gestor' : 'colaborador',
        status: usuarioData.statusUsuario,
        internal_notes: usuarioData.notasInternas
      };

      await supabase.from('Employees').update(payload).eq('id', userId);
      alert('Alterações salvas no banco com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  // Tipo de Acesso — salva assim que o gestor troca a opção
  const handleChangeAccessType = (e) => {
    const novoTipo = e.target.value;
    if (novoTipo === usuarioData.tipoAcesso) return;
    openConfirm({
      title: novoTipo === 'Gestor' ? 'Dar acesso de Gestor?' : 'Remover acesso de Gestor?',
      message: novoTipo === 'Gestor'
        ? `${usuarioData.primeiroNome || 'Este usuário'} vai passar a ter acesso TOTAL ao sistema — as mesmas páginas, funções e botões que uma conta de gestor tem, sem exceção.`
        : `${usuarioData.primeiroNome || 'Este usuário'} volta a ter só o acesso de colaborador (ponto e área do colaborador).`,
      confirmLabel: 'Confirmar',
      danger: false,
      onConfirm: () => applyAccessTypeChange(novoTipo)
    });
  };

  const applyAccessTypeChange = async (novoTipo) => {
    setUsuarioData(prev => ({ ...prev, tipoAcesso: novoTipo }));
    if (!supabase || !userId) return;
    try {
      const { error } = await supabase.from('Employees').update({
        access_type: novoTipo,
        role: novoTipo === 'Gestor' ? 'gestor' : 'colaborador'
      }).eq('id', userId);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o tipo de acesso.');
    }
  };

  // Resetar a senha do usuário para o padrão inicial (CPF, só dígitos).
  // Chama a Edge Function `reset-employee-password`, que atualiza tanto
  // Employees.password_hash quanto a senha real no Supabase Auth (só ela
  // tem acesso à chave de admin necessária pra isso — ver Login.jsx, que
  // tenta signInWithPassword primeiro). Se a função ainda não foi
  // publicada, cai num fallback que atualiza só a tabela e avisa.
  const handleResetPassword = () => {
    const cpfDigits = (usuarioData.cpf || '').replace(/\D/g, '');
    if (!cpfDigits) {
      alert('Este usuário não tem CPF cadastrado. Cadastre o CPF na aba Informações antes de resetar a senha.');
      return;
    }
    openConfirm({
      title: 'Resetar senha?',
      message: `A senha de ${usuarioData.primeiroNome || 'usuário'} vai voltar para o padrão inicial: o CPF (${cpfDigits}).`,
      confirmLabel: 'Resetar senha',
      danger: false,
      onConfirm: () => applyResetPassword(cpfDigits)
    });
  };

  const applyResetPassword = async (cpfDigits) => {
    if (!supabase || !userId) return;
    setResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-employee-password', {
        body: { employee_id: userId, requester_id: loggedInUser?.id }
      });

      if (error) {
        // O supabase-js só devolve uma mensagem genérica ("Edge Function
        // returned a non-2xx status code") em erros de HTTP — o motivo
        // real vem no corpo da resposta, acessível via error.context.
        let detail = error.message;
        try {
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            if (body?.error) detail = body.error;
          }
        } catch (_) {
          // se não der pra ler o corpo, fica com a mensagem genérica mesmo
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);

      alert('Senha resetada para o CPF do usuário com sucesso (login e Supabase Auth já atualizados)!');
      setUsuarioData(prev => ({ ...prev, senhaAtual: cpfDigits }));
    } catch (err) {
      console.error(err);
      try {
        const { error: fallbackError } = await supabase
          .from('Employees')
          .update({ password_hash: cpfDigits })
          .eq('id', userId);
        if (fallbackError) throw fallbackError;
        setUsuarioData(prev => ({ ...prev, senhaAtual: cpfDigits }));

        alert(
          'A função de reset recusou o pedido (' + (err.message || 'erro desconhecido') + '). ' +
          'Atualizei a senha só na tabela de colaboradores — se este usuário fizer login pelo Supabase Auth, ' +
          'a senha antiga ainda vai valer até esse erro ser corrigido na Edge Function.'
        );
      } catch (fallbackErr) {
        console.error(fallbackErr);
        alert('Erro ao resetar a senha.');
      }
    } finally {
      setResettingPassword(false);
    }
  };

  // Ativar / Inativar
  const handleToggleStatus = (novoStatus) => {
    if (novoStatus === usuarioData.statusUsuario) return;
    openConfirm({
      title: novoStatus === 'Inativo' ? 'Inativar usuário?' : 'Ativar usuário?',
      message: novoStatus === 'Inativo'
        ? `${usuarioData.primeiroNome || 'Este usuário'} vai perder o acesso ao sistema e deixa de ser cobrado na fatura.`
        : `${usuarioData.primeiroNome || 'Este usuário'} volta a ter acesso normal ao sistema.`,
      confirmLabel: novoStatus === 'Inativo' ? 'Inativar' : 'Ativar',
      danger: novoStatus === 'Inativo',
      onConfirm: () => applyStatusChange(novoStatus)
    });
  };

  const applyStatusChange = async (novoStatus) => {
    if (!supabase || !userId) return;
    const statusAnterior = usuarioData.statusUsuario;
    setUsuarioData(prev => ({ ...prev, statusUsuario: novoStatus }));
    try {
      const { error } = await supabase.from('Employees').update({ status: novoStatus }).eq('id', userId);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      setUsuarioData(prev => ({ ...prev, statusUsuario: statusAnterior }));
      alert('Erro ao atualizar o status do usuário.');
    }
  };

  // Deletar usuário — exige digitar o nome completo do colaborador dentro do
  // próprio modal como confirmação (ação permanente), e some com os dados
  // relacionados antes, pra não esbarrar em restrição de chave estrangeira.
  const handleDeleteUser = () => {
    const nomeCompleto = `${usuarioData.primeiroNome} ${usuarioData.sobrenome}`.trim() || 'este usuário';
    openConfirm({
      title: 'Deletar usuário permanentemente?',
      message: `Isso apaga ${nomeCompleto} e todos os dados vinculados (ponto, jornada, cercas, férias, dependentes, anexos) de forma definitiva. Não é possível desfazer.`,
      confirmLabel: 'Deletar usuário',
      danger: true,
      requireText: nomeCompleto,
      onConfirm: () => applyDeleteUser()
    });
  };

  const applyDeleteUser = async () => {
    if (!supabase || !userId) return;
    setDeletingUser(true);
    try {
      const relatedTables = [
        'employee_custom_fields',
        'employee_attachments',
        'employee_vacations',
        'employee_dependents',
        'employee_work_schedules',
        'geofences',
        'time_records',
        'employee_admissions'
      ];
      for (const table of relatedTables) {
        const { error } = await supabase.from(table).delete().eq('employee_id', userId);
        if (error) console.warn(`Aviso ao limpar ${table}:`, error.message);
      }

      const { error: empError } = await supabase.from('Employees').delete().eq('id', userId);
      if (empError) throw empError;

      alert('Usuário deletado com sucesso.');
      navigate('/admin/colaboradores');
    } catch (err) {
      console.error(err);
      alert('Erro ao deletar o usuário.');
      setDeletingUser(false);
    }
  };

  // Foto de perfil — sobe pro Storage (bucket "employee-photos") e salva a
  // URL pública em Employees.photo_url. Usa upsert no mesmo caminho
  // (userId/foto-perfil.ext), então trocar a foto substitui a anterior em
  // vez de acumular arquivos á toa no bucket.
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !supabase) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem (JPG, PNG etc).');
      return;
    }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${userId}/foto-perfil.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-photos')
        .upload(filePath, file, { upsert: true, cacheControl: '3600' });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('employee-photos').getPublicUrl(filePath);
      // Cache-busting: sem isso, o navegador continuaria mostrando a foto
      // antiga em cache mesmo depois de trocada, já que o caminho do
      // arquivo é sempre o mesmo (upsert).
      const photoUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase.from('Employees').update({ photo_url: photoUrl }).eq('id', userId);
      if (updateError) throw updateError;

      setUsuarioData(prev => ({ ...prev, fotoUrl: photoUrl }));
    } catch (err) {
      console.error(err);
      alert(
        'Erro ao enviar a foto: ' + (err.message || 'tente novamente.') +
        ' Se o erro mencionar "bucket not found", crie um bucket público chamado "employee-photos" no Supabase (Storage → New bucket).'
      );
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // 2. Configurar / Adicionar Campos Adicionais
  const handleAddCustomField = async () => {
    if (!newFieldName.trim() || !userId) return;
    const { data, error } = await supabase.from('employee_custom_fields').insert([{
      employee_id: userId,
      field_name: newFieldName,
      field_type: newFieldType,
      field_value: ''
    }]).select();

    if (!error && data) {
      setCustomFields([...customFields, ...data]);
      setNewFieldName('');
    }
  };

  // Recarrega direto do Supabase (em vez de só confiar no retorno do
  // insert) — garante que o que aparece na tela é exatamente o que está
  // salvo no banco, sem depender de estado local que pode ficar
  // dessincronizado.
  const refetchVacations = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('employee_vacations')
      .select('*')
      .eq('employee_id', userId)
      .order('start_date', { ascending: false });
    if (error) { console.error(error); return; }
    setVacations(data || []);
  };

  const refetchDependents = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('employee_dependents')
      .select('*')
      .eq('employee_id', userId)
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    setDependents(data || []);
  };

  // 6. Cadastrar Férias
  const handleAddVacation = async () => {
    if (!userId) return;
    if (!newVacation.start_date || !newVacation.end_date) {
      alert('Preencha as datas de início e fim das férias.');
      return;
    }
    const { error } = await supabase.from('employee_vacations').insert([{
      employee_id: userId,
      ...newVacation,
      status: 'Agendado'
    }]);

    if (error) {
      console.error(error);
      alert('Erro ao salvar as férias: ' + error.message);
      return;
    }

    await refetchVacations();
    setNewVacation({ start_date: '', end_date: '' });
    setShowVacationModal(false);
  };

  const handleDeleteVacation = (vacation) => {
    openConfirm({
      title: 'Remover período de férias?',
      message: `Remove o período de ${vacation.start_date} a ${vacation.end_date}.`,
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: async () => {
        const { error } = await supabase.from('employee_vacations').delete().eq('id', vacation.id);
        if (error) {
          console.error(error);
          alert('Erro ao remover o período de férias.');
          return;
        }
        await refetchVacations();
      }
    });
  };

  // 7. Cadastrar Dependente
  const handleAddDependent = async () => {
    if (!userId) return;
    if (!newDependent.first_name?.trim() || !newDependent.last_name?.trim()) {
      alert('Preencha nome e sobrenome do dependente (sobrenome é obrigatório).');
      return;
    }
    const { error } = await supabase.from('employee_dependents').insert([{
      employee_id: userId,
      ...newDependent
    }]);

    if (error) {
      console.error(error);
      alert('Erro ao salvar o dependente: ' + error.message);
      return;
    }

    await refetchDependents();
    setNewDependent({ first_name: '', last_name: '', birth_date: '', relationship: 'Filho(a)', notes: '' });
    setShowDependentModal(false);
  };

  const handleDeleteDependent = (dependent) => {
    openConfirm({
      title: 'Remover dependente?',
      message: `Remove ${dependent.first_name} ${dependent.last_name} da lista de dependentes.`,
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: async () => {
        const { error } = await supabase.from('employee_dependents').delete().eq('id', dependent.id);
        if (error) {
          console.error(error);
          alert('Erro ao remover o dependente.');
          return;
        }
        await refetchDependents();
      }
    });
  };

  const menuItems = [
    { id: 'informacoes', label: 'Informações', icon: User },
    { id: 'jornada', label: 'Jornada de trabalho', icon: Clock },
    { id: 'cercas', label: 'Cercas', icon: MapPin },
    { id: 'ferias', label: 'Férias', icon: Plane },
    { id: 'dependentes', label: 'Dependentes', icon: Users },
    { id: 'formulario_admissao', label: 'Formulário de Admissão', icon: FileText },
    { id: 'acesso', label: 'Acesso ao sistema', icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Sua Empresa" />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto mb-4">
          <h1 className="text-xl font-bold uppercase text-slate-800 tracking-wide mb-2">Usuários</h1>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <Link to="/admin" className="hover:text-[#ff8b00] transition-colors">Painel</Link>
            <span>&gt;</span>
            <Link to="/admin/colaboradores" className="hover:text-[#ff8b00] transition-colors">Usuários</Link>
            <span>&gt;</span>
            <span className="text-[#ff8b00] font-medium">Edição</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* SIDEBAR DA PÁGINA */}
          <div className="md:col-span-1 space-y-4">
            <div className="p-5 bg-white rounded-lg border border-slate-200 text-center space-y-2">
              <div className="relative w-20 h-20 mx-auto">
                {usuarioData.fotoUrl ? (
                  <img
                    src={usuarioData.fotoUrl}
                    alt={`${usuarioData.primeiroNome} ${usuarioData.sobrenome}`}
                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-300 flex items-center justify-center font-bold text-2xl text-slate-600 uppercase">
                    {usuarioData.primeiroNome?.[0]}{usuarioData.sobrenome?.[0]}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#ff8b00] hover:bg-[#fc9314] text-white flex items-center justify-center shadow border-2 border-white transition-colors disabled:opacity-60"
                  title="Alterar foto"
                >
                  {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">
                  {usuarioData.primeiroNome} {usuarioData.sobrenome}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">{usuarioData.cargo || 'Cargo não definido'}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{'Sua Empresa'}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-white text-[#ff8b00] font-semibold shadow-sm border-l-4 border-[#ff8b00]'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* PAINEL CONTEÚDO PRINCIPAL */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <Link to="/admin/colaboradores" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </Link>
              </div>

              {/* 1. DADOS DO PERFIL & INFORMAÇÕES */}
              {activeTab === 'informacoes' && (
                <div>
                  <div className="flex border-b border-slate-200 px-4 pt-2 gap-6 text-sm overflow-x-auto">
                    {[
                      { id: 'dados', label: 'Dados do perfil' },
                      { id: 'campos_adicionais', label: 'Campos adicionais' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setProfileSubTab(tab.id)}
                        className={`pb-3 whitespace-nowrap transition-all ${
                          profileSubTab === tab.id
                            ? 'border-b-2 border-[#ff8b00] text-[#ff8b00] font-medium'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* SUB-ABA: DADOS DO PERFIL */}
                  {profileSubTab === 'dados' && (
                    <div className="p-6 space-y-8 text-xs">
                      <section className="space-y-4">
                        <h3 className="font-semibold text-slate-800 text-sm">Informações básicas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-slate-600 mb-1">Primeiro nome*</label>
                            <input type="text" name="primeiroNome" value={usuarioData.primeiroNome} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Sobrenome*</label>
                            <input type="text" name="sobrenome" value={usuarioData.sobrenome} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Gênero</label>
                            <select name="genero" value={usuarioData.genero} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]">
                              <option value="Feminino">Feminino</option>
                              <option value="Masculino">Masculino</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">E-mail</label>
                            <input type="email" name="email" value={usuarioData.email} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Telefone</label>
                            <input type="text" name="telefone" value={usuarioData.telefone} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Estado civil</label>
                            <select name="estadoCivil" value={usuarioData.estadoCivil} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]">
                              <option value="Casado(a)">Casado(a)</option>
                              <option value="Solteiro(a)">Solteiro(a)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">CPF*</label>
                            <input type="text" name="cpf" value={usuarioData.cpf} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">RG</label>
                            <input type="text" name="rg" value={usuarioData.rg} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">PIS/PASEP</label>
                            <input type="text" name="pisPasep" value={usuarioData.pisPasep} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]" />
                          </div>
                        </div>
                      </section>

                      <hr className="border-slate-100" />

                      {/* Endereço Completo */}
                      <section className="space-y-4">
                        <h3 className="font-semibold text-slate-800 text-sm">Endereço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-slate-600 mb-1">CEP</label>
                            <input type="text" name="cep" value={usuarioData.cep} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Rua</label>
                            <input type="text" name="rua" value={usuarioData.rua} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Número</label>
                            <input type="text" name="numero" value={usuarioData.numero} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Bairro</label>
                            <input type="text" name="bairro" value={usuarioData.bairro} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Complemento</label>
                            <input type="text" name="complemento" value={usuarioData.complemento} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Estado</label>
                            <select name="estado" value={usuarioData.estado} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]">
                              <option value="Rio Grande do Sul">Rio Grande do Sul</option>
                              <option value="Santa Catarina">Santa Catarina</option>
                              <option value="Paraná">Paraná</option>
                              <option value="São Paulo">São Paulo</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Cidade</label>
                            <input type="text" name="cidade" value={usuarioData.cidade} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]" />
                          </div>
                        </div>
                      </section>

                      <div className="flex justify-end pt-4">
                        <button onClick={handleSaveProfile} disabled={saving} className="bg-[#ff8b00] hover:bg-[#fc9314] text-white font-medium px-6 py-2 rounded text-xs transition-colors">
                          {saving ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-ABA: CAMPOS ADICIONAIS */}
                  {profileSubTab === 'campos_adicionais' && (
                    <div className="p-6 space-y-6 text-xs">
                      <section className="space-y-2">
                        <h3 className="font-semibold text-slate-800 text-sm">Notas internas</h3>
                        <p className="text-slate-500">
                          Anotações do gestor sobre este colaborador — visíveis só pra quem tem acesso a este
                          painel, nunca pro colaborador.
                        </p>
                        <textarea
                          name="notasInternas"
                          value={usuarioData.notasInternas}
                          onChange={handleInputChange}
                          rows={4}
                          placeholder="Ex: Combinado horário flexível às sextas-feiras, pendência de documento X, feedback da última avaliação..."
                          className="w-full border rounded p-2.5 text-slate-800 focus:outline-none focus:border-[#ff8b00] resize-y"
                        />
                      </section>

                      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        <button onClick={() => setShowConfigCampos(!showConfigCampos)} className="flex items-center gap-1.5 border border-[#ff8b00] text-[#ff8b00] px-3 py-1.5 rounded font-medium hover:bg-[#ff8b00]/10 transition-colors">
                          <Settings className="w-3.5 h-3.5" /> Configurar campos
                        </button>
                      </div>

                      {showConfigCampos && (
                        <div className="p-4 bg-slate-50 border rounded-lg space-y-4">
                          <h4 className="font-semibold text-slate-700">Campos adicionais no cadastro</h4>
                          <div className="flex gap-4 items-center">
                            <input
                              type="text"
                              placeholder="Digite o nome do campo (ex: Observações)"
                              value={newFieldName}
                              onChange={(e) => setNewFieldName(e.target.value)}
                              className="border p-2 rounded flex-1 text-xs focus:outline-none focus:border-[#ff8b00]"
                            />
                            <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className="border p-2 rounded text-xs focus:outline-none focus:border-[#ff8b00]">
                              <option value="Texto livre">Texto livre</option>
                              <option value="Número">Número</option>
                            </select>
                            <button onClick={handleAddCustomField} className="bg-[#ff8b00] hover:bg-[#fc9314] text-white px-4 py-2 rounded font-medium flex items-center gap-1 transition-colors">
                              <Plus className="w-3.5 h-3.5" /> Adicionar Campo
                            </button>
                          </div>
                        </div>
                      )}

                      {customFields.length === 0 ? (
                        <div className="text-slate-500 py-6">Nenhum campo criado.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {customFields.map((field) => (
                            <div key={field.id}>
                              <label className="block text-slate-600 mb-1 font-medium">{field.field_name}</label>
                              <input
                                type="text"
                                defaultValue={field.field_value}
                                className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button onClick={handleSaveProfile} className="bg-[#ff8b00] hover:bg-[#fc9314] text-white font-medium px-6 py-2 rounded text-xs transition-colors">
                          Salvar alterações
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. JORNADA DE TRABALHO */}
              {activeTab === 'jornada' && <WorkScheduleTab employeeId={userId} />}

              {/* 3. CERCAS (Geofencing) */}
              {activeTab === 'cercas' && <GeofenceMapTab employeeId={userId} />}

              {/* 4. FÉRIAS */}
              {activeTab === 'ferias' && (
                <div className="p-6 text-xs space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Admitido em {usuarioData.dataAdmissao}</span>
                    <button onClick={() => setShowVacationModal(true)} className="bg-[#ff8b00] hover:bg-[#fc9314] text-white font-medium px-4 py-2 rounded transition-colors">
                      Adicionar período
                    </button>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-slate-500 font-semibold">
                        <th className="py-2">INÍCIO</th>
                        <th className="py-2">FIM</th>
                        <th className="py-2 text-right">STATUS</th>
                        <th className="py-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vacations.map(v => (
                        <tr key={v.id} className="border-b">
                          <td className="py-3 font-medium text-slate-700">{v.start_date}</td>
                          <td className="py-3 text-slate-700">{v.end_date}</td>
                          <td className="py-3 text-right font-medium text-[#ff8b00]">{v.status}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteVacation(v)}
                              className="text-red-500 hover:text-red-600"
                              title="Remover"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {vacations.length === 0 && (
                    <div className="py-8 text-center text-slate-400">Nenhum período de férias cadastrado</div>
                  )}
                </div>
              )}

              {/* 5. DEPENDENTES */}
              {activeTab === 'dependentes' && (
                <div className="p-6 text-xs space-y-6">
                  <div className="flex justify-end">
                    <button onClick={() => setShowDependentModal(true)} className="bg-[#ff8b00] hover:bg-[#fc9314] text-white font-medium px-4 py-2 rounded transition-colors">
                      Adicionar novo
                    </button>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-slate-500 font-semibold">
                        <th className="py-2">NOME</th>
                        <th className="py-2">NASCIMENTO</th>
                        <th className="py-2">VÍNCULO</th>
                        <th className="py-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dependents.map(d => (
                        <tr key={d.id} className="border-b">
                          <td className="py-2 font-medium">{d.first_name} {d.last_name}</td>
                          <td className="py-2">{d.birth_date}</td>
                          <td className="py-2">{d.relationship}</td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => handleDeleteDependent(d)}
                              className="text-red-500 hover:text-red-600"
                              title="Remover"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {dependents.length === 0 && (
                    <div className="py-8 text-center text-slate-400">Nenhum dependente cadastrado</div>
                  )}
                </div>
              )}

              {/* 6. ACESSO AO SISTEMA */}
              {activeTab === 'acesso' && (
                <div className="text-xs">
                  {/* ACESSO (dados de login, somente leitura) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-6 border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Acesso</h3>
                      <p className="text-slate-500 mt-1">
                        O colaborador também pode entrar usando o CPF em vez do e-mail.
                      </p>
                    </div>
                    <div className="space-y-1.5 md:text-right">
                      <div><span className="text-slate-500">ID PONTO: </span><strong className="text-slate-800">{usuarioData.idPonto || '-'}</strong></div>
                      <div><span className="text-slate-500">LOGIN: </span><strong className="text-slate-800">{usuarioData.login || '-'}</strong></div>
                      <div className="flex items-center gap-1.5 md:justify-end">
                        <span className="text-slate-500">SENHA: </span>
                        <strong className="text-slate-800 font-mono">
                          {showSenha ? (usuarioData.senhaAtual || '(não definida)') : '******'}
                        </strong>
                        <button
                          type="button"
                          onClick={() => setShowSenha(v => !v)}
                          className="text-slate-400 hover:text-slate-600"
                          title={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TIPO DE ACESSO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-6 border-b border-slate-100 items-center">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Tipo de acesso</h3>
                      <p className="text-slate-500 mt-1">
                        Gestor tem acesso total ao sistema. Colaborador mantém o acesso atual (ponto e área do colaborador).
                      </p>
                    </div>
                    <div className="md:justify-self-end w-full md:w-56">
                      <select
                        value={usuarioData.tipoAcesso}
                        onChange={handleChangeAccessType}
                        className="w-full border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]"
                      >
                        <option value="Colaborador">Colaborador</option>
                        <option value="Gestor">Gestor</option>
                      </select>
                    </div>
                  </div>

                  {/* SENHA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-6 border-b border-slate-100 items-center">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Senha</h3>
                      <p className="text-slate-500 mt-1">
                        Reconfigurar senha do usuário para o padrão inicial (CPF do usuário)
                      </p>
                    </div>
                    <div className="md:justify-self-end">
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={resettingPassword}
                        className="bg-[#ff8b00] hover:bg-[#fc9314] text-white font-semibold px-4 py-2 rounded text-xs transition-colors disabled:opacity-60"
                      >
                        {resettingPassword ? 'Resetando...' : 'Resetar senha'}
                      </button>
                    </div>
                  </div>

                  {/* STATUS DO USUÁRIO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-6 border-b border-slate-100 items-center">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Status do usuário</h3>
                      <p className="text-slate-500 mt-1">
                        Ao inativar, você <strong>bloqueia</strong> o acesso do usuário ao sistema e ele deixa de ser cobrado na fatura.
                      </p>
                    </div>
                    <div className="md:justify-self-end flex items-center gap-5">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="statusUsuario"
                          checked={usuarioData.statusUsuario === 'Ativo'}
                          onChange={() => handleToggleStatus('Ativo')}
                          className="accent-[#1a2c6a] w-3.5 h-3.5"
                        />
                        <span className={usuarioData.statusUsuario === 'Ativo' ? 'text-[#1a2c6a] font-semibold' : 'text-slate-500'}>
                          Ativo
                        </span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="statusUsuario"
                          checked={usuarioData.statusUsuario === 'Inativo'}
                          onChange={() => handleToggleStatus('Inativo')}
                          className="accent-slate-400 w-3.5 h-3.5"
                        />
                        <span className={usuarioData.statusUsuario === 'Inativo' ? 'text-slate-700 font-semibold' : 'text-slate-500'}>
                          Inativo
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* DELETAR USUÁRIO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-6 items-center">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Deletar usuário</h3>
                      <p className="text-slate-500 mt-1">
                        Ao deletar, você apaga o usuário de forma <strong>permanente</strong>, sem possibilidade de recuperação.
                      </p>
                    </div>
                    <div className="md:justify-self-end">
                      <button
                        type="button"
                        onClick={handleDeleteUser}
                        disabled={deletingUser}
                        className="border border-red-300 text-red-500 hover:bg-red-50 font-semibold px-4 py-2 rounded text-xs transition-colors disabled:opacity-60"
                      >
                        {deletingUser ? 'Deletando...' : 'Deletar usuário'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. FORMULÁRIO DE ADMISSÃO — lê o processo de admissão real
                  (preenchido pelo colaborador em PreencherAdmissao.jsx) */}
              {activeTab === 'formulario_admissao' && <AdmissionInfoTab employeeId={userId} />}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE CONFIRMAÇÃO (ativar/inativar, tipo de acesso, resetar
          senha, deletar usuário) */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">{confirmModal.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.message}</p>

            {confirmModal.requireText && (
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Digite <strong>{confirmModal.requireText}</strong> para confirmar
                </label>
                <input
                  type="text"
                  autoFocus
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full border rounded p-2 text-xs focus:outline-none focus:border-red-400"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeConfirmModal}
                className="px-4 py-2 border rounded text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmModalAction}
                disabled={
                  !!confirmModal.requireText &&
                  confirmInput.trim().toLowerCase() !== confirmModal.requireText.toLowerCase()
                }
                className={`px-4 py-2 rounded text-xs font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  confirmModal.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#ff8b00] hover:bg-[#fc9314]'
                }`}
              >
                {confirmModal.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FÉRIAS */}
      {showVacationModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Adicionar Período de Férias</h3>
            <div>
              <label className="block text-xs text-slate-600">Data de Início*</label>
              <input type="date" onChange={(e) => setNewVacation({...newVacation, start_date: e.target.value})} className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]" />
            </div>
            <div>
              <label className="block text-xs text-slate-600">Data de Fim*</label>
              <input type="date" onChange={(e) => setNewVacation({...newVacation, end_date: e.target.value})} className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowVacationModal(false)} className="px-4 py-2 border rounded text-xs">Cancelar</button>
              <button onClick={handleAddVacation} className="px-4 py-2 bg-[#ff8b00] hover:bg-[#fc9314] text-white rounded text-xs font-medium transition-colors">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEPENDENTES */}
      {showDependentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Novo dependente</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-600">Primeiro nome*</label>
                <input type="text" onChange={(e) => setNewDependent({...newDependent, first_name: e.target.value})} className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]" />
              </div>
              <div>
                <label className="block text-xs text-slate-600">Sobrenome*</label>
                <input type="text" onChange={(e) => setNewDependent({...newDependent, last_name: e.target.value})} className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-600">Data de nascimento*</label>
              <input type="date" onChange={(e) => setNewDependent({...newDependent, birth_date: e.target.value})} className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]" />
            </div>
            <div>
              <label className="block text-xs text-slate-600">Vínculo*</label>
              <select onChange={(e) => setNewDependent({...newDependent, relationship: e.target.value})} className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]">
                <option value="Filho(a)">Filho(a)</option>
                <option value="Cônjuge">Cônjuge</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowDependentModal(false)} className="px-4 py-2 border rounded text-xs">Cancelar</button>
              <button onClick={handleAddDependent} className="px-4 py-2 bg-[#ff8b00] hover:bg-[#fc9314] text-white rounded text-xs font-medium transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// JORNADA DE TRABALHO — componente próprio, com fetch/save independentes.
// Guarda uma jornada estruturada por dia da semana (entrada, intervalo de
// almoço e saída), calcula a carga horária diária/semanal automaticamente
// e salva em `employee_work_schedules`, vinculada ao employee_id. Essa é a
// jornada que o cálculo de horas do ponto (atrasos, extras, faltas) vai usar.
// ---------------------------------------------------------------------------

const WEEKDAYS = [
  { key: 1, label: 'Segunda-feira', short: 'SEG' },
  { key: 2, label: 'Terça-feira', short: 'TER' },
  { key: 3, label: 'Quarta-feira', short: 'QUA' },
  { key: 4, label: 'Quinta-feira', short: 'QUI' },
  { key: 5, label: 'Sexta-feira', short: 'SEX' },
  { key: 6, label: 'Sábado', short: 'SAB' },
  { key: 0, label: 'Domingo', short: 'DOM' },
];

function defaultDay(weekday) {
  const isWeekday = weekday >= 1 && weekday <= 5;
  return {
    weekday,
    active: isWeekday,
    has_break: isWeekday,
    entry: isWeekday ? '08:00' : '',
    lunch_start: isWeekday ? '12:00' : '',
    lunch_end: isWeekday ? '13:00' : '',
    exit: isWeekday ? '18:00' : '',
  };
}

function defaultDays() {
  return WEEKDAYS.map((w) => defaultDay(w.key));
}

function timeToMinutes(t) {
  if (!t || typeof t !== 'string') return null;
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function minutesToHours(mins) {
  if (!mins || mins <= 0) return '0h00';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h${String(m).padStart(2, '0')}`;
}

// Calcula os minutos trabalhados no dia, descontando o intervalo de almoço
// quando aplicável. Usado tanto na tela (preview) quanto para gravar
// weekly_hours no banco.
function calcDailyMinutes(day) {
  if (!day.active) return 0;
  const entry = timeToMinutes(day.entry);
  const exit = timeToMinutes(day.exit);
  if (entry === null || exit === null || exit <= entry) return 0;

  if (!day.has_break) return exit - entry;

  const lunchStart = timeToMinutes(day.lunch_start);
  const lunchEnd = timeToMinutes(day.lunch_end);
  if (lunchStart === null || lunchEnd === null || lunchEnd <= lunchStart) {
    return exit - entry;
  }
  return Math.max(0, exit - entry - (lunchEnd - lunchStart));
}

function buildScheduleLabel(days) {
  const active = days.filter((d) => d.active && d.entry && d.exit);
  if (active.length === 0) return 'Sem jornada definida';

  const order = WEEKDAYS.map((w) => w.key);
  const sorted = [...active].sort((a, b) => order.indexOf(a.weekday) - order.indexOf(b.weekday));
  const shortOf = (weekday) => WEEKDAYS.find((w) => w.key === weekday)?.short || '';

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const sameTimes = active.every((d) => d.entry === first.entry && d.exit === last.exit);

  const rangeLabel =
    sorted.length > 1 && sameTimes
      ? `${shortOf(first.weekday)} A ${shortOf(last.weekday)}`
      : sorted.map((d) => shortOf(d.weekday)).join('/');

  return `${rangeLabel} ${first.entry} ÀS ${last.exit}`;
}

function WorkScheduleTab({ employeeId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scheduleId, setScheduleId] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState(defaultDays());

  useEffect(() => {
    if (!employeeId || !supabase) return;

    async function fetchSchedule() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('employee_work_schedules')
          .select('*')
          .eq('employee_id', employeeId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setScheduleId(data.id);
          setStartDate(data.start_date || new Date().toISOString().split('T')[0]);
          setDays(Array.isArray(data.week_days) && data.week_days.length ? data.week_days : defaultDays());
        } else {
          setScheduleId(null);
          setDays(defaultDays());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSchedule();
  }, [employeeId]);

  function updateDay(weekday, patch) {
    setDays((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));
  }

  const weeklyMinutes = days.reduce((sum, d) => sum + calcDailyMinutes(d), 0);

  async function handleSave() {
    if (!employeeId || !supabase) return;
    setSaving(true);
    try {
      const label = buildScheduleLabel(days);
      const payload = {
        employee_id: employeeId,
        start_date: startDate || new Date().toISOString().split('T')[0],
        week_days: days,
        weekly_hours: Math.round((weeklyMinutes / 60) * 100) / 100,
        schedule_name: label,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('employee_work_schedules')
        .upsert(payload, { onConflict: 'employee_id' })
        .select()
        .single();
      if (error) throw error;
      setScheduleId(data.id);

      // Mantém Employees.work_schedule (texto livre usado em outras telas,
      // como a criação do colaborador) sincronizado com a jornada real.
      await supabase.from('Employees').update({ work_schedule: label }).eq('id', employeeId);

      alert('Jornada de trabalho salva com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar a jornada de trabalho. Verifique os horários preenchidos.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center text-slate-400 text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando jornada...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Jornada de trabalho</h3>
          <p className="text-slate-500 mt-0.5">
            Defina os dias, horários e intervalo de almoço. Essa jornada é a base para o cálculo
            de horas extras, atrasos e faltas no registro de ponto.
          </p>
        </div>
        <div>
          <label className="block text-slate-500 text-[10px] mb-1">Vigente a partir de</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]"
          />
        </div>
      </div>

      <div className="space-y-2">
        {WEEKDAYS.map((wd) => {
          const day = days.find((d) => d.weekday === wd.key) || defaultDay(wd.key);
          const dailyMinutes = calcDailyMinutes(day);

          return (
            <div
              key={wd.key}
              className={`rounded-lg border p-3 transition-colors ${
                day.active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/60'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <label className="flex items-center gap-2 w-36 shrink-0 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={day.active}
                    onChange={(e) => updateDay(wd.key, { active: e.target.checked })}
                    className="accent-[#ff8b00] w-3.5 h-3.5"
                  />
                  <span className={`font-semibold ${day.active ? 'text-slate-800' : 'text-slate-400'}`}>
                    {wd.label}
                  </span>
                </label>

                {day.active ? (
                  <div className="flex flex-1 flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">Entrada</label>
                      <input
                        type="time"
                        value={day.entry}
                        onChange={(e) => updateDay(wd.key, { entry: e.target.value })}
                        className="border rounded p-1.5 text-xs focus:outline-none focus:border-[#ff8b00]"
                      />
                    </div>

                    <label className="flex items-center gap-1.5 text-[11px] text-slate-500 pb-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={day.has_break}
                        onChange={(e) => updateDay(wd.key, { has_break: e.target.checked })}
                        className="accent-[#ff8b00] w-3 h-3"
                      />
                      <Coffee className="w-3 h-3" /> Intervalo
                    </label>

                    {day.has_break && (
                      <>
                        <div>
                          <label className="block text-slate-500 text-[10px] mb-1">Saída p/ almoço</label>
                          <input
                            type="time"
                            value={day.lunch_start}
                            onChange={(e) => updateDay(wd.key, { lunch_start: e.target.value })}
                            className="border rounded p-1.5 text-xs focus:outline-none focus:border-[#ff8b00]"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 text-[10px] mb-1">Retorno do almoço</label>
                          <input
                            type="time"
                            value={day.lunch_end}
                            onChange={(e) => updateDay(wd.key, { lunch_end: e.target.value })}
                            className="border rounded p-1.5 text-xs focus:outline-none focus:border-[#ff8b00]"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">Saída</label>
                      <input
                        type="time"
                        value={day.exit}
                        onChange={(e) => updateDay(wd.key, { exit: e.target.value })}
                        className="border rounded p-1.5 text-xs focus:outline-none focus:border-[#ff8b00]"
                      />
                    </div>

                    <div className="ml-auto text-right pb-2">
                      <span className="text-slate-400 text-[10px] block">Carga do dia</span>
                      <strong className="text-slate-700">{minutesToHours(dailyMinutes)}</strong>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 text-[11px]">Folga / não trabalha neste dia</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100">
        <div>
          <span className="text-slate-500 text-[10px] block">Carga horária semanal total</span>
          <strong className="text-slate-800 text-sm">{minutesToHours(weeklyMinutes)}</strong>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#ff8b00] hover:bg-[#fc9314] text-white font-medium px-6 py-2.5 rounded text-xs transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? 'Salvando...' : scheduleId ? 'Salvar alterações' : 'Salvar jornada'}
        </button>
      </div>
    </div>
  );
}
// ---------------------------------------------------------------------------
// CERCAS — mapa interativo (Leaflet + OpenStreetMap, carregado via CDN, sem
// precisar instalar pacote novo no projeto). O gestor clica no mapa pra
// colocar um pino, ajusta nome/raio, e salva. Cada pino é uma cerca
// independente — o colaborador é liberado ao bater o ponto dentro do raio de
// QUALQUER uma delas. Fora de todas, o ponto ainda é salvo, mas fica
// "pendente" até o gestor aprovar manualmente (checagem feita em
// PunchClock.jsx no momento de bater o ponto; aprovação feita em
// TimeClockMirror.jsx / Espelho de Ponto).
// ---------------------------------------------------------------------------

const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function loadLeaflet(onReady) {
  if (typeof window === 'undefined') return;
  if (window.L) {
    onReady();
    return;
  }
  if (!document.getElementById('leaflet-cdn-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-cdn-css';
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS_URL;
    document.head.appendChild(link);
  }
  const existingScript = document.getElementById('leaflet-cdn-script');
  if (existingScript) {
    existingScript.addEventListener('load', onReady);
    return;
  }
  const script = document.createElement('script');
  script.id = 'leaflet-cdn-script';
  script.src = LEAFLET_JS_URL;
  script.async = true;
  script.onload = onReady;
  document.body.appendChild(script);
}

function GeofenceMapTab({ employeeId }) {
  const [loading, setLoading] = useState(true);
  const [fences, setFences] = useState([]);
  const [addingMode, setAddingMode] = useState(false);
  const [leafletReady, setLeafletReady] = useState(typeof window !== 'undefined' && !!window.L);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const addingModeRef = useRef(false);
  const toastTimeoutRef = useRef(null);

  function showToast(message, type = 'success') {
    setToast({ type, message });
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    addingModeRef.current = addingMode;
  }, [addingMode]);

  // 1) Carrega a biblioteca do mapa (uma vez só, via CDN)
  useEffect(() => {
    loadLeaflet(() => setLeafletReady(true));
  }, []);

  // 2) Busca as cercas já cadastradas para este colaborador
  useEffect(() => {
    if (!employeeId || !supabase) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('geofences')
        .select('*')
        .eq('employee_id', employeeId);
      if (error) console.error(error);
      setFences((data || []).map((f) => ({ ...f, _editing: false })));
      setLoading(false);
    })();
  }, [employeeId]);

  // 3) Inicializa o mapa assim que a biblioteca e o <div> estiverem prontos
  useEffect(() => {
    if (!leafletReady || !mapDivRef.current || mapInstanceRef.current) return;
    const L = window.L;

    const map = L.map(mapDivRef.current).setView([-14.235, -51.9253], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e) => {
      if (!addingModeRef.current) return;
      const tempId = `temp-${Date.now()}`;
      setFences((prev) => [
        ...prev,
        {
          id: tempId,
          _isNew: true,
          _editing: true,
          name: '',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          radius_meters: 100,
        },
      ]);
      setAddingMode(false);
    });

    mapInstanceRef.current = map;

    // Centraliza no local do gestor, se o navegador permitir — só ajuda a
    // não começar sempre olhando pro Brasil inteiro.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 15),
        () => {},
        { timeout: 4000 }
      );
    }

    // Corrige um bug comum do Leaflet quando o mapa nasce dentro de uma aba
    // escondida (o container não tem altura calculada ainda no 1º frame).
    setTimeout(() => map.invalidateSize(), 200);

    // Corrige o mapa "sumir" (fica em branco, mas os controles de zoom
    // continuam aparecendo): sempre que o <div> do mapa muda de tamanho por
    // QUALQUER motivo — troca de aba, o texto do botão "Adicionar cerca"
    // mudando de largura, reflow da página, etc — o Leaflet não percebe
    // sozinho e continua desenhando os tiles na posição antiga. O
    // ResizeObserver avisa o Leaflet (invalidateSize) toda vez que isso
    // acontece, então o mapa se realinha sozinho em vez de ficar em branco.
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapDivRef.current);
    }

    return () => {
      resizeObserver?.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = {};
    };
  }, [leafletReady]);

  // 4) Sempre que a lista de cercas mudar, reconcilia os marcadores/círculos
  // no mapa (adiciona os novos, remove os excluídos, atualiza raio/posição).
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    const L = window.L;

    // Ícone do pino em SVG inline — o marcador padrão do Leaflet depende de
    // 3 arquivos de imagem (marker-icon.png etc.) cujo caminho quebra com
    // frequência quando a lib é carregada via CDN, deixando o pino invisível
    // (só o círculo do raio aparecia). Um DivIcon com SVG embutido não
    // depende de nenhum arquivo externo, então nunca quebra.
    const pinIcon = L.divIcon({
      className: '',
      html: `
        <svg width="28" height="28" viewBox="0 0 24 24" style="transform: translate(-2px, -26px);">
          <path d="M12 0C7.6 0 4 3.6 4 8c0 5.8 7 15.3 7.3 15.7.2.3.6.5.9.5s.7-.2.9-.5C13.4 23.3 20 13.8 20 8c0-4.4-3.6-8-8-8z"
                fill="#ff8b00" stroke="#ffffff" stroke-width="1.2"/>
          <circle cx="12" cy="8" r="3.2" fill="#ffffff"/>
        </svg>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    const currentIds = new Set(fences.map((f) => f.id));
    Object.keys(markersRef.current).forEach((key) => {
      if (!currentIds.has(key)) {
        const { marker, circle } = markersRef.current[key];
        map.removeLayer(marker);
        map.removeLayer(circle);
        delete markersRef.current[key];
      }
    });

    fences.forEach((fence) => {
      const existing = markersRef.current[fence.id];
      const radius = Number(fence.radius_meters) || 0;

      if (existing) {
        existing.circle.setRadius(radius);
      } else {
        const marker = L.marker([fence.latitude, fence.longitude], { draggable: true, icon: pinIcon }).addTo(map);
        const circle = L.circle([fence.latitude, fence.longitude], {
          radius,
          color: '#ff8b00',
          fillColor: '#ff8b00',
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map);

        marker.on('drag', (e) => {
          circle.setLatLng(e.target.getLatLng());
        });
        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          setFences((prev) =>
            prev.map((f) => (f.id === fence.id ? { ...f, latitude: lat, longitude: lng } : f))
          );
        });

        markersRef.current[fence.id] = { marker, circle };
      }
    });
  }, [fences]);

  function updateFenceField(id, patch) {
    setFences((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  // Entra em modo de edição, guardando os valores atuais em `_original`
  // (usado pra reverter se o gestor clicar em "Cancelar").
  function handleEditFence(fence) {
    setFences((prev) =>
      prev.map((f) =>
        f.id === fence.id
          ? { ...f, _editing: true, _original: { name: f.name, radius_meters: f.radius_meters } }
          : f
      )
    );
  }

  function handleCancelEditFence(fence) {
    if (fence._isNew) {
      // Cerca nunca salva: cancelar remove o pino do mapa direto.
      setFences((prev) => prev.filter((f) => f.id !== fence.id));
      return;
    }
    setFences((prev) =>
      prev.map((f) =>
        f.id === fence.id
          ? { ...f, ...(f._original || {}), _editing: false, _original: undefined }
          : f
      )
    );
  }

  async function handleSaveFence(fence) {
    if (!fence.name?.trim()) {
      alert('Dê um nome para essa cerca (ex: "Sede", "Obra Zona Sul").');
      return;
    }
    const payload = {
      employee_id: employeeId,
      name: fence.name.trim(),
      latitude: fence.latitude,
      longitude: fence.longitude,
      radius_meters: Number(fence.radius_meters) || 100,
    };

    if (fence._isNew) {
      const { data, error } = await supabase.from('geofences').insert([payload]).select().single();
      if (error) {
        console.error(error);
        showToast('Erro ao salvar a cerca.', 'error');
        return;
      }
      setFences((prev) => prev.map((f) => (f.id === fence.id ? { ...data, _editing: false } : f)));
    } else {
      const { error } = await supabase.from('geofences').update(payload).eq('id', fence.id);
      if (error) {
        console.error(error);
        showToast('Erro ao salvar a cerca.', 'error');
        return;
      }
      setFences((prev) =>
        prev.map((f) => (f.id === fence.id ? { ...f, ...payload, _editing: false, _original: undefined } : f))
      );
    }
    showToast('Cerca salva com sucesso!');
  }

  async function handleDeleteFence(fence) {
    if (!fence._isNew) {
      if (!window.confirm(`Remover a cerca "${fence.name}"?`)) return;
      const { error } = await supabase.from('geofences').delete().eq('id', fence.id);
      if (error) {
        console.error(error);
        showToast('Erro ao remover a cerca.', 'error');
        return;
      }
      showToast('Cerca removida.');
    }
    setFences((prev) => prev.filter((f) => f.id !== fence.id));
  }

  return (
    <div className="p-6 text-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Cercas do usuário</h3>
          <p className="text-slate-500 mt-0.5 max-w-lg">
            Clique no mapa para colocar um pino e definir a área onde o ponto é liberado sem
            alerta. Fora de todas as cercas, o ponto ainda é registrado, mas fica pendente até
            você aprovar (veja no Espelho de Ponto).
          </p>
        </div>
        <button
          onClick={() => {
            setAddingMode((v) => !v);
            setTimeout(() => mapInstanceRef.current?.invalidateSize(), 0);
          }}
          className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded font-medium transition-colors border ${
            addingMode
              ? 'bg-[#ff8b00] text-white border-[#ff8b00]'
              : 'border-[#ff8b00] text-[#ff8b00] hover:bg-[#ff8b00]/10'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          {addingMode ? 'Clique no mapa...' : 'Adicionar cerca no mapa'}
        </button>
      </div>

      <div
        className={`relative w-full h-80 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden ${addingMode ? 'cursor-crosshair' : ''}`}
      >
        {/* Este <div> é dono exclusivo do Leaflet a partir da inicialização:
            className e filhos são sempre os mesmos em TODO render, então o
            React nunca precisa "tocar" nele de novo — o que evita qualquer
            risco de conflito com os nós que o Leaflet insere manualmente
            (fora do controle do React) e que causava o mapa sumir/ficar
            branco ao clicar em "Adicionar cerca no mapa". */}
        <div ref={mapDivRef} className="absolute inset-0" />

        {!leafletReady && (
          <div className="absolute inset-0 bg-slate-50 flex items-center justify-center text-slate-400 gap-2 pointer-events-none">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando mapa...
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-slate-400 flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando cercas...
        </div>
      ) : fences.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400 space-y-1">
          <MapPin className="w-6 h-6 mx-auto text-slate-300" />
          <p className="font-medium text-slate-600">Nenhuma cerca cadastrada</p>
          <p>Clique em "Adicionar cerca no mapa" e depois no local desejado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fences.map((fence) =>
            fence._editing ? (
              <div key={fence.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={fence.name}
                    onChange={(e) => updateFenceField(fence.id, { name: e.target.value })}
                    placeholder="Nome do local (ex: Sede, Obra Zona Sul)"
                    className="flex-1 border rounded p-1.5 text-xs focus:outline-none focus:border-[#ff8b00]"
                  />
                  {fence._isNew ? (
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-semibold shrink-0">
                      Não salva
                    </span>
                  ) : (
                    <span className="bg-[#ff8b00]/10 text-[#ff8b00] px-2 py-0.5 rounded text-[10px] font-semibold shrink-0">
                      Ativa
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 text-slate-500">
                    Raio
                    <input
                      type="number"
                      min="10"
                      step="10"
                      value={fence.radius_meters}
                      onChange={(e) => updateFenceField(fence.id, { radius_meters: e.target.value })}
                      className="w-20 border rounded p-1.5 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                    metros
                  </label>
                  <span className="text-slate-400 font-mono text-[10px]">
                    Lat: {Number(fence.latitude).toFixed(5)}, Lng: {Number(fence.longitude).toFixed(5)}
                  </span>

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => handleSaveFence(fence)}
                      className="bg-[#ff8b00] hover:bg-[#fc9314] text-white font-medium px-3 py-1.5 rounded text-xs transition-colors"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => handleCancelEditFence(fence)}
                      className="border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium px-3 py-1.5 rounded text-xs transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={fence.id} className="p-3 border rounded-lg flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span className="font-semibold text-slate-800">{fence.name}</span>
                  <span className="bg-[#ff8b00]/10 text-[#ff8b00] px-2 py-0.5 rounded text-[10px] font-semibold shrink-0">
                    Ativa
                  </span>
                </div>
                <span className="text-slate-500">Raio: {fence.radius_meters}m</span>
                <span className="text-slate-400 font-mono text-[10px]">
                  Lat: {Number(fence.latitude).toFixed(5)}, Lng: {Number(fence.longitude).toFixed(5)}
                </span>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => handleEditFence(fence)}
                    className="flex items-center gap-1 border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium px-3 py-1.5 rounded text-xs transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => handleDeleteFence(fence)}
                    className="flex items-center gap-1 border border-red-300 text-red-500 hover:bg-red-50 font-medium px-3 py-1.5 rounded text-xs transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-xs font-medium text-white animate-in slide-in-from-bottom-2 ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-[#ff8b00]'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FORMULÁRIO DE ADMISSÃO — lê o processo de admissão real do colaborador
// (tabela employee_admissions, preenchida pelo próprio colaborador em
// PreencherAdmissao.jsx). Mostra o mesmo progresso e os mesmos campos que a
// página de Admissão do gestor já exibe, só que direto na tela de edição do
// usuário — sem duplicar lógica, é a mesma estrutura (template_steps +
// progress_data) usada em admin/Admissao.jsx e admissionSteps.js.
// ---------------------------------------------------------------------------

// Mesma regra usada em PreencherAdmissao.jsx / admissionSteps.js pra
// considerar um campo "preenchido": string/número não vazio, ou objeto de
// upload com `url`.
function isAdmissionFieldEmpty(value) {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value === 'object') return !value.url;
  return false;
}

function AdmissionInfoTab({ employeeId }) {
  const [loading, setLoading] = useState(true);
  const [admission, setAdmission] = useState(null);

  useEffect(() => {
    if (!employeeId || !supabase) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('employee_admissions')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) console.error(error);
      setAdmission(data || null);
      setLoading(false);
    })();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center text-slate-400 text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando admissão...
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="p-6 text-xs">
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-400 space-y-2">
          <FileText className="w-8 h-8 mx-auto text-slate-300" />
          <p className="font-medium text-slate-600">Nenhum processo de admissão vinculado a este colaborador</p>
          <p>Quando um processo de admissão for iniciado para ele em "Admissão", as respostas aparecem aqui.</p>
        </div>
      </div>
    );
  }

  const fields = (admission.template_steps || []).flatMap((step) => step.fields || []);
  const progressData = admission.progress_data || {};
  const sentCount = fields.filter((f) => !isAdmissionFieldEmpty(progressData[f.key])).length;
  const totalCount = fields.length;
  const progressPercent = totalCount ? Math.round((sentCount / totalCount) * 100) : 0;

  return (
    <div className="p-6 text-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Formulário de Admissão</h3>
          <p className="text-slate-500 mt-0.5">
            {admission.template_name}
            {admission.status ? ` · ${admission.status}` : ''}
          </p>
        </div>
        <span className="bg-[#ff8b00]/10 text-[#ff8b00] px-3 py-1 rounded-full text-[11px] font-semibold shrink-0">
          {progressPercent}% preenchido ({sentCount} de {totalCount} campos)
        </span>
      </div>

      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <div className="bg-[#ff8b00] h-full transition-all" style={{ width: `${progressPercent}%` }} />
      </div>

      {fields.length === 0 ? (
        <div className="text-slate-400 py-6 text-center">Este processo de admissão ainda não tem campos configurados.</div>
      ) : (
        <div className="divide-y divide-slate-100 border rounded-lg overflow-hidden">
          {fields.map((field) => {
            const rawValue = progressData[field.key];
            const isEmpty = isAdmissionFieldEmpty(rawValue);
            const isFileUpload = !isEmpty && typeof rawValue === 'object';
            const displayValue = isEmpty ? null : isFileUpload ? rawValue.url : String(rawValue);

            return (
              <div key={field.key} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <span className="font-medium text-slate-700 shrink-0">{field.label}</span>
                {isEmpty ? (
                  <span className="text-slate-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Não enviado
                  </span>
                ) : isFileUpload ? (
                  <a
                    href={displayValue}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#ff8b00] hover:underline flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ver arquivo enviado
                  </a>
                ) : (
                  <span className="text-slate-700 text-right break-words max-w-xs">{displayValue}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
