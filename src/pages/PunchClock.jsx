import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { 
  Scan, Calendar, Clock, ChevronDown, User, LogOut, 
  Eye, EyeOff, Upload, CheckCircle2, MapPin, Check, FileText,
  Camera, RefreshCw, AlertCircle
} from 'lucide-react';

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
  if (mins === null || isNaN(mins) || mins < 0) return '00:00';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export default function PunchClock() {
  const navigate = useNavigate();

  // Autenticação e dados do usuário atual (dinâmico)
  const authContext = useAuth() || {};
  const { user: contextUser } = authContext;

  const storedSession = JSON.parse(
    localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || '{}'
  );
  
  const currentUser = storedSession?.user || storedSession || contextUser || {};
  const userEmail = currentUser?.email || contextUser?.email || '';
  
  const fullName = 
    currentUser?.full_name || 
    contextUser?.full_name || 
    contextUser?.user_metadata?.full_name || 
    currentUser?.name || 
    'Usuário';

  const firstName = fullName !== 'Usuário' ? fullName.split(' ')[0] : 'Carregando...';
  const lastName = fullName !== 'Usuário' ? fullName.split(' ').slice(1).join(' ') : '';

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
  const [greeting, setGreeting] = useState('Olá');

  // Estados da Confirmação no Mapa / Localização / Selfie
  const [mapSuccess, setMapSuccess] = useState(false);
  const [punchDateTimeModal, setPunchDateTimeModal] = useState({ date: '', time: '' });

  // Novas validações obrigatórias
  const [location, setLocation] = useState({ lat: null, lng: null, loading: false, error: null });
  const [selfieImage, setSelfieImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Estados da Sessão Perfil
  const [profileData, setProfileData] = useState({
    nome: firstName,
    sobrenome: lastName,
    email: userEmail,
    empresa: currentUser?.companyName || 'Sua Empresa',
    initials: firstName !== 'Carregando...' ? firstName.substring(0, 2).toUpperCase() : 'WI',
    avatarUrl: null,
  });

  // Atualiza o perfil caso o usuário demore a ser carregado no contexto
  useEffect(() => {
    if (userEmail && userEmail !== profileData.email) {
      setProfileData(prev => ({
        ...prev,
        nome: firstName,
        sobrenome: lastName,
        email: userEmail,
        empresa: currentUser?.companyName || 'Sua Empresa',
        initials: firstName !== 'Carregando...' ? firstName.substring(0, 2).toUpperCase() : 'WI',
      }));
    }
  }, [userEmail, firstName, lastName]);

  // Função para pegar a data local (AAAA-MM-DD)
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Carrega a última batida e estatísticas mensais do Supabase ao iniciar
  const loadPunchData = async () => {
    if (!supabase || !profileData.email) return;
    try {
      const todayStr = getLocalDateString();
      
      const { data: emp } = await supabase
        .from('Employees')
        .select('id')
        .eq('email', profileData.email)
        .maybeSingle();

      if (emp?.id) {
        const { data: recordsToday } = await supabase
          .from('time_records')
          .select('*')
          .eq('employee_id', emp.id)
          .eq('record_date', todayStr);

        if (recordsToday && recordsToday.length > 0) {
          recordsToday.sort((a, b) => {
            const timeA = a.saida !== '-' && a.saida ? a.saida : a.entrada;
            const timeB = b.saida !== '-' && b.saida ? b.saida : b.entrada;
            return timeA.localeCompare(timeB);
          });
          
          const latestRecord = recordsToday[recordsToday.length - 1];
          const lastTime = (latestRecord.saida && latestRecord.saida !== '-') ? latestRecord.saida : latestRecord.entrada;
          
          const [yr, mo, dy] = todayStr.split('-');
          setLastPunch(`${dy}/${mo}/${yr} às ${lastTime}h`);
        } else {
          setLastPunch('Nenhum registro hoje');
        }

        const now = new Date();
        const yearNum = now.getFullYear();
        const monthNum = String(now.getMonth() + 1).padStart(2, '0');
        const startDate = `${yearNum}-${monthNum}-01`;
        const endDate = `${yearNum}-${monthNum}-31`;

        const { data: monthRecords } = await supabase
          .from('time_records')
          .select('*')
          .eq('employee_id', emp.id)
          .gte('record_date', startDate)
          .lte('record_date', endDate);

        if (monthRecords && monthRecords.length > 0) {
          const uniqueDates = new Set(monthRecords.map(r => r.record_date));
          const diasTrabalhadosCount = uniqueDates.size;

          let totalMonthMinutes = 0;
          monthRecords.forEach(curr => {
            const mEnt = timeToMinutes(curr.entrada);
            let mSai = timeToMinutes(curr.saida);
            if (mEnt !== null && mSai !== null) {
              if (mSai < mEnt || curr.is_night) {
                mSai += 1440;
              }
              const diff = Math.max(0, mSai - mEnt);
              totalMonthMinutes += diff;
            }
          });

          setStats({
            diasTrabalhados: diasTrabalhadosCount,
            horasNoMes: minutesToHHMM(totalMonthMinutes),
            bancoDeHoras: '00:00'
          });
        } else {
          setStats({
            diasTrabalhados: 0,
            horasNoMes: '00:00',
            bancoDeHoras: '00:00'
          });
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados de ponto:', err);
    }
  };

  useEffect(() => {
    loadPunchData();
  }, [profileData.email]);

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Desliga a câmera quando a view muda
  useEffect(() => {
    if (currentView !== 'map') {
      stopCamera();
    }
  }, [currentView]);

  const updateDateTime = () => {
    const now = new Date();
    const optionsDate = { day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('pt-BR', optionsDate);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setCurrentDateTime(`${dateStr}, ${hours}:${minutes}h`);
    
    const currentHour = now.getHours();
    if (currentHour >= 5 && currentHour < 13) {
      setGreeting('Bom dia');
    } else if (currentHour >= 13 && currentHour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }
  };

  // --- LÓGICA DE LOCALIZAÇÃO EM TEMPO REAL ---
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocation({ lat: null, lng: null, loading: false, error: 'Navegador não suporta geolocalização.' });
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loading: false,
          error: null
        });
      },
      (err) => {
        let msg = 'Erro ao obter localização. Permita o acesso ao GPS.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Acesso à localização negado. Você precisa permitir o GPS no navegador.';
        }
        setLocation({ lat: null, lng: null, loading: false, error: msg });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // --- LÓGICA DA CÂMERA E SELFIE ---
  const startCamera = async () => {
    setCameraError(null);
    setCameraLoading(true);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Erro ao acessar a câmera:', err);
      setCameraError('Permissão para acessar a câmera negada ou câmera não disponível.');
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setSelfieImage(dataUrl);
    stopCamera();
  };

  const retakeSelfie = () => {
    setSelfieImage(null);
    startCamera();
  };

  // Redireciona para o Mapa de Ponto e inicia a validação dos requisitos
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
    setSelfieImage(null);
    
    setCurrentView('map');

    // Inicia a captura imediata da localização e da câmera
    requestLocation();
    setTimeout(() => startCamera(), 300);
  };

  // Confirms Punch in Map view
  const handleConfirmPunch = async () => {
    if (!location.lat || !location.lng || !selfieImage) return;

    setLoading(true);
    try {
      const now = new Date();
      const recordDate = getLocalDateString(now);
      const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const fullNameFormat = `${profileData.nome} ${profileData.sobrenome}`.trim();

      if (supabase) {
        let { data: emp } = await supabase
          .from('Employees')
          .select('id')
          .eq('email', profileData.email)
          .maybeSingle();

        if (!emp) {
          const { data: newEmp } = await supabase
            .from('Employees')
            .insert([{ full_name: fullNameFormat, email: profileData.email, role: 'colaborador' }])
            .select('id')
            .single();
          emp = newEmp;
        }

        if (emp?.id) {
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
              .update({ 
                saida: timeFormatted,
                latitude: location.lat,
                longitude: location.lng,
                photo_url: selfieImage
              })
              .eq('id', openRecord.id);
          } else {
            await supabase.from('time_records').insert([
              {
                employee_id: emp.id,
                record_date: recordDate,
                entrada: timeFormatted,
                saida: '-',
                is_night: false,
                obs: 'Ponto Web (GPS + Selfie)',
                latitude: location.lat,
                longitude: location.lng,
                photo_url: selfieImage
              }
            ]);
          }
        }
      }

      await loadPunchData();

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
      stopCamera();
    } catch (err) {
      console.error('Erro ao bater ponto:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    stopCamera();
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

  // O botão de confirmar só é habilitado se tiver Localização E Selfie válidas
  const isFormValid = location.lat && location.lng && selfieImage && !loading;

  return (
    <div className="min-h-screen bg-[#eef2f5] flex flex-col font-sans text-slate-700">
      {/* NAVBAR OFICIAL APLICADA */}
      <Navbar selectedCompany={profileData.empresa} />

      {/* VIEW 1: PAINEL PRINCIPAL (HOME) */}
      {currentView === 'home' && (
        <main className="flex-1 flex flex-col items-center justify-start pt-10 px-4 pb-12">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 flex items-center justify-center gap-2">
            <span>{greeting},</span>
            <span>{profileData.nome}</span>
            <span>! 👋</span>
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
                className="w-full bg-[#fc9314] hover:bg-[#ff8b00] text-white font-bold text-xs py-3.5 rounded-md transition duration-150 shadow-sm tracking-wide disabled:opacity-50 cursor-pointer"
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

              <a
                href="https://wiaponto.vercel.app/solicitacoes"
                className="w-full border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs py-2.5 rounded-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer block text-center"
              >
                Solicitar ajuste
              </a>
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

      {/* VIEW 3: MAPA E CONFIRMAÇÃO DE PONTO COM LOCALIZAÇÃO + SELFIE */}
      {currentView === 'map' && (
        <div className="relative flex-1 w-full bg-slate-200 overflow-y-auto py-8 min-h-[calc(100vh-60px)] flex items-center justify-center">
          <div className="absolute inset-0 bg-[#d4dadc] opacity-60 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="p-3 bg-[#ff8b00] text-white rounded-full shadow-2xl relative z-10 animate-bounce">
                <MapPin size={28} />
              </div>
            </div>
          </div>

          <div className="relative z-20 w-full max-w-md px-4">
            {!mapSuccess ? (
              <div className="bg-white rounded-xl shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95">
                
                {/* CABEÇALHO COM DATA E HORA */}
                <div>
                  <h3 className="text-base font-bold text-slate-800">Validação de Ponto</h3>
                  <p className="text-xs text-slate-500">Localização e Selfie são obrigatórias</p>
                </div>

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

                {/* PAINEL 1: GEOLOCALIZAÇÃO OBRIGATÓRIA */}
                <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#ff8b00]" />
                      Localização (GPS)
                    </span>
                    {location.lat && location.lng ? (
                      <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={12} /> Validada
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                        Obrigatória
                      </span>
                    )}
                  </div>

                  {location.loading && (
                    <p className="text-xs text-slate-500 animate-pulse flex items-center gap-1.5">
                      <RefreshCw size={12} className="animate-spin" /> Obtendo coordenadas de GPS...
                    </p>
                  )}

                  {location.error && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {location.error}
                      </p>
                      <button
                        onClick={requestLocation}
                        className="text-xs font-bold text-[#ff8b00] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={11} /> Tentar obter localização novamente
                      </button>
                    </div>
                  )}

                  {location.lat && location.lng && (
                    <p className="text-[11px] font-mono text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                      Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                    </p>
                  )}
                </div>

                {/* PAINEL 2: CÂMERA / SELFIE OBRIGATÓRIA */}
                <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Camera size={14} className="text-[#ff8b00]" />
                      Selfie de Confirmação
                    </span>
                    {selfieImage ? (
                      <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={12} /> Foto Tirada
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                        Obrigatória
                      </span>
                    )}
                  </div>

                  <canvas ref={canvasRef} className="hidden" />

                  {cameraError && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {cameraError}
                      </p>
                      <button
                        onClick={startCamera}
                        className="text-xs font-bold text-[#ff8b00] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={11} /> Tentar abrir câmera novamente
                      </button>
                    </div>
                  )}

                  {!selfieImage ? (
                    <div className="space-y-2">
                      <div className="relative w-full h-44 bg-slate-900 rounded-md overflow-hidden flex items-center justify-center border border-slate-300">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transform -scale-x-100"
                        />
                        {cameraLoading && (
                          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-white text-xs">
                            Iniciando câmera...
                          </div>
                        )}
                      </div>

                      <button
                        onClick={captureSelfie}
                        disabled={cameraLoading || !!cameraError}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 rounded flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                      >
                        <Camera size={14} /> Tirar Foto
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-full h-44 rounded-md overflow-hidden border border-slate-300 bg-black">
                        <img src={selfieImage} alt="Selfie do colaborador" className="w-full h-full object-cover" />
                      </div>

                      <button
                        onClick={retakeSelfie}
                        className="w-full text-xs font-bold text-slate-600 hover:text-slate-800 py-1 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={12} /> Tirar Foto Novamente
                      </button>
                    </div>
                  )}
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleConfirmPunch}
                    disabled={!isFormValid}
                    className="w-full bg-[#ff8b00] hover:bg-[#e07a00] text-white font-bold text-xs py-3.5 rounded uppercase tracking-wider transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? 'CONFIRMANDO...' : 'CONFIRMAR PONTO'}
                  </button>

                  {!isFormValid && (
                    <p className="text-[10px] text-slate-400">
                      * O botão será liberado assim que a localização for obtida e a selfie for tirada.
                    </p>
                  )}

                  <button
                    onClick={() => {
                      stopCamera();
                      setCurrentView('home');
                    }}
                    className="w-full text-xs font-bold text-[#ff8b00] hover:text-[#e07a00] py-1 cursor-pointer"
                  >
                    Cancelar Ponto
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-2xl p-8 text-center space-y-5 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-[#ff8b00] text-white mx-auto flex items-center justify-center shadow-md">
                  <Check size={32} />
                </div>

                <h3 className="text-base font-bold text-slate-800">Ponto registrado com sucesso!</h3>

                <button
                  onClick={() => {
                    stopCamera();
                    setCurrentView('home');
                  }}
                  className="w-full border-2 border-[#ff8b00] text-[#ff8b00] hover:bg-orange-50 font-bold text-xs py-2.5 rounded transition uppercase tracking-wider cursor-pointer"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-slate-200/60 bg-slate-50 mt-auto">
        © 2026 WiaPonto® - Todos os direitos reservados.
      </footer>
    </div>
  );
}
