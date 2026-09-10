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
  Settings,
  Upload,
  Plus,
  FileText,
  Loader2,
  Coffee
} from 'lucide-react';

export default function Usuario() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('informacoes');
  const [profileSubTab, setProfileSubTab] = useState('dados');
  const [, setLoading] = useState(false);
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
            login: emp.cpf ? emp.cpf.replace(/\D/g, '') : '',
            tipoAcesso: emp.role === 'gestor' || emp.role === 'admin' || emp.access_type === 'Gestor' ? 'Gestor' : 'Colaborador',
            statusUsuario: emp.status || 'Ativo'
          });
        }

        // 2. Sub-tabelas
        const { data: fields } = await supabase.from('employee_custom_fields').select('*').eq('employee_id', userId);
        if (fields) setCustomFields(fields);

        const { data: files } = await supabase.from('employee_attachments').select('*').eq('employee_id', userId);
        if (files) setAttachments(files);

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

  // Salvar especificamente o Tipo de Acesso
  const handleSaveAccessType = async () => {
    if (!supabase || !userId) return;
    setSaving(true);
    try {
      const isGestor = usuarioData.tipoAcesso === 'Gestor';
      const payload = {
        access_type: usuarioData.tipoAcesso,
        role: isGestor ? 'gestor' : 'colaborador'
      };

      const { error } = await supabase.from('Employees').update(payload).eq('id', userId);
      if (error) throw error;

      alert(`Tipo de acesso salvo como ${usuarioData.tipoAcesso} com sucesso!`);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o tipo de acesso.');
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
      const { error: uploadErr } = await supabase.storage
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
              {activeTab === 'jornada' && <WorkScheduleTab employeeId={userId} />}

              {/* 3. CERCAS (Geofencing) */}
              {activeTab === 'cercas' && <GeofenceMapTab employeeId={userId} />}

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

                  <div className="space-y-4">
                    <label className="block text-slate-700 font-semibold">Tipo de acesso</label>
                    <div className="flex items-center gap-3">
                      <select
                        name="tipoAcesso"
                        value={usuarioData.tipoAcesso}
                        onChange={handleInputChange}
                        className="w-full md:w-1/2 border rounded p-2 text-slate-800 focus:outline-none focus:border-[#ff8b00]"
                      >
                        <option value="Colaborador">Colaborador</option>
                        <option value="Gestor">Gestor</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleSaveAccessType}
                        disabled={saving}
                        className="bg-[#ff8b00] hover:bg-[#e07a00] text-white font-medium px-5 py-2 rounded text-xs transition-colors shrink-0"
                      >
                        {saving ? 'Salvando...' : 'Salvar tipo de acesso'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. FORMULÁRIO DE ADMISSÃO (esqueleto — a leitura dos dados
                  reais preenchidos pelo colaborador em PreencherAdmissao.jsx
                  será conectada aqui numa próxima etapa) */}
              {activeTab === 'formulario_admissao' && (
                <div className="p-6 text-xs">
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-400 space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-medium text-slate-600">Formulário de Admissão</p>
                    <p>
                      Em breve, as respostas enviadas pelo colaborador no processo de admissão
                      (selfie, estado civil, telefone, endereço, dados bancários, etc.) vão
                      aparecer aqui, vinculadas a este usuário.
                    </p>
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
          className="bg-[#ff8b00] hover:bg-[#e07a00] text-white font-medium px-6 py-2.5 rounded text-xs transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
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

  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const addingModeRef = useRef(false);

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
      setFences(data || []);
      setLoading(false);
    })();
  }, [employeeId]);

  // 3) Inicializa o mapa assim que a biblioteca e o <div> estiverem prontos
  useEffect(() => {
    if (!leafletReady || !mapDivRef.current || mapInstanceRef.current) return;
    const L = window.L;

    const map = L.map(mapDivRef.current).setView([-14.235, -51.9253], 4);
    // Importante: NÃO usar tile.openstreetmap.org direto em produção — é o
    // servidor de demonstração da própria OSM, e a política de uso deles
    // bloqueia/limita quem faz muitas requisições de tile (zoom/pan
    // repetidos), o que fazia o mapa ficar em branco depois de alguns
    // segundos de uso e nunca mais carregar. O CARTO oferece um tile básico
    // gratuito, sem precisar de chave de API, pensado pra uso real.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors',
      subdomains: 'abcd',
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

    return () => {
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
        alert('Erro ao salvar a cerca.');
        return;
      }
      setFences((prev) => prev.map((f) => (f.id === fence.id ? data : f)));
    } else {
      const { error } = await supabase.from('geofences').update(payload).eq('id', fence.id);
      if (error) {
        console.error(error);
        alert('Erro ao salvar a cerca.');
        return;
      }
      setFences((prev) => prev.map((f) => (f.id === fence.id ? { ...f, ...payload } : f)));
    }
  }

  async function handleDeleteFence(fence) {
    if (!fence._isNew) {
      const { error } = await supabase.from('geofences').delete().eq('id', fence.id);
      if (error) {
        console.error(error);
        alert('Erro ao remover a cerca.');
        return;
      }
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
          onClick={() => setAddingMode((v) => !v)}
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
        ref={mapDivRef}
        className={`w-full h-80 rounded-lg border border-slate-200 bg-slate-50 ${addingMode ? 'cursor-crosshair' : ''}`}
      >
        {!leafletReady && (
          <div className="h-full flex items-center justify-center text-slate-400 gap-2">
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
          {fences.map((fence) => (
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
                    className="bg-[#ff8b00] hover:bg-[#e07a00] text-white font-medium px-3 py-1.5 rounded text-xs transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => handleDeleteFence(fence)}
                    className="border border-red-300 text-red-500 hover:bg-red-50 font-medium px-3 py-1.5 rounded text-xs transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
