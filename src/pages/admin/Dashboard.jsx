import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Clock, 
  FileText, 
  UserPlus, 
  HelpCircle, 
  MessageSquare, 
  Briefcase, 
  ShieldCheck, 
  Calendar, 
  X
} from 'lucide-react';

export default function Dashboard() {
  const [selectedCompany, setSelectedCompany] = useState('Sua Empresa');
  const [activeModal, setActiveModal] = useState(null);

  // Estados dinâmicos do Ponto Eletrônico Hoje
  const [pontoHoje, setPontoHoje] = useState({
    presentes: 0,
    totalColaboradores: 0,
    pendentesJustificativa: 0
  });

  useEffect(() => {
    async function loadTodayStats() {
      if (!supabase) return;

      const todayStr = new Date().toISOString().split('T')[0];

      // Busca total de funcionários
      const { count: totalEmp } = await supabase
        .from('Employees')
        .select('*', { count: 'exact', head: true });

      // Busca registros de ponto do dia
      const { data: todayRecords } = await supabase
        .from('time_records')
        .select('employee_id')
        .eq('record_date', todayStr);

      const uniqueEmployeesToday = new Set(todayRecords?.map(r => r.employee_id)).size;

      setPontoHoje({
        presentes: uniqueEmployeesToday,
        totalColaboradores: totalEmp || 0,
        pendentesJustificativa: 0
      });
    }

    loadTodayStats();
  }, []);

  const modules = [
    { title: 'Ponto eletrônico', icon: Clock, path: '/admin/ponto' },
    { title: 'Usuários', icon: Users, path: '/admin/colaboradores' },
    { title: 'Admissão', icon: UserPlus, path: '/admin/admissao' },
    { title: 'Contratos', icon: FileText, path: '/admin/contratos' },
    { title: 'Banco de horas', icon: Calendar, path: '/admin/banco-horas' },
    { title: 'Distribuição de Docs', icon: FileText, path: '/admin/documentos' },
    { title: 'Central de Ajuda', icon: HelpCircle, path: '/admin/ajuda' },
    { 
      title: 'Comunicação interna', 
      icon: MessageSquare, 
      isNew: true, 
      isPopup: true, 
      modalType: 'comunicacao' 
    },
    { 
      title: 'Assistente Trabalhista', 
      icon: Briefcase, 
      isNew: true, 
      isPopup: true, 
      modalType: 'assistente' 
    },
    { 
      title: 'Perfil Seguro', 
      icon: ShieldCheck, 
      isNew: true, 
      isPopup: true, 
      modalType: 'perfil-seguro' 
    },
  ];

  const modalImages = {
    comunicacao: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=1000&auto=format&fit=crop',
    assistente: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1000&auto=format&fit=crop',
    'perfil-seguro': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop'
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 pb-12 relative">
      <Navbar selectedCompany={selectedCompany} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Módulos de Gestão</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {modules.map((m, idx) => {
              const Icon = m.icon;
              
              if (m.isPopup) {
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveModal(m.modalType)}
                    className="relative group bg-white p-5 rounded-lg border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#ff8b00] transition cursor-pointer flex flex-col items-center text-center select-none"
                  >
                    {m.isNew && (
                      <span className="absolute top-2.5 right-2.5 text-[9px] font-extrabold bg-[#ff8b00] text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Novo
                      </span>
                    )}
                    <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-orange-50 text-[#1a2c6a] group-hover:text-[#ff8b00] flex items-center justify-center mb-3 transition">
                      <Icon size={22} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-[#1a2c6a] transition">{m.title}</span>
                  </div>
                );
              }

              return (
                <Link 
                  key={idx}
                  to={m.path}
                  className="relative group bg-white p-5 rounded-lg border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#ff8b00] transition cursor-pointer flex flex-col items-center text-center"
                >
                  {m.isNew && (
                    <span className="absolute top-2.5 right-2.5 text-[9px] font-extrabold bg-[#ff8b00] text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Novo
                    </span>
                  )}
                  <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-orange-50 text-[#1a2c6a] group-hover:text-[#ff8b00] flex items-center justify-center mb-3 transition">
                    <Icon size={22} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-[#1a2c6a] transition">{m.title}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* PAINEL GERAL (4 CARDS) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-[2px] bg-slate-400"></div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Painel</h3>
            <div className="flex-1 h-[1px] bg-slate-300/80"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD PONTO ELETRÔNICO HOJE */}
            <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-[#1a2c6a] text-base">Ponto Eletrônico Hoje</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 text-xs">
                    <span className="font-semibold text-slate-600">Presença Registrada</span>
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                      {pontoHoje.presentes} / {pontoHoje.totalColaboradores} Funcionários
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 text-xs">
                    <span className="font-semibold text-slate-600">Atrasos / Justificativas</span>
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                      {pontoHoje.pendentesJustificativa} Pendentes
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 mt-6 bg-slate-50/50">
                <Link to="/admin/ponto" className="text-xs font-bold text-[#ff8b00] hover:underline">
                  Ver todos os pontos
                </Link>
              </div>
            </div>

            {/* Card Hora Extra */}
            <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden">
              <div className="p-6 pb-0">
                <h4 className="font-bold text-[#1a2c6a] text-base mb-4">Hora Extra</h4>
                <p className="text-xs font-bold text-slate-600 mb-4">1 usuário com horas extras</p>
                
                <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      JO
                    </div>
                    <span className="font-bold text-slate-700">Joquebede de Oliveira</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">02h00min</span>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 mt-6 bg-slate-50/50">
                <button className="text-xs font-bold text-[#ff8b00] hover:underline">
                  Ver todos
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
