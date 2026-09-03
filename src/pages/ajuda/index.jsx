import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { articlesData } from './articlesData';
import { 
  Search, 
  BookOpen, 
  UserCheck, 
  Clock, 
  FileText, 
  Smartphone,  
  ShieldCheck, 
  ChevronRight,
  Users,
  Settings,
  HelpCircle,
  Briefcase
} from 'lucide-react';

export default function Ajuda() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  
  const [userRole, setUserRole] = useState('gestor'); 
  const [activeTab, setActiveTab] = useState('gestor');

  // Categorias alinhadas com os IDs e nomes do sistema
  const categoriesByRole = {
    colaborador: [
      { id: 'primeiros-passos', title: 'Primeiros Passos', icon: BookOpen, desc: 'Acessando a plataforma pela primeira vez' },
      { id: 'bate-ponto', title: 'Bate Ponto', icon: UserCheck, desc: 'Guias básicos de uso e registro' },
      { id: 'documentos-avisos', title: 'Documentos e Avisos', icon: Smartphone, desc: 'Assinaturas e comunicados' },
      { id: 'espelho-ponto', title: 'Espelho de Ponto', icon: FileText, desc: 'Consulta de horas e solicitações de ajuste' },
    ],
    gestor: [
      { id: 'primeiros-passos', title: 'Primeiros Passos Gestão', icon: BookOpen, desc: 'Configurações iniciais do sistema' },
      { id: 'cerca-virtual', title: 'Cerca Virtual', icon: ShieldCheck, desc: 'Bloqueios e locais de marcação' },
      { id: 'modulo-usuarios', title: 'Módulo Usuários', icon: Users, desc: 'Gestão de acessos e permissões' },
      { id: 'ponto-horas', title: 'Ponto & Cálculo de Horas', icon: Clock, desc: 'Tratamento de ponto e horas extras' },
      { id: 'relatorios', title: 'Relatórios & Espelho', icon: FileText, desc: 'Exportações e acompanhamento' },
      { id: 'banco-horas', title: 'Banco de Horas', icon: Clock, desc: 'Ajustes e compensações' },
      { id: 'jornadas', title: 'Jornadas & Escalas', icon: Settings, desc: 'Criação de turnos de trabalho' },
      { id: 'ferias-folgas', title: 'Férias e Folgas', icon: Briefcase, desc: 'Agendamentos e recesso' },
      { id: 'admissao', title: 'Admissão & Documentos', icon: FileText, desc: 'Envio e verificação de documentos' },
      { id: 'configuracoes', title: 'Outras Configurações', icon: Settings, desc: 'Dispositivos (Control ID, EVO) e integração' },
    ]
  };

  const defaultArticles = [
    {
      id: '1',
      categoryId: 'primeiros-passos',
      category: 'PRIMEIROS PASSOS',
      title: 'Como acessar o Wiaponto pelo navegador (computador e celular)',
      time: 'há 4 dias',
      role: 'todos'
    },
    {
      id: '2',
      categoryId: 'bate-ponto',
      category: 'REGISTROS',
      title: 'Como registrar o ponto com foto e localização',
      time: '1 min de leitura',
      role: 'todos'
    },
    {
      id: '3',
      categoryId: 'documentos-avisos',
      category: 'DOCUMENTOS E AVISOS',
      title: 'Como assinar folhas de ponto, visualizar documentos e acompanhar avisos',
      time: '2 min de leitura',
      role: 'todos'
    },
    {
      id: '4',
      categoryId: 'espelho-ponto',
      category: 'ESPELHO DE PONTO',
      title: 'Como consultar o histórico de registros e solicitar ajustes de ponto',
      time: '2 min de leitura',
      role: 'todos'
    },
    {
      id: '5',
      categoryId: 'cerca-virtual',
      category: 'CERCA VIRTUAL',
      title: 'Como impedir o colaborador de bater ponto fora da empresa',
      time: 'há 4 dias',
      role: 'gestor'
    },
    {
      id: '6',
      categoryId: 'admissao',
      category: 'ADMISSÃO',
      title: 'Como usar o Perfil Seguro (consulta de cadastro e antecedentes)',
      time: 'há 4 dias',
      role: 'gestor'
    }
  ];

  useEffect(() => {
    fetchHelpArticles();
  }, []);

  const fetchHelpArticles = async () => {
  if (!supabase) {
    setRecentArticles(articlesData);
    return;
  }
  try {
    const { data, error } = await supabase
      .from('help_articles')
      .select('*')
      .limit(50);

    if (!error && data && data.length > 0) {
      setRecentArticles(data);
    } else {
      setRecentArticles(articlesData);
    }
  } catch (err) {
    console.error('Erro ao buscar artigos de ajuda:', err);
    setRecentArticles(articlesData);
  }
};

  const handleArticleClick = (articleId) => {
    window.location.href = `/ajuda/artigo/${articleId}`;
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const currentCategories = activeTab === 'gestor' 
    ? categoriesByRole.gestor 
    : categoriesByRole.colaborador;

  const filteredArticles = recentArticles.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = activeTab === 'gestor' || item.role === 'colaborador' || item.role === 'todos';
    const matchesCategory = selectedCategory ? item.categoryId === selectedCategory : true;
    return matchesSearch && matchesRole && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Teste" />

      <div className="bg-gradient-to-r from-[#fc9314] to-[#ff8b00] py-14 px-4 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-md">
        <div className="max-w-3xl w-full z-10 space-y-4">
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Suporte & Tutoriais
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Como podemos ajudar você hoje?
          </h1>
          
          <div className="pt-2 max-w-2xl mx-auto relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite sua dúvida ou palavra-chave (ex: ponto, cerca virtual, relatório)..."
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl text-sm text-slate-800 shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {userRole === 'gestor' && (
          <div className="flex justify-center">
            <div className="bg-slate-200/80 p-1 rounded-xl flex gap-1 text-sm font-medium">
              <button
                onClick={() => { setActiveTab('gestor'); setSelectedCategory(null); }}
                className={`px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'gestor'
                    ? 'bg-white text-[#fc9314] shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Área do Gestor / RH
              </button>
              <button
                onClick={() => { setActiveTab('colaborador'); setSelectedCategory(null); }}
                className={`px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'colaborador'
                    ? 'bg-white text-[#fc9314] shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Visão do Colaborador
              </button>
            </div>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex justify-between items-baseline">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#fc9314]" />
              Categorias para {activeTab === 'gestor' ? 'Gestores' : 'Colaboradores'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentCategories.map((cat) => {
              const IconComponent = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex items-start space-x-4 ${
                    isSelected
                      ? 'border-[#fc9314] bg-orange-50/50 shadow-md ring-2 ring-[#fc9314]/20'
                      : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-md'
                  }`}
                >
                  <div className={`p-3 rounded-lg shrink-0 ${isSelected ? 'bg-[#fc9314] text-white' : 'bg-orange-100 text-[#fc9314]'}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{cat.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">
              {selectedCategory ? 'Artigos da Categoria Selecionada' : 'Instruções e Guias Recentes'}
            </h2>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-[#fc9314] hover:underline font-semibold cursor-pointer"
              >
                Ver todos os artigos
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleArticleClick(item.id)}
                  className="py-4 px-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-1 pr-4">
                    <span className="text-[10px] font-bold text-[#fc9314] uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-medium text-slate-700 group-hover:text-[#fc9314] transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400 hidden sm:inline">{item.time}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#fc9314] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-sm text-slate-400 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p>Nenhum artigo encontrado para esta seleção.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 px-8 flex justify-between items-center text-xs text-slate-400 bg-white">
        <span>Wiaponto</span>
        <span>Powered by Wiaponto Help</span>
      </footer>
    </div>
  );
}
