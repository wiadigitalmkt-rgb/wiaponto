import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase'; // Certifique-se de que o caminho do seu supabase client esteja correto
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
  Search
} from 'lucide-react';

export default function Usuario() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('informacoes');
  const [profileSubTab, setProfileSubTab] = useState('dados');
  const [jornadaSubTab, setJornadaSubTab] = useState('informacoes');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado dos dados do Usuário/Colaborador
  const [usuarioData, setUsuarioData] = useState({
    primeiroNome: 'Joquebede',
    sobrenome: 'de Oliveira',
    genero: 'Feminino',
    email: 'elenuzaazp@gmail.com',
    telefone: '(51) 98901-9193',
    estadoCivil: 'Casado(a)',
    cpf: '600.172.060-65',
    rg: '',
    pisPasep: '000.00000.00-0',
    departamento: '',
    dataNascimento: '1999-02-04',
    cargo: 'Atendente',
    salario: '1.621,00',
    dataAdmissao: '2026-08-06',
    tipoContrato: 'CLT',
    cep: '94510-344',
    rua: 'Rua Tais de Souza',
    numero: '87',
    bairro: 'augusta',
    complemento: 'casa',
    estado: 'Rio Grande do Sul',
    cidade: 'Viamão',
    banco: '',
    agencia: '',
    conta: '',
    observacoes: '',
    idPonto: '7412',
    login: '60017206065',
    tipoAcesso: 'Colaborador',
    statusUsuario: 'Ativo'
  });

  // Carregar dados do Banco de Dados caso haja um ID na URL
  useEffect(() => {
    if (userId && supabase) {
      async function fetchUser() {
        setLoading(true);
        const { data, error } = await supabase
          .from('Employees')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          setUsuarioData(prev => ({
            ...prev,
            primeiroNome: data.first_name || data.full_name?.split(' ')[0] || prev.primeiroNome,
            sobrenome: data.last_name || data.full_name?.split(' ').slice(1).join(' ') || prev.sobrenome,
            genero: data.gender || prev.genero,
            email: data.email || prev.email,
            telefone: data.phone || prev.telefone,
            estadoCivil: data.marital_status || prev.estadoCivil,
            cpf: data.cpf || prev.cpf,
            rg: data.rg || prev.rg,
            pisPasep: data.pis_pasep || prev.pisPasep,
            cargo: data.position || prev.cargo,
            salario: data.salary || prev.salario,
            dataAdmissao: data.admission_date || prev.dataAdmissao,
            cep: data.cep || prev.cep,
            rua: data.street || prev.rua,
            numero: data.number || prev.numero,
            bairro: data.neighborhood || prev.bairro,
            complemento: data.complement || prev.complemento,
            cidade: data.city || prev.cidade,
            estado: data.state || prev.estado,
            idPonto: data.point_id || prev.idPonto,
            tipoAcesso: data.access_type || prev.tipoAcesso,
            statusUsuario: data.status || prev.statusUsuario
          }));
        }
        setLoading(false);
      }
      fetchUser();
    }
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUsuarioData(prev => ({ ...prev, [name]: value }));
  };

  // Função para salvar as alterações no Banco de Dados Supabase
  const handleSave = async () => {
    if (!supabase) return;
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
        status: usuarioData.statusUsuario
      };

      if (userId) {
        await supabase.from('Employees').update(payload).eq('id', userId);
      } else {
        await supabase.from('Employees').insert([payload]);
      }
      alert('Alterações salvas com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar alterações.');
    } finally {
      setSaving(false);
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

  const getBreadcrumbLabel = () => {
    switch (activeTab) {
      case 'informacoes': return 'Dados do perfil';
      case 'jornada': return 'Jornada de trabalho';
      case 'cercas': return 'Cercas';
      case 'ferias': return 'Férias';
      case 'dependentes': return 'Dependentes';
      case 'acesso': return 'Acesso ao sistema';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-700">
      {/* Navbar Oficial */}
      <Navbar selectedCompany="Sua Empresa" />

      <main className="flex-1 p-6">
        {/* Título e Nav Header */}
        <div className="max-w-6xl mx-auto mb-4">
          <h1 className="text-xl font-bold uppercase text-slate-800 tracking-wide mb-2">Usuários</h1>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <Link to="/admin" className="hover:text-teal-600 transition-colors">Painel</Link>
            <span>&gt;</span>
            <Link to="/admin/colaboradores" className="hover:text-teal-600 transition-colors">Usuários</Link>
            <span>&gt;</span>
            <span className="text-teal-600 font-medium">{getBreadcrumbLabel()}</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* SIDEBAR DA PÁGINA */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3 p-2">
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
                        ? 'bg-white text-teal-600 font-semibold shadow-sm border-l-4 border-teal-500'
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
              
              {/* Botão Voltar Topo */}
              <div className="p-4 border-b border-slate-100">
                <Link to="/admin/colaboradores" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </Link>
              </div>

              {/* CONTEÚDO: 1. INFORMAÇÕES (DADOS DO PERFIL) */}
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
                            ? 'border-b-2 border-teal-500 text-teal-600 font-medium'
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
                      {/* Informações básicas */}
                      <section className="space-y-4">
                        <h3 className="font-semibold text-slate-800 text-sm">Informações básicas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-slate-600 mb-1">Primeiro nome*</label>
                            <input type="text" name="primeiroNome" value={usuarioData.primeiroNome} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Sobrenome*</label>
                            <input type="text" name="sobrenome" value={usuarioData.sobrenome} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Gênero</label>
                            <select name="genero" value={usuarioData.genero} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800">
                              <option value="Feminino">Feminino</option>
                              <option value="Masculino">Masculino</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">E-mail</label>
                            <input type="email" name="email" value={usuarioData.email} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Telefone</label>
                            <input type="text" name="telefone" value={usuarioData.telefone} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Estado civil</label>
                            <select name="estadoCivil" value={usuarioData.estadoCivil} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800">
                              <option value="Casado(a)">Casado(a)</option>
                              <option value="Solteiro(a)">Solteiro(a)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">CPF*</label>
                            <input type="text" name="cpf" value={usuarioData.cpf} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">RG</label>
                            <input type="text" name="rg" value={usuarioData.rg} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">PIS/PASEP</label>
                            <input type="text" name="pisPasep" value={usuarioData.pisPasep} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
                          </div>
                        </div>
                      </section>

                      <hr className="border-slate-100" />

                      {/* Contratação */}
                      <section className="space-y-4">
                        <h3 className="font-semibold text-slate-800 text-sm">Contratação</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-slate-600 mb-1">Cargo*</label>
                            <input type="text" name="cargo" value={usuarioData.cargo} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Salário bruto</label>
                            <input type="text" name="salario" value={usuarioData.salario.includes('R$') ? usuarioData.salario : `R$ ${usuarioData.salario}`} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Data de admissão</label>
                            <input type="date" name="dataAdmissao" value={usuarioData.dataAdmissao} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
                          </div>
                        </div>
                      </section>

                      <hr className="border-slate-100" />

                      {/* Endereço */}
                      <section className="space-y-4">
                        <h3 className="font-semibold text-slate-800 text-sm">Endereço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-slate-600 mb-1">CEP</label>
                            <input type="text" name="cep" value={usuarioData.cep} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Rua</label>
                            <input type="text" name="rua" value={usuarioData.rua} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Número</label>
                            <input type="text" name="numero" value={usuarioData.numero} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
                          </div>
                        </div>
                      </section>

                      <div className="flex justify-end pt-4">
                        <button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-2 rounded text-xs transition-colors disabled:opacity-50">
                          {saving ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-ABA: CAMPOS ADICIONAIS */}
                  {profileSubTab === 'campos_adicionais' && (
                    <div className="p-6 space-y-8 text-xs min-h-[300px] flex flex-col justify-between">
                      <div className="space-y-6">
                        <button className="flex items-center gap-1.5 border border-teal-600 text-teal-600 px-3 py-1.5 rounded font-medium hover:bg-teal-50">
                          <Settings className="w-3.5 h-3.5" /> Configurar campos
                        </button>

                        <div className="text-slate-600 pt-4">
                          Nenhum campo criado.
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button onClick={handleSave} className="bg-slate-300 text-slate-500 cursor-not-allowed font-medium px-6 py-2 rounded text-xs">
                          Salvar alterações
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-ABA: ADMISSÃO */}
                  {profileSubTab === 'admissao' && (
                    <div className="p-6 space-y-6 text-xs">
                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-700 uppercase tracking-wide">INFORMAÇÕES SOLICITADAS</h4>
                        <div className="text-slate-500 py-2">
                          Nenhum item encontrado
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-700 uppercase tracking-wide">ARQUIVOS SOLICITADOS</h4>
                        <div className="text-slate-500 py-2">
                          Nenhum item encontrado
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-ABA: ANEXOS */}
                  {profileSubTab === 'anexos' && (
                    <div className="p-6 space-y-6 text-xs">
                      <div className="flex justify-between items-center">
                        <div></div>
                        <div className="text-right">
                          <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 rounded transition-colors inline-flex items-center gap-1.5">
                            Anexar novo arquivo
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
                      </table>

                      <div className="py-12 text-center text-slate-500">
                        Nenhum anexo encontrado
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-slate-500">
                        <span>0 Resultado</span>
                        <div className="flex items-center gap-2">
                          <span>Itens por página</span>
                          <select className="border rounded p-1 bg-white">
                            <option>10</option>
                            <option>20</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-ABA: ARQUIVOS DISTRIBUÍDOS */}
                  {profileSubTab === 'arquivos' && (
                    <div className="p-6 space-y-6 text-xs">
                      <div className="flex justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-xs">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                          <input type="text" placeholder="Buscar" className="w-full pl-8 pr-3 py-1.5 border rounded text-xs bg-slate-50" />
                        </div>
                        <select className="border rounded px-3 py-1.5 bg-white text-slate-600">
                          <option>Todos</option>
                        </select>
                      </div>

                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                            <th className="py-2">DESCRIÇÃO</th>
                            <th className="py-2">TIPO</th>
                            <th className="py-2 text-right">DATA</th>
                          </tr>
                        </thead>
                      </table>

                      <div className="py-12 text-center text-slate-500">
                        Nenhum resultado encontrado
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-slate-500">
                        <span>0 Resultado</span>
                        <div className="flex items-center gap-2">
                          <span>Itens por página</span>
                          <select className="border rounded p-1 bg-white">
                            <option>10</option>
                            <option>20</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* CONTEÚDO: 2. JORNADA DE TRABALHO */}
              {activeTab === 'jornada' && (
                <div>
                  <div className="flex border-b border-slate-200 px-4 pt-2 gap-6 text-sm">
                    <button
                      onClick={() => setJornadaSubTab('informacoes')}
                      className={`pb-3 ${jornadaSubTab === 'informacoes' ? 'border-b-2 border-teal-500 text-teal-600 font-medium' : 'text-slate-500'}`}
                    >
                      Informações
                    </button>
                    <button
                      onClick={() => setJornadaSubTab('jornadas')}
                      className={`pb-3 ${jornadaSubTab === 'jornadas' ? 'border-b-2 border-teal-500 text-teal-600 font-medium' : 'text-slate-500'}`}
                    >
                      Jornadas
                    </button>
                  </div>

                  <div className="p-6 space-y-6 text-xs">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-teal-600" />
                        <span>Permitir ponto offline pelo aplicativo celular para este usuário</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-teal-600" />
                        <span>Bloquear ponto pelo aplicativo celular para este usuário</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-teal-600" />
                        <span>Bloquear ponto pelo navegador web para este usuário</span>
                      </label>
                    </div>

                    <hr className="border-slate-100" />

                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Jornada atual</h4>
                      <p className="text-slate-600 mb-1"><strong>Nome:</strong> SEG A SEX 8H AS 12H DAS 14H AS 18H SAB 08H AS 12H</p>
                      <p className="text-slate-600 mb-1"><strong>Tipo:</strong> Padrão</p>
                      <p className="text-slate-600 mb-4"><strong>Usada desde:</strong> 06/08/2026</p>

                      <table className="w-full border-collapse border border-slate-200 text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 border-b">
                            <th className="p-2 border-r">DIA DA SEMANA</th>
                            <th className="p-2 border-r">ENTRADA</th>
                            <th className="p-2 border-r">SAÍDA</th>
                            <th className="p-2 border-r">ENTRADA</th>
                            <th className="p-2">SAÍDA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-2 border-r font-medium">Segunda, Terça, Quarta, Quinta, Sexta</td>
                            <td className="p-2 border-r">08:00</td>
                            <td className="p-2 border-r">12:00</td>
                            <td className="p-2 border-r">14:00</td>
                            <td className="p-2">18:00</td>
                          </tr>
                          <tr>
                            <td className="p-2 border-r font-medium">Sábado</td>
                            <td className="p-2 border-r">08:00</td>
                            <td className="p-2 border-r">12:00</td>
                            <td className="p-2 border-r">-</td>
                            <td className="p-2">-</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="text-right mt-2 text-slate-500 font-semibold">
                        Total de horas semanal: 44h00min
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-2 rounded text-xs transition-colors">
                        Salvar alterações
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTEÚDO: 3. CERCAS */}
              {activeTab === 'cercas' && (
                <div className="p-6 text-xs space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 text-sm">Cercas do Usuário</h3>
                    <button className="flex items-center gap-1 border border-teal-600 text-teal-600 px-3 py-1.5 rounded hover:bg-teal-50 font-medium">
                      <MapPin className="w-3.5 h-3.5" /> Gerenciar Cercas <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-400 space-y-2">
                    <MapPin className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-medium text-slate-600">Nenhuma cerca cadastrada</p>
                    <p>Cadastre cercas em "Gerenciar Cercas" para vincular ao usuário</p>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-2 rounded text-xs transition-colors">
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              )}

              {/* CONTEÚDO: 4. FÉRIAS */}
              {activeTab === 'ferias' && (
                <div className="p-6 text-xs space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Admitido em 06/08/2026</span>
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 rounded transition-colors">
                      Adicionar período
                    </button>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-slate-500 font-semibold">
                        <th className="py-2">PERÍODO AQUISITIVO</th>
                        <th className="py-2">STATUS</th>
                        <th className="py-2 text-right">SALDO</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 font-medium text-slate-700">&gt; 06/08/2026 à 05/08/2027</td>
                        <td className="py-3 text-slate-400">-</td>
                        <td className="py-3 text-right font-medium">0 dias</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* CONTEÚDO: 5. DEPENDENTES */}
              {activeTab === 'dependentes' && (
                <div className="p-6 text-xs space-y-6">
                  <div className="flex justify-end">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 rounded transition-colors">
                      Adicionar novo
                    </button>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-slate-500 font-semibold">
                        <th className="py-2">NOME</th>
                        <th className="py-2">IDADE</th>
                        <th className="py-2">VÍNCULO</th>
                      </tr>
                    </thead>
                  </table>

                  <div className="py-12 text-center text-slate-400">
                    Nenhum dependente informado até o momento.
                  </div>
                </div>
              )}

              {/* CONTEÚDO: 6. ACESSO AO SISTEMA */}
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
                      className="w-full md:w-1/3 border rounded p-2 text-slate-800"
                    >
                      <option value="Colaborador">Colaborador</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-slate-800">Senha</h4>
                      <p className="text-slate-500">Reconfigurar senha do usuário para o padrão inicial (CPF do usuário)</p>
                    </div>
                    <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded font-medium transition-colors">
                      Resetar senha
                    </button>
                  </div>

                  <hr className="border-slate-100" />

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Status do usuário</h4>
                    <p className="text-slate-500 mb-3">
                      Ao inativar, você <strong>bloqueia</strong> o acesso do usuário ao sistema e ele deixa de ser cobrado na fatura
                    </p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="statusUsuario"
                          value="Ativo"
                          checked={usuarioData.statusUsuario === 'Ativo'}
                          onChange={handleInputChange}
                          className="text-teal-600"
                        />
                        <span>Ativo</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="statusUsuario"
                          value="Inativo"
                          checked={usuarioData.statusUsuario === 'Inativo'}
                          onChange={handleInputChange}
                          className="text-teal-600"
                        />
                        <span>Inativo</span>
                      </label>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Deletar usuário</h4>
                    <p className="text-slate-500 mb-3">
                      Ao deletar, você apaga o usuário de forma <strong>permanente</strong>, sem possibilidade de recuperação
                    </p>
                    <button className="border border-slate-300 text-slate-400 px-4 py-2 rounded font-medium cursor-not-allowed">
                      Deletar usuário
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
