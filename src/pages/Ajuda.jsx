import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Search, MessageSquare } from 'lucide-react';

export default function Ajuda() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);

  const categories = [
    'TUTORIAL DO COLABORADOR',
    'CONFIGURAÇÕES: OUTRAS',
    'CONFIGURAÇÕES: CERCA VIRTUAL',
    'RELATÓRIOS: OUTROS',
    'PRIMEIROS PASSOS',
    'MÓDULO USUÁRIOS',
    'MÓDULO PONTO / CÁLCULO DE HORAS',
    'RELATÓRIOS: ESPELHO PONTO',
    'BANCO DE HORAS',
    'CONFIGURAÇÕES: JORNADAS',
    'FÉRIAS',
    'FERIADOS E FOLGAS',
    'ADMISSÃO',
    'DISTRIBUIÇÃO DE DOCUMENTOS',
    'EXPORTAÇÃO TXT',
    'APLICATIVO DE CELULAR',
    'TABLET',
    'CONTROL ID',
    'EVO',
    'FINANCEIRO'
  ];

  const defaultRecent = [
    {
      category: 'PRIMEIROS PASSOS',
      title: 'Como acessar o Wiaponto pelo navegador (computador e celular)',
      time: 'há 4 dias',
      comments: 0
    },
    {
      category: 'PRIMEIROS PASSOS',
      title: 'Como usar o Assistente Trabalhista (IA de dúvidas sobre legislação)',
      time: 'há 4 dias',
      comments: 0
    },
    {
      category: 'CONFIGURAÇÕES: CERCA VIRTUAL',
      title: 'Como impedir o colaborador de bater ponto fora da empresa (cerca virtual)',
      time: 'há 4 dias',
      comments: 0
    },
    {
      category: 'CONFIGURAÇÕES: CERCA VIRTUAL',
      title: 'Como configurar a cerca virtual',
      time: 'há 4 dias',
      comments: 0
    },
    {
      category: 'ADMISSÃO',
      title: 'Como usar o Perfil Seguro (consulta de cadastro, processos e antecedentes)',
      time: 'há 4 dias',
      comments: 0
    }
  ];

  useEffect(() => {
    fetchHelpArticles();
  }, []);

  const fetchHelpArticles = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('help_articles')
        .select('*')
        .limit(10);

      if (!error && data && data.length > 0) {
        setRecentArticles(data);
      } else {
        setRecentArticles(defaultRecent);
      }
    } catch (err) {
      console.error('Erro ao buscar artigos de ajuda:', err);
      setRecentArticles(defaultRecent);
    }
  };

  const filteredArticles = recentArticles.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory 
      ? item.category?.toUpperCase() === selectedCategory.toUpperCase()
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Teste" />

      {/* BANNER SUPERIOR TURQUESA */}
      <div className="bg-[#fc9314] bg-opacity-90 py-16 px-4 relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
          <div className="w-[600px] h-[600px] border-[40px] border-white rounded-full"></div>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-6 relative z-10">
          Bem-vindo à <span className="font-bold">Central de Ajuda</span>
        </h1>

        <div className="w-full max-w-2xl relative z-10">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisa"
              className="w-full pl-11 pr-4 py-3 bg-white rounded-full text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff8b00]-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* CORPO DE CONTEÚDO */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 space-y-12">
        {/* GRID DE CATEGORIAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={idx}
                onClick={() => setSelectedCategory(isSelected ? null : cat)}
                className={`w-full py-4 px-6 border rounded-md text-xs font-semibold tracking-wide transition-colors text-center shadow-sm uppercase ${
                  isSelected
                    ? 'bg-[#ff8b00] text-white border-[#ff8b00]'
                    : 'border-[#ff8b00] text-[#ff8b00] hover:bg-[#ff8b00]-50/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <hr className="border-slate-200" />

        {/* ATIVIDADE RECENTE / RESULTADOS */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">
              {selectedCategory ? `Artigos: ${selectedCategory}` : 'Atividade recente'}
            </h2>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-teal-600 hover:underline font-medium"
              >
                Limpar filtro
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((item, index) => (
                <div key={index} className="py-4 flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold tracking-wider text-[#ff8b00] uppercase">
                      {item.category || 'GERAL'}
                    </span>
                    <h3 className="text-xs text-teal-600 font-medium hover:underline cursor-pointer">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                    <span>Artigo criado: {item.time || 'há poucos dias'}</span>
                    <div className="flex items-center gap-1 text-teal-600">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{item.comments || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum artigo encontrado para o termo pesquisado.
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 py-6 px-8 flex justify-between items-center text-xs text-slate-400">
        <span>Wiaponto</span>
        <span className="text-[11px] text-slate-300">Powered by Wiaponto Help</span>
      </footer>
    </div>
  );
}
