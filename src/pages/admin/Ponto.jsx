import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  Download, 
  PlusCircle, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileText,
  MoreVertical,
  UserCheck,
  UserX,
  Clock3
} from 'lucide-react';

export default function PontoEletronico() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [currentDate, setCurrentDate] = useState('07 de Agosto de 2026');

  // Dados mockados para simular a lista de colaboradores hoje
  const registros = [
    {
      id: 1,
      nome: 'Joquebede de Oliveira',
      cargo: 'Analista de RH',
      avatar: 'JO',
      e1: '08:00',
      s1: '12:00',
      e2: '13:00',
      s2: '18:00',
      totalHoras: '09h00min',
      status: 'Hora Extra',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
      localizacao: true
    },
    {
      id: 2,
      nome: 'WIA DIGITAL',
      cargo: 'Desenvolvedor Senior',
      avatar: 'WD',
      e1: '08:15',
      s1: '12:00',
      e2: '13:00',
      s2: '--:--',
      totalHoras: '03h45min',
      status: 'Em Andamento (Atraso)',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
      localizacao: true
    },
    {
      id: 3,
      nome: 'Carlos Eduardo',
      cargo: 'Designer UI/UX',
      avatar: 'CE',
      e1: '--:--',
      s1: '--:--',
      e2: '--:--',
      s2: '--:--',
      totalHoras: '00h00min',
      status: 'Falta Justificada',
      statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
      localizacao: false
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Topbar / Cabeçalho do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-[#1a2c6a] flex items-center gap-2">
            <Clock className="text-[#ff8b00]" size={24} />
            Ponto Eletrônico
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gestão diária de marcações, presenças e solicitações dos colaboradores
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-xs font-bold transition flex items-center gap-2">
            <Download size={15} /> Exportar
          </button>
          <button className="bg-[#1a2c6a] hover:bg-[#121f4c] text-white px-4 py-2 rounded-md text-xs font-bold transition flex items-center gap-2 shadow-sm">
            <PlusCircle size={15} /> Ajuste Manual
          </button>
        </div>
      </div>

      {/* Navegação de Data + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Controle de Data */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-sm flex items-center justify-between">
          <button className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-600">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Data Selecionada</span>
            <span className="text-xs font-bold text-[#1a2c6a] flex items-center gap-1.5 justify-center mt-0.5">
              <CalendarIcon size={14} className="text-[#ff8b00]" />
              {currentDate}
            </span>
          </div>
          <button className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-600">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* KPI: Presentes */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Presentes Hoje</span>
            <span className="text-lg font-extrabold text-slate-800">2 / 3 <span className="text-xs font-medium text-slate-500">(66%)</span></span>
          </div>
        </div>

        {/* KPI: Ausentes / Atrasos */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock3 size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Atrasos / Ausências</span>
            <span className="text-lg font-extrabold text-slate-800">1 Atraso | 1 Falta</span>
          </div>
        </div>

        {/* KPI: Ajustes Pendentes */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-50 text-[#ff8b00] flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Ajustes Pendentes</span>
            <span className="text-lg font-extrabold text-[#ff8b00]">1 Solicitação</span>
          </div>
        </div>

      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Campo de Busca */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Buscar colaborador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:border-[#ff8b00] transition"
          />
        </div>

        {/* Botões de Filtro */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['todos', 'presentes', 'atrasados', 'ausentes', 'pendentes'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition shrink-0 ${
                selectedFilter === filter 
                  ? 'bg-[#1a2c6a] text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

      </div>

      {/* Tabela Principal de Registros de Ponto */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-4 text-center">Entrada 1</th>
                <th className="py-3 px-4 text-center">Saída 1</th>
                <th className="py-3 px-4 text-center">Entrada 2</th>
                <th className="py-3 px-4 text-center">Saída 2</th>
                <th className="py-3 px-4 text-center">Total Horas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {registros.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50/80 transition">
                  
                  {/* Colaborador */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a2c6a] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {reg.avatar}
                      </div>
                      <div>
                        <span className="font-bold text-[#1a2c6a] block">{reg.nome}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{reg.cargo}</span>
                      </div>
                    </div>
                  </td>

                  {/* Horários */}
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800">{reg.e1}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800">{reg.s1}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800">{reg.e2}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800">{reg.s2}</td>

                  {/* Total de Horas */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-[#1a2c6a]">
                    {reg.totalHoras}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border ${reg.statusColor}`}>
                      {reg.status}
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {reg.localizacao && (
                        <button title="Ver geolocalização do ponto" className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#ff8b00] rounded transition">
                          <MapPin size={15} />
                        </button>
                      )}
                      <button title="Ver espelho de ponto" className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#1a2c6a] rounded transition">
                        <FileText size={15} />
                      </button>
                      <button title="Opções" className="p-1.5 hover:bg-slate-100 text-slate-500 rounded transition">
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Exibindo 3 colaboradores</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 font-bold text-[11px] disabled:opacity-50" disabled>
              Anterior
            </button>
            <button className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 font-bold text-[11px] disabled:opacity-50" disabled>
              Próximo
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
