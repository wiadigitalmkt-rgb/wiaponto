import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { 
  Scan, Calendar, Clock, ChevronDown, User, LogOut, 
  Eye, EyeOff, Upload, CheckCircle2, MapPin, Check, FileText
} from 'lucide-react';

export default function PunchClock() {
  const navigate = useNavigate();

  // Estados de navegação interna
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'profile' | 'map'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Estados gerais do Ponto
  const [loading, setLoading] = useState(false);
  const [lastPunch, setLastPunch] = useState('Nenhum registro hoje');
  const [stats, setStats] = useState({
    diasTrabalhados: 0,
    horasNoMes: '00:00',
    bancoDeHoras: '00:00',
  });
  const [pendingPunches, setPendingPunches] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Estados da Confirmação no Mapa
  const [mapSuccess, setMapSuccess] = useState(false);
  const [punchDateTimeModal, setPunchDateTimeModal] = useState({ date: '', time: '' });

  // Estados da Sessão Perfil
  const [profileData, setProfileData] = useState({
    nome: 'Joquebede',
    sobrenome: 'de Oliveira',
    email: 'elenuzaazp@gmail.com',
    empresa: 'Empresa Teste 11738',
    initials: 'JD',
    avatarUrl: null,
  });

  const [passwords, setPasswords] = useState({
    atual: '',
    nova: '',
    confirmacao: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [signatureName, setSignatureName] = useState('Joquebede de Oliveira');
  const [selectedSignatureStyle, setSelectedSignatureStyle] = useState('');

  // Função para pegar a data local (AAAA-MM-DD) sem problemas de fuso horário/UTC
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Carrega a última batida do Supabase ao iniciar
  const loadTodayPunch = async () => {
    if (!supabase) return;
    try {
      const todayStr = getLocalDateString();
      
      const { data: emp } = await supabase
        .from('Employees')
        .select('id')
        .eq('email', profileData.email)
        .maybeSingle();

      if (emp?.id) {
        const { data: record } = await supabase
          .from('time_records')
          .select('*')
          .eq('employee_id', emp.id)
          .eq('record_date', todayStr)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (record) {
          const lastTime = (record.saida && record.saida !== '-') ? record.saida : record.entrada;
          const [yr, mo, dy] = todayStr.split('-');
          setLastPunch(`${dy}/${mo}/${yr} às ${lastTime}h`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTodayPunch();
  }, [profileData.email]);

  // Atualização em tempo real do relógio
  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const updateDateTime = () => {
    const now = new Date();
    const optionsDate = { day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('pt-BR', optionsDate);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setCurrentDateTime(`${dateStr}, ${hours}:${minutes}h`);
  };

  // Redireciona para o Mapa de Ponto
  const handleOpenMap = () => {
    setIsMenuOpen(false);
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    setPunchDateTimeModal({
      date: `${day}/${month}/${year}`,
      time: `${hours}h${minutes}min`
    });
    setMapSuccess(false);
    setCurrentView('map');
  };

  // Confirma o Ponto na tela do Mapa e atualiza no Supabase para refletir no Admin e Dashboard
  const handleConfirmPunch = async () => {
    setLoading(true);
    try {
      const now = new Date();
      // Correção do fuso usando data local
      const recordDate = getLocalDateString(now);
      const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const fullName = `${profileData.nome} ${profileData.sobrenome}`.trim();

      if (supabase) {
        // Busca colaborador existente pelo e-mail ou cria
        let { data: emp } = await supabase
          .from('Employees')
          .select('id')
          .eq('email', profileData.email)
          .maybeSingle();

        if (!emp) {
          const { data: newEmp } = await supabase
            .from('Employees')
            .insert([{ full_name: fullName, email: profileData.email, role: 'colaborador' }])
            .select('id')
            .single();
          emp = newEmp;
        }

        if (emp?.id) {
          // Verifica se já existe batida sem saída hoje para fechar ou abrir novo intervalo
          const { data: openRecord } = await supabase
            .from('time_records')
            .select('*')
            .eq('employee_id', emp.id)
            .eq('record_date', recordDate)
            .or('saida.eq.-,saida.is.null')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (openRecord) {
            await supabase
              .from('time_records')
              .update({ saida: timeFormatted })
              .eq('id', openRecord.id);
          } else {
            await supabase.from('time_records').insert([
              {
                employee_id: emp.id,
                record_date: recordDate,
                entrada: timeFormatted,
                saida: '-',
                is_night: false,
                obs: 'Ponto Web'
              }
            ]);
          }
        }
      }

      const dateStr = now.toLocaleDateString('pt-BR');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const newPunchStr = `${dateStr} às ${hours}:${minutes}h`;

      setLastPunch(newPunchStr);
      setPendingPunches([
        { date: `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`, time: `${hours}:${minutes}` },
        ...pendingPunches
      ]);

      setMapSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate('/login');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileData({ ...profileData, avatarUrl: imageUrl });
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f5] flex flex-col font-sans text-slate-700">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Dancing+Script:wght@600&family=Great+Vibes&family=Pacifico&family=Sacramento&display=swap');
        .font-sig-1 { font-family: 'Dancing Script', cursive; }
        .font-sig-2 { font-family: 'Great Vibes', cursive; }
        .font-sig-3 { font-family: 'Caveat', cursive; }
        .font-sig-4 { font-family: 'Sacramento', cursive; }
        .font-sig-5 { font-family: 'Pacifico', cursive; }
      `}</style>

      {/* NAVBAR OFICIAL APLICADA */}
      <Navbar selectedCompany={profileData.empresa} />

      {/* VIEW 1: PAINEL PRINCIPAL (HOME) */}
      {currentView === 'home' && (
        <main className="flex-1 flex flex-col items-center justify-start pt-10 px-4 pb-12">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 flex items-center justify-center gap-2">
            <span>Boa noite,</span>
            <span>{profileData.nome}</span>
            <span>!  👋 </span>
          </h1>

          <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 text-[#ff8b00] rounded-md">
                  <Scan size={24} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Registre o seu ponto</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{currentDateTime || 'Carregando data...'}</p>
                </div>
              </div>

              <div className="bg-slate-100/80 px-5 py-3 rounded-md text-right w-full sm:w-auto">
                <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Última batida</span>
                <span className="text-xs font-bold text-slate-800">{lastPunch}</span>
              </div>
            </div>

            <div className="p-6 border-b border-slate-100">
              <button
                onClick={handleOpenMap}
                disabled={loading}
                className="w-full bg-[#fc9314] hover:bg-[#ff8b00] text-white font-bold text-xs py-3.5 rounded-md transition duration-150 shadow-sm tracking-wide disabled:opacity-50"
              >
                Bater ponto
              </button>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50/30 text-center py-6 border-b border-slate-100">
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-2">Dias trabalhados</span>
                <span className="text-xl font-bold text-slate-800">{stats.diasTrabalhados}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-2">Horas no mês</span>
                <span className="text-xl font-bold text-slate-800">{stats.horasNoMes}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-2">Banco de horas</span>
                <span className="text-xl font-bold text-slate-800">{stats.bancoDeHoras}</span>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <button
                onClick={() => navigate('/espelho')}
                className="w-full border border-[#fc9314] text-[#ff8b00] hover:bg-orange-50/50 font-bold text-xs py-2.5 rounded-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar size={14} />
                <span>Ver histórico de pontos</span>
              </button>

              <button
                onClick={() => navigate('/documentos')}
                className="w-full border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs py-2.5 rounded-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText size={14} className="text-slate-500" />
                <span>Ver documentos</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: SESSÃO PERFIL */}
      {currentView === 'profile' && (
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
          <div className="bg-white rounded-md border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Detalhes</h2>
              <p className="text-xs text-slate-400">Mantenha as suas informações pessoais atualizadas.</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xl overflow-hidden">
                    {profileData.avatarUrl ? (
                      <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profileData.initials
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-[#fc9314] text-white rounded-full cursor-pointer hover:bg-[#ff8b00] transition shadow">
                    <Upload size={12} />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Empresa</span>
                  <p className="text-sm font-bold text-slate-800">{profileData.empresa}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome*</label>
                  <input
                    type="text"
                    value={profileData.nome}
                    onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sobrenome*</label>
                  <input
                    type="text"
                    value={profileData.sobrenome}
                    onChange={(e) => setProfileData({ ...profileData, sobrenome: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 3: MAPA E CONFIRMAÇÃO DE PONTO */}
      {currentView === 'map' && (
        <div className="relative flex-1 w-full bg-slate-200 overflow-hidden min-h-[calc(100vh-60px)]">
          <div className="absolute inset-0 bg-[#d4dadc] opacity-80 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="p-3 bg-[#ff8b00] text-white rounded-full shadow-2xl relative z-10 animate-bounce">
                <MapPin size={28} />
              </div>
            </div>
          </div>

          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-20">
            {!mapSuccess ? (
              <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 text-center space-y-5 animate-in zoom-in-95">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-[#ff8b00] mx-auto flex items-center justify-center border border-orange-100">
                  <CheckCircle2 size={22} />
                </div>

                <h3 className="text-sm font-bold text-slate-800">Localização validada com sucesso!</h3>

                <div className="bg-slate-50/80 p-3 rounded-md flex justify-around items-center text-left text-xs border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <div>
                      <span className="block text-[10px] text-slate-400">Data do registro</span>
                      <strong className="text-slate-800">{punchDateTimeModal.date}</strong>
                    </div>
                  </div>

                  <div className="h-6 w-px bg-slate-200"></div>

                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    <div>
                      <span className="block text-[10px] text-slate-400">Horário do registro</span>
                      <strong className="text-slate-800">{punchDateTimeModal.time}</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleConfirmPunch}
                    disabled={loading}
                    className="w-full bg-[#ff8b00] hover:bg-[#e07a00] text-white font-bold text-xs py-3 rounded uppercase tracking-wider transition shadow-sm"
                  >
                    {loading ? 'CONFIRMANDO...' : 'CONFIRMAR PONTO'}
                  </button>

                  <button
                    onClick={() => setCurrentView('home')}
                    className="w-full text-xs font-bold text-[#ff8b00] hover:text-[#e07a00] py-1"
                  >
                    Cancelar Ponto
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-8 text-center space-y-5 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-[#ff8b00] text-white mx-auto flex items-center justify-center shadow-md">
                  <Check size={32} />
                </div>

                <h3 className="text-base font-bold text-slate-800">Ponto registrado com sucesso</h3>

                <button
                  onClick={() => setCurrentView('home')}
                  className="w-full border-2 border-[#ff8b00] text-[#ff8b00] hover:bg-orange-50 font-bold text-xs py-2.5 rounded transition uppercase tracking-wider"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-slate-200/60 bg-slate-50 mt-auto">
        © 2026 Coalize® - Todos os direitos reservados.
      </footer>
    </div>
  );
}
