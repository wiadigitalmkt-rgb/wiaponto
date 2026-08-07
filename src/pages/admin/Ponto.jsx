import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { 
  Clock, 
  FileText, 
  ChevronRight, 
  Calendar,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function AdminPonto() {
  const [selectedMonth, setSelectedMonth] = useState('Agosto/2026');
  const [selectedUser, setSelectedUser] = useState('Joquebede de...');

  // Dados mockados
  const registros = [
    { id: 1, data: '06/08/2026 - Quinta-feira', horaExtra: '2h', trabalhado: '10h' },
    { id: 2, data: '07/08/2026 - Sexta-feira', horaExtra: '0h', trabalhado: '0h' },
  ];

  return (
    <div className="min-h-screen bg-[#edf2f7] flex flex-col font-sans text-slate-700">
      {/* Topo do PontoMax Padronizado (Importado do componente único) */}
      <Navbar selectedCompany="Sua Empresa" />

      <div className="flex flex-1">
        {/* Sidebar Esquerda */}
        <aside className="w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col space-y-6">
          <div>
            <h1 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              PONTO ELETRÔNICO
            </h1>
            
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-600 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                  JD
                </div>
                <span className="text-sm font-medium">Joqueb...</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <nav className="space-y-1">
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500">
                <Clock className="w-4 h-4" />
                <span>Pontos registrados</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-slate-500 hover:bg-slate-100">
                <FileText className="w-4 h-4" />
                <span>Resumo de...</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Conteúdo Central */}
        <main className="flex-1 p-8">
          {/* Breadcrumb e Filtro Topo */}
          <div className="flex justify-between items-center mb-4 text-xs text-slate-500">
            <div>
              <span>Painel</span> <ChevronRight className="w-3 h-3 inline mx-1" /> <span className="text-emerald-600 font-medium">Pontos registrados</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span>Departamento</span>
              <select className="border border-slate-300 rounded px-2 py-1 bg-white text-xs font-medium focus:outline-none">
                <option>Todos</option>
              </select>
            </div>
          </div>

          {/* Card Principal */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            {/* Header de Filtros Internos */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600">
                <div className="flex items-center space-x-2">
                  <span>Mês</span>
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-1.5 bg-white text-xs font-normal focus:outline-none"
                  >
                    <option>Agosto/2026</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span>Usuário</span>
                  <select 
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-1.5 bg-white text-xs font-normal focus:outline-none"
                  >
                    <option>Joquebede de...</option>
                  </select>
                </div>
              </div>

              <button className="flex items-center text-xs text-emerald-600 font-medium hover:underline">
                Ver jornada atual <Calendar className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            {/* Cabeçalho da Tabela */}
            <div className="grid grid-cols-12 px-6 py-3 bg-slate-50/50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-100">
              <div className="col-span-8"></div>
              <div className="col-span-2 text-right">HORA EXTRA</div>
              <div className="col-span-2 text-right">TRABALHADO</div>
            </div>

            {/* Linhas da Tabela */}
            <div className="divide-y divide-slate-100">
              {registros.map((item) => (
                <div key={item.id} className="grid grid-cols-12 px-6 py-4 items-center text-sm hover:bg-slate-50 transition-colors">
                  <div className="col-span-8 flex items-center space-x-3">
                    <ChevronRight className="w-4 h-4 text-slate-400 cursor-pointer" />
                    <span className="font-medium text-slate-700">{item.data}</span>
                  </div>
                  <div className="col-span-2 text-right font-medium text-slate-600">{item.horaExtra}</div>
                  <div className="col-span-2 text-right font-semibold text-slate-800">{item.trabalhado}</div>
                </div>
              ))}

              {/* Linha de Totais */}
              <div className="grid grid-cols-12 px-6 py-4 items-center text-sm font-bold bg-slate-50/30">
                <div className="col-span-8"></div>
                <div className="col-span-2 text-right text-slate-800">2h</div>
                <div className="col-span-2 text-right text-slate-800">10h</div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Widget Flutuante de Suporte */}
      <div className="fixed bottom-6 right-6">
        <button className="w-10 h-10 bg-[#00a884] text-white rounded-md flex items-center justify-center shadow-lg hover:bg-[#008f70] transition-colors">
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Rodapé */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 PontoMax - Todos os direitos reservados.
      </footer>
    </div>
  );
}
