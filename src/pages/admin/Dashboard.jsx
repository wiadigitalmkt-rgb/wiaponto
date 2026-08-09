import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
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
  Award,
  X
} from 'lucide-react';

export default function Dashboard() {
  const [selectedCompany, setSelectedCompany] = useState('Sua Empresa');
  const [activeModal, setActiveModal] = useState(null); // 'comunicacao' | 'assistente' | 'perfil-seguro' | null

  // Módulos principais com rotas ou disparo de popups
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

  // Imagens dos banners correspondentes a cada modal
  const modalImages = {
    comunicacao: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=1000&auto=format&fit=crop',
    assistente: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1000&auto=format&fit=crop',
    'perfil-seguro': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop'
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 pb-12 relative">
      {/* Navbar Padronizada */}
      <Navbar selectedCompany={selectedCompany} />

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Banner de Setup / Progresso */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700">Setup Inicial</h2>
            <span className="text-xs font-semibold text-[#ff8b00]">
              Seu teste acaba em 14 dias
            </span>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-[#ff8b00] h-2 rounded-full transition-all duration-500" style={{ width: '86%' }}></div>
            </div>
            <span className="text-xs font-bold text-slate-600">86%</span>
          </div>

          <div className="border border-slate-200 rounded-md flex flex-col sm:flex-row items-stretch overflow-hidden bg-white">
            <div className="flex-1 p-3.5 flex items-center gap-3 text-xs text-slate-600">
              <Award className="text-[#ff8b00] shrink-0" size={18} />
              <span>
                <strong className="text-slate-800 font-bold">Próxima etapa:</strong> Cadastrar colaboradores e definir horários de trabalho
              </span>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 p-2 flex items-center justify-center bg-white">
              <button className="bg-[#ff8b00] hover:bg-[#e67a00] text-white px-6 py-2 rounded-md text-xs font-bold transition w-full sm:w-auto">
                Continuar
              </button>
            </div>
          </div>
        </div>

        {/* Grid de Cards de Módulos */}
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
            <div className="w-2 h-2 rounded-full bg-[#ff8b00]"></div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Painel Geral</h3>
          </div>

          {/* Linha 1: Ponto Eletrônico + Hora Extra */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card Ponto Eletrônico */}
            <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-[#1a2c6a] text-base">Ponto Eletrônico Hoje</h4>
                  <button className="bg-[#1a2c6a] hover:bg-[#121f4c] text-white text-xs font-bold px-3 py-1.5 rounded-md transition">
                    Bater Ponto
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 text-xs">
                    <span className="font-semibold text-slate-600">Presença Registrada</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">1 / 2 Funcionários</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 text-xs">
                    <span className="font-semibold text-slate-600">Atrasos / Justificativas</span>
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">1 Pendente</span>
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

          {/* Linha 2: Admissão + Saldo de Férias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card Admissão */}
            <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden">
              <div className="p-6">
                <h4 className="font-bold text-[#1a2c6a] text-base mb-6">Admissão</h4>
                
                <div className="flex flex-col items-center justify-center text-center py-4">
                  <div className="w-20 h-28 bg-[#1a2c6a] rounded-md shadow-md border-2 border-slate-300 flex flex-col items-center justify-between p-2 mb-4 text-white">
                    <div className="w-6 h-6 rounded-full border border-amber-300 flex items-center justify-center text-[8px] font-bold text-amber-300">
                      ★
                    </div>
                    <div className="text-[7px] tracking-wider uppercase text-center font-bold">
                      Carteira de<br/>Trabalho
                    </div>
                    <div className="w-full h-1 bg-amber-300/40 rounded"></div>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">Nenhuma admissão em andamento.</p>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <button className="text-xs font-bold text-[#ff8b00] hover:underline">
                  Ver admissões
                </button>
              </div>
            </div>

            {/* Card Saldo de Férias */}
            <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden">
              <div className="p-6 pb-0">
                <h4 className="font-bold text-[#1a2c6a] text-base mb-4">Saldo de Férias</h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2 px-1">Usuário</th>
                        <th className="py-2 px-1">Vencimento</th>
                        <th className="py-2 px-1 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      <tr>
                        <td className="py-3 px-1 font-bold text-[#1a2c6a]">WIA DIGITAL</td>
                        <td className="py-3 px-1">31/07/2027</td>
                        <td className="py-3 px-1 text-right font-bold">0</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-1 font-bold text-[#1a2c6a]">Joquebede de Oliveira</td>
                        <td className="py-3 px-1">05/08/2027</td>
                        <td className="py-3 px-1 text-right font-bold">0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 mt-6 bg-slate-50/50">
                <button className="text-xs font-bold text-[#ff8b00] hover:underline">
                  Ver todos os saldos
                </button>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* POPUP / MODAL: PERÍODO DE TESTE ENCERRADO */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in duration-200">
            {/* Botão Fechar */}
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 bg-white/80 hover:bg-white rounded-full p-1.5 transition z-10 shadow-sm"
            >
              <X size={18} />
            </button>

            {/* Imagem do Modal */}
            <div className="md:w-1/2 h-56 md:h-auto relative bg-slate-100">
              <img
                src={modalImages[activeModal]}
                alt="Banner do recurso"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Conteúdo do Modal */}
            <div className="md:w-1/2 p-8 flex flex-col justify-center text-left space-y-4">
              <h3 className="text-lg font-bold text-slate-800 leading-snug">
                Período de teste encerrado
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                O período de teste deste recurso já terminou. Para ativar na sua empresa, entre em contato com o suporte comercial.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => window.open('https://wa.me/5500000000000', '_blank')}
                  className="w-full bg-[#009688] hover:bg-[#00897b] text-white text-xs font-bold py-3 px-4 rounded-md transition shadow-md hover:shadow-lg text-center"
                >
                  Falar com o comercial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
