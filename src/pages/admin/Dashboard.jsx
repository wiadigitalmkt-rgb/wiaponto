import React, { useState } from 'react';
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
  ChevronDown,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const [selectedCompany, setSelectedCompany] = useState('Sua Empresa');

  // Módulos principais (Cards de topo)
  const modules = [
    { title: 'Ponto eletrônico', icon: Clock, path: '/admin/ponto' },
    { title: 'Usuários', icon: Users, path: '/admin/colaboradores' },
    { title: 'Admissão', icon: UserPlus, path: '/admin/admissao' },
    { title: 'Contratos', icon: FileText, path: '/admin/contratos' },
    { title: 'Banco de horas', icon: Calendar, path: '/admin/banco-horas' },
    { title: 'Distribuição de Docs', icon: FileText, path: '/admin/documentos' },
    { title: 'Central de Ajuda', icon: HelpCircle, path: '/admin/ajuda' },
    { title: 'Comunicação interna', icon: MessageSquare, isNew: true, path: '/admin/comunicacao' },
    { title: 'Assistente Trabalhista', icon: Briefcase, isNew: true, path: '/admin/assistente' },
    { title: 'Perfil Seguro', icon: ShieldCheck, isNew: true, path: '/admin/perfil-seguro' },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800">
      {/* Topbar Superior Estilo Coalize */}
      <header className="bg-[#1a2c6a] text-white px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-none bg-[#ff8b00] flex items-center justify-center text-white">
              <Clock size={20} />
            </div>
            <span>PontoMax</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-200">
            <button className="hover:text-white flex items-center gap-1 transition">Atalhos <ChevronDown size={14} /></button>
            <button className="hover:text-white flex items-center gap-1 transition">Relatórios <ChevronDown size={14} /></button>
            <button className="hover:text-white flex items-center gap-1 transition">Configurações <ChevronDown size={14} /></button>
            <button className="hover:text-white transition">Solicitações</button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#121f4c] px-3 py-1.5 rounded-none text-xs font-semibold flex items-center gap-2 border border-slate-700">
            <span>Empresa:</span>
            <span className="text-[#ff8b00] font-bold">{selectedCompany}</span>
          </div>
          <div className="w-9 h-9 bg-[#ff8b00] flex items-center justify-center font-bold text-sm text-white border-2 border-white/20">
            AD
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Banner de Setup / Progresso */}
        <div className="bg-white rounded-none p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#1a2c6a]">Setup Inicial da Empresa</h2>
            <span className="text-xs font-bold text-[#ff8b00] bg-orange-50 px-2.5 py-1 rounded-none border border-orange-200">
              86% Concluído
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-none h-2.5 mb-5 overflow-hidden">
            <div className="bg-[#ff8b00] h-2.5 rounded-none transition-all duration-500" style={{ width: '86%' }}></div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-none bg-slate-50 border border-slate-200/60">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-[#1a2c6a]" size={22} />
              <p className="text-sm text-slate-700 font-medium">
                Próxima etapa: <strong className="text-slate-900">Cadastrar colaboradores e definir horários de trabalho</strong>
              </p>
            </div>
            <button className="bg-[#1a2c6a] hover:bg-[#121f4c] text-white px-5 py-2 rounded-none text-sm font-semibold transition flex items-center gap-2 shadow-sm">
              Continuar <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Grid de Cards de Módulos (Quadrados) */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Módulos de Gestão</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {modules.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div 
                  key={idx} 
                  className="relative group bg-white p-5 rounded-none border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#ff8b00] transition cursor-pointer flex flex-col items-center text-center"
                >
                  {m.isNew && (
                    <span className="absolute top-3 right-3 text-[10px] font-extrabold bg-[#ff8b00] text-white px-2 py-0.5 rounded-none uppercase tracking-wider">
                      Novo
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-none bg-slate-50 group-hover:bg-orange-50 text-[#1a2c6a] group-hover:text-[#ff8b00] flex items-center justify-center mb-3 transition">
                    <Icon size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-[#1a2c6a] transition">{m.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumo do Painel Inferior (Quadrados) */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-none bg-[#ff8b00]"></div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Painel Geral</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card Ponto Eletrônico */}
            <div className="bg-white rounded-none p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-[#1a2c6a] text-base">Ponto Eletrônico Hoje</h4>
                  <button className="text-xs font-bold text-[#ff8b00] hover:underline">
                    Ver todos os pontos
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-none bg-slate-50 text-xs">
                    <span className="font-semibold text-slate-600">Presença Registrada</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-none">1 / 2 Funcionários</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-none bg-slate-50 text-xs">
                    <span className="font-semibold text-slate-600">Atrasos / Justificativas</span>
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-none">1 Pendente</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Horas Extras */}
            <div className="bg-white rounded-none p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-[#1a2c6a] text-base">Banco de Horas & Extras</h4>
                  <button className="text-xs font-bold text-[#ff8b00] hover:underline">
                    Ver relatórios
                  </button>
                </div>
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Clock size={32} className="mx-auto mb-2 text-slate-300" />
                  Nenhum colaborador acumulando hora extra hoje.
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
