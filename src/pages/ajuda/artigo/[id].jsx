import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Clock, ThumbsUp, CheckCircle } from 'lucide-react';
import { articlesData } from '../articlesData';

export default function ArtigoDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  // Módulo Usuários - Todos os 28 Artigos Mapeados
  const usersArticles = {
    'como-transferir-um-colaborador-de-departamento': {
      id: 'como-transferir-um-colaborador-de-departamento',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como transferir um colaborador de departamento',
      updated_at: 'há 1 dia',
      content: `A alteração de departamento é realizada diretamente na ficha cadastral do usuário no painel de administração do Wiaponto.`,
      steps: [
        'Acesse o menu Usuários no painel do Gestor.',
        'Localize e clique sobre o nome do colaborador desejado.',
        'Acesse a aba Dados de Perfil / Informações.',
        'No campo Departamento, selecione o novo setor de destino.',
        'Clique em Salvar alterações para confirmar a transferência.'
      ]
    },
    'como-corrigir-o-nome-do-colaborador-para-o-relogio-e-os-documentos-reconhecerem': {
      id: 'como-corrigir-o-nome-do-colaborador-para-o-relogio-e-os-documentos-reconhecerem',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como corrigir o nome do colaborador para o relógio e os documentos reconhecerem',
      updated_at: 'há 1 dia',
      content: `A grafia exata do nome é fundamental para a sincronização dos relógios REP e emissão correta de documentos legais.`,
      steps: [
        'Vá para o menu Usuários e abra a ficha do colaborador.',
        'Edite o campo Nome Completo garantindo que não existam caracteres especiais ou espaços extras.',
        'Clique em Salvar.',
        'Sincronize o relógio ponto via rede para atualizar a lista de colaboradores localmente.'
      ]
    },
    'como-corrigir-o-cpf-de-um-colaborador-cadastrado-errado': {
      id: 'como-corrigir-o-cpf-de-um-colaborador-cadastrado-errado',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como corrigir o CPF de um colaborador cadastrado errado',
      updated_at: 'há 1 dia',
      content: `O CPF é a chave primária de identificação. Caso esteja incorreto e o usuário ainda não possua registros de ponto vinculados, é possível fazer a edição direta.`,
      steps: [
        'Acesse o módulo Usuários e selecione o perfil.',
        'No campo CPF, digite os números corretos.',
        'Verifique se a mensagem de validação aprova o número formatado.',
        'Clique em Salvar no fim da página.'
      ]
    },
    'como-corrigir-ou-alterar-a-data-de-admissao-do-colaborador': {
      id: 'como-corrigir-ou-alterar-a-data-de-admissao-do-colaborador',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como corrigir ou alterar a data de admissão do colaborador',
      updated_at: 'há 1 dia',
      content: `A data de admissão afeta os cálculos do espelho de ponto, cálculo de férias e integração com a folha.`,
      steps: [
        'Abra o módulo Usuários e selecione o colaborador.',
        'Na aba Informações Contratuais / Dados do Perfil, encontre o campo Data de Admissão.',
        'Ajuste para a data correta no calendário.',
        'Salve as alterações e verifique o espelho de ponto do período.'
      ]
    },
    'como-remover-do-aplicativo-os-colaboradores-ja-desligados': {
      id: 'como-remover-do-aplicativo-os-colaboradores-ja-desligados',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como remover do aplicativo os colaboradores já desligados',
      updated_at: 'há 1 dia',
      content: `Para remover o acesso de ex-colaboradores ao aplicativo mobile sem perder os registros históricos, altere o status do cadastro.`,
      steps: [
        'Acesse Usuários no painel Web.',
        'Localize o ex-colaborador e abra seu cadastro.',
        'Altere a chave Status do Usuário de "Ativo" para "Inativo".',
        'Confirme a inativação para revogar instantaneamente a autenticação do aplicativo.'
      ]
    },
    'qual-a-diferenca-entre-inativar-e-excluir-um-colaborador': {
      id: 'qual-a-diferenca-entre-inativar-e-excluir-um-colaborador',
      category: 'MÓDULO USUÁRIOS',
      title: 'Qual a diferença entre inativar e excluir um colaborador',
      updated_at: 'há 1 dia',
      content: `Entenda o impacto de cada ação no sistema Wiaponto para garantir a retenção legal dos dados de ponto.`,
      steps: [
        'Inativar: Mantém o histórico completo de marcações, documentos e holerites no sistema, porém bloqueia o acesso do funcionário ao aplicativo e relógio.',
        'Excluir: Remove o cadastro da visualização direta (ação recomendada apenas quando o cadastro foi efetuado por engano e não possui registros de ponto associados).'
      ]
    },
    'cadastrar-usuarios-no-relogio-via-navegador-admin-login-admin-admin': {
      id: 'cadastrar-usuarios-no-relogio-via-navegador-admin-login-admin-admin',
      category: 'MÓDULO USUÁRIOS',
      title: 'Cadastrar usuários no relógio via navegador admin (login admin/admin)',
      updated_at: 'há 1 dia',
      content: `Acesse a interface Web nativa do relógio físico para cadastrar digitais ou nomes diretamente no equipamento.`,
      steps: [
        'Conecte o computador na mesma rede local (IP) do relógio de ponto.',
        'Digite o IP do relógio na barra de endereços do navegador.',
        'Realize o login utilizando as credenciais padrão (admin / admin).',
        'Navegue até a aba Gestão de Usuários e adicione os dados correspondentes ao ID do colaborador cadastrado no Wiaponto.'
      ]
    },
    'como-recuperar-colaboradores-excluidos-por-engano': {
      id: 'como-recuperar-colaboradores-excluidos-por-engano',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como recuperar colaboradores excluídos por engano',
      updated_at: 'há 1 dia',
      content: `Registros apagados inadvertidamente podem ser restaurados pelo filtro de lixeira/excluídos.`,
      steps: [
        'No menu Usuários, acesse o filtro de Status da listagem.',
        'Selecione a opção "Excluídos / Lixeira".',
        'Localize o colaborador na lista e clique no ícone Restaurar.',
        'O perfil retornará à lista de ativos com o seu histórico preservado.'
      ]
    },
    'como-anexar-atestado-ou-documento-ao-perfil-do-colaborador': {
      id: 'como-anexar-atestado-ou-documento-ao-perfil-do-colaborador',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como anexar atestado ou documento ao perfil do colaborador',
      updated_at: 'há 1 dia',
      content: `Mantenha documentos médicos, contratos e certificados centralizados na ficha do colaborador.`,
      steps: [
        'Acesse o cadastro do colaborador no módulo Usuários.',
        'Navegue até a aba Documentos / Anexos.',
        'Clique no botão Fazer Upload de Documento.',
        'Selecione o arquivo no computador, informe o título/tipo e confirme o salvamento.'
      ]
    },
    'como-importar-colaboradores-em-massa-pela-planilha-modelo': {
      id: 'como-importar-colaboradores-em-massa-pela-planilha-modelo',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como importar colaboradores em massa pela planilha modelo',
      updated_at: 'há 1 dia',
      content: `Agilize a implantação importando dados de múltiplos colaboradores via arquivo CSV/Excel.`,
      steps: [
        'No menu Usuários, clique no botão Ações > Importar Planilha.',
        'Baixe a Planilha Modelo fornecida pelo sistema.',
        'Preencha os campos obrigatórios (Nome, CPF, Admissão, Cargo) sem alterar os cabeçalhos.',
        'Faça o upload da planilha e valide as informações no pré-visualizador antes de importar.'
      ]
    },
    'como-recuperar-o-espelho-de-ponto-de-um-ex-colaborador-inativado': {
      id: 'como-recuperar-o-espelho-de-ponto-de-um-ex-colaborador-inativado',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como recuperar o espelho de ponto de um ex-colaborador inativado',
      updated_at: 'há 1 dia',
      content: `O histórico de ponto de funcionários inativos fica retido no sistema para fins de auditoria e rescisão.`,
      steps: [
        'Acesse o módulo Espelho de Ponto.',
        'Nos filtros de busca, altere o filtro Status do Colaborador para "Inativos" ou "Todos".',
        'Busque pelo nome ou CPF do ex-colaborador.',
        'Selecione o período retroativo desejado para visualizar ou exportar o espelho.'
      ]
    },
    'como-cadastrar-um-usuario-individualmente': {
      id: 'como-cadastrar-um-usuario-individualmente',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como cadastrar um usuário individualmente',
      updated_at: 'há 1 dia',
      content: `Inclusão manual de novos colaboradores no painel principal.`,
      steps: [
        'No menu Usuários, clique no botão + Novo Usuário.',
        'Preencha a aba Informações Pessoais (Nome, CPF, Data de Nascimento).',
        'Vá para Informações Contratuais (Admissão, Cargo, Departamento e Jornada).',
        'Clique no botão Salvar Cadastro.'
      ]
    },
    'como-cadastrar-colaboradores-em-duas-empresas-do-mesmo-grupo': {
      id: 'como-cadastrar-colaboradores-em-duas-empresas-do-mesmo-grupo',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como cadastrar colaboradores em duas empresas do mesmo grupo',
      updated_at: 'há 1 dia',
      content: `Para colaboradores com vínculo em múltiplos CNPJs no mesmo grupo econômico.`,
      steps: [
        'Cadastre o usuário na primeira empresa no menu Usuários.',
        'Alterne para a segunda empresa no menu superior de seleção de empresas.',
        'Acesse Usuários > Vincular Usuário Existente.',
        'Digite o CPF do colaborador para importar e configurar o segundo vínculo contratual.'
      ]
    },
    'como-anexar-o-atestado-ou-documentos-no-perfil-do-colaborador': {
      id: 'como-anexar-o-atestado-ou-documentos-no-perfil-do-colaborador',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como anexar o atestado ou documentos no perfil do colaborador',
      updated_at: 'há 1 dia',
      content: `Armazene comprovantes e atestados de ausência no repositório individual do usuário.`,
      steps: [
        'Abra o cadastro do colaborador no módulo Usuários.',
        'Selecione a guia Documentos.',
        'Escolha a opção Adicionar Documento e selecione a categoria (Atestado Médico / Geral).',
        'Anexe o arquivo PDF ou imagem e salve.'
      ]
    },
    'como-mudar-o-dono-da-conta-para-outro-usuario': {
      id: 'como-mudar-o-dono-da-conta-para-outro-usuario',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como mudar o dono da conta para outro usuário',
      updated_at: 'há 1 dia',
      content: `A transferência da titularidade da conta (Dono/Administrador Master) requer alteração nas permissões Globais.`,
      steps: [
        'Acesse Configurações > Usuários e Permissões do Sistema.',
        'Localize o usuário que assumirá o perfil de Proprietário.',
        'Altere a função do perfil para "Administrador Geral / Dono da Conta".',
        'Confirme a transição via autenticação de segurança ou e-mail de verificação.'
      ]
    },
    'por-que-demora-para-gerar-o-id-de-um-colaborador-recem-cadastrado': {
      id: 'por-que-demora-para-gerar-o-id-de-um-colaborador-recem-cadastrado',
      category: 'MÓDULO USUÁRIOS',
      title: 'Por que demora para gerar o ID de um colaborador recém-cadastrado',
      updated_at: 'há 1 dia',
      content: `O ID numérico do relógio é sincronizado de forma assíncrona entre o banco de dados na nuvem e o hardware de ponto local.`,
      steps: [
        'A geração do ID ocorre em poucos segundos após a validação do CPF.',
        'Verifique se a conexão de rede entre o servidor e o relógio de ponto está ativa.',
        'Se o ID demorar para aparecer no relógio, acesse o painel e solicite a "Forçar Sincronização de Relógio".'
      ]
    },
    'como-o-gestor-faz-a-assinatura-do-contrato': {
      id: 'como-o-gestor-faz-a-assinatura-do-contrato',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como o gestor faz a assinatura do contrato',
      updated_at: 'há 1 dia',
      content: `Assinatura digital de termos e contratos de trabalho pelo painel administrativo.`,
      steps: [
        'Acesse o módulo Contratos ou a ficha do colaborador em Usuários > Contratos.',
        'Clique na pendência de assinatura referente ao contrato gerado.',
        'Selecione Assinar Digitalmente e insira a senha do gestor ou utilize o certificado configurado.',
        'Confirme o aceite para consolidar a assinatura no documento.'
      ]
    },
    'como-cadastrar-dependentes-do-colaborador': {
      id: 'como-cadastrar-dependentes-do-colaborador',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como cadastrar dependentes do colaborador',
      updated_at: 'há 1 dia',
      content: `Registro de dependentes para fins de imposto de renda, salário família e benefícios.`,
      steps: [
        'Acesse o módulo Usuários e abra a ficha do colaborador.',
        'Selecione a aba Dependentes na barra lateral.',
        'Clique em + Adicionar Dependente.',
        'Preencha o Nome, CPF, Data de Nascimento e Parentesco, e salve as alterações.'
      ]
    },
    'como-cadastrar-ou-atualizar-a-foto-do-colaborador-para-o-reconhecimento-facial': {
      id: 'como-cadastrar-ou-atualizar-a-foto-do-colaborador-para-o-reconhecimento-facial',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como cadastrar ou atualizar a foto do colaborador para o reconhecimento facial',
      updated_at: 'há 1 dia',
      content: `Garanta a precisão na validação biométrica ajustando a foto cadastral para a inteligência facial.`,
      steps: [
        'No módulo Usuários, abra o perfil do colaborador.',
        'Na aba Dados de Perfil, clique na imagem de avatar / foto do colaborador.',
        'Faça o upload de uma foto nítida e bem iluminada (fundo neutro e sem acessórios como óculos escuros e boné).',
        'Clique em Salvar e aguarde a sincronização com o aplicativo/relógio.'
      ]
    },
    'como-anexar-atestados-e-documentos-no-perfil-do-colaborador': {
      id: 'como-anexar-atestados-e-documentos-no-perfil-do-colaborador',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como anexar atestados e documentos no perfil do colaborador',
      updated_at: 'há 1 dia',
      content: `Centralização de documentação trabalhista na nuvem Wiaponto.`,
      steps: [
        'Abra o menu Usuários e escolha o colaborador.',
        'Vá até a aba Documentos.',
        'Clique em Fazer Upload e selecione o tipo do arquivo.',
        'Confirme o envio para armazená-lo com segurança.'
      ]
    },
    'como-cadastrar-beneficios-do-colaborador': {
      id: 'como-cadastrar-beneficios-do-colaborador',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como cadastrar benefícios do colaborador',
      updated_at: 'há 1 dia',
      content: `Atribuição de vale-transporte, vale-refeição e convênios no cadastro do funcionário.`,
      steps: [
        'No módulo Usuários, abra o cadastro do funcionário.',
        'Acesse a guia Benefícios.',
        'Clique em + Associar Benefício.',
        'Selecione o benefício cadastrado na empresa, defina o valor/desconto e confirme.'
      ]
    },
    'como-criar-campos-adicionais-no-cadastro-do-colaborador': {
      id: 'como-criar-campos-adicionais-no-cadastro-do-colaborador',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como criar campos adicionais no cadastro do colaborador',
      updated_at: 'há 1 dia',
      content: `Personalize a ficha de cadastro incluindo campos sob medida para a necessidade da sua empresa.`,
      steps: [
        'Acesse Configurações do Sistema > Campos Customizados.',
        'Clique em Criar Novo Campo Customizado.',
        'Escolha o tipo de campo (Texto, Seleção, Data ou Número) e defina o nome (Ex: Número do Calçado, Tamanho do Uniforme).',
        'Salve a configuração para que o campo apareça no cadastro de todos os usuários.'
      ]
    },
    'como-dar-acesso-de-gerente-a-filiais-e-departamentos-especificos': {
      id: 'como-dar-acesso-de-gerente-a-filiais-e-departamentos-especificos',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como dar acesso de gerente a filiais e departamentos específicos',
      updated_at: 'há 1 dia',
      content: `Configure alçadas de gerenciamento restritas para supervisores de equipe.`,
      steps: [
        'No módulo Usuários, selecione o perfil do gestor/supervisor.',
        'Navegue até a guia Permissões e Acessos.',
        'Defina o perfil de acesso como "Gerente/Supervisor".',
        'Na opção Restrição de Escopo, marque apenas as Filiais e Departamentos que este gerente poderá visualizar/tratar.'
      ]
    },
    'como-alterar-dados-cadastrais-do-colaborador': {
      id: 'como-alterar-dados-cadastrais-do-colaborador',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como alterar dados cadastrais do colaborador',
      updated_at: 'há 1 dia',
      content: `Mantenha atualizadas as informações pessoais, contato e dados bancários do colaborador.`,
      steps: [
        'Acesse o módulo Usuários.',
        'Clique sobre o colaborador desejado.',
        'Edite as informações necessárias diretamente nos campos liberados.',
        'Clique em Salvar no canto inferior da página.'
      ]
    },
    'usuario-e-senha-invalidos-como-resolver': {
      id: 'usuario-e-senha-invalidos-como-resolver',
      category: 'MÓDULO USUÁRIOS',
      title: '‘Usuário e senha inválidos’: como resolver',
      updated_at: 'há 1 dia',
      content: `Passos de diagnóstico quando o colaborador não consegue autenticar no aplicativo ou painel Web.`,
      steps: [
        'Verifique se o CPF foi inserido sem pontos ou traço no login inicial.',
        'Confirme se o status do usuário no painel do gestor está marcado como "Ativo".',
        'No menu Usuários, acesse o cadastro do colaborador e clique no botão Resetar / Enviar Nova Senha.',
        'Oriente o usuário a verificar a caixa de e-mail ou tentar o login padrão inicial.'
      ]
    },
    'como-transferir-um-colaborador-entre-filiais-ou-cnpjs-diferentes': {
      id: 'como-transferir-um-colaborador-entre-filiais-ou-cnpjs-diferentes',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como transferir um colaborador entre filiais ou CNPJs diferentes',
      updated_at: 'há 1 dia',
      content: `Procedimento para transferências de empregados entre empresas do mesmo grupo econômico.`,
      steps: [
        'Acesse Usuários no painel da empresa de origem.',
        'Abra o cadastro do colaborador e selecione Ações > Transferir Empresa/Filial.',
        'Escolha o CNPJ de destino e defina a data de efetivação da transferência.',
        'Confirme a migração para que a nova filial passe a responder pelo histórico do funcionário.'
      ]
    },
    'como-inativar-ou-reativar-um-usuario': {
      id: 'como-inativar-ou-reativar-um-usuario',
      category: 'MÓDULO USUÁRIOS',
      title: 'Como inativar ou reativar um usuário',
      updated_at: 'há 1 dia',
      content: `Altere a situação do usuário para liberar licenças de uso ou reabilitar colaboradores recontratados.`,
      steps: [
        'Acesse o menu Usuários no painel de gestão.',
        'Utilize a busca para encontrar o colaborador.',
        'Alterne a chave de Status no canto superior direito da ficha do colaborador entre "Ativo" e "Inativo".',
        'Clique em Salvar para atualizar imediatamente as permissões do perfil.'
      ]
    },
    'cpf-cadastrado-em-outro-usuario-como-resolver': {
      id: 'cpf-cadastrado-em-outro-usuario-como-resolver',
      category: 'MÓDULO USUÁRIOS',
      title: 'CPF cadastrado em outro usuário: como resolver',
      updated_at: 'há 1 dia',
      content: `Resolução de duplicidade de CPF no banco de dados.`,
      steps: [
        'No menu Usuários, utilize o campo de pesquisa global e busque pelo número do CPF informado.',
        'Verifique se o número foi inserido por engano em outro cadastro de colaborador ou se o usuário está na aba "Inativos".',
        'Se for um registro duplicado sem histórico, acesse o cadastro incorreto e corrija o número.',
        'Se o colaborador for recontratado, basta Reativar o cadastro anterior em vez de criar um novo.'
      ]
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchArticleDetails();
  }, [id]);

  const fetchArticleDetails = async () => {
  setLoading(true);

  // 1. Tenta buscar no Supabase se configurado
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

  // 2. Fallback no array unificado (articlesData)
  const foundArticle = articlesData.find((art) => art.id === id);

  if (foundArticle) {
    setArticle(foundArticle);
  } else {
    // Se não encontrar o ID informado, exibe o primeiro por padrão
    setArticle(articlesData[0]);
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
                {article.category || 'MÓDULO USUÁRIOS'}
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
