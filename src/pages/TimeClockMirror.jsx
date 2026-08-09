import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { ChevronRight, Clock, FileText, Calendar } from 'lucide-react';

export default function TimeClockMirror() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState('Agosto/2026');
  const [loading, setLoading] = useState(false);

  // Lista mock de batidas sincronizadas com o print
  const [records, setRecords] = useState([
    { id: 1, date: '06/08/2026 - Quinta-feira', horaExtra: '0h', trabalhado: '7h' },
    { id: 2, date: '07/08/2026 - Sexta-feira', horaExtra: '1h', trabalhado: '9h' },
    { id: 3, date: '08/08/2026 - Sábado', horaExtra: '0h', trabalhado: '0h' },
    { id: 4, date: '09/08/2026 - Domingo', horaExtra: '0h', trabalhado: '0h' },
  ]);

  useEffect(() => {
    fetchRecords();
  }, [selectedMonth]);

  const fetchRecords = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!error && data && data.length > 0) {
        // Mapeamento caso existam registros no banco Supabase
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f5] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Teste 11738" userInitials="JD" userName="Joquebede" />

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex gap-8">
        {/* MENU LATERAL DO COLABORADOR */}
        <aside className="w-56 shrink-0 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              PONTO ELETRÔNICO
            </h2>

            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                JD
              </div>
              <span className="text-xs font-bold text-slate-800 truncate">
                Joquebede de Oliv...
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => navigate('/espelho')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold bg-white text-teal-600 shadow-sm border border-slate-200/60"
            >
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Pontos registrados</span>
            </button>

            <button
              onClick={() => navigate('/solicitacoes')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium text-slate-600 hover:bg-slate-200/50 transition"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Solicitações</span>
            </button>
          </nav>
        </aside>

        {/* ÁREA PRINCIPAL / TABELA DE PONTOS */}
        <main className="flex-1 space-y-3">
          {/* BREADCRUMB */}
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Link to="/ponto" className="hover:text-teal-600 transition">
              Painel
            </Link>
            <ChevronRight size={12} />
            <span className="text-teal-600 font-medium">Pontos registrados</span>
          </div>

          {/* CARD DO ESPELHO DE PONTO */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            {/* CABEÇALHO DO CARD */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Mês</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border border-slate-200 rounded px-3 py-1 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                >
                  <option value="Agosto/2026">Agosto/2026</option>
                  <option value="Julho/2026">Julho/2026</option>
                  <option value="Junho/2026">Junho/2026</option>
                </select>
              </div>

              <button
                onClick={() => alert('Jornada atual')}
                className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1.5"
              >
                <span>Ver jornada atual</span>
                <Calendar size={14} />
              </button>
            </div>

            {/* TABELA DE REGISTROS */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-3 px-6"></th>
                    <th className="py-3 px-6 text-right">HORA EXTRA</th>
                    <th className="py-3 px-6 text-right">TRABALHADO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {records.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-800 flex items-center gap-2">
                        <ChevronRight size={14} className="text-slate-400" />
                        <span>{item.date}</span>
                      </td>
                      <td className="py-3.5 px-6 text-right text-slate-600">{item.horaExtra}</td>
                      <td className="py-3.5 px-6 text-right text-slate-800 font-bold">{item.trabalhado}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50/30 font-bold text-slate-800">
                    <td className="py-3.5 px-6"></td>
                    <td className="py-3.5 px-6 text-right">1h</td>
                    <td className="py-3.5 px-6 text-right">16h</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </main>
      </div>

      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-slate-200/50 mt-auto">
        © 2026 Coalize® - Todos os direitos reservados.
      </footer>
    </div>
  );
}
