import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Clock, ThumbsUp, CheckCircle } from 'lucide-react';

export default function ArtigoDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchArticleDetails();
  }, [id]);

  const fetchArticleDetails = async () => {
    setLoading(true);
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('help_articles')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          setArticle(data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Erro ao buscar artigo no Supabase:', err);
      }
    }

    // Fallback de demonstração
    setArticle({
      id: id,
      category: 'PRIMEIROS PASSOS',
      title: 'Como acessar o Wiaponto pelo navegador (computador e celular)',
      updated_at: 'há 4 dias',
      content: `
        Para acessar o sistema Wiaponto de qualquer dispositivo, siga os passos abaixo:
        
        1. Abra o seu navegador de preferência (Google Chrome, Safari ou Edge).
        2. Acesse o link oficial de login da sua empresa.
        3. Insira suas credenciais (E-mail/CPF e Senha) fornecidas pelo RH.
        4. Caso seja o seu primeiro acesso, será solicitado a alteração de senha por segurança.
      `,
      steps: [
        'Acesse o site oficial pelo seu navegador.',
        'Insira seu usuário e senha nos campos indicados.',
        'Clique em "Entrar" para acessar o painel principal.'
      ]
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar selectedCompany="Empresa Teste" />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fc9314]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Teste" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        <button
          onClick={() => navigate('/ajuda')}
          className="flex items-center gap-2 text-xs font-semibold text-[#fc9314] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a Central de Ajuda
        </button>

        {article && (
          <article className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="space-y-3 border-b border-slate-100 pb-6">
              <span className="text-[10px] font-bold text-[#fc9314] uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded border border-orange-100">
                {article.category || 'GERAL'}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">
                {article.title}
              </h1>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Atualizado {article.updated_at || 'recentemente'}
                </span>
              </div>
            </div>

            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line space-y-4">
              <p>{article.content}</p>

              {article.steps && article.steps.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4 space-y-3">
                  <h3 className="font-bold text-slate-800 text-sm">Passo a Passo:</h3>
                  <ul className="space-y-2">
                    {article.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle className="w-4 h-4 text-[#fc9314] shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-slate-500">Este artigo foi útil?</span>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 flex items-center gap-1 cursor-pointer">
                  <ThumbsUp className="w-3.5 h-3.5 text-slate-500" /> Sim
                </button>
              </div>
            </div>
          </article>
        )}
      </main>

      <footer className="border-t border-slate-200 py-6 px-8 flex justify-between items-center text-xs text-slate-400 bg-white">
        <span>Wiaponto</span>
        <span>Powered by Wiaponto Help</span>
      </footer>
    </div>
  );
}
