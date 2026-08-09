import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { FileText, Plus, Search, Loader2 } from 'lucide-react';

export default function Contratos() {
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setContracts(data);
      }
    } catch (err) {
      console.error('Erro ao buscar contratos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter((c) =>
    (c.title || c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f0f4f7] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Teste 11738" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* CABEÇALHO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Contratos</h1>
            <p className="text-xs text-slate-500">
              Gerencie e visualize todos os contratos de trabalho
            </p>
          </div>

          <button
            onClick={() => alert('Função de criar contrato em breve!')}
            className="bg-[#009688] hover:bg-[#00897b] text-white text-xs font-bold px-4 py-2.5 rounded-md transition shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Novo Contrato
          </button>
        </div>

        {/* BARRINHA DE PESQUISA */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-sm flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por título ou funcionário..."
            className="w-full text-xs text-slate-700 bg-transparent focus:outline-none"
          />
        </div>

        {/* TABELA DE CONTRATOS */}
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[250px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-6">TÍTULO / NOME</th>
                  <th className="py-3 px-6">TIPO DE CONTRATO</th>
                  <th className="py-3 px-6">STATUS</th>
                  <th className="py-3 px-6">CRIADO EM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                      Carregando contratos...
                    </td>
                  </tr>
                ) : filteredContracts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="py-16 text-center text-slate-500 font-medium text-xs"
                    >
                      <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      Nenhum contrato encontrado
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-800">
                        {contract.title || contract.name || 'Sem título'}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {contract.type || 'CLT'}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          {contract.status || 'Ativo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">
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
        </div>
      </main>
    </div>
  );
}
