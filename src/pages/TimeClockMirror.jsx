import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { 
  Clock, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Calendar,
  ExternalLink,
  MessageSquare,
  Moon,
  Monitor,
  CheckCircle2,
  X,
  History,
  Search,
  MapPin,
  Camera
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================================
// FUNÇÕES UTILITÁRIAS DE CÁLCULO DE HORAS
// ============================================================================

const timeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === '-' || timeStr.trim() === '') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

const minutesToHHMM = (mins) => {
  if (mins === null || isNaN(mins) || mins < 0) return '-';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const minutesToDisplayHours = (mins) => {
  if (!mins || mins <= 0) return '0h';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

const minutesToFullDisplay = (mins) => {
  if (mins === null || isNaN(mins) || mins < 0) return '00h 00min';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}min`;
};

const processDayRecord = (record, targetDailyMinutes = 480) => {
  let totalDayMinutes = 0;
  let nightMinutes = 0;

  const newBatidas = record.batidas.map((b) => {
    const mEnt = timeToMinutes(b.entrada);
    let mSai = timeToMinutes(b.saida);

    if (mEnt !== null && mSai !== null) {
      if (mSai < mEnt || b.isNight) {
        mSai += 1440;
      }
      const diff = Math.max(0, mSai - mEnt);
      totalDayMinutes += diff;

      if (b.isNight) {
        nightMinutes += diff;
      }

      return { ...b, saldo: minutesToHHMM(diff) };
    }
    return { ...b, saldo: '-' };
  });

  const trabalhadoStr = minutesToDisplayHours(totalDayMinutes);
  const extraMinutes = Math.max(0, totalDayMinutes - targetDailyMinutes);
  const horaExtraStr = minutesToDisplayHours(extraMinutes);

  return {
    ...record,
    batidas: newBatidas,
    trabalhado: trabalhadoStr,
    horaExtra: horaExtraStr,
    totalDayMinutes,
    extraMinutes,
    nightMinutes
  };
};

export default function AdminPonto() {
  const [activeTab, setActiveTab] = useState('pontos'); // 'pontos' | 'resumo'
  const [selectedMonth, setSelectedMonth] = useState('Agosto/2026');
  const [selectedDepartment, setSelectedDepartment] = useState('Todos');
  
  // Lista dinâmica de colaboradores do Supabase
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // Objeto do colaborador selecionado
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // Estado para verificar se é um GESTOR
  const [isManager, setIsManager] = useState(true);

  const [expandedRow, setExpandedRow] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showJornadaModal, setShowJornadaModal] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  const [editingRowKey, setEditingRowKey] = useState(null);
  const [editFormData, setEditFormData] = useState({
    isNight: false,
    obs: '',
    entrada: '',
    saida: ''
  });

  const [registros, setRegistros] = useState([]);

  // 1. CARREGAR COLABORADORES DO SUPABASE E DETECTAR USUÁRIO LOGADO COM RESTRIÇÃO
  useEffect(() => {
    async function loadEmployees() {
      const { data: authData } = await supabase.auth.getUser();
      const storedSession = JSON.parse(
        localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || '{}'
      );
      
      const sessionUser = storedSession?.user || storedSession || {};
      const currentUserEmail = authData?.user?.email || sessionUser?.email || '';
      const currentUserCpf = sessionUser?.cpf || '';

      const { data, error } = await supabase
        .from('Employees')
        .select('*')
        .order('full_name', { ascending: true });

      if (!error && data && data.length > 0) {
        // Localiza o registro do usuário logado na tabela
        const loggedInEmployee = data.find(e => 
          (currentUserEmail && e.email?.toLowerCase() === currentUserEmail.toLowerCase()) ||
          (currentUserCpf && e.cpf === currentUserCpf)
        );

        // Verifica os papéis de acesso tanto no banco quanto na sessão armazenada
        const sessionRole = String(sessionUser?.role || sessionUser?.access_type || '').toLowerCase();
        const dbRole = String(loggedInEmployee?.role || loggedInEmployee?.access_type || '').toLowerCase();

        const isUserManager = 
          sessionRole.includes('gestor') || 
          sessionRole.includes('admin') || 
          dbRole.includes('gestor') || 
          dbRole.includes('admin') ||
          (!loggedInEmployee && currentUserEmail.includes('gestor')); // Fallback para perfil gestor sem e-mail direto na tabela

        if (isUserManager || (!loggedInEmployee && currentUserEmail)) {
          // Se for gestor ou se a conta for de gestão, carrega todos os colaboradores
          setIsManager(true);
          setEmployees(data);
          setSelectedUser(prev => prev || loggedInEmployee || data[0]);
        } else if (loggedInEmployee && loggedInEmployee.role === 'colaborador') {
          // Restringe apenas se for estritamente colaborador
          setIsManager(false);
          setEmployees([loggedInEmployee]);
          setSelectedUser(loggedInEmployee);
        } else {
          // Padrão de segurança: Gestor
          setIsManager(true);
          setEmployees(data);
          setSelectedUser(prev => prev || data[0]);
        }
      }
    }
    loadEmployees();
  }, []);

  // 2. BUSCAR PONTOS DO COLABORADOR SELECIONADO DO SUPABASE
  const fetchRecordsFromSupabase = async () => {
    if (!selectedUser) return;

    let query = supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', selectedUser.id);

    const monthMap = {
      'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04',
      'Maio': '05', 'Junho': '06', 'Julho': '07', 'Agosto': '08',
      'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12'
    };

    const parts = selectedMonth.split('/');
    if (parts.length === 2) {
      const monthNum = monthMap[parts[0]];
      const yearNum = parts[1];
      if (monthNum && yearNum) {
        const startDate = `${yearNum}-${monthNum}-01`;
        const endDate = `${yearNum}-${monthNum}-31`;
        query = query.gte('record_date', startDate).lte('record_date', endDate);
      }
    }

    const { data, error } = await query.order('record_date', { ascending: false });

    if (!error && data) {
      const grouped = data.reduce((acc, curr) => {
        const dateKey = curr.record_date;
        if (!acc[dateKey]) {
          acc[dateKey] = {
            id: dateKey,
            data: dateKey,
            batidas: []
          };
        }
        acc[dateKey].batidas.push({
          db_id: curr.id,
          entrada: curr.entrada || '-',
          saida: curr.saida || '-',
          isNight: curr.is_night || false,
          obs: curr.obs || '',
          latitude: curr.latitude,
          longitude: curr.longitude,
          photo_url: curr.photo_url
        });
        return acc;
      }, {});

      const processed = Object.values(grouped).map((rec) => processDayRecord(rec));
      setRegistros(processed);
    }
  };

  useEffect(() => {
    fetchRecordsFromSupabase();

    if (!selectedUser?.id || !supabase) return;

    const channel = supabase
      .channel(`realtime:time_records:${selectedUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_records',
          filter: `employee_id=eq.${selectedUser.id}`
        },
        () => {
          fetchRecordsFromSupabase();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, selectedMonth]);

  const filteredUsers = employees.filter(u => 
    u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleRemoveBatida = async (itemId, batidaIdx, dbId) => {
    if (!isManager) return;
    if (dbId) {
      const { error } = await supabase.from('time_records').delete().eq('id', dbId);
      if (error) {
        alert('Erro ao remover: ' + error.message);
        return;
      }
    }
    fetchRecordsFromSupabase();
    showToast('Ponto removido com sucesso!');
  };

  const handleStartEdit = (itemId, idx, batida) => {
    if (!isManager) return;
    setEditingRowKey(`${itemId}-${idx}`);
    setEditFormData({
      isNight: batida.isNight || false,
      obs: batida.obs || '',
      entrada: batida.entrada === '-' ? '' : batida.entrada,
      saida: batida.saida === '-' ? '' : batida.saida
    });
  };

  const handleSaveEdit = async (itemId, batidaIdx, dbId) => {
    if (dbId) {
      const { error } = await supabase
        .from('time_records')
        .update({
          entrada: editFormData.entrada.trim() || '-',
          saida: editFormData.saida.trim() || '-',
          is_night: editFormData.isNight,
          obs: editFormData.obs
        })
        .eq('id', dbId);

      if (error) {
        alert('Erro ao salvar: ' + error.message);
        return;
      }
    }
    setEditingRowKey(null);
    fetchRecordsFromSupabase();
    showToast('Ponto atualizado com sucesso!');
  };

  const handleAddPointToDb = async (recordDate) => {
    if (!isManager || !selectedUser) return;
    const { error } = await supabase.from('time_records').insert([
      {
        employee_id: selectedUser.id,
        record_date: recordDate,
        entrada: '08:00',
        saida: '12:00',
        is_night: false,
        obs: ''
      }
    ]);

    if (error) {
      alert('Erro ao adicionar: ' + error.message);
    } else {
      fetchRecordsFromSupabase();
      showToast('Ponto adicionado com sucesso!');
    }
  };

  const totalGeralTrabalhadoMinutos = registros.reduce((acc, curr) => acc + (curr.totalDayMinutes || 0), 0);
  const totalGeralExtraMinutos = registros.reduce((acc, curr) => acc + (curr.extraMinutes || 0), 0);
  const totalGeralNoturnoMinutos = registros.reduce((acc, curr) => acc + (curr.nightMinutes || 0), 0);
  const totalGeralDiurnoMinutos = Math.max(0, totalGeralTrabalhadoMinutos - totalGeralNoturnoMinutos - totalGeralExtraMinutos);

  const handleDownloadPDF = () => {
    window.print();
  };

  const UserDropdownSelector = () => {
    const isColaboradorOnly = !isManager && employees.length <= 1;

    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs font-semibold text-slate-600">Usuário</span>
        {isColaboradorOnly ? (
          <div className="flex items-center justify-between border border-slate-300 rounded px-3 py-1 bg-slate-50 text-xs text-slate-500 min-w-[170px] cursor-not-allowed shadow-xs opacity-90">
            <span className="truncate pr-2">{selectedUser ? selectedUser.full_name : 'Carregando...'}</span>
          </div>
        ) : (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="flex items-center justify-between border border-slate-300 rounded px-3 py-1 bg-white text-xs text-slate-700 hover:border-[#2a3c7e] transition-colors min-w-[170px] focus:outline-none shadow-xs">
              <span className="truncate pr-2">{selectedUser ? selectedUser.full_name : 'Carregando...'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-1.5 bg-white rounded-md shadow-xl border border-slate-200 z-50">
              <div className="relative mb-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Buscar usuário..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 text-xs border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-[#2a3c7e]"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <DropdownMenuItem 
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setUserSearchTerm('');
                      }}
                      className="cursor-pointer text-xs px-2.5 py-2 rounded text-slate-700 transition-colors hover:bg-[#2a3c7e] hover:text-white focus:bg-[#2a3c7e] focus:text-white data-[highlighted]:bg-[#2a3c7e] data-[highlighted]:text-white focus:outline-none"
                    >
                      {user.full_name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-3 text-xs text-center text-slate-400">
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  const DepartmentDropdownSelector = () => {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs font-semibold text-slate-600">Departamento</span>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="flex items-center justify-between border border-slate-300 rounded px-3 py-1 bg-white text-xs text-slate-700 hover:border-[#2a3c7e] transition-colors focus:outline-none shadow-xs">
            <span>{selectedDepartment}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 p-1.5 bg-white rounded-md shadow-xl border border-slate-200 z-50">
            <DropdownMenuItem 
              onClick={() => setSelectedDepartment('Todos')}
              className="cursor-pointer text-xs px-2.5 py-2 rounded text-slate-700 transition-colors hover:bg-[#2a3c7e] hover:text-white focus:bg-[#2a3c7e] focus:text-white data-[highlighted]:bg-[#2a3c7e] data-[highlighted]:text-white focus:outline-none"
            >
              Todos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const MonthDropdownSelector = () => {
    const months = [
      'Agosto/2026',
      'Julho/2026',
      'Junho/2026',
      'Maio/2026',
      'Abril/2026',
      'Março/2026'
    ];

    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs font-semibold text-slate-600">Mês</span>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="flex items-center justify-between border border-slate-300 rounded px-3 py-1 bg-white text-xs text-slate-700 hover:border-[#2a3c7e] transition-colors focus:outline-none shadow-xs">
            <span>{selectedMonth}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 p-1.5 bg-white rounded-md shadow-xl border border-slate-200 z-50">
            {months.map((month) => (
              <DropdownMenuItem 
                key={month}
                onClick={() => setSelectedMonth(month)}
                className="cursor-pointer text-xs px-2.5 py-2 rounded text-slate-700 transition-colors hover:bg-[#2a3c7e] hover:text-white focus:bg-[#2a3c7e] focus:text-white data-[highlighted]:bg-[#2a3c7e] data-[highlighted]:text-white focus:outline-none"
              >
                {month}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] flex flex-col font-sans text-slate-700 relative">
      <Navbar selectedCompany="Sua Empresa" />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 min-w-[240px] max-w-[280px] p-5 flex flex-col space-y-6 bg-transparent shrink-0">
          <div>
            <h1 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              PONTO ELETRÔNICO
            </h1>
            
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-200/50 cursor-pointer text-slate-600 mb-4 transition-colors">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                  {selectedUser ? selectedUser.full_name.substring(0, 2).toUpperCase() : '--'}
                </div>
                <span className="text-sm font-medium max-md:truncate">
                  {selectedUser ? selectedUser.full_name.split(' ')[0] : 'Usuário'}
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </div>

            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('pontos')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'pontos'
                    ? 'bg-white text-slate-700 hover:bg-[#fc9314] hover:text-white border-l-4 border-[#ff8b00] shadow-sm font-semibold'
                    : 'bg-white text-slate-500 hover:bg-[#fc9314] hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap max-md:truncate">Pontos registrados</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('resumo')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'resumo'
                    ? 'bg-white text-slate-700 hover:bg-[#fc9314] hover:text-white border-l-4 border-[#ff8b00] shadow-sm font-semibold'
                    : 'bg-white text-slate-500 hover:bg-[#fc9314] hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap max-md:truncate">Resumo das horas</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Conteúdo Central */}
        <main className="flex-1 p-6 pl-0">
          <div className="flex justify-between items-center mb-3 text-xs text-slate-500">
            <div>
              <a 
                href="/admin" 
                className="hover:text-[#ff8b00] hover:underline transition-colors font-medium cursor-pointer"
              >
                Painel
              </a> 
              <ChevronRight className="w-3 h-3 inline mx-1" />{' '}
              <span className="text-[#ff8b00] font-medium">
                {activeTab === 'pontos' ? 'Pontos registrados' : 'Resumo das horas'}
              </span>
            </div>
            
            <DepartmentDropdownSelector />
          </div>

          {/* CONTEÚDO DA ABA: PONTOS REGISTRADOS */}
          {activeTab === 'pontos' && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200/80">
              <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600">
                  <MonthDropdownSelector />
                  <UserDropdownSelector />
                </div>

                <button 
                  onClick={() => setShowJornadaModal(true)}
                  className="flex items-center text-xs text-[#ff8b00] font-medium hover:underline cursor-pointer"
                >
                  Ver jornada atual <Calendar className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>

              <div className="grid grid-cols-12 px-6 py-2.5 bg-slate-50/50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <div className="col-span-8"></div>
                <div className="col-span-2 text-right">HORA EXTRA</div>
                <div className="col-span-2 text-right">TRABALHADO</div>
              </div>

              <div className="divide-y divide-slate-200">
                {registros.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Nenhum registro de ponto encontrado para este colaborador.
                  </div>
                ) : (
                  registros.map((item) => {
                    const isExpanded = expandedRow === item.id;
                    return (
                      <div key={item.id} className="transition-colors border-b border-slate-200">
                        <div 
                          onClick={() => toggleRow(item.id)}
                          className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="col-span-8 flex items-center space-x-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="font-semibold text-slate-700 text-xs">{item.data}</span>
                          </div>
                          <div className="col-span-2 text-right font-medium text-slate-600">{item.horaExtra}</div>
                          <div className="col-span-2 text-right font-semibold text-slate-800">{item.trabalhado}</div>
                        </div>

                        {isExpanded && (
                          <div className="px-8 py-4 bg-slate-50/40 border-t border-b border-slate-200 text-xs">
                            <div className="flex items-center justify-between mb-4">
                              
                              {/* EXIBE ADICIONAR APENAS PARA GESTOR */}
                              {isManager && (
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger className="flex items-center space-x-1 border border-slate-300 bg-white px-3 py-1 rounded font-medium text-slate-700 hover:bg-[#1a2c6a] hover:text-white transition-colors focus:outline-none">
                                    <span>Adicionar</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="bg-white">
                                    <DropdownMenuItem 
                                      onClick={() => handleAddPointToDb(item.id)}
                                      className="cursor-pointer"
                                    >
                                      Adicionar ponto
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">Falta justificada</DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">Trocar jornada</DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">Anotação</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}

                              <button 
                                onClick={() => setShowHistoryModal(true)}
                                className="flex items-center space-x-1 text-[#ff8b00] hover:underline font-medium cursor-pointer ml-auto"
                              >
                                <History className="w-3.5 h-3.5" />
                                <span>Ver histórico</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-12 text-slate-500 font-bold uppercase text-[10px] mb-2 px-2">
                              <div className="col-span-6">DETALHES / LOCALIZAÇÃO E SELFIE</div>
                              <div className="col-span-2 text-center">ENTRADA</div>
                              <div className="col-span-2 text-center">SAÍDA</div>
                              <div className="col-span-2 text-center">SALDO</div>
                            </div>

                            <div className="space-y-2">
                              {item.batidas.map((b, idx) => {
                                const isEditing = editingRowKey === `${item.id}-${idx}`;

                                if (isEditing && isManager) {
                                  return (
                                    <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-md p-2 shadow-sm gap-2">
                                      <button 
                                        onClick={() => setEditingRowKey(null)}
                                        className="text-red-500 font-semibold hover:underline text-xs px-2"
                                      >
                                        Desfazer
                                      </button>

                                      <div className="flex items-center space-x-2">
                                        <label className="flex items-center space-x-1 cursor-pointer bg-slate-50 p-1 rounded border border-slate-200">
                                          <input 
                                            type="checkbox"
                                            checked={editFormData.isNight}
                                            onChange={(e) => setEditFormData({ ...editFormData, isNight: e.target.checked })}
                                            className="rounded border-slate-300 text-[#ff8b00] focus:ring-0"
                                          />
                                          <Moon className="w-3.5 h-3.5 text-slate-600" />
                                        </label>

                                        <input 
                                          type="text"
                                          placeholder="Max 15 caractere"
                                          value={editFormData.obs}
                                          onChange={(e) => setEditFormData({ ...editFormData, obs: e.target.value })}
                                          className="border border-slate-300 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:border-[#2a3c7e]"
                                        />
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <div className="relative flex items-center">
                                          <input 
                                            type="text"
                                            value={editFormData.entrada}
                                            onChange={(e) => setEditFormData({ ...editFormData, entrada: e.target.value })}
                                            className="border border-slate-300 rounded px-2 py-1 text-xs w-16 text-center font-mono focus:outline-none"
                                          />
                                          {editFormData.entrada && (
                                            <X 
                                              onClick={() => setEditFormData({ ...editFormData, entrada: '' })}
                                              className="w-3 h-3 text-red-400 absolute right-1 cursor-pointer" 
                                            />
                                          )}
                                        </div>

                                        <div className="relative flex items-center">
                                          <input 
                                            type="text"
                                            value={editFormData.saida}
                                            onChange={(e) => setEditFormData({ ...editFormData, saida: e.target.value })}
                                            className="border border-slate-300 rounded px-2 py-1 text-xs w-16 text-center font-mono focus:outline-none"
                                          />
                                          {editFormData.saida && (
                                            <X 
                                              onClick={() => setEditFormData({ ...editFormData, saida: '' })}
                                              className="w-3 h-3 text-red-400 absolute right-1 cursor-pointer" 
                                            />
                                          )}
                                        </div>

                                        <span className="text-slate-400 text-xs px-2">-</span>

                                        <button 
                                          onClick={() => handleSaveEdit(item.id, idx, b.db_id)}
                                          className="bg-white border border-[#1a2c6a] text-[#1a2c6a] hover:bg-[#1a2c6a] hover:text-white font-medium px-4 py-1 rounded text-xs transition-colors"
                                        >
                                          Salvar
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={idx} className="group grid grid-cols-12 items-center bg-white border border-slate-200/80 rounded-md py-1.5 px-3 shadow-sm hover:border-slate-300 transition-all">
                                    {/* COLUNA ESQUERDA: BOTOES, LOCALIZAÇÃO E SELFIE */}
                                    <div className="col-span-6 flex items-center space-x-3 overflow-hidden">
                                      {/* EXIBE REMOVER APENAS PARA GESTOR */}
                                      {isManager && (
                                        <button 
                                          onClick={() => handleRemoveBatida(item.id, idx, b.db_id)}
                                          className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white font-semibold px-2 py-0.5 rounded text-[10px] transition-opacity shadow-sm shrink-0"
                                        >
                                          Remover
                                        </button>
                                      )}

                                      {/* Selfie Thumbnail */}
                                      {b.photo_url ? (
                                        <button 
                                          onClick={() => setSelectedPhotoModal(b.photo_url)}
                                          className="flex items-center space-x-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-orange-50 hover:text-[#ff8b00] border border-slate-200 rounded px-1.5 py-0.5 transition-colors cursor-pointer shrink-0"
                                          title="Clique para ver a selfie"
                                        >
                                          <img 
                                            src={b.photo_url} 
                                            alt="Selfie" 
                                            className="w-5 h-5 rounded object-cover border border-slate-300"
                                          />
                                          <span className="hidden sm:inline">Selfie</span>
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                                          <Camera className="w-3 h-3" /> S/ Selfie
                                        </span>
                                      )}

                                      {/* Localização GPS */}
                                      {b.latitude && b.longitude ? (
                                        <a 
                                          href={`https://maps.google.com/?q=${b.latitude},${b.longitude}`} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="flex items-center space-x-1 text-slate-600 hover:text-[#ff8b00] bg-slate-50 hover:bg-orange-50 px-2 py-0.5 rounded border border-slate-200/80 font-mono text-[10px] transition-colors truncate"
                                          title="Clique para abrir no Google Maps"
                                        >
                                          <MapPin className="w-3 h-3 text-[#ff8b00] shrink-0" />
                                          <span className="truncate">Lat: {Number(b.latitude).toFixed(4)}, Lng: {Number(b.longitude).toFixed(4)}</span>
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                                          <MapPin className="w-3 h-3" /> S/ GPS
                                        </span>
                                      )}
                                    </div>

                                    <div className="col-span-2 flex items-center justify-center space-x-1 text-slate-700 font-mono text-xs">
                                      <span>{b.entrada}</span>
                                      {b.entrada !== '-' && <Monitor className="w-3.5 h-3.5 text-slate-400" />}
                                    </div>

                                    <div className="col-span-2 flex items-center justify-center space-x-1 text-slate-700 font-mono text-xs">
                                      <span>{b.saida}</span>
                                      {b.saida !== '-' && <Monitor className="w-3.5 h-3.5 text-slate-400" />}
                                    </div>

                                    <div className="col-span-2 flex items-center justify-between pl-4">
                                      <span className="font-mono text-slate-600 text-xs">{b.saldo}</span>
                                      
                                      {/* EXIBE EDITAR APENAS PARA GESTOR */}
                                      {isManager && (
                                        <button 
                                          onClick={() => handleStartEdit(item.id, idx, b)}
                                          className="text-[#ff8b00] hover:underline text-xs font-medium"
                                        >
                                          Editar
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex justify-end space-x-6 items-center mt-3 pt-2 border-t border-slate-200 text-slate-600 font-medium text-xs">
                              <span>Horas extras: <strong>{item.horaExtra}</strong></span>
                              <span>Trabalhado: <strong>{item.trabalhado}</strong></span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                <div className="grid grid-cols-12 px-6 py-3 items-center text-xs font-bold bg-slate-50/30">
                  <div className="col-span-8"></div>
                  <div className="col-span-2 text-right text-slate-800">
                    {minutesToDisplayHours(totalGeralExtraMinutos)}
                  </div>
                  <div className="col-span-2 text-right text-slate-800">
                    {minutesToDisplayHours(totalGeralTrabalhadoMinutos)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RESUMO DAS HORAS */}
          {activeTab === 'resumo' && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600">
                  <MonthDropdownSelector />
                  <UserDropdownSelector />
                </div>

                <button 
                  onClick={handleDownloadPDF}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-[#1a2c6a] hover:text-white px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Baixar em PDF</span>
                </button>
              </div>

              {/* Tabela Clean Compacta */}
              <div className="text-[12px] divide-y divide-slate-100">
                <div className="py-2 space-y-1">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3 text-slate-800 font-bold uppercase text-[11px]">1. TRABALHADO</span>
                    <span className="col-span-5 text-slate-600">Horas diurnas</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">{minutesToFullDisplay(totalGeralDiurnoMinutos)}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3"></span>
                    <span className="col-span-5 text-slate-600">Adicional noturno</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">{minutesToFullDisplay(totalGeralNoturnoMinutos)}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3"></span>
                    <span className="col-span-5 text-slate-600">Hora extra</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">{minutesToFullDisplay(totalGeralExtraMinutos)}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center pt-1 font-bold text-slate-900">
                    <span className="col-span-3"></span>
                    <span className="col-span-5">Total Trabalhado</span>
                    <span className="col-span-4 text-right">{minutesToFullDisplay(totalGeralTrabalhadoMinutos)}</span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3 text-slate-800 font-bold uppercase text-[11px]">2. FALTAS</span>
                    <span className="col-span-5 text-slate-600">Dias de falta</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">0 dias</span>
                  </div>
                  <div className="grid grid-cols-12 items-center pt-1 font-bold text-slate-900">
                    <span className="col-span-3"></span>
                    <span className="col-span-5">Horas de atraso + falta s/ justificativa</span>
                    <span className="col-span-4 text-right">00h 00min</span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3 text-slate-800 font-bold uppercase text-[11px]">3. HORA EXTRA (GERAL)</span>
                    <span className="col-span-5 text-slate-600">Adicionada ao banco de horas</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">00h 00min</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3"></span>
                    <span className="col-span-5 text-slate-600">Hora extra a pagar</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">{minutesToFullDisplay(totalGeralExtraMinutos)}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center pt-1 font-bold text-slate-900">
                    <span className="col-span-3"></span>
                    <span className="col-span-5">Total Horas Extras</span>
                    <span className="col-span-4 text-right">{minutesToFullDisplay(totalGeralExtraMinutos)}</span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3 text-slate-800 font-bold uppercase text-[11px]">4. HORA EXTRA (A PAGAR)</span>
                    <span className="col-span-5 text-slate-600">Dia útil (diurno)</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">{minutesToFullDisplay(totalGeralExtraMinutos)}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3"></span>
                    <span className="col-span-5 text-slate-600">Dia útil (noturno)</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">00h 00min</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3"></span>
                    <span className="col-span-5 text-slate-600">DSR ou Folga (diurno)</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">00h 00min</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3"></span>
                    <span className="col-span-5 text-slate-600">DSR ou Folga (noturno)</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">00h 00min</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3"></span>
                    <span className="col-span-5 text-slate-600">Feriado (diurno)</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">00h 00min</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3"></span>
                    <span className="col-span-5 text-slate-600">Feriado (noturno)</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">00h 00min</span>
                  </div>
                  <div className="grid grid-cols-12 items-center pt-1 font-bold text-slate-900">
                    <span className="col-span-3"></span>
                    <span className="col-span-5">Total Horas Extras</span>
                    <span className="col-span-4 text-right">{minutesToFullDisplay(totalGeralExtraMinutos)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Ampliador de Foto da Selfie */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setSelectedPhotoModal(null)}>
          <div className="bg-white p-3 rounded-lg shadow-2xl max-w-sm w-full relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#ff8b00]" /> Selfie de Confirmação
              </span>
              <button onClick={() => setSelectedPhotoModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={selectedPhotoModal} alt="Selfie ampliada" className="w-full h-auto rounded-md border border-slate-200" />
          </div>
        </div>
      )}

      {/* Popup / Toast de feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white px-5 py-3 rounded-lg shadow-xl flex items-center space-x-3 z-50">
          <CheckCircle2 className="w-4 h-4 text-[#ff8b00]" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal Histórico de Alteração */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">Histórico de alteração</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[70vh] overflow-y-auto">
              <p className="text-slate-500 font-medium">Dia 06/08/2026</p>

              <div className="relative pl-6 space-y-6 border-l-2 border-slate-200 ml-2">
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full border-2 border-red-500 bg-white"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-[11px]">07/08/2026 20:33</p>
                      <p className="font-bold text-slate-700">WIA DIGITAL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-700">06/08 08:00 <span className="text-red-500 ml-1">→ Removido</span></p>
                      <p className="text-slate-400 flex items-center justify-end gap-1 mt-0.5"><Monitor className="w-3 h-3"/> Ponto manual</p>
                      <p className="italic text-slate-400 text-[11px] mt-1">"Ponto removido via interface web"</p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full border-2 border-[#ff8b00] bg-white"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-[11px]">06/08/2026 23:08</p>
                      <p className="font-bold text-slate-700">WIA DIGITAL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-700">06/08 14:00 → 06/08 21:00</p>
                      <p className="text-slate-400 flex items-center justify-end gap-1 mt-0.5"><Monitor className="w-3 h-3"/> Ponto manual</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="bg-white border border-[#1a2c6a] text-[#1a2c6a] hover:bg-[#1a2c6a] hover:text-white font-medium px-6 py-2 rounded text-xs transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Jornada Atual */}
      {showJornadaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">Jornada atual</h2>
              <button onClick={() => setShowJornadaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <p className="font-semibold text-slate-700">Nome: SEG A SEX 8H AS 12H DAS 14H AS 18H SAB 08H AS 12H</p>
                <p className="text-slate-600 mt-1">Tipo: Padrão</p>
                <p className="text-slate-600 mt-1">Usada desde: 06/08/2026</p>
              </div>

              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
                      <th className="p-2.5 font-bold uppercase">DIA DA SEMANA</th>
                      <th className="p-2.5 font-bold uppercase text-center">ENTRADA</th>
                      <th className="p-2.5 font-bold uppercase text-center">SAÍDA</th>
                      <th className="p-2.5 font-bold uppercase text-center">ENTRADA</th>
                      <th className="p-2.5 font-bold uppercase text-center">SAÍDA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="p-2.5 font-medium">Seg, Ter, Qua, Qui, Sex</td>
                      <td className="p-2.5 text-center">08:00</td>
                      <td className="p-2.5 text-center">12:00</td>
                      <td className="p-2.5 text-center">14:00</td>
                      <td className="p-2.5 text-center">18:00</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Sáb</td>
                      <td className="p-2.5 text-center">08:00</td>
                      <td className="p-2.5 text-center">12:00</td>
                      <td className="p-2.5 text-center">-</td>
                      <td className="p-2.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Dom</td>
                      <td className="p-2.5 text-center">-</td>
                      <td className="p-2.5 text-center">-</td>
                      <td className="p-2.5 text-center">-</td>
                      <td className="p-2.5 text-center">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-right text-slate-700 font-medium">
                Total de horas semanal: <strong>44h00min</strong>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <button className="text-[#ff8b00] font-semibold text-xs hover:underline">
                Configurar jornada
              </button>
              <button 
                onClick={() => setShowJornadaModal(false)}
                className="bg-white border border-[#1a2c6a] text-[#1a2c6a] hover:bg-[#1a2c6a] hover:text-white font-medium px-6 py-2 rounded text-xs transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Widget Flutuante de Suporte */}
      <div className="fixed bottom-6 right-6">
        <button className="w-10 h-10 bg-white border border-[#1a2c6a] text-[#1a2c6a] hover:bg-[#1a2c6a] hover:text-white rounded-md flex items-center justify-center shadow-lg transition-colors">
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Rodapé */}
      <footer className="text-center py-3 text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 PontoMax - Todos os direitos reservados.
      </footer>
    </div>
  );
}
