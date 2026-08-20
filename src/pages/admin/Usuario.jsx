import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
  User,
  Clock,
  MapPin,
  Plane,
  Users,
  KeyRound,
  ArrowLeft,
  ExternalLink,
  Settings,
  Upload,
  Search,
  Plus,
  Trash2,
  X
} from 'lucide-react';

export default function Usuario() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('informacoes');
  const [profileSubTab, setProfileSubTab] = useState('dados');
  const [jornadaSubTab, setJornadaSubTab] = useState('informacoes');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

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

  const [attachments, setAttachments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [geofences, setGeofences] = useState([]);
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

  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [newFence, setNewFence] = useState({ name: '', latitude: -30.0811, longitude: -51.0233, radius_meters: 100 });

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
            login: emp.cpf ? emp.cpf.replace(/\D/g, '') : '',
            tipoAcesso: emp.role === 'gestor' || emp.role === 'admin' ? 'Gestor' : 'Colaborador',
            statusUsuario: emp.status || 'Ativo'
          });
        }

        // 2. Sub-tabelas
        const { data: fields } = await supabase.from('employee_custom_fields').select('*').eq('employee_id', userId);
        if (fields) setCustomFields(fields);

        const { data: files } = await supabase.from('employee_attachments').select('*').eq('employee_id', userId);
        if (files) setAttachments(files);

        const { data: scheds } = await supabase.from('employee_work_schedules').select('*').eq('employee_id', userId);
        if (scheds) setSchedules(scheds);

        const { data: fences } = await supabase.from('geofences').select('*').eq('employee_id', userId);
        if (fences) setGeofences(fences);

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
        status: usuarioData.statusUsuario
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

  // 3. Upload Múltiplo de Arquivos/Anexos
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !userId) return;

    for (const file of files) {
      const filePath = `${userId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('employee-files')
        .upload(filePath, file);

      const fileUrl = uploadErr ? '' : supabase.storage.from('employee-files').getPublicUrl(filePath).data.publicUrl;

      const { data: record } = await supabase.from('employee_attachments').insert([{
        employee_id: userId,
        file_name: file.name,
        file_url: fileUrl,
        file_size: file.size
      }]).select();

      if (record) {
        setAttachments(prev => [...prev, ...record]);
      }
    }
  };

  // 4. Adicionar Nova Jornada
  const handleAddSchedule = async () => {
    if (!userId) return;
    const newEntry = {
      employee_id: userId,
      start_date: new Date().toISOString().split('T')[0],
      schedule_name: 'SEG A SEX 8H AS 12H DAS 14H AS 18H SAB 08H AS 12H'
    };
    const { data } = await supabase.from('employee_work_schedules').insert([newEntry]).select();
    if (data) setSchedules([...schedules, ...data]);
  };

  // 5. Adicionar Cerca
  const handleAddGeofence = async () => {
    if (!userId || !newFence.name) return;
    const { data } = await supabase.from('geofences').insert([{
      employee_id: userId,
      ...newFence
    }]).select();

    if (data) {
      setGeofences([...geofences, ...data]);
      setShowGeofenceModal(false);
    }
  };

  // 6. Cadastrar Férias
  const handleAddVacation = async () => {
    if (!userId || !newVacation.start_date || !newVacation.end_date) return;
    const { data } = await supabase.from('employee_vacations').insert([{
      employee_id: userId,
      ...newVacation,
      status: 'Agendado'
    }]).select();

    if (data) {
      setVacations([...vacations, ...data]);
      setShowVacationModal(false);
    }
  };

  // 7. Cadastrar Dependente
  const handleAddDependent = async () => {
    if (!userId || !newDependent.first_name) return;
    const { data } = await supabase.from('employee_dependents').insert([{
      employee_id: userId,
      ...newDependent
    }]).select();

    if (data) {
      setDependents([...dependents, ...data]);
      setShowDependentModal(false);
    }
  };

  // 8. Resetar Senha para o Padrao (CPF sem pontuação)
  const handleResetPassword = async () => {
    if (!userId) return;
    const defaultPassword = usuarioData.cpf.replace(/\D/g, '');
    const { error } = await supabase.from('Employees').update({
      password_hash: defaultPassword
    }).eq('id', userId);

    if (!error) {
      alert(`Senha resetada com sucesso para o padrão (CPF): ${defaultPassword}`);
    } else {
      alert('Erro ao resetar senha.');
    }
  };

  const menuItems = [
    { id: 'informacoes', label: 'Informações', icon: User },
    { id: 'jornada', label: 'Jornada de trabalho', icon: Clock },
    { id: 'cercas', label: 'Cercas', icon: MapPin },
    { id: 'ferias', label: 'Férias', icon: Plane },
    { id: 'dependentes', label: 'Dependentes', icon: Users },
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
            <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center font-semibold text-slate-600 uppercase">
                {usuarioData.primeiroNome?.[0]}{usuarioData.sobrenome?.[0]}
              </div>
              <span className="font-semibold text-slate-800 text-sm">
                {usuarioData.primeiroNome} {usuarioData.sobrenome}
              </span>
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
                      { id: 'campos_adicionais', label: 'Campos adicionais' },
                      { id: 'admissao', label: 'Admissão' },
                      { id: 'anexos', label: 'Anexos' },
                      { id: 'arquivos', label: 'Arquivos distribuídos' }
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
                        <button onClick={handleSaveProfile} disabled={saving} className="bg-[#ff8b00] hover:bg-[#e07a00] text-white font-medium px-6 py-2 rounded text-xs transition-colors">
                          {saving ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-ABA: CAMPOS ADICIONAIS */}
                  {profileSubTab === 'campos_adicionais' && (
                    <div className="p-6 space-y-6 text-xs">
                      <div className="flex justify-between items-center">
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
                            <button onClick={handleAddCustomField} className="bg-[#ff8b00] hover:bg-[#e07a00] text-white px-4 py-2 rounded font-medium flex items-center gap-1 transition-colors">
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
                        <button onClick={handleSaveProfile} className="bg-[#ff8b00] hover:bg-[#e07a00] text-white font-medium px-6 py-2 rounded text-xs transition-colors">
                          Salvar alterações
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-ABA: ANEXOS (UPLOAD MÚLTIPLO) */}
                  {profileSubTab === 'anexos' && (
                    <div className="p-6 space-y-6 text-xs">
                      <div className="flex justify-between items-center">
                        <input
                          type="file"
                          multiple
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        <div></div>
                        <div className="text-right">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#ff8b00] hover:bg-[#e07a00] text-white font-medium px-4 py-2 rounded transition-colors inline-flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" /> Anexar novo arquivo
                          </button>
                          <span className="block text-[10px] text-slate-400 mt-1">Limite por arquivo: 50MB</span>
                        </div>
                      </div>

                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                            <th className="py-2">ARQUIVO</th>
                            <th className="py-2 text-right">ANEXADO EM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attachments.map((file) => (
                            <tr key={file.id} className="border-b">
                              <td className="py-2 font-medium text-[#ff8b00]">
                                <a href={file.file_url} target="_blank" rel="noreferrer" className="hover:underline">
                                  {file.file_name}
                                </a>
                              </td>
                              <td className="py-2 text-right text-slate-400">
                                {new Date(file.created_at).toLocaleDateString('pt-BR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {attachments.length === 0 && (
                        <div className="py-12 text-center text-slate-500">Nenhum anexo encontrado</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2. JORNADA DE TRABALHO */}
              {activeTab === 'jornada' && (
                <div>
                  <div className="flex border-b border-slate-200 px-4 pt-2 gap-6 text-sm">
                    <button
                      onClick={() => setJornadaSubTab('informacoes')}
                      className={`pb-3 ${jornadaSubTab === 'informacoes' ? 'border-b-2 border-[#ff8b00] text-[#ff8b00] font-medium' : 'text-slate-500'}`}
                    >
                      Informações
                    </button>
                    <button
                      onClick={() => setJornadaSubTab('jornadas')}
                      className={`pb-3 ${jornadaSubTab === 'jornadas' ? 'border-b-2 border-[#ff8b00] text-[#ff8b00] font-medium' : 'text-slate-500'}`}
                    >
                      Jornadas
                    </button>
                  </div>

                  {jornadaSubTab === 'jornadas' ? (
                    <div className="p-6 space-y-6 text-xs">
                      <div className="flex justify-between items-center">
                        <button onClick={handleAddSchedule} className="border border-[#ff8b00] text-[#ff8b00] px-4 py-2 rounded font-medium hover:bg-[#ff8b00]/10 flex items-center gap-1 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Adicionar nova
                        </button>
                      </div>

                      <div className="space-y-4">
                        {schedules.map((s) => (
                          <div key={s.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border p-3 rounded">
                            <div>
                              <label className="block text-slate-500 text-[10px]">Início em</label>
                              <input type="date" defaultValue={s.start_date} className="border rounded p-1.5 text-xs w-full focus:outline-none focus:border-[#ff8b00]" />
                            </div>
                            <div>
                              <label className="block text-slate-500 text-[10px]">Jornada</label>
                              <select defaultValue={s.schedule_name} className="border rounded p-1.5 text-xs w-full focus:outline-none focus:border-[#ff8b00]">
                                <option value="SEG A SEX 8H AS 12H DAS 14H AS 18H SAB 08H AS 12H">
                                  SEG A SEX 8H AS 12H DAS 14H AS 18H SAB 08H AS 12H
                                </option>
                              </select>
                            </div>
                            <div className="text-right">
                              <button className="text-red-500 hover:underline">Remover</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-4">
                        <button onClick={handleSaveProfile} className="bg-[#ff8b00] hover:bg-[#e07a00] text-white font-medium px-6 py-2 rounded text-xs transition-colors">
                          Salvar alterações
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 space-y-6 text-xs">
                      <p className="text-slate-600 font-medium">Jornada Atual e Parâmetros de Ponto Celular/Web</p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. CERCAS (Geofencing) */}
              {activeTab === 'cercas' && (
                <div className="p-6 text-xs space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 text-sm">Cercas do Usuário</h3>
                    <button onClick={() => setShowGeofenceModal(true)} className="flex items-center gap-1 border border-[#ff8b00] text-[#ff8b00] px-3 py-1.5 rounded hover:bg-[#ff8b00]/10 font-medium transition-colors">
                      <MapPin className="w-3.5 h-3.5" /> Adicionar Cerca no Mapa
                    </button>
                  </div>

                  {geofences.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-400 space-y-2">
                      <MapPin className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-medium text-slate-600">Nenhuma cerca cadastrada</p>
                      <p>Adicione um raio no mapa onde o ponto será liberado sem alerta.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {geofences.map(f => (
                        <div key={f.id} className="p-3 border rounded flex justify-between items-center">
                          <div>
                            <strong className="text-slate-800 block">{f.name}</strong>
                            <span className="text-slate-500">Lat: {f.latitude}, Lng: {f.longitude} (Raio: {f.radius_meters}m)</span>
                          </div>
                          <span className="bg-[#ff8b00]/10 text-[#ff8b00] px-2 py-0.5 rounded text-[10px] font-semibold">Ativa</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. FÉRIAS */}
              {activeTab === 'ferias' && (
                <div className="p-6 text-xs space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Admitido em {usuarioData.dataAdmissao}</span>
                    <button onClick={() => setShowVacationModal(true)} className="bg-[#ff8b00] hover:bg-[#e07a00] text-white font-medium px-4 py-2 rounded transition-colors">
                      Adicionar período
                    </button>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-slate-500 font-semibold">
                        <th className="py-2">INÍCIO</th>
                        <th className="py-2">FIM</th>
                        <th className="py-2 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vacations.map(v => (
                        <tr key={v.id} className="border-b">
                          <td className="py-3 font-medium text-slate-700">{v.start_date}</td>
                          <td className="py-3 text-slate-700">{v.end_date}</td>
                          <td className="py-3 text-right font-medium text-[#ff8b00]">{v.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. DEPENDENTES */}
              {activeTab === 'dependentes' && (
                <div className="p-6 text-xs space-y-6">
                  <div className="flex justify-end">
                    <button onClick={() => setShowDependentModal(true)} className="bg-[#ff8b00] hover:bg-[#e07a00] text-white font-medium px-4 py-2 rounded transition-colors">
                      Adicionar novo
                    </button>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-slate-500 font-semibold">
                        <th className="py-2">NOME</th>
                        <th className="py-2">NASCIMENTO</th>
                        <th className="py-2">VÍNCULO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dependents.map(d => (
                        <tr key={d.id} className="border-b">
                          <td className="py-2 font-medium">{d.first_name} {d.last_name}</td>
                          <td className="py-2">{d.birth_date}</td>
                          <td className="py-2">{d.relationship}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 6. ACESSO AO SISTEMA */}
              {activeTab === 'acesso' && (
                <div className="p-6 space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-slate-500 block">ID PONTO:</span>
                      <strong className="text-slate-800">{usuarioData.idPonto}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">LOGIN:</span>
                      <strong className="text-slate-800">{usuarioData.login}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">SENHA:</span>
                      <strong className="text-slate-800">******</strong>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-2">Tipo de acesso</label>
                    <select
                      name="tipoAcesso"
                      value={usuarioData.tipoAcesso}
                      onChange={handleInputChange}
                      className="w-full md:w-1/2 border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]"
                    >
                      <option value="Colaborador">Colaborador</option>
                      <option value="Gestor">Gestor</option>
                    </select>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-slate-800">Senha</h4>
                      <p className="text-slate-500">Reconfigurar senha do usuário para o padrão inicial (CPF do usuário)</p>
                    </div>
                    <button onClick={handleResetPassword} className="bg-[#ff8b00] hover:bg-[#e07a00] text-white px-4 py-2 rounded font-medium transition-colors">
                      Resetar senha
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

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
              <button onClick={handleAddVacation} className="px-4 py-2 bg-[#ff8b00] hover:bg-[#e07a00] text-white rounded text-xs font-medium transition-colors">Adicionar</button>
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
              <button onClick={handleAddDependent} className="px-4 py-2 bg-[#ff8b00] hover:bg-[#e07a00] text-white rounded text-xs font-medium transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CERCA NO MAPA */}
      {showGeofenceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Cadastrar Cerca Geográfica</h3>
            <div>
              <label className="block text-xs text-slate-600">Nome do Local</label>
              <input type="text" placeholder="Ex: Sede Viamão" onChange={(e) => setNewFence({...newFence, name: e.target.value})} className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-600">Latitude</label>
                <input type="number" step="any" value={newFence.latitude} onChange={(e) => setNewFence({...newFence, latitude: parseFloat(e.target.value)})} className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]" />
              </div>
              <div>
                <label className="block text-xs text-slate-600">Longitude</label>
                <input type="number" step="any" value={newFence.longitude} onChange={(e) => setNewFence({...newFence, longitude: parseFloat(e.target.value)})} className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-600">Raio de Cobertura (Metros)</label>
              <input type="number" value={newFence.radius_meters} onChange={(e) => setNewFence({...newFence, radius_meters: parseInt(e.target.value)})} className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowGeofenceModal(false)} className="px-4 py-2 border rounded text-xs">Cancelar</button>
              <button onClick={handleAddGeofence} className="px-4 py-2 bg-[#ff8b00] hover:bg-[#e07a00] text-white rounded text-xs font-medium transition-colors">Salvar Cerca</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
