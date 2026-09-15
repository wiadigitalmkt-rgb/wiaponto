import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Loader2, Plus, X, Trash2, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// AVISOS — antes era uma aba dentro de Documentos, agora é a própria página
// (mural de avisos da empresa, pra comunicados mensais etc). Mesma tabela
// de sempre (company_announcements), só que com uma tela dedicada.
// ---------------------------------------------------------------------------
export default function Avisos() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeImageUrl, setNoticeImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const sessionUser = JSON.parse(
    localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || '{}'
  );
  const isManager = sessionUser.role === 'gestor' || sessionUser.role === 'admin';

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Erro ao buscar avisos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) {
      alert('Informe o título e a mensagem.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('company_announcements').insert([
        {
          title: noticeTitle,
          content: noticeContent,
          image_url: noticeImageUrl || null,
          author_name: sessionUser.full_name || 'Gestão'
        }
      ]);
      if (error) throw error;

      setShowAnnouncementModal(false);
      setNoticeTitle('');
      setNoticeContent('');
      setNoticeImageUrl('');
      fetchAnnouncements();
    } catch (err) {
      console.error('Erro ao criar aviso:', err);
      alert('Erro ao publicar aviso: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este aviso?')) return;
    try {
      const { error } = await supabase.from('company_announcements').delete().eq('id', id);
      if (error) throw error;
      fetchAnnouncements();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f7] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Sua Empresa" />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-4">
        <div className="text-xs text-slate-500">
          <Link to="/admin" className="hover:text-[#ff8b00] transition-colors">Painel</Link>
          <ChevronRight className="w-3 h-3 inline mx-1" />
          <span className="text-[#ff8b00] font-medium">Avisos</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#ff8b00]" /> Avisos da Empresa
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Comunicados e avisos publicados pela gestão.</p>
          </div>
          {isManager && (
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-semibold px-4 py-2 rounded transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Publicar Aviso
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ff8b00]" />
            Carregando avisos...
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-lg border border-slate-200">
            Nenhum aviso publicado até o momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {announcements.map((ann) => (
              <div key={ann.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col justify-between">
                <div>
                  {ann.image_url && (
                    <img src={ann.image_url} alt={ann.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">{ann.title}</h4>
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{ann.content}</p>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between items-center bg-slate-50/50">
                  <span>Publicado por: {ann.author_name} — {new Date(ann.created_at).toLocaleDateString('pt-BR')}</span>
                  {isManager && (
                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
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
      </main>

      {/* MODAL: PUBLICAR AVISO */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Publicar Aviso Geral</h3>
              <button onClick={() => setShowAnnouncementModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Título*</label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none focus:border-[#ff8b00]"
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
                  className="w-full border rounded p-2 focus:outline-none focus:border-[#ff8b00]"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Conteúdo/Mensagem*</label>
                <textarea
                  rows={4}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none focus:border-[#ff8b00]"
                  placeholder="Escreva os detalhes do aviso..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-[#ff8b00] hover:bg-[#fc9314] text-white font-semibold rounded transition-colors disabled:opacity-50"
              >
                {saving ? 'Publicando...' : 'Publicar Aviso'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
