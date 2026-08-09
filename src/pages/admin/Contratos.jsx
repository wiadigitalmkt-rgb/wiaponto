
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Search, ArrowLeft, FileText, FileCheck, Loader2 } from 'lucide-react';

export default function Contratos() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('gerenciar'); // 'gerenciar' | 'assinatura'
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    fetchContracts();
  }, [activeMenu]);

  const fetchContracts = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Exemplo de integração Supabase
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setContracts(data);
      }
    } catch (err) {
      console.error('Erro ao buscar contratos:', err);
    } font-finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f0f4f7] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Teste 11738" />

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex gap-6">
        {/* MENU LATERAL DA PÁGINA */}
        <aside className="w-56 shrink-0 space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            CONTRATOS
          </h2>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveMenu('gerenciar')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                activeMenu === 'gerenciar'
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-200/60 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Gerenciar contratos</span>
            </button>

            <button
              onClick={() => setActiveMenu('assinatura')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                activeMenu === 'assinatura'
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-200/60 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <FileCheck className="w-4 h-4 text-slate-500" />
              <span>Gerenciar assinatura</span>
            </button>
          </nav>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 space-y-3">
          {/* BREADCRUMB */}
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Link to="/admin" className="hover:text-teal-600 transition-colors">
              Painel
            </Link>
            <span>&gt;</span>
            <span className="text-teal-600 font-medium">Contratos</span>
          </div>

          {/* CARD DO CONTEÚDO */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            {/* CABEÇALHO COM BOTÃO CRIAR NOVO */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <button
                onClick={() => alert('Nova funcionalidade de contrato em breve!')}
                className="bg-[#009688] hover:bg-[#00897b] text-white text-xs font-semibold px-4 py-2 rounded transition-colors shadow-sm"
              >
                Criar novo
              </button>
            </div>

            {/* BARRA DE PESQUISA */}
            <div className="p-4 bg-white border-b border-slate-100">
              <div className="relative max-w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* TABELA / ESTADO VAZIO */}
            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/30">
                    <th className="py-3 px-6">NOME</th>
                    <th className="py-3 px-6">CRIADO EM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="2" className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                        Carregando...
                      </td>
                    </tr>
                  ) : filteredContracts.length === 0 ? (
                    <tr>
                      <td
                        colSpan="2"
                        className="py-16 text-center text-slate-500 font-medium text-xs"
                      >
                        Nenhum contrato encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredContracts.map((contract) => (
                      <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-6 font-semibold text-slate-800">
                          {contract.name}
                        </td>
                        <td className="py-3 px-6 text-slate-500">
                          {contract.created_at
                            ? new Date(contract.created_at).toLocaleDateString('pt-BR')
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* RODAPÉ E PAGINAÇÃO */}
            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>{filteredContracts.length} Resultado</span>
              <div className="flex items-center gap-2">
                <span>Itens por página</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-slate-200 rounded p-1 text-xs focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* RODAPÉ GLOBAL */}
      <footer className="text-center py-4 text-[11px] text-slate-400 border-t border-slate-200/50 mt-auto">
        © 2026 Wiaponto - Todos os direitos reservados.
      </footer>
    </div>
  );
}
