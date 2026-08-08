import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import {
  User,
  Clock,
  MapPin,
  Plane,
  Users,
  KeyRound,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

export default function Usuario() {
  const [activeTab, setActiveTab] = useState('informacoes');
  
  // Estado para sub-abas internas de "Dados do perfil"
  const [profileSubTab, setProfileSubTab] = useState('dados');
  
  // Estado para sub-abas internas de "Jornada de trabalho"
  const [jornadaSubTab, setJornadaSubTab] = useState('informacoes');

  // Dados mockados do usuário conforme os prints
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
    // Configurações de Acesso
    idPonto: '7412',
    login: '60017206065',
    tipoAcesso: 'Colaborador',
    statusUsuario: 'Ativo'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUsuarioData(prev => ({ ...prev, [name]: value }));
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
    <div className="min-h-screen bg-slate-100 p-6 text-slate-700 font-sans">
      {/* Título e Nav Header */}
      <div className="max-w-6xl mx-auto mb-4">
        <h1 className="text-xl font-bold uppercase text-slate-800 tracking-wide mb-2">Usuários</h1>
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <span>Painel</span>
          <span>&gt;</span>
          <span>Usuários</span>
          <span>&gt;</span>
          <span className="text-teal-600 font-medium">{getBreadcrumbLabel()}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* SIDEBAR DA PÁGINA */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center font-semibold text-slate-600">
              JD
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
              <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            </div>

            {/* CONTEÚDO: 1. INFORMAÇÕES (DADOS DO PERFIL) */}
            {activeTab === 'informacoes' && (
              <div>
                <div className="flex border-b border-slate-200 px-4 pt-2 gap-6 text-sm">
                  {['dados', 'campos_adicionais', 'admissao', 'anexos', 'arquivos'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setProfileSubTab(tab)}
                      className={`pb-3 capitalize transition-all ${
                        profileSubTab === tab
                          ? 'border-b-2 border-teal-500 text-teal-600 font-medium'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab === 'dados' ? 'Dados do perfil' : tab.replace('_', ' ')}
                    </button>
                  ))}
                </div>

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
                          <input type="text" name="salario" value={`R$ ${usuarioData.salario}`} onChange={handleInputChange} className="w-full border rounded p-2 text-slate-800" />
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
                      <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-2 rounded text-xs">
                        Salvar alterações
                      </button>
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
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded text-teal-600" />
                      <span>Permitir ponto offline pelo aplicativo celular para este usuário</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded text-teal-600" />
                      <span>Bloquear ponto pelo aplicativo celular para este usuário</span>
                    </label>
                    <label className="flex items-center gap-2">
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
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-2 rounded text-xs">
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
                  <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-2 rounded text-xs">
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
                  <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 rounded">
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
                  <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 rounded">
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
                  <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded font-medium">
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
    </div>
  );
}
