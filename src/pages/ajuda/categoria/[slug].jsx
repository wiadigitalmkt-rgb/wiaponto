import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, BookOpen, ChevronRight, HelpCircle } from 'lucide-react';

export default function CategoriaDetalhes() {
  const router = useRouter();
  const { slug } = router.query;
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetchCategoryArticles();
  }, [slug]);

  const fetchCategoryArticles = async () => {
    setLoading(true);
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('help_articles')
          .select('*')
          .ilike('category', `%${slug}%`);

        if (!error && data && data.length > 0) {
          setArticles(data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Erro ao buscar artigos da categoria:', err);
      }
    }

    // Fallback de demonstração
    setArticles([
      {
        id: '1',
        category: slug?.toString().toUpperCase(),
        title: `Guia de utilização - ${slug}`,
        time: 'há 2 dias'
      },
      {
        id: '2',
        category: slug?.toString().toUpperCase(),
        title: `Configurações avançadas de ${slug}`,
        time: 'há 5 dias'
      }
    ]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Teste" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        <button
          onClick={() => router.push('/ajuda')}
          className="flex items-center gap-2 text-xs font-semibold text-[#fc9314] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a Central de Ajuda
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 text-[#fc9314] rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 capitalize">
                Categoria: {slug ? slug.toString().replace('-', ' ') : ''}
              </h1>
              <p className="text-xs text-slate-400">
                Artigos e tutoriais relacionados a este módulo.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#fc9314]"></div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {articles.length > 0 ? (
                articles.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => router.push(`/ajuda/artigo/${item.id}`)}
                    className="py-4 px-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-slate-700 group-hover:text-[#fc9314] transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-[11px] text-slate-400">{item.time || 'Criado recentemente'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#fc9314] group-hover:translate-x-1 transition-all" />
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-sm text-slate-400 space-y-2">
                  <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Nenhum artigo encontrado para esta categoria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 px-8 flex justify-between items-center text-xs text-slate-400 bg-white">
        <span>Wiaponto</span>
        <span>Powered by Wiaponto Help</span>
      </footer>
    </div>
  );
}
