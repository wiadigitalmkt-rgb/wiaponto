import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { 
  Clock, 
  FileText, 
  MessageSquare, 
  Loader2, 
  Upload, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  X,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Documentos() {
  const [activeMenu, setActiveMenu] = useState('espelho'); // 'espelho' | 'pdf' | 'avisos'
  const [activeTab, setActiveTab] = useState('espelhos'); // 'espelhos' (Pendentes) | 'downloads' (Assinados)
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  // Estados dos Dados
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // Colaborador selecionado no filtro (null = Todos)
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const [mirrors, setMirrors] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Estados dos Modais
  const [showUploadMirrorModal, setShowUploadMirrorModal] = useState(false);
  const [showUploadPdfModal, setShowUploadPdfModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Formulários Modais
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [fileTitle, setFileTitle] = useState('');
  const [fileCategory, setFileCategory] = useState('Holerite');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Form Aviso
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeImageUrl, setNoticeImageUrl] = useState('');

  // Identificação do Usuário Logado na Sessão
  const sessionUser = JSON.parse(
    localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || '{}'
  );
  const isManager = sessionUser.role === 'gestor' || sessionUser.role === 'admin';

  useEffect(() => {
    fetchInitialData();
  }, [activeMenu, activeTab, selectedUser]);

  const fetchInitialData = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // 1. Carrega Colaboradores
      const { data: empData } = await supabase
        .from('Employees')
        .select('id, full_name, email, cpf')
        .order('full_name', { ascending: true });
      if (empData) setEmployees(empData);

      // 2. Carrega conforme Menu Ativo
      if (activeMenu === 'espelho') {
        let query = supabase.from('time_card_mirrors').select('*, Employees(full_name, email)').order('created_at', { ascending: false });
        
        // Filtro de permissão do usuário
        if (!isManager && sessionUser.id) {
          query = query.eq('employee_id', sessionUser.id);
        } else if (selectedUser) {
          query = query.eq('employee_id', selectedUser.id);
        }

        const { data } = await query;
        if (data) setMirrors(data);
      } else if (activeMenu === 'pdf') {
        let query = supabase.from('employee_attachments').select('*, Employees(full_name)').order('created_at', { ascending: false });
        
        if (!isManager && sessionUser.id) {
          query = query.eq('employee_id', sessionUser.id);
        } else if (selectedUser) {
          query = query.eq('employee_id', selectedUser.id);
        }

        const { data } = await query;
        if (data) setAttachments(data);
      } else if (activeMenu === 'avisos') {
        const { data } = await supabase.from('company_announcements').select('*').order('created_at', { ascending: false });
        if (data) setAnnouncements(data);
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÃO DE UPLOAD DE ESPELHO EM PDF ---
  const handleUploadMirror = async (e) => {
    e.preventDefault();
    if (!selectedEmpId || !selectedFile || !fileTitle) {
      alert('Preencha todos os campos e escolha o PDF.');
      return;
    }

    setLoading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `espelhos/${Date.now()}_${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, selectedFile);
      let filePublicUrl = '';
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName);
        filePublicUrl = publicUrlData.publicUrl;
      } else {
        filePublicUrl = URL.createObjectURL(selectedFile);
      }

      await supabase.from('time_card_mirrors').insert([
        {
          employee_id: selectedEmpId,
          title: fileTitle,
          file_url: filePublicUrl,
          status: 'Pendente',
          sent_at: new Date().toISOString()
        }
      ]);

      alert('Espelho enviado com sucesso!');
      setShowUploadMirrorModal(false);
      setFileTitle('');
      setSelectedFile(null);
      fetchInitialData();
    } catch (err) {
      console.error('Erro ao enviar espelho:', err);
      alert('Erro ao enviar arquivo.');
    } finally {
      setLoading(false);
    }
  };

  // --- ASSINAR ESPELHO DIGITALMENTE (PELO COLABORADOR) ---
  const handleSignMirror = async (mirror) => {
    if (!confirm('Deseja assinar digitalmente este espelho de ponto?')) return;

    setLoading(true);
    try {
      const signedDate = new Date().toISOString();
      const certificateHash = `CERT-WIA-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      let ipAddress = 'IP: 189.100.22.15 (Viamão/RS)';
      
      await supabase
        .from('time_card_mirrors')
        .update({
          status: 'Assinado',
          signed_at: signedDate,
          signed_by_name: sessionUser.full_name || 'Colaborador',
          signed_by_email: sessionUser.email || 'colaborador@sistema.com',
          signed_ip_location: ipAddress,
          signature_certificate_hash: certificateHash
        })
        .eq('id', mirror.id);

      alert('Espelho assinado com sucesso!');
      fetchInitialData();
    } catch (err) {
      console.error('Erro ao assinar espelho:', err);
      alert('Erro ao realizar assinatura.');
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÃO DE UPLOAD DE ARQUIVOS EM PDF DO COLABORADOR ---
  const handleUploadAttachment = async (e) => {
    e.preventDefault();
    if (!selectedEmpId || !selectedFile) {
      alert('Selecione o colaborador e o arquivo.');
      return;
    }

    setLoading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `anexos/${Date.now()}_${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, selectedFile);
      let filePublicUrl = '';
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName);
        filePublicUrl = publicUrlData.publicUrl;
      } else {
        filePublicUrl = URL.createObjectURL(selectedFile);
      }

      await supabase.from('employee_attachments').insert([
        {
          employee_id: selectedEmpId,
          file_name: selectedFile.name,
          file_url: filePublicUrl,
          file_size: selectedFile.size,
          category: fileCategory
        }
      ]);

      alert('Arquivo anexado com sucesso!');
      setShowUploadPdfModal(false);
      setSelectedFile(null);
      fetchInitialData();
    } catch (err) {
      console.error('Erro ao anexar arquivo:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- CRIAR AVISO DA EMPRESA ---
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) {
      alert('Informe o título e a mensagem.');
      return;
    }

    setLoading(true);
    try {
      await supabase.from('company_announcements').insert([
        {
          title: noticeTitle,
          content: noticeContent,
          image_url: noticeImageUrl,
          author_name: sessionUser.full_name || 'Gestão'
        }
      ]);

      alert('Aviso publicado com sucesso!');
      setShowAnnouncementModal(false);
      setNoticeTitle('');
      setNoticeContent('');
      setNoticeImageUrl('');
      fetchInitialData();
    } catch (err) {
      console.error('Erro ao criar aviso:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- DELETAR ITENS ---
  const handleDeleteItem = async (table, id) => {
    if (!confirm('Tem certeza que deseja excluir este registro permanente?')) return;
    setLoading(true);
    try {
      await supabase.from(table).delete().eq('id', id);
      fetchInitialData();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtro interno para colaboradores do Dropdown
  const filteredEmployeesList = employees.filter(u => 
    u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Componente Reutilizável de Escolha de Colaborador (idêntico à página /espelho)
  const UserDropdownSelector = () => {
    if (!isManager) return null;

    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs font-semibold text-slate-600">Usuário</span>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="flex items-center justify-between border border-slate-300 rounded px-3 py-1 bg-white text-xs text-slate-700 hover:border-[#2a3c7e] transition-colors min-w-[170px] focus:outline-none shadow-xs">
            <span className="truncate pr-2">{selectedUser ? selectedUser.full_name : 'Todos os colaboradores'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-1.5 bg-white rounded-md shadow-xl border border-slate-200 z-50">
            <div className="relative mb-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Buscar usuário..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-xs border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-[#2a3c7e]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-0.5">
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedUser(null);
                  setUserSearchTerm('');
                }}
                className={`cursor-pointer text-xs px-2.5 py-2 rounded transition-colors ${!selectedUser ? 'bg-[#2a3c7e] text-white font-semibold' : 'text-slate-700 hover:bg-[#2a3c7e] hover:text-white'}`}
              >
                Todos os colaboradores
              </DropdownMenuItem>

              {filteredEmployeesList.length > 0 ? (
                filteredEmployeesList.map((user) => (
                  <DropdownMenuItem 
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setUserSearchTerm('');
                    }}
                    className={`cursor-pointer text-xs px-2.5 py-2 rounded transition-colors ${selectedUser?.id === user.id ? 'bg-[#2a3c7e] text-white font-semibold' : 'text-slate-700 hover:bg-[#2a3c7e] hover:text-white'}`}
                  >
                    {user.full_name}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-2 py-3 text-xs text-center text-slate-400">
                  Nenhum usuário encontrado
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  // Filtragem local dos espelhos por status (Pendentes vs Assinados)
  const filteredMirrors = mirrors.filter((m) => {
    if (activeTab === 'espelhos') {
      return m.status !== 'Assinado'; // Espelhos Pendentes
    } else {
      return m.status === 'Assinado'; // Espelhos Assinados
    }
  });

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
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs transition-colors ${
                activeMenu === 'espelho'
                  ? 'bg-white text-[#ff8b00] shadow-sm border border-slate-200/60 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50 font-medium'
              }`}
            >
              <Clock className={`w-4 h-4 ${activeMenu === 'espelho' ? 'text-[#ff8b00]' : 'text-slate-500'}`} />
              <span>Espelho</span>
            </button>

            <button
              onClick={() => setActiveMenu('pdf')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs transition-colors ${
                activeMenu === 'pdf'
                  ? 'bg-white text-[#ff8b00] shadow-sm border border-slate-200/60 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50 font-medium'
              }`}
            >
              <FileText className={`w-4 h-4 ${activeMenu === 'pdf' ? 'text-[#ff8b00]' : 'text-slate-500'}`} />
              <span>Arquivos em GERAL</span>
            </button>

            <button
              onClick={() => setActiveMenu('avisos')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs transition-colors ${
                activeMenu === 'avisos'
                  ? 'bg-white text-[#ff8b00] shadow-sm border border-slate-200/60 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50 font-medium'
              }`}
            >
              <MessageSquare className={`w-4 h-4 ${activeMenu === 'avisos' ? 'text-[#ff8b00]' : 'text-slate-500'}`} />
              <span>Avisos</span>
            </button>
          </nav>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 space-y-3">
          {/* BREADCRUMB */}
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Link to="/admin" className="hover:text-[#ff8b00] transition-colors">
              Painel
            </Link>
            <span>&gt;</span>
            <span className="text-[#ff8b00] font-medium capitalize">{activeMenu}</span>
          </div>

          {/* CARD DO CONTEÚDO */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            
            {/* SESSÃO 1: ESPELHO */}
            {activeMenu === 'espelho' && (
              <>
                <div className="px-6 py-3 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex gap-6 border-b border-transparent">
                      <button
                        onClick={() => setActiveTab('espelhos')}
                        className={`pb-1.5 text-xs font-bold transition-colors border-b-2 ${
                          activeTab === 'espelhos'
                            ? 'border-[#ff8b00] text-[#ff8b00]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Espelhos (Pendentes)
                      </button>
                      <button
                        onClick={() => setActiveTab('downloads')}
                        className={`pb-1.5 text-xs font-bold transition-colors border-b-2 ${
                          activeTab === 'downloads'
                            ? 'border-[#ff8b00] text-[#ff8b00]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Espelhos assinados
                      </button>
                    </div>

                    {/* Botão de Escolha de Colaborador */}
                    <UserDropdownSelector />
                  </div>

                  {isManager && (
                    <button
                      onClick={() => setShowUploadMirrorModal(true)}
                      className="bg-[#fc9314] hover:bg-[#ff8b00] text-white text-xs font-semibold px-4 py-2 rounded transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Enviar espelho
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto min-h-[220px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/30">
                        <th className="py-3 px-6">ESPELHO / TÍTULO</th>
                        <th className="py-3 px-6">COLABORADOR</th>
                        <th className="py-3 px-6">STATUS</th>
                        <th className="py-3 px-6">DATA ENVIO</th>
                        <th className="py-3 px-6">ASSINATURA</th>
                        <th className="py-3 px-6 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ff8b00]" />
                            Carregando espelhos...
                          </td>
                        </tr>
                      ) : filteredMirrors.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-16 text-center text-slate-500 font-medium text-xs">
                            Nenhum espelho de ponto nesta aba
                          </td>
                        </tr>
                      ) : (
                        filteredMirrors.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-6 font-semibold text-slate-800">
                              <a href={m.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#ff8b00]">
                                <FileText className="w-4 h-4 text-slate-400" />
                                {m.title}
                              </a>
                            </td>
                            <td className="py-3.5 px-6 text-slate-600">
                              {m.Employees?.full_name || 'N/A'}
                            </td>
                            <td className="py-3.5 px-6">
                              {m.status === 'Assinado' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                                  <CheckCircle2 className="w-3 h-3" /> Assinado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Pendente
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-6 text-slate-500">
                              {m.sent_at ? new Date(m.sent_at).toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="py-3.5 px-6 text-slate-600">
                              {m.status === 'Assinado' ? (
                                <button
                                  onClick={() => setSelectedCertificate(m)}
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Ver Certificado
                                </button>
                              ) : (
                                !isManager ? (
                                  <button
                                    onClick={() => handleSignMirror(m)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                                  >
                                    Assinar Agora
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Aguardando Colaborador</span>
                                )
                              )}
                            </td>
                            <td className="py-3.5 px-6 text-right space-x-2">
                              {isManager && (
                                <button
                                  onClick={() => handleDeleteItem('time_card_mirrors', m.id)}
                                  className="text-slate-400 hover:text-red-600 transition-colors"
                                  title="Excluir Espelho"
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* SESSÃO 2: ARQUIVOS EM PDF DO COLABORADOR */}
            {activeMenu === 'pdf' && (
              <>
                <div className="px-6 py-3 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-6">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Documentos e Holerites do Colaborador
                    </h3>
                    
                    {/* Botão de Escolha de Colaborador */}
                    <UserDropdownSelector />
                  </div>

                  {isManager && (
                    <button
                      onClick={() => setShowUploadPdfModal(true)}
                      className="bg-[#fc9314] hover:bg-[#ff8b00] text-white text-xs font-semibold px-4 py-2 rounded transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Anexar Documento
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto min-h-[220px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/30">
                        <th className="py-3 px-6">NOME DO ARQUIVO</th>
                        <th className="py-3 px-6">COLABORADOR</th>
                        <th className="py-3 px-6">CATEGORIA</th>
                        <th className="py-3 px-6">DATA</th>
                        <th className="py-3 px-6 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ff8b00]" />
                            Carregando arquivos...
                          </td>
                        </tr>
                      ) : attachments.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-16 text-center text-slate-500 font-medium text-xs">
                            Nenhum documento anexado para o filtro selecionado
                          </td>
                        </tr>
                      ) : (
                        attachments.map((att) => (
                          <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-6 font-semibold text-slate-800">
                              <a href={att.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#ff8b00]">
                                <FileText className="w-4 h-4 text-slate-400" />
                                {att.file_name}
                              </a>
                            </td>
                            <td className="py-3.5 px-6 text-slate-600">
                              {att.Employees?.full_name || 'Geral'}
                            </td>
                            <td className="py-3.5 px-6 text-slate-600">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                {att.category || 'Documento'}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-slate-500">
                              {new Date(att.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3.5 px-6 text-right space-x-2">
                              <a
                                href={att.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-500 hover:text-[#ff8b00] inline-block"
                                title="Visualizar"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              {isManager && (
                                <button
                                  onClick={() => handleDeleteItem('employee_attachments', att.id)}
                                  className="text-slate-400 hover:text-red-600 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* SESSÃO 3: AVISOS COM FOTO E TEXTO */}
            {activeMenu === 'avisos' && (
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Mural de Avisos da Empresa
                  </h3>
                  {isManager && (
                    <button
                      onClick={() => setShowAnnouncementModal(true)}
                      className="bg-[#fc9314] hover:bg-[#ff8b00] text-white text-xs font-semibold px-4 py-2 rounded transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Publicar Aviso
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ff8b00]" />
                    Carregando avisos...
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs">
                    Nenhum aviso publicado até o momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col justify-between">
                        <div>
                          {ann.image_url && (
                            <img
                              src={ann.image_url}
                              alt={ann.title}
                              className="w-full h-48 object-cover"
                            />
                          )}
                          <div className="p-4 space-y-2">
                            <h4 className="font-bold text-slate-800 text-sm">{ann.title}</h4>
                            <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{ann.content}</p>
                          </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between items-center bg-slate-50/50">
                          <span>Publicado por: {ann.author_name} - {new Date(ann.created_at).toLocaleDateString('pt-BR')}</span>
                          {isManager && (
                            <button
                              onClick={() => handleDeleteItem('company_announcements', ann.id)}
                              className="text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RODAPÉ E PAGINAÇÃO */}
            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>Resultados cadastrados</span>
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

      {/* MODAL 1: ENVIAR ESPELHO */}
      {showUploadMirrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Enviar Espelho de Ponto (PDF)</h3>
              <button onClick={() => setShowUploadMirrorModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUploadMirror} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Colaborador*</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none"
                  required
                >
                  <option value="">Selecione...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.cpf || 'Sem CPF'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Título do Documento*</label>
                <input
                  type="text"
                  placeholder="Ex: Espelho de Ponto - Agosto/2026"
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Arquivo PDF*</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full border rounded p-1.5"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#ff8b00] hover:bg-[#e07a00] text-white font-semibold rounded transition-colors"
              >
                {loading ? 'Enviando...' : 'Confirmar Envio'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ANEXAR PDF / DOCUMENTO */}
      {showUploadPdfModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Anexar Documento do Colaborador</h3>
              <button onClick={() => setShowUploadPdfModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUploadAttachment} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Colaborador*</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none"
                  required
                >
                  <option value="">Selecione...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Categoria*</label>
                <select
                  value={fileCategory}
                  onChange={(e) => setFileCategory(e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none"
                >
                  <option value="Holerite">Contra-cheque / Holerite</option>
                  <option value="Documento">Documento Pessoal (RG/CPF)</option>
                  <option value="Atestado">Atestado Médico</option>
                  <option value="Atestado">Certificados</option>
                  <option value="Atestado">Fotos</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Arquivo*</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full border rounded p-1.5"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#ff8b00] hover:bg-[#e07a00] text-white font-semibold rounded transition-colors"
              >
                {loading ? 'Anexando...' : 'Salvar Arquivo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PUBLICAR AVISO */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Publicar Aviso Geral</h3>
              <button onClick={() => setShowAnnouncementModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Título*</label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none"
                  placeholder="Ex: Reunião Geral de Fim de Ano"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">URL da Imagem (Opcional)</label>
                <input
                  type="url"
                  value={noticeImageUrl}
                  onChange={(e) => setNoticeImageUrl(e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Conteúdo/Mensagem*</label>
                <textarea
                  rows="4"
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none"
                  placeholder="Escreva os detalhes do aviso..."
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#ff8b00] hover:bg-[#e07a00] text-white font-semibold rounded transition-colors"
              >
                {loading ? 'Publicando...' : 'Publicar Aviso'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CERTIFICADO DIGITAL */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 border-t-4 border-emerald-600">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Certificado de Assinatura Digital</h3>
              </div>
              <button onClick={() => setSelectedCertificate(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded border">
              <p><strong>Documento:</strong> {selectedCertificate.title}</p>
              <p><strong>Assinado por:</strong> {selectedCertificate.signed_by_name}</p>
              <p><strong>E-mail:</strong> {selectedCertificate.signed_by_email}</p>
              <p><strong>Data/Hora:</strong> {new Date(selectedCertificate.signed_at).toLocaleString('pt-BR')}</p>
              <p><strong>Localização / IP:</strong> {selectedCertificate.signed_ip_location}</p>
              <p className="font-mono text-[10px] text-slate-500 break-all pt-2 border-t">
                <strong>Hash de Autenticidade:</strong><br />{selectedCertificate.signature_certificate_hash}
              </p>
            </div>
            <button
              onClick={() => setSelectedCertificate(null)}
              className="w-full py-2 bg-slate-800 text-white rounded font-medium text-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* RODAPÉ GLOBAL */}
      <footer className="text-center py-4 text-[11px] text-slate-400 border-t border-slate-200/50 mt-auto">
        © 2026 Wiaponto - Todos os direitos reservados.
      </footer>
    </div>
  );
}
