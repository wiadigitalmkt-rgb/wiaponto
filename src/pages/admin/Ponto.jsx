import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { 
  Clock, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Calendar,
  ExternalLink,
  MessageSquare,
  Moon,
  Monitor,
  CheckCircle2,
  X,
  History,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================================
// FUNÇÕES UTILITÁRIAS DE CÁLCULO DE HORAS (EXATIDÃO MATEMÁTICA)
// ============================================================================

// Converte texto "HH:MM" para minutos totais
const timeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === '-' || timeStr.trim() === '') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

// Converte minutos totais para formato "HH:MM"
const minutesToHHMM = (mins) => {
  if (mins === null || isNaN(mins) || mins < 0) return '-';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Converte minutos para formato legível ex: "7h", "7h 30min" ou "0h"
const minutesToDisplayHours = (mins) => {
  if (!mins || mins <= 0) return '0h';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

// Converte minutos para formato detalhado "XXh YYmin" (usado no resumo)
const minutesToFullDisplay = (mins) => {
  if (mins === null || isNaN(mins) || mins < 0) return '00h 00min';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}min`;
};

// Recalcula dinamicamente os saldos, horas trabalhadas e horas extras de um dia
const processDayRecord = (record, targetDailyMinutes = 480) => { // 8h = 480 minutos
  let totalDayMinutes = 0;
  let nightMinutes = 0;

  const newBatidas = record.batidas.map((b) => {
    const mEnt = timeToMinutes(b.entrada);
    let mSai = timeToMinutes(b.saida);

    if (mEnt !== null && mSai !== null) {
      if (mSai < mEnt || b.isNight) {
        mSai += 1440;
      }
      const diff = Math.max(0, mSai - mEnt);
      totalDayMinutes += diff;

      if (b.isNight) {
        nightMinutes += diff;
      }

      return { ...b, saldo: minutesToHHMM(diff) };
    }
    return { ...b, saldo: '-' };
  });

  const trabalhadoStr = minutesToDisplayHours(totalDayMinutes);
  const extraMinutes = Math.max(0, totalDayMinutes - targetDailyMinutes);
  const horaExtraStr = minutesToDisplayHours(extraMinutes);

  return {
    ...record,
    batidas: newBatidas,
    trabalhado: trabalhadoStr,
    horaExtra: horaExtraStr,
    totalDayMinutes,
    extraMinutes,
    nightMinutes
  };
};

export default function AdminPonto() {
  const [activeTab, setActiveTab] = useState('pontos'); // 'pontos' | 'resumo'
  const [selectedMonth, setSelectedMonth] = useState('Agosto/2026');
  const [selectedUser, setSelectedUser] = useState('Joquebede de...');
  const [expandedRow, setExpandedRow] = useState(1);

  // Modais e Popups
  const [toastMessage, setToastMessage] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showJornadaModal, setShowJornadaModal] = useState(false);

  // Estado de Edição de Batida
  const [editingRowKey, setEditingRowKey] = useState(null); // 'itemId-idx'
  const [editFormData, setEditFormData] = useState({
    isNight: false,
    obs: '',
    entrada: '',
    saida: ''
  });

  // Dados iniciais processados com cálculos exatos
  const initialRegistros = [
    { 
      id: 1, 
      data: '06/08/2026 - Quinta-feira', 
      batidas: [
        { entrada: '14:00', saida: '21:00', isNight: false, obs: '' },
        { entrada: '23:12', saida: '-', isNight: false, obs: '' }
      ]
    },
    { 
      id: 2, 
      data: '07/08/2026 - Sexta-feira', 
      batidas: [
        { entrada: '08:00', saida: '12:00', isNight: false, obs: '' },
        { entrada: '14:00', saida: '22:00', isNight: false, obs: '' }
      ]
    },
  ].map((rec) => processDayRecord(rec));

  // Inicializa o estado buscando primeiramente no localStorage
  const [registros, setRegistros] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('@ponto_registros');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((rec) => processDayRecord(rec));
        } catch (e) {
          console.error("Erro ao carregar dados salvos:", e);
        }
      }
    }
    return initialRegistros;
  });

  // Salva no localStorage toda vez que 'registros' for alterado
  useEffect(() => {
    localStorage.setItem('@ponto_registros', JSON.stringify(registros));
  }, [registros]);

  // Exibe notificação temporária
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // 1. Ação de Excluir / Remover ponto com recálculo automático
  const handleRemoveBatida = (itemId, batidaIdx) => {
    const updated = registros.map((item) => {
      if (item.id === itemId) {
        const newBatidas = item.batidas.filter((_, idx) => idx !== batidaIdx);
        return processDayRecord({ ...item, batidas: newBatidas });
      }
      return item;
    });
    setRegistros(updated);
    showToast('Ponto removido com sucesso!');
  };

  // 2. Iniciar modo de edição
  const handleStartEdit = (itemId, idx, batida) => {
    setEditingRowKey(`${itemId}-${idx}`);
    setEditFormData({
      isNight: batida.isNight || false,
      obs: batida.obs || '',
      entrada: batida.entrada === '-' ? '' : batida.entrada,
      saida: batida.saida === '-' ? '' : batida.saida
    });
  };

  // 3. Salvar Edição com Recálculo Dinâmico
  const handleSaveEdit = (itemId, batidaIdx) => {
    const updated = registros.map((item) => {
      if (item.id === itemId) {
        const newBatidas = [...item.batidas];
        newBatidas[batidaIdx] = {
          ...newBatidas[batidaIdx],
          entrada: editFormData.entrada.trim() || '-',
          saida: editFormData.saida.trim() || '-',
          isNight: editFormData.isNight,
          obs: editFormData.obs
        };
        return processDayRecord({ ...item, batidas: newBatidas });
      }
      return item;
    });
    setRegistros(updated);
    setEditingRowKey(null);
    showToast('Ponto atualizado com sucesso!');
  };

  // Soma dos totais gerais do mês (Para Rodapé e para Tela de Resumo)
  const totalGeralTrabalhadoMinutos = registros.reduce((acc, curr) => acc + (curr.totalDayMinutes || 0), 0);
  const totalGeralExtraMinutos = registros.reduce((acc, curr) => acc + (curr.extraMinutes || 0), 0);
  const totalGeralNoturnoMinutos = registros.reduce((acc, curr) => acc + (curr.nightMinutes || 0), 0);
  const totalGeralDiurnoMinutos = Math.max(0, totalGeralTrabalhadoMinutos - totalGeralNoturnoMinutos - totalGeralExtraMinutos);

  // Ação de download PDF
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] flex flex-col font-sans text-slate-700 relative">
      <Navbar selectedCompany="Sua Empresa" />

      <div className="flex flex-1">
        {/* Sidebar Esquerda */}
        <aside className="w-64 p-6 flex flex-col space-y-6 bg-transparent">
          <div>
            <h1 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              PONTO ELETRÔNICO
            </h1>
            
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-200/50 cursor-pointer text-slate-600 mb-4 transition-colors">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-700">
                  JD
                </div>
                <span className="text-sm font-medium">Joqu...</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('pontos')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'pontos'
                    ? 'bg-[#ff8b00]/10 text-[#ff8b00] border-l-4 border-[#ff8b00] shadow-sm font-semibold'
                    : 'text-slate-500 hover:bg-slate-200/50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Pontos registrados</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('resumo')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'resumo'
                    ? 'bg-[#ff8b00]/10 text-[#ff8b00] border-l-4 border-[#ff8b00] shadow-sm font-semibold'
                    : 'text-slate-500 hover:bg-slate-200/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Resumo das...</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Conteúdo Central */}
        <main className="flex-1 p-8 pl-2">
          {/* Breadcrumb e Filtro Topo */}
          <div className="flex justify-between items-center mb-4 text-xs text-slate-500">
            <div>
              {/* Botão Painel redirecionando para a página /admin */}
              <a 
                href="https://wiaponto.vercel.app/admin" 
                className="hover:text-[#ff8b00] hover:underline transition-colors font-medium cursor-pointer"
              >
                Painel
              </a> 
              <ChevronRight className="w-3 h-3 inline mx-1" />{' '}
              <span className="text-[#ff8b00] font-medium">
                {activeTab === 'pontos' ? 'Pontos registrados' : 'Resumo das horas'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span>Departamento</span>
              <select className="border border-slate-300 rounded px-2 py-1 bg-white text-xs font-medium focus:outline-none shadow-sm">
                <option>Todos</option>
              </select>
            </div>
          </div>

          {/* CONTEÚDO DA ABA: PONTOS REGISTRADOS */}
          {activeTab === 'pontos' && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200/80">
              {/* Header de Filtros Internos */}
              <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
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

                {/* Botão de Ver jornada atual */}
                <button 
                  onClick={() => setShowJornadaModal(true)}
                  className="flex items-center text-xs text-[#ff8b00] font-medium hover:underline cursor-pointer"
                >
                  Ver jornada atual <Calendar className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>

              {/* Cabeçalho da Tabela */}
              <div className="grid grid-cols-12 px-6 py-3 bg-slate-50/50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <div className="col-span-8"></div>
                <div className="col-span-2 text-right">HORA EXTRA</div>
                <div className="col-span-2 text-right">TRABALHADO</div>
              </div>

              {/* Linhas da Tabela com Bordas Mais Aparentes */}
              <div className="divide-y divide-slate-200">
                {registros.map((item) => {
                  const isExpanded = expandedRow === item.id;
                  return (
                    <div key={item.id} className="transition-colors border-b border-slate-200">
                      {/* Linha Resumida */}
                      <div 
                        onClick={() => toggleRow(item.id)}
                        className="grid grid-cols-12 px-6 py-4 items-center text-sm hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="col-span-8 flex items-center space-x-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-medium text-slate-700">{item.data}</span>
                        </div>
                        <div className="col-span-2 text-right font-medium text-slate-600">{item.horaExtra}</div>
                        <div className="col-span-2 text-right font-semibold text-slate-800">{item.trabalhado}</div>
                      </div>

                      {/* Conteúdo Expandido */}
                      {isExpanded && (
                        <div className="px-8 py-4 bg-slate-50/40 border-t border-b border-slate-200 text-xs">
                          {/* Ações superiores */}
                          <div className="flex items-center justify-between mb-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="flex items-center space-x-1 border border-slate-300 bg-white px-3 py-1.5 rounded-md font-medium text-slate-700 hover:bg-slate-50 focus:outline-none">
                                <span>Adicionar</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="bg-white">
                                <DropdownMenuItem className="cursor-pointer">Adicionar ponto</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">Falta justificada</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">Trocar jornada</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">Anotação</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Botão Ver histórico */}
                            <button 
                              onClick={() => setShowHistoryModal(true)}
                              className="flex items-center space-x-1 text-[#ff8b00] hover:underline font-medium cursor-pointer"
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>Ver histórico</span>
                            </button>
                          </div>

                          {/* Cabeçalho da sub-tabela */}
                          <div className="grid grid-cols-12 text-slate-500 font-bold uppercase text-[10px] mb-2 px-2">
                            <div className="col-span-6"></div>
                            <div className="col-span-2 text-center">ENTRADA</div>
                            <div className="col-span-2 text-center">SAÍDA</div>
                            <div className="col-span-2 text-center">SALDO</div>
                          </div>

                          {/* Lista de Batimentos */}
                          <div className="space-y-2">
                            {item.batidas.map((b, idx) => {
                              const isEditing = editingRowKey === `${item.id}-${idx}`;

                              if (isEditing) {
                                return (
                                  <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-md p-2 shadow-sm gap-2">
                                    <button 
                                      onClick={() => setEditingRowKey(null)}
                                      className="text-red-500 font-semibold hover:underline text-xs px-2"
                                    >
                                      Desfazer
                                    </button>

                                    <div className="flex items-center space-x-2">
                                      <label className="flex items-center space-x-1 cursor-pointer bg-slate-50 p-1.5 rounded border border-slate-200" title="Ponto da madrugada do dia seguinte">
                                        <input 
                                          type="checkbox"
                                          checked={editFormData.isNight}
                                          onChange={(e) => setEditFormData({ ...editFormData, isNight: e.target.checked })}
                                          className="rounded border-slate-300 text-[#ff8b00] focus:ring-0"
                                        />
                                        <Moon className="w-3.5 h-3.5 text-slate-600" />
                                      </label>

                                      <input 
                                        type="text"
                                        placeholder="Max 15 caractere"
                                        value={editFormData.obs}
                                        onChange={(e) => setEditFormData({ ...editFormData, obs: e.target.value })}
                                        className="border border-slate-300 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:border-[#ff8b00]"
                                      />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <div className="relative flex items-center">
                                        <input 
                                          type="text"
                                          value={editFormData.entrada}
                                          onChange={(e) => setEditFormData({ ...editFormData, entrada: e.target.value })}
                                          className="border border-slate-300 rounded px-2 py-1 text-xs w-16 text-center font-mono focus:outline-none"
                                        />
                                        {editFormData.entrada && (
                                          <X 
                                            onClick={() => setEditFormData({ ...editFormData, entrada: '' })}
                                            className="w-3 h-3 text-red-400 absolute right-1 cursor-pointer" 
                                          />
                                        )}
                                      </div>

                                      <div className="relative flex items-center">
                                        <input 
                                          type="text"
                                          value={editFormData.saida}
                                          onChange={(e) => setEditFormData({ ...editFormData, saida: e.target.value })}
                                          className="border border-slate-300 rounded px-2 py-1 text-xs w-16 text-center font-mono focus:outline-none"
                                        />
                                        {editFormData.saida && (
                                          <X 
                                            onClick={() => setEditFormData({ ...editFormData, saida: '' })}
                                            className="w-3 h-3 text-red-400 absolute right-1 cursor-pointer" 
                                          />
                                        )}
                                      </div>

                                      <span className="text-slate-400 text-xs px-2">-</span>

                                      <button 
                                        onClick={() => handleSaveEdit(item.id, idx)}
                                        className="bg-[#ff8b00] text-white font-medium px-4 py-1 rounded text-xs hover:bg-[#e07a00] transition-colors"
                                      >
                                        Salvar
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div key={idx} className="group grid grid-cols-12 items-center bg-white border border-slate-200/80 rounded-md py-2 px-3 shadow-sm hover:border-slate-300 transition-all">
                                  <div className="col-span-6 flex items-center">
                                    <button 
                                      onClick={() => handleRemoveBatida(item.id, idx)}
                                      className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1 rounded text-xs transition-opacity shadow-sm"
                                    >
                                      Remover
                                    </button>
                                  </div>

                                  <div className="col-span-2 flex items-center justify-center space-x-1 text-slate-700 font-mono">
                                    <span>{b.entrada}</span>
                                    {b.entrada !== '-' && <Monitor className="w-3.5 h-3.5 text-slate-400" />}
                                  </div>

                                  <div className="col-span-2 flex items-center justify-center space-x-1 text-slate-700 font-mono">
                                    <span>{b.saida}</span>
                                    {b.saida !== '-' && <Monitor className="w-3.5 h-3.5 text-slate-400" />}
                                  </div>

                                  <div className="col-span-2 flex items-center justify-between pl-4">
                                    <span className="font-mono text-slate-600">{b.saldo}</span>
                                    <button 
                                      onClick={() => handleStartEdit(item.id, idx, b)}
                                      className="text-[#ff8b00] hover:underline text-xs font-medium"
                                    >
                                      Editar
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Rodapé do dia */}
                          <div className="flex justify-end space-x-6 items-center mt-4 pt-3 border-t border-slate-200 text-slate-600 font-medium text-xs">
                            <span>Horas extras: <strong>{item.horaExtra}</strong></span>
                            <span>Trabalhado: <strong>{item.trabalhado}</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Linha de Totais Gerais */}
                <div className="grid grid-cols-12 px-6 py-4 items-center text-sm font-bold bg-slate-50/30">
                  <div className="col-span-8"></div>
                  <div className="col-span-2 text-right text-slate-800">
                    {minutesToDisplayHours(totalGeralExtraMinutos)}
                  </div>
                  <div className="col-span-2 text-right text-slate-800">
                    {minutesToDisplayHours(totalGeralTrabalhadoMinutos)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO DA ABA: RESUMO DAS HORAS */}
          {activeTab === 'resumo' && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-6 space-y-6">
              {/* Header de Filtros Internos + Botão Baixar PDF */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
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

                <button 
                  onClick={handleDownloadPDF}
                  className="border border-[#ff8b00] text-[#ff8b00] hover:bg-[#ff8b00]/10 px-4 py-2 rounded-md font-semibold text-xs transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar em PDF</span>
                </button>
              </div>

              {/* Bloco 1: TRABALHADO */}
              <div className="border-b border-slate-200 pb-6 text-xs space-y-2">
                <div className="grid grid-cols-12 font-semibold py-1">
                  <span className="col-span-4 text-slate-800 font-bold">1. TRABALHADO</span>
                  <span className="col-span-5 text-slate-600">Horas diurnas</span>
                  <span className="col-span-3 text-right text-slate-700">{minutesToFullDisplay(totalGeralDiurnoMinutos)}</span>
                </div>
                <div className="grid grid-cols-12 font-semibold py-1">
                  <span className="col-span-4"></span>
                  <span className="col-span-5 text-slate-600">Adicional noturno</span>
                  <span className="col-span-3 text-right text-slate-700">{minutesToFullDisplay(totalGeralNoturnoMinutos)}</span>
                </div>
                <div className="grid grid-cols-12 font-semibold py-1">
                  <span className="col-span-4"></span>
                  <span className="col-span-5 text-slate-600">Hora extra</span>
                  <span className="col-span-3 text-right text-slate-700">{minutesToFullDisplay(totalGeralExtraMinutos)}</span>
                </div>
                <div className="grid grid-cols-12 font-bold py-2 border-t border-slate-100 text-slate-800">
                  <span className="col-span-4"></span>
                  <span className="col-span-5">Total Trabalhado</span>
                  <span className="col-span-3 text-right">{minutesToFullDisplay(totalGeralTrabalhadoMinutos)}</span>
                </div>
              </div>

              {/* Bloco 2: FALTAS */}
              <div className="border-b border-slate-200 pb-6 text-xs space-y-2">
                <div className="grid grid-cols-12 font-semibold py-1">
                  <span className="col-span-4 text-slate-800 font-bold">2. FALTAS</span>
                  <span className="col-span-5 text-slate-600">Dias de falta</span>
                  <span className="col-span-3 text-right text-slate-700">0 dias</span>
                </div>
                <div className="grid grid-cols-12 font-bold py-2 border-t border-slate-100 text-slate-800">
                  <span className="col-span-4"></span>
                  <span className="col-span-5">Horas de atraso + falta s/ justificativa</span>
                  <span className="col-span-3 text-right">00h 00min</span>
                </div>
              </div>

              {/* Bloco 3: HORA EXTRA (geral) */}
              <div className="border-b border-slate-200 pb-6 text-xs space-y-2">
                <div className="grid grid-cols-12 font-semibold py-1">
                  <span className="col-span-4 text-slate-800 font-bold">3. HORA EXTRA (geral)</span>
                  <span className="col-span-5 text-slate-600">Adicionada ao banco de horas</span>
                  <span className="col-span-3 text-right text-slate-700">00h 00min</span>
                </div>
                <div className="grid grid-cols-12 font-semibold py-1">
                  <span className="col-span-4"></span>
                  <span className="col-span-5 text-slate-600">Hora extra a pagar</span>
                  <span className="col-span-3 text-right text-slate-700">{minutesToFullDisplay(totalGeralExtraMinutos)}</span>
                </div>
                <div className="grid grid-cols-12 font-bold py-2 border-t border-slate-100 text-slate-800">
                  <span className="col-span-4"></span>
                  <span className="col-span-5">Total Horas Extras</span>
                  <span className="col-span-3 text-right">{minutesToFullDisplay(totalGeralExtraMinutos)}</span>
                </div>
              </div>

              {/* Bloco 4: HORA EXTRA (a pagar) */}
              <div className="text-xs space-y-2">
                <div className="grid grid-cols-12 font-semibold py-1">
                  <span className="col-span-4 text-slate-800 font-bold">4. HORA EXTRA (a pagar)</span>
                  <span className="col-span-5 text-slate-600">Dia útil (diurno)</span>
                  <span className="col-span-3 text-right text-slate-700">{minutesToFullDisplay(totalGeralExtraMinutos)}</span>
                </div>
                <div className="grid grid-cols-12 font-semibold py-1">
                  <span className="col-span-4"></span>
                  <span className="col-span-5 text-slate-600">Dia útil (noturno)</span>
                  <span className="col-span-3 text-right text-slate-700">00h 00min</span>
                </div>
                <div className="grid grid-cols-12 font-semibold py-1">
                  <span className="col-span-4"></span>
                  <span className="col-span-5 text-slate-600">DSR ou Folga (diurno)</span>
                  <span className="col-span-3 text-right text-slate-700">00h 00min</span>
                </div>
                <div className="grid grid-cols-12 font-semibold py-1">
                  <span className="col-span-4"></span>
                  <span className="col-span-5 text-slate-600">DSR ou Folga (noturno)</span>
                  <span className="col-span-3 text-right text-slate-700">00h 00min</span>
                </div>
                <div className="grid grid-cols-12 font-semibold py-1">
                  <span className="col-span-4"></span>
                  <span className="col-span-5 text-slate-600">Feriado (diurno)</span>
                  <span className="col-span-3 text-right text-slate-700">00h 00min</span>
                </div>
                <div className="grid grid-cols-12 font-semibold py-1">
                  <span className="col-span-4"></span>
                  <span className="col-span-5 text-slate-600">Feriado (noturno)</span>
                  <span className="col-span-3 text-right text-slate-700">00h 00min</span>
                </div>
                <div className="grid grid-cols-12 font-bold py-2 border-t border-slate-100 text-slate-800">
                  <span className="col-span-4"></span>
                  <span className="col-span-5">Total Horas Extras</span>
                  <span className="col-span-3 text-right">{minutesToFullDisplay(totalGeralExtraMinutos)}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Popup / Toast de feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white px-5 py-3 rounded-lg shadow-xl flex items-center space-x-3 z-50">
          <CheckCircle2 className="w-4 h-4 text-[#ff8b00]" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal Histórico de Alteração */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">Histórico de alteração</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[70vh] overflow-y-auto">
              <p className="text-slate-500 font-medium">Dia 06/08/2026</p>

              <div className="relative pl-6 space-y-6 border-l-2 border-slate-200 ml-2">
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full border-2 border-red-500 bg-white"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-[11px]">07/08/2026 20:33</p>
                      <p className="font-bold text-slate-700">WIA DIGITAL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-700">06/08 08:00 <span className="text-red-500 ml-1">→ Removido</span></p>
                      <p className="text-slate-400 flex items-center justify-end gap-1 mt-0.5"><Monitor className="w-3 h-3"/> Ponto manual</p>
                      <p className="italic text-slate-400 text-[11px] mt-1">"Ponto removido via interface web"</p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full border-2 border-[#ff8b00] bg-white"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-[11px]">06/08/2026 23:08</p>
                      <p className="font-bold text-slate-700">WIA DIGITAL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-700">06/08 14:00 → 06/08 21:00</p>
                      <p className="text-slate-400 flex items-center justify-end gap-1 mt-0.5"><Monitor className="w-3 h-3"/> Ponto manual</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="bg-[#ff8b00] text-white font-medium px-6 py-2 rounded text-xs hover:bg-[#e07a00] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Jornada Atual */}
      {showJornadaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">Jornada atual</h2>
              <button onClick={() => setShowJornadaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <p className="font-semibold text-slate-700">Nome: SEG A SEX 8H AS 12H DAS 14H AS 18H SAB 08H AS 12H</p>
                <p className="text-slate-600 mt-1">Tipo: Padrão</p>
                <p className="text-slate-600 mt-1">Usada desde: 06/08/2026</p>
              </div>

              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
                      <th className="p-2.5 font-bold uppercase">DIA DA SEMANA</th>
                      <th className="p-2.5 font-bold uppercase text-center">ENTRADA</th>
                      <th className="p-2.5 font-bold uppercase text-center">SAÍDA</th>
                      <th className="p-2.5 font-bold uppercase text-center">ENTRADA</th>
                      <th className="p-2.5 font-bold uppercase text-center">SAÍDA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="p-2.5 font-medium">Seg, Ter, Qua, Qui, Sex</td>
                      <td className="p-2.5 text-center">08:00</td>
                      <td className="p-2.5 text-center">12:00</td>
                      <td className="p-2.5 text-center">14:00</td>
                      <td className="p-2.5 text-center">18:00</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Sáb</td>
                      <td className="p-2.5 text-center">08:00</td>
                      <td className="p-2.5 text-center">12:00</td>
                      <td className="p-2.5 text-center">-</td>
                      <td className="p-2.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Dom</td>
                      <td className="p-2.5 text-center">-</td>
                      <td className="p-2.5 text-center">-</td>
                      <td className="p-2.5 text-center">-</td>
                      <td className="p-2.5 text-center">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-right text-slate-700 font-medium">
                Total de horas semanal: <strong>44h00min</strong>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <button className="text-[#ff8b00] font-semibold text-xs hover:underline">
                Configurar jornada
              </button>
              <button 
                onClick={() => setShowJornadaModal(false)}
                className="bg-[#ff8b00] text-white font-medium px-6 py-2 rounded text-xs hover:bg-[#e07a00] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Widget Flutuante de Suporte */}
      <div className="fixed bottom-6 right-6">
        <button className="w-10 h-10 bg-[#ff8b00] text-white rounded-md flex items-center justify-center shadow-lg hover:bg-[#e07a00] transition-colors">
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
