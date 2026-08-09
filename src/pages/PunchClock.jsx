import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  Scan, Calendar, Clock, ChevronDown, User, LogOut, 
  Eye, EyeOff, Upload, CheckCircle2, MapPin, Check
} from 'lucide-react';

export default function PunchClock() {
  const navigate = useNavigate();

  // Estados de navegação interna
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'profile' | 'map'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Estados gerais do Ponto
  const [loading, setLoading] = useState(false);
  const [lastPunch, setLastPunch] = useState('06/08/2026 às 23:12h');
  const [stats, setStats] = useState({
    diasTrabalhados: 2,
    horasNoMes: '16:00',
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

  // Confirma o Ponto na tela do Mapa
  const handleConfirmPunch = async () => {
    setLoading(true);
    try {
      if (supabase) {
        await supabase.from('time_entries').insert([
          { timestamp: new Date().toISOString(), type: 'entry_exit' },
        ]);
      }

      const now = new Date();
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

  // Logout
  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate('/login');
  };

  // Upload de foto do perfil
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileData({ ...profileData, avatarUrl: imageUrl });
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f5] flex flex-col font-sans text-slate-700">
      
      {/* INJEÇÃO DAS FONTES CURSIVAS PARA AS ASSINATURAS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Dancing+Script:wght@600&family=Great+Vibes&family=Pacifico&family=Sacramento&display=swap');
        .font-sig-1 { font-family: 'Dancing Script', cursive; }
        .font-sig-2 { font-family: 'Great Vibes', cursive; }
        .font-sig-3 { font-family: 'Caveat', cursive; }
        .font-sig-4 { font-family: 'Sacramento', cursive; }
        .font-sig-5 { font-family: 'Pacifico', cursive; }
      `}</style>

      {/* NAVBAR DO COLABORADOR */}
      <header className="bg-[#1e293b] text-white px-6 py-3 flex justify-between items-center shadow-md relative z-50">
        {/* LOGO */}
        <div 
          onClick={() => setCurrentView('home')} 
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full border-2 border-teal-400 flex items-center justify-center">
            <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
          </div>
          <span className="font-bold text-lg tracking-tight">Coalize</span>
        </div>

        {/* DIREITA: EMPRESA E BOTÃO USUÁRIO */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 border border-slate-600 rounded px-3 py-1.5 text-xs text-slate-200">
            <span>{profileData.empresa}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>

          {/* BOTÃO DO USUÁRIO / DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 hover:opacity-90 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-bold text-xs overflow-hidden border border-slate-400">
                {profileData.avatarUrl ? (
                  <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profileData.initials
                )}
              </div>
              <span className="text-xs font-semibold">{profileData.nome}</span>
              <ChevronDown size={14} className="text-slate-300" />
            </button>

            {/* DROPDOWN IGUAL AO PRINT */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl border border-slate-200 text-slate-800 py-3 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 pb-3 mb-2 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm overflow-hidden">
                    {profileData.avatarUrl ? (
                      <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profileData.initials
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">{profileData.nome}</p>
                    <p className="text-xs text-slate-400 font-medium">Colaborador</p>
                  </div>
                </div>

                <div className="px-3 mb-2">
                  <button
                    onClick={handleOpenMap}
                    className="w-full bg-[#11998e] hover:bg-[#0f8a80] text-white font-bold text-xs py-2.5 rounded transition uppercase tracking-wider"
                  >
                    BATER PONTO
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => { setCurrentView('profile'); setIsMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                  >
                    <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px]">C</div>
                    <span>Perfil</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                  >
                    <LogOut size={15} className="text-slate-500" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* VIEW 1: PAINEL PRINCIPAL (HOME) */}
      {currentView === 'home' && (
        <main className="flex-1 flex flex-col items-center justify-start pt-10 px-4 pb-12">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 flex items-center justify-center gap-2">
            <span>Coalize</span>
            <span className="text-red-500">♥</span>
            <span>{profileData.nome}</span>
          </h1>

          <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 text-emerald-600 rounded-md">
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
                className="w-full bg-[#11998e] hover:bg-[#0f8a80] text-white font-bold text-xs py-3.5 rounded-md transition duration-150 shadow-sm tracking-wide disabled:opacity-50"
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

            {pendingPunches.length > 0 && (
              <div className="p-6 border-b border-slate-100 bg-slate-50/20">
                <h3 className="text-xs font-bold text-slate-700 mb-3">
                  Pontos pendentes <span className="text-slate-400 font-normal">({pendingPunches.length})</span>
                </h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <span>DATA</span>
                    <span>REGISTRO</span>
                    <span>STATUS</span>
                  </div>
                  {pendingPunches.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-3 text-xs text-slate-700 py-1.5 border-t border-slate-100 items-center">
                      <span className="font-medium">{item.date}</span>
                      <span className="font-medium">{item.time}</span>
                      <span className="text-[11px] text-slate-500">
                        <strong className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded mr-1">Enviando:</strong> 
                        processo pode levar até 15 minutos para finalizar
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-6">
              <button
                onClick={() => navigate('/espelho')}
                className="w-full border border-[#11998e] text-[#11998e] hover:bg-teal-50/50 font-bold text-xs py-2.5 rounded-md transition duration-150 flex items-center justify-center gap-2"
              >
                <Calendar size={14} />
                <span>Ver histórico de pontos</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: SESSÃO PERFIL */}
      {currentView === 'profile' && (
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
          {/* CARD 1: DETALHES */}
          <div className="bg-white rounded-md border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Detalhes</h2>
              <p className="text-xs text-slate-400">Mantenha as suas informações pessoais atualizadas.</p>
            </div>

            <div className="p-6 space-y-6">
              {/* FOTO E EMPRESA */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xl overflow-hidden">
                    {profileData.avatarUrl ? (
                      <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profileData.initials
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-[#11998e] text-white rounded-full cursor-pointer hover:bg-[#0f8a80] transition shadow">
                    <Upload size={12} />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Empresa</span>
                  <p className="text-sm font-bold text-slate-800">{profileData.empresa}</p>
                </div>
              </div>

              {/* INPUTS NOME, SOBRENOME, EMAIL */}
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

              {/* VINCULAR GOOGLE */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Conta Google</h3>
                  <p className="text-xs text-slate-400">Vincule sua conta Google para entrar com 1 clique.</p>
                </div>
                <button 
                  onClick={() => alert('Vincular conta Google...')}
                  className="border border-slate-300 rounded px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span className="font-bold text-blue-500">G</span> Vincular conta Google
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2: ATUALIZAR SENHA */}
          <div className="bg-white rounded-md border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Atualizar senha</h2>
              <p className="text-xs text-slate-400">Tenha certeza de que a sua conta possui uma senha longa e complexa para se manter seguro.</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Senha atual*</label>
                <div className="relative max-w-sm">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={passwords.atual}
                    onChange={(e) => setPasswords({ ...passwords, atual: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 pr-9"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nova senha*</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={passwords.nova}
                      onChange={(e) => setPasswords({ ...passwords, nova: e.target.value })}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 pr-9"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Confirmação de senha*</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={passwords.confirmacao}
                      onChange={(e) => setPasswords({ ...passwords, confirmacao: e.target.value })}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 pr-9"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => alert('Senha atualizada com sucesso!')}
                  className="bg-[#11998e] hover:bg-[#0f8a80] text-white font-bold text-xs px-5 py-2.5 rounded transition"
                >
                  Atualizar senha
                </button>
              </div>
            </div>
          </div>

          {/* CARD 3: ASSINATURA DIGITAL (5 ESTILOS CURSIVOS) */}
          <div className="bg-white rounded-md border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Assinatura digital</h2>
              <p className="text-xs text-slate-400">Configure para assinar documentos digitalmente dentro da Coalize.</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome na assinatura*</label>
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Estilo</label>
                  <select
                    value={selectedSignatureStyle}
                    onChange={(e) => setSelectedSignatureStyle(e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 bg-white"
                  >
                    <option value="">Selecione um estilo</option>
                    <option value="font-sig-1">Estilo Cursivo 1 (Dancing Script)</option>
                    <option value="font-sig-2">Estilo Cursivo 2 (Great Vibes)</option>
                    <option value="font-sig-3">Estilo Cursivo 3 (Caveat)</option>
                    <option value="font-sig-4">Estilo Cursivo 4 (Sacramento)</option>
                    <option value="font-sig-5">Estilo Cursivo 5 (Pacifico)</option>
                  </select>
                </div>
              </div>

              {/* PREVISÃO DAS 5 ASSINATURAS CURSIVAS */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Opções de Assinatura Emendada:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div 
                    onClick={() => setSelectedSignatureStyle('font-sig-1')}
                    className={`p-3 bg-white border rounded cursor-pointer transition flex justify-between items-center ${selectedSignatureStyle === 'font-sig-1' ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="font-sig-1 text-lg text-slate-800">{signatureName || 'Sua assinatura'}</span>
                    {selectedSignatureStyle === 'font-sig-1' && <Check size={14} className="text-teal-600" />}
                  </div>

                  <div 
                    onClick={() => setSelectedSignatureStyle('font-sig-2')}
                    className={`p-3 bg-white border rounded cursor-pointer transition flex justify-between items-center ${selectedSignatureStyle === 'font-sig-2' ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="font-sig-2 text-xl text-slate-800">{signatureName || 'Sua assinatura'}</span>
                    {selectedSignatureStyle === 'font-sig-2' && <Check size={14} className="text-teal-600" />}
                  </div>

                  <div 
                    onClick={() => setSelectedSignatureStyle('font-sig-3')}
                    className={`p-3 bg-white border rounded cursor-pointer transition flex justify-between items-center ${selectedSignatureStyle === 'font-sig-3' ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="font-sig-3 text-2xl text-slate-800">{signatureName || 'Sua assinatura'}</span>
                    {selectedSignatureStyle === 'font-sig-3' && <Check size={14} className="text-teal-600" />}
                  </div>

                  <div 
                    onClick={() => setSelectedSignatureStyle('font-sig-4')}
                    className={`p-3 bg-white border rounded cursor-pointer transition flex justify-between items-center ${selectedSignatureStyle === 'font-sig-4' ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="font-sig-4 text-2xl text-slate-800">{signatureName || 'Sua assinatura'}</span>
                    {selectedSignatureStyle === 'font-sig-4' && <Check size={14} className="text-teal-600" />}
                  </div>

                  <div 
                    onClick={() => setSelectedSignatureStyle('font-sig-5')}
                    className={`p-3 bg-white border rounded cursor-pointer transition sm:col-span-2 flex justify-between items-center ${selectedSignatureStyle === 'font-sig-5' ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="font-sig-5 text-base text-slate-800">{signatureName || 'Sua assinatura'}</span>
                    {selectedSignatureStyle === 'font-sig-5' && <Check size={14} className="text-teal-600" />}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => alert('Assinatura salva com sucesso!')}
                  className="bg-[#11998e] hover:bg-[#0f8a80] text-white font-bold text-xs px-5 py-2.5 rounded transition"
                >
                  Salvar assinatura
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 3: TELA DO MAPA DE LOCALIZAÇÃO DO BATER PONTO */}
      {currentView === 'map' && (
        <div className="relative flex-1 w-full bg-slate-200 overflow-hidden min-h-[calc(100vh-60px)]">
          {/* SIMULAÇÃO DE MAPA EM BACKGROUND */}
          <div className="absolute inset-0 bg-[#d4dadc] opacity-80 bg-[radial-gradient(#a3b1b6_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="w-48 h-48 bg-teal-500/20 rounded-full animate-ping absolute"></div>
              <div className="w-32 h-32 bg-teal-500/30 rounded-full border border-teal-500/50 absolute"></div>
              <div className="p-3 bg-teal-600 text-white rounded-full shadow-2xl relative z-10 animate-bounce">
                <MapPin size={28} />
              </div>
            </div>
          </div>

          {/* MODAL SOBREPOSTO NO MAPA */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-20">
            {!mapSuccess ? (
              <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 text-center space-y-5 animate-in zoom-in-95">
                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 mx-auto flex items-center justify-center border border-teal-100">
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
                    className="w-full bg-[#11998e] hover:bg-[#0f8a80] text-white font-bold text-xs py-3 rounded uppercase tracking-wider transition shadow-sm"
                  >
                    {loading ? 'CONFIRMANDO...' : 'CONFIRMAR PONTO'}
                  </button>

                  <button
                    onClick={() => setCurrentView('home')}
                    className="w-full text-xs font-bold text-teal-600 hover:text-teal-700 py-1"
                  >
                    Cancelar Ponto
                  </button>
                </div>
              </div>
            ) : (
              /* MODAL DE SUCESSO APÓS CONFIRMAR */
              <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-8 text-center space-y-5 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-teal-500 text-white mx-auto flex items-center justify-center shadow-md">
                  <Check size={32} />
                </div>

                <h3 className="text-base font-bold text-slate-800">Ponto registrado com sucesso</h3>

                <button
                  onClick={() => setCurrentView('home')}
                  className="w-full border-2 border-teal-500 text-teal-600 hover:bg-teal-50 font-bold text-xs py-2.5 rounded transition uppercase tracking-wider"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER PADRÃO */}
      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-slate-200/60 bg-slate-50 mt-auto">
        © 2026 Coalize® - Todos os direitos reservados.
      </footer>
    </div>
  );
}
