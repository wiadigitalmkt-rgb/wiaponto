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

  const fallbackArticles = {
    '1': {
      id: '1',
      category: 'ESPELHO DE PONTO',
      title: 'Como consultar, tratar inconsistências e fechar o Espelho de Ponto dos colaboradores',
      updated_at: 'há 1 dia',
      content: `O Espelho de Ponto é a ferramenta central do gestor para acompanhamento do cumprimento de jornada, tratamento de marcações incorretas e fechamento mensal para envio à folha de pagamento.

Acesse a página do Espelho de Ponto pelo menu de Módulos de Gestão e siga as etapas de conferência e tratamento abaixo:`,
      steps: [
        'Acesse o menu Espelho de Ponto no painel principal do Gestor.',
        'Selecione a empresa, departamento ou pesquise o nome do colaborador e defina o período de apuração desejado.',
        'Analise a grade de registros do colaborador, identificando marcações faltantes, horas extras, atrasos e faltas.',
        'Para realizar ajustes ou abonar justificativas, clique sobre o dia desejado, insira o horário correto/motivo e salve as alterações.',
        'Após a verificação dos dados do período, clique em Exportar/Fechar Ponto para gerar os arquivos de folha de pagamento e liberar a assinatura do colaborador.'
      ]
    },
    '2': {
      id: '2',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como gerenciar perfis, dados pessoais e permissões de acesso dos colaboradores',
      updated_at: 'há 1 dia',
      content: `No módulo de Usuários, o gestor possui controle total sobre os dados cadastrais, jornadas atribuídas, locais de marcação (cercas virtuais), férias e permissões do sistema.

Para navegar pelas seções e atualizar as informações do colaborador, siga as etapas:`,
      steps: [
        'No painel do Gestor, clique no módulo Usuários.',
        'Localize e selecione o colaborador na lista ou clique em Novo Usuário para realizar um cadastro.',
        'Navegue pela barra lateral esquerda para editar as seções: Informações, Jornada de trabalho, Cercas, Férias, Dependentes e Acesso ao sistema.',
        'Na aba Dados do perfil, atualize informações pessoais como Nome, CPF, RG, E-mail, Telefone, Endereço e Cargo.',
        'Clique no botão Salvar alterações no canto inferior direito para atualizar o cadastro no sistema.'
      ]
    },
    '3': {
      id: '3',
      category: 'ADMISSÃO & DOCUMENTOS',
      title: 'Como iniciar o processo de admissão digital para novos colaboradores',
      updated_at: 'há 1 dia',
      content: `A funcionalidade de Admissão Digital permite coletar dados e documentos de novos colaboradores de forma automatizada via modelos pré-definidos (Templates).

Acompanhe os passos necessários para disparar e monitorar um processo admissional:`,
      steps: [
        'Certifique-se de possuir um modelo configurado na aba Templates dentro do menu Admissão.',
        'Na página principal de Admissão, clique no botão Iniciar admissão.',
        'Pesquise e marque a caixa ao lado do nome do colaborador cadastrado e clique em Continuar.',
        'Selecione o modelo de template desejado para a coleta de dados/documentos e clique em Usar template.',
        'Acompanhe o progresso do preenchimento do colaborador pelas abas Em andamento e Concluídas, e baixe o relatório final em Relatórios > Dados Admissão.'
      ]
    },
    '4': {
      id: '4',
      category: 'CONTRATOS',
      title: 'Como gerenciar e vincular contratos de trabalho aos colaboradores',
      updated_at: 'há 2 dias',
      content: `O módulo de Contratos centraliza o controle de acordos individuais de trabalho, tipos de contratação e histórico de vínculos da empresa.

Siga as etapas abaixo para criar ou vincular novos contratos no sistema:`,
      steps: [
        'Acesse o módulo Contratos no menu de gestão do Wiaponto.',
        'Selecione o tipo de contrato desejado (CLT, Estágio, PJ, Menor Aprendiz ou Experiência).',
        'Clique em Novo Contrato ou selecione um modelo preexistente na lista.',
        'Preencha os termos contratuais, carga horária associada e dados do contratado.',
        'Envie o contrato para assinatura digital do colaborador ou realize o arquivamento no cadastro do usuário.'
      ]
    },
    '5': {
      id: '5',
      category: 'BANCO DE HORAS',
      title: 'Como acompanhar o saldo, realizar lançamentos e compensar banco de horas',
      updated_at: 'há 2 dias',
      content: `Gerencie os saldos positivos e negativos do banco de horas da sua equipe e faça acertos manuais quando necessário.

Acompanhe como realizar os lançamentos no sistema:`,
      steps: [
        'Clique na opção Banco de Horas no menu de módulos de gestão.',
        'Selecione o colaborador ou equipe para visualizar o saldo acumulado (créditos ou débitos).',
        'Para realizar baixas ou compensações manuais, clique em Adicionar Lançamento.',
        'Defina o tipo de movimento (Débito/Crédito), a quantidade de horas e adicione uma justificativa.',
        'Clique em Confirmar para atualizar instantaneamente o saldo do banco de horas do colaborador.'
      ]
    },
    '6': {
      id: '6',
      category: 'DISTRIBUIÇÃO DE DOCS',
      title: 'Como enviar holerites, informes e comunicados individuais ou em massa',
      updated_at: 'há 2 dias',
      content: `A Distribuição de Documentos facilita o envio direto de recibos de pagamento, informativos de rendimento e notificações aos colaboradores.

Siga o passo a passo para disponibilizar novos arquivos:`,
      steps: [
        'Acesse o menu Distribuição de Docs no painel do Gestor.',
        'Clique em Novo Envio / Enviar Documentos.',
        'Escolha a categoria do arquivo (Holerite, Informe de Rendimentos, Aviso de Férias ou Comunicado Geral).',
        'Selecione os destinatários (um colaborador específico, um departamento inteiro ou todos os usuários).',
        'Faça o upload do arquivo (PDF ou imagem) e clique em Enviar Documento para disponibilizá-lo para assinatura e consulta no perfil dos colaboradores.'
      ]
    },
    '7': {
      id: '7',
      category: 'COMUNICAÇÃO INTERNA',
      title: 'Como criar e gerenciar avisos e comunicados no painel dos colaboradores',
      updated_at: 'há 3 dias',
      content: `A Módulo de Comunicação Interna permite que o gestor publique informativos gerais e monitore as confirmações de leitura da equipe.

Para publicar um novo comunicado, siga as instruções:`,
      steps: [
        'No menu principal de gestão, selecione Comunicação interna.',
        'Clique em Novo Comunicado para redigir um aviso para a equipe.',
        'Preencha o título, texto do comunicado e defina o público-alvo (departamento ou empresa inteira).',
        'Defina se o comunicado exige confirmação de leitura por parte do colaborador.',
        'Clique em Publicar para que o aviso seja exibido no painel e aplicativo dos colaboradores.'
      ]
    },
    '8': {
      id: '8',
      category: 'ASSISTENTE TRABALHISTA',
      title: 'Como utilizar o Assistente Trabalhista para consultas legais e normas da CLT',
      updated_at: 'há 3 dias',
      content: `O Assistente Trabalhista é um guia prático para auxiliar gestores e equipes de RH no cumprimento das diretrizes da CLT e Portarias do MTE.

Acesse o assistente seguindo os passos abaixo:`,
      steps: [
        'Clique no card Assistente Trabalhista no menu de gestão.',
        'Utilize o campo de busca ou os tópicos recomendados para pesquisar dúvidas sobre regramentos trabalhistas (ex: limites de jornada, regras de banco de horas, prazos de pagamento de férias).',
        'Visualize as orientações fundamentadas na legislação vigente (CLT e Portarias MTE).',
        'Aplique as boas práticas e diretrizes sugeridas no tratamento do ponto e gestão da sua equipe.'
      ]
    },
    '9': {
      id: '9',
      category: 'PERFIL SEGURO',
      title: 'Como realizar a verificação de antecedentes e integridade cadastral de colaboradores',
      updated_at: 'há 3 dias',
      content: `O Perfil Seguro é a ferramenta do sistema focada em Compliance e validação rápida de dados cadastrais e checagens documentais.

Veja como solicitar uma verificação:`,
      steps: [
        'Acesse o módulo Perfil Seguro no painel de gestão.',
        'Digite o CPF ou selecione o colaborador cadastrado que deseja consultar.',
        'Escolha o tipo de checagem a ser realizada (validação de dados cadastrais, verificação de documentos ou certidões).',
        'Clique em Solicitar Consulta para processar as informações com segurança.',
        'Visualize o relatório gerado na tela com os status de validação cadastral para acompanhamento de Compliance e RH.'
      ]
    }
  };

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

    if (fallbackArticles[id]) {
      setArticle(fallbackArticles[id]);
    } else {
      setArticle(fallbackArticles['1']);
    }
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
                  <h3 className="font-bold text-slate-800 text-sm">Resumo do Passo a Passo:</h3>
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
