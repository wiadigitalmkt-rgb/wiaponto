import React, { useState } from 'react';
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
  History
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminPonto() {
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

  // Dados com estado para permitir alterações (exclusão/edição)
  const [registros, setRegistros] = useState([
    { 
      id: 1, 
      data: '06/08/2026 - Quinta-feira', 
      horaExtra: '0h', 
      trabalhado: '6h',
      batidas: [
        { entrada: '14:00', saida: '20:00', saldo: '06:00', isNight: false, obs: '' },
        { entrada: '23:12', saida: '-', saldo: '-', isNight: false, obs: '' }
      ]
    },
    { 
      id: 2, 
      data: '07/08/2026 - Sexta-feira', 
      horaExtra: '1h', 
      trabalhado: '9h',
      batidas: [
        { entrada: '08:00', saida: '12:00', saldo: '04:00', isNight: false, obs: '' },
        { entrada: '14:00', saida: '19:00', saldo: '05:00', isNight: false, obs: '' }
      ]
    },
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // 1. Ação de Excluir / Remover ponto
  const handleRemoveBatida = (itemId, batidaIdx) => {
    const updated = registros.map((item) => {
      if (item.id === itemId) {
        const newBatidas = item.batidas.filter((_, idx) => idx !== batidaIdx);
        return { ...item, batidas: newBatidas };
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

  // Salvar Edição
  const handleSaveEdit = (itemId, batidaIdx) => {
    const updated = registros.map((item) => {
      if (item.id === itemId) {
        const newBatidas = [...item.batidas];
        newBatidas[batidaIdx] = {
          ...newBatidas[batidaIdx],
          entrada: editFormData.entrada || '-',
          saida: editFormData.saida || '-',
          isNight: editFormData.isNight,
          obs: editFormData.obs
        };
        return { ...item, batidas: newBatidas };
      }
      return item;
    });
    setRegistros(updated);
    setEditingRowKey(null);
    showToast('Ponto atualizado com sucesso!');
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
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium bg-emerald-50/80 text-emerald-700 border-l-4 border-emerald-500 shadow-sm">
                <Clock className="w-4 h-4" />
                <span>Pontos registrados</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-slate-500 hover:bg-slate-200/50 transition-colors">
                <FileText className="w-4 h-4" />
                <span>Resumo de...</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Conteúdo Central */}
        <main className="flex-1 p-8 pl-2">
          {/* Breadcrumb e Filtro Topo */}
          <div className="flex justify-between items-center mb-4 text-xs text-slate-500">
            <div>
              <span>Painel</span> <ChevronRight className="w-3 h-3 inline mx-1" /> <span className="text-emerald-600 font-medium">Pontos registrados</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span>Departamento</span>
              <select className="border border-slate-300 rounded px-2 py-1 bg-white text-xs font-medium focus:outline-none shadow-sm">
                <option>Todos</option>
              </select>
            </div>
          </div>

          {/* Card Principal */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200/80">
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

              {/* REQUISITO 5: Botão de Ver jornada atual */}
              <button 
                onClick={() => setShowJornadaModal(true)}
                className="flex items-center text-xs text-emerald-600 font-medium hover:underline cursor-pointer"
              >
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
              {registros.map((item) => {
                const isExpanded = expandedRow === item.id;
                return (
                  <div key={item.id} className="transition-colors">
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
                      <div className="px-8 py-4 bg-slate-50/40 border-t border-b border-slate-100 text-xs">
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

                          {/* REQUISITO 4: Botão Ver histórico idêntico ao modelo */}
                          <button 
                            onClick={() => setShowHistoryModal(true)}
                            className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
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
                              // REQUISITO 2: Painel de Edição do ponto com opção Noturno (Lua)
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
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                                      />
                                      <Moon className="w-3.5 h-3.5 text-slate-600" />
                                    </label>

                                    <input 
                                      type="text"
                                      placeholder="Max 15 caractere"
                                      value={editFormData.obs}
                                      onChange={(e) => setEditFormData({ ...editFormData, obs: e.target.value })}
                                      className="border border-slate-300 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:border-emerald-500"
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
                                      className="bg-emerald-600 text-white font-medium px-4 py-1 rounded text-xs hover:bg-emerald-700 transition-colors"
                                    >
                                      Salvar
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            // REQUISITO 1: Botão "Remover" que aparece no hover (group-hover)
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
                                    className="text-emerald-600 hover:underline text-xs font-medium"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Rodapé do dia */}
                        <div className="flex justify-end space-x-6 items-center mt-4 pt-3 border-t border-slate-200/60 text-slate-600 font-medium text-xs">
                          <span>Horas extras: <strong>{item.horaExtra}</strong></span>
                          <span>Trabalhado: <strong>{item.trabalhado}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Linha de Totais */}
              <div className="grid grid-cols-12 px-6 py-4 items-center text-sm font-bold bg-slate-50/30">
                <div className="col-span-8"></div>
                <div className="col-span-2 text-right text-slate-800">1h</div>
                <div className="col-span-2 text-right text-slate-800">15h</div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* REQUISITO 3: Popup / Toast de feedback de ação */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white px-5 py-3 rounded-lg shadow-xl flex items-center space-x-3 z-50 animate-bounce-short">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* REQUISITO 4: Modal Histórico de Alteração (Igual da Imagem 4) */}
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
                {/* Item 1 */}
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

                {/* Item 2 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full border-2 border-red-500 bg-white"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-[11px]">07/08/2026 20:33</p>
                      <p className="font-bold text-slate-700">WIA DIGITAL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-700">06/08 12:00 <span className="text-red-500 ml-1">→ Removido</span></p>
                      <p className="text-slate-400 flex items-center justify-end gap-1 mt-0.5"><Monitor className="w-3 h-3"/> Ponto manual</p>
                      <p className="italic text-slate-400 text-[11px] mt-1">"Ponto removido via interface web"</p>
                    </div>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full border-2 border-emerald-500 bg-white"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-[11px]">06/08/2026 23:08</p>
                      <p className="font-bold text-slate-700">WIA DIGITAL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-700">06/08 18:00 → 06/08 20:00</p>
                      <p className="text-slate-400 flex items-center justify-end gap-1 mt-0.5"><Monitor className="w-3 h-3"/> Ponto manual</p>
                    </div>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full border-2 border-emerald-500 bg-white"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-[11px]">07/08/2026 20:37</p>
                      <p className="font-bold text-slate-700">WIA DIGITAL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-700">06/08 20:00 → 06/08 21:00</p>
                      <p className="text-slate-400 flex items-center justify-end gap-1 mt-0.5"><Monitor className="w-3 h-3"/> Ponto manual</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="bg-emerald-600 text-white font-medium px-6 py-2 rounded text-xs hover:bg-emerald-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUISITO 5: Modal Jornada Atual (Igual da Imagem 6) */}
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
              <button className="text-emerald-600 font-semibold text-xs hover:underline">
                Configurar jornada
              </button>
              <button 
                onClick={() => setShowJornadaModal(false)}
                className="bg-emerald-600 text-white font-medium px-6 py-2 rounded text-xs hover:bg-emerald-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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
