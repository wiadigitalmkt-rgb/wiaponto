import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Scan, Calendar, Clock } from 'lucide-react';

export default function PunchClock() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lastPunch, setLastPunch] = useState('06/08/2026 às 23:12h');
  const [stats, setStats] = useState({
    diasTrabalhados: 2,
    horasNoMes: '16:00',
    bancoDeHoras: '00:00',
  });

  // Data atual formatada (Ex: 9 de agosto de 2026, 14:24h)
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateDateTime = () => {
    const now = new Date();
    const optionsDate = { day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('pt-BR', optionsDate);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setCurrentDateTime(`${dateStr}, ${hours}:${minutes}h`);
  };

  const handleBaterPonto = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { error } = await supabase.from('time_entries').insert([
          {
            timestamp: new Date().toISOString(),
            type: 'entry_exit',
          },
        ]);
        if (error) console.error('Erro ao gravar ponto no Supabase:', error);
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setLastPunch(`${dateStr} às ${hours}:${minutes}h`);
      alert('Ponto registrado com sucesso!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f5] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Wianet Telecom" userInitials="JD" userName="Joquebede" />

      <main className="flex-1 flex flex-col items-center justify-start pt-10 px-4 pb-12">
        {/* TÍTULO DE BOAS-VINDAS */}
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 flex items-center justify-center gap-2">
          <span>WiaPonto</span>
          <span className="text-red-500">♥</span>
          <span>Joquebede</span>
        </h1>

        {/* CARD PRINCIPAL */}
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm w-full max-w-2xl overflow-hidden">
          {/* TOPO DO CARD */}
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

          {/* BOTÃO BATER PONTO */}
          <div className="p-6 border-b border-slate-100">
            <button
              onClick={handleBaterPonto}
              disabled={loading}
              className="w-full bg-[#11998e] hover:bg-[#0f8a80] text-white font-bold text-xs py-3.5 rounded-md transition duration-150 shadow-sm tracking-wide disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Bater ponto'}
            </button>
          </div>

          {/* ESTATÍSTICAS / RESUMO */}
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

          {/* BOTÃO VER HISTÓRICO */}
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

      <footer className="py-6 text-center text-[11px] text-slate-400">
        © 2026 Coalize® - Todos os direitos reservados.
      </footer>
    </div>
  );
}
