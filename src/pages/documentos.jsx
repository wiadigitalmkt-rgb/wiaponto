import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { ChevronRight, FileText, Download, Eye, FileCheck, Bell } from 'lucide-react';

export default function Documentos() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('espelho');
  const [documents, setDocuments] = useState([
    { id: '1', title: 'Espelho de Ponto - Julho/2026', type: 'Espelho', date: '01/08/2026', status: 'Assinado' },
    { id: '2', title: 'Contra-cheque - Julho/2026', type: 'Holerite', date: '05/08/2026', status: 'Pendente' },
    { id: '3', title: 'Aviso de Férias - 2026', type: 'Aviso', date: '10/08/2026', status: 'Visualizado' },
  ]);

  useEffect(() => {
    fetchAttachments();
  }, []);

  const fetchAttachments = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('employee_attachments')
        .select('*');

      if (!error && data && data.length > 0) {
        // Mapeamento caso existam anexos salvos no Supabase
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f5] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Teste 11738" userInitials="JD" userName="Joquebede" />

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex gap-8">
        {/* MENU LATERAL DE DOCUMENTOS */}
        <aside className="w-56 shrink-0 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              DISTRIBUIÇÃO DE DOCUMENTOS
            </h2>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('espelho')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold transition cursor-pointer ${
                activeTab === 'espelho'
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Espelho</span>
            </button>

            <button
              onClick={() => setActiveTab('pdf')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold transition cursor-pointer ${
                activeTab === 'pdf'
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Arquivos em PDF</span>
            </button>

            <button
              onClick={() => setActiveTab('avisos')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold transition cursor-pointer ${
                activeTab === 'avisos'
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Avisos</span>
            </button>
          </nav>
        </aside>

        {/* ÁREA PRINCIPAL / TABELA DE DOCUMENTOS */}
        <main className="flex-1 space-y-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Link to="/ponto" className="hover:text-teal-600 transition">
              Painel
            </Link>
            <ChevronRight size={12} />
            <span className="text-teal-600 font-medium">Documentos</span>
          </div>

          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Meus Documentos e Anexos
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-6">DOCUMENTO</th>
                    <th className="py-3 px-6">TIPO</th>
                    <th className="py-3 px-6">DATA DE ENVIO</th>
                    <th className="py-3 px-6">STATUS</th>
                    <th className="py-3 px-6 text-right">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-800">{doc.title}</td>
                      <td className="py-3.5 px-6 text-slate-600">{doc.type}</td>
                      <td className="py-3.5 px-6 text-slate-600">{doc.date}</td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.status === 'Assinado' ? 'bg-green-100 text-green-700' :
                          doc.status === 'Pendente' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-2">
                        <button className="p-1 text-slate-500 hover:text-teal-600 transition" title="Visualizar">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 text-slate-500 hover:text-teal-600 transition" title="Baixar">
                          <Download size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-slate-200/50 mt-auto bg-white">
        © 2026 Coalize® - Todos os direitos reservados.
      </footer>
    </div>
  );
}
