
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Clock, FileText, MessageSquare, Loader2 } from 'lucide-react';

export default function Documentos() {
  const [activeMenu, setActiveMenu] = useState('espelho'); // 'espelho' | 'pdf' | 'avisos'
  const [activeTab, setActiveTab] = useState('espelhos'); // 'espelhos' | 'downloads'
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, [activeMenu, activeTab]);

  const fetchDocuments = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDocuments(data);
      }
    } catch (err) {
      console.error('Erro ao buscar documentos:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f7] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Teste 11738" />

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex gap-6">
        {/* MENU LATERAL DA PÁGINA */}
        <aside className="w-56 shrink-0 space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider leading-relaxed">
            Distribuição de<br />Documentos
          </h2>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveMenu('espelho')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                activeMenu === 'espelho'
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-200/60 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Espelho</span>
            </button>

            <button
              onClick={() => setActiveMenu('pdf')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                activeMenu === 'pdf'
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-200/60 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Arquivos em PDF</span>
            </button>

            <button
              onClick={() => setActiveMenu('avisos')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                activeMenu === 'avisos'
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-200/60 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>Avisos</span>
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
            <span className="text-teal-600 font-medium">Espelho</span>
          </div>

          {/* CARD DO CONTEÚDO */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            {/* CABEÇALHO DAS ABAS + BOTÃO ENVIAR */}
            <div className="px-6 pt-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('espelhos')}
                  className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
                    activeTab === 'espelhos'
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Espelhos
                </button>
                <button
                  onClick={() => setActiveTab('downloads')}
                  className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
                    activeTab === 'downloads'
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Downloads
                </button>
              </div>

              <button
                onClick={() => alert('Função de Enviar espelhos em breve!')}
                className="mb-3 bg-[#009688] hover:bg-[#00897b] text-white text-xs font-semibold px-4 py-2 rounded transition-colors shadow-sm"
              >
                Enviar espelhos
              </button>
            </div>

            {/* TABELA DE ESPELHOS */}
            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/30">
                    <th className="py-3 px-6">ESPELHO</th>
                    <th className="py-3 px-6">STATUS</th>
                    <th className="py-3 px-6">DATA ENVIO</th>
                    <th className="py-3 px-6">ASSINATURAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                        Carregando documentos...
                      </td>
                    </tr>
                  ) : documents.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-16 text-center text-slate-500 font-medium text-xs"
                      >
                        Nenhum espelho encontrado
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-slate-800">
                          {doc.title || doc.name}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600">
                          {doc.status || 'Pendente'}
                        </td>
                        <td className="py-3.5 px-6 text-slate-500">
                          {doc.sent_at
                            ? new Date(doc.sent_at).toLocaleDateString('pt-BR')
                            : '-'}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600">
                          {doc.signatures || '0/1'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* RODAPÉ E PAGINAÇÃO */}
            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>{documents.length} Resultado</span>
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
