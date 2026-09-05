// articlesData.js
export const articlesData = [
  // --- ARTIGOS PADRÃO ---
  {
    id: '1',
    categoryId: 'primeiros-passos',
    category: 'PRIMEIROS PASSOS',
    title: 'Como acessar o Wiaponto pelo navegador (computador e celular)',
    time: 'há 4 dias',
    updated_at: 'há 4 dias',
    role: 'todos',
    content: `Para acessar o sistema Wiaponto de qualquer dispositivo com navegação web, siga as orientações gerais de acesso:\n\n1. Abra o seu navegador de preferência.\n2. Acesse o endereço oficial da plataforma.\n3. Informe suas credenciais de acesso (E-mail ou CPF) e a senha cadastrada.\n4. Caso seja o seu primeiro acesso, realize a confirmação de senha exigida por segurança.`,
    steps: [
      'Acesse o site oficial pelo seu navegador.',
      'Insira seu usuário e senha nos campos indicados.',
      'Clique em "Entrar" para acessar o painel principal.'
    ]
  },
  {
    id: '2',
    categoryId: 'bate-ponto',
    category: 'REGISTROS',
    title: 'Como registrar o ponto com foto e localização',
    time: '1 min de leitura',
    updated_at: '1 min de leitura',
    role: 'todos',
    content: `Para registrar a sua jornada diária com facilidade e segurança, siga o passo a passo através da página principal de registro do WiaPonto.`,
    steps: [
      'Acesse a página /ponto e clique no botão laranja "Bater ponto".',
      'Verifique se o GPS foi validado e clique em "Tirar Foto" para registrar a selfie.',
      'Clique no botão "CONFIRMAR PONTO" para concluir o registro.'
    ]
  },
  {
    id: '3',
    categoryId: 'documentos-avisos',
    category: 'DOCUMENTOS E AVISOS',
    title: 'Como assinar folhas de ponto, visualizar documentos e acompanhar avisos',
    time: '2 min de leitura',
    updated_at: '2 min de leitura',
    role: 'todos',
    content: `Na área de Documentos, o RH centraliza a assinatura de espelhos de ponto e arquivos. O colaborador visualiza arquivos e acompanha comunicados em tempo real.`,
    steps: [
      'Acesso: Utilize a opção "Documentos" na barra superior ou o botão "Ver documentos" na tela de registro.',
      'Assinaturas: Acesse a aba Espelho, revise os registros pendentes e realize a assinatura.',
      'Avisos e Arquivos: Navegue pelas abas do menu lateral para conferir informativos da empresa.'
    ]
  },
  {
    id: '4',
    categoryId: 'espelho-ponto',
    category: 'ESPELHO DE PONTO',
    title: 'Como consultar o histórico de registros e solicitar ajustes de ponto',
    time: '2 min de leitura',
    updated_at: '2 min de leitura',
    role: 'todos',
    content: `O Espelho de Ponto permite acompanhar todo o seu histórico de batidas, verificar resumos de horas e solicitar correções em casos de divergências.`,
    steps: [
      'Consulta: Acesse via navbar em "Espelho de Ponto" ou pelo botão "Ver histórico de pontos".',
      'Acompanhamento: Verifique suas marcações diárias e o saldo geral de horas.',
      'Solicitação de Ajuste: Clique em "Solicitar ajuste" na tela inicial para enviar justificativas.'
    ]
  },
  {
    id: '5',
    categoryId: 'cerca-virtual',
    category: 'CERCA VIRTUAL',
    title: 'Como impedir o colaborador de bater ponto fora da empresa',
    time: 'há 4 dias',
    updated_at: 'há 4 dias',
    role: 'gestor',
    content: `A Cerca Virtual limita o registro de ponto aos locais geográficos autorizados pela gestão da empresa.`,
    steps: [
      'Acesse o menu Cerca Virtual no painel do Gestor.',
      'Defina o raio de tolerância em metros ao redor do endereço da empresa.',
      'Ative o bloqueio de marcação fora do perímetro e salve.'
    ]
  },

  // --- MÓDULO CONTRATOS ---
  {
    id: 'como-o-gestor-faz-a-assinatura-do-contrato',
    categoryId: 'contratos',
    category: 'CONTRATOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como o gestor faz a assinatura do contrato',
    content: `A assinatura de contratos de trabalho e termos aditivos pelo gestor é feita de forma totalmente digital pelo painel administrativo, garantindo validade jurídica e agilidade no processo de contratação.`,
    steps: [
      'Acesse o módulo "Contratos" ou navegue até o menu "Usuários > Contratos".',
      'Localize a lista de contratos pendentes de assinatura do gestor.',
      'Clique sobre o contrato desejado para visualizar a minuta completa.',
      'Clique no botão "Assinar Digitalmente".',
      'Informe a sua senha de verificação de segurança do gestor ou utilize a autenticação via certificado configurado.',
      'Confirme a assinatura para concluir a validação do documento.'
    ]
  },
  {
    id: 'como-criar-e-enviar-um-contrato-digital-para-o-colaborador',
    categoryId: 'contratos',
    category: 'CONTRATOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como criar e enviar um contrato digital para o colaborador',
    content: `Gere e envie contratos de trabalho, aditivos e termos de compromisso diretamente para o e-mail ou aplicativo do colaborador para coleta de assinatura eletrônica.`,
    steps: [
      'Acesse o menu "Contratos" no painel do Gestor.',
      'Clique no botão "+ Novo Contrato".',
      'Selecione o colaborador desejado ou utilize um modelo de contrato pré-definido.',
      'Preencha as cláusulas personalizadas ou revise os campos automáticos da minuta.',
      'Clique em "Gerar e Enviar para Assinatura".',
      'O colaborador receberá uma notificação via e-mail e aplicativo para realizar o aceite e a assinatura digital.'
    ]
  },

  // --- MÓDULO ADMISSÃO ---
  {
    id: 'como-usar-o-perfil-seguro-consulta-de-cadastro-processos-e-antecedentes',
    categoryId: 'admissao',
    category: 'ADMISSÃO',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como usar o Perfil Seguro (consulta de cadastro, processos e antecedentes)',
    content: `O recurso Perfil Seguro permite consultar e verificar a veracidade das informações cadastrais, processos e histórico de antecedentes antes de concluir o processo de admissão do colaborador.`,
    steps: [
      'Acesse o módulo Admissão no painel do Gestor.',
      'Clique na opção "Perfil Seguro" no menu superior ou lateral do módulo.',
      'Insira o CPF do candidato e clique em "Consultar Perfil".',
      'Revise o relatório retornado contendo a validação cadastral e antecedentes.',
      'Anexe a consulta ao processo de admissão para acompanhamento do RH.'
    ]
  },
  {
    id: 'como-editar-um-template-de-admissao-ja-criado',
    categoryId: 'admissao',
    category: 'ADMISSÃO',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como editar um template de admissão já criado',
    content: `Você pode alterar os requisitos de documentos, formulários solicitados ou etapas de um template de admissão existente sempre que os processos da empresa mudarem.`,
    steps: [
      'Acesse o menu Admissão > Templates de Admissão.',
      'Localize o template que deseja atualizar na lista.',
      'Clique no ícone de "Editar" (lápis) ao lado do nome do template.',
      'Adicione, remova ou altere a obrigatoriedade dos documentos e campos exigidos.',
      'Clique em "Salvar Alterações" para atualizar o modelo.'
    ]
  },
  {
    id: 'como-iniciar-uma-admissao-para-um-novo-colaborador',
    categoryId: 'admissao',
    category: 'ADMISSÃO',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como iniciar uma admissão para um novo colaborador',
    content: `Envie o convite de admissão prévia diretamente para o e-mail ou WhatsApp do novo funcionário para que ele preencha os dados e envie os documentos solicitados.`,
    steps: [
      'Acesse o painel do Gestor e entre na opção "Admissão".',
      'Clique no botão "+ Nova Admissão".',
      'Informe o Nome, E-mail, Celular e selecione o Template de Admissão apropriado.',
      'Clique em "Enviar Convite de Admissão".',
      'Acompanhe o preenchimento e o envio dos documentos pela dashboard de status.'
    ]
  },
  {
    id: 'como-criar-um-template-de-admissao',
    categoryId: 'admissao',
    category: 'ADMISSÃO',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como criar um template de admissão',
    content: `Crie modelos padronizados de solicitação de documentos (Ex: RG, CNH, Comprovante de Residência, Carteira de Trabalho) de acordo com o cargo ou departamento do colaborador.`,
    steps: [
      'Acesse o módulo "Admissão" e selecione a aba "Templates".',
      'Clique em "+ Criar Novo Template".',
      'Defina um nome para o template (Ex: Admissão Padrão CLT / Operacional).',
      'Marque os documentos que devem ser obrigatoriamente anexados pelo candidato.',
      'Clique em "Salvar Template" para liberá-lo nos novos envios.'
    ]
  },

  // --- 28 ARTIGOS DO MÓDULO USUÁRIOS ---
  {
    id: 'como-transferir-um-colaborador-de-departamento',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como transferir um colaborador de departamento',
    content: `A alteração de departamento é realizada diretamente na ficha cadastral do usuário no painel de administração do Wiaponto.`,
    steps: [
      'Acesse o menu Usuários no painel do Gestor.',
      'Localize e clique sobre o nome do colaborador desejado.',
      'Acesse a aba Dados de Perfil / Informações.',
      'No campo Departamento, selecione o novo setor de destino.',
      'Clique em Salvar alterações para confirmar a transferência.'
    ]
  },
  {
    id: 'como-corrigir-o-nome-do-colaborador-para-o-relogio-e-os-documentos-reconhecerem',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como corrigir o nome do colaborador para o relógio e os documentos reconhecerem',
    content: `A grafia exata do nome é fundamental para a sincronização dos relógios REP e emissão correta de documentos legais.`,
    steps: [
      'Vá para o menu Usuários e abra a ficha do colaborador.',
      'Edite o campo Nome Completo garantindo que não existam caracteres especiais ou espaços extras.',
      'Clique em Salvar.',
      'Sincronize o relógio ponto via rede para atualizar a lista de colaboradores localmente.'
    ]
  },
  {
    id: 'como-corrigir-o-cpf-de-um-colaborador-cadastrado-errado',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como corrigir o CPF de um colaborador cadastrado errado',
    content: `O CPF é a chave primária de identificação. Caso esteja incorreto e o usuário ainda não possua registros de ponto vinculados, é possível fazer a edição direta.`,
    steps: [
      'Acesse o módulo Usuários e selecione o perfil.',
      'No campo CPF, digite os números corretos.',
      'Verifique se a mensagem de validação aprova o número formatado.',
      'Clique em Salvar no fim da página.'
    ]
  },
  {
    id: 'como-corrigir-ou-alterar-a-data-de-admissao-do-colaborador',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como corrigir ou alterar a data de admissão do colaborador',
    content: `A data de admissão afeta os cálculos do espelho de ponto, cálculo de férias e integração com a folha.`,
    steps: [
      'Abra o módulo Usuários e selecione o colaborador.',
      'Na aba Informações Contratuais / Dados do Perfil, encontre o campo Data de Admissão.',
      'Ajuste para a data correta no calendário.',
      'Salve as alterações e verifique o espelho de ponto do período.'
    ]
  },
  {
    id: 'como-remover-do-aplicativo-os-colaboradores-ja-desligados',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como remover do aplicativo os colaboradores já desligados',
    content: `Para remover o acesso de ex-colaboradores ao aplicativo mobile sem perder os registros históricos, altere o status do cadastro.`,
    steps: [
      'Acesse Usuários no painel Web.',
      'Localize o ex-colaborador e abra seu cadastro.',
      'Altere a chave Status do Usuário de "Ativo" para "Inativo".',
      'Confirme a inativação para revogar instantaneamente a autenticação do aplicativo.'
    ]
  },
  {
    id: 'qual-a-diferenca-entre-inativar-e-excluir-um-colaborador',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Qual a diferença entre inativar e excluir um colaborador',
    content: `Entenda o impacto de cada ação no sistema Wiaponto para garantir a retenção legal dos dados de ponto.`,
    steps: [
      'Inativar: Mantém o histórico completo de marcações, documentos e holerites no sistema, porém bloqueia o acesso do funcionário ao aplicativo e relógio.',
      'Excluir: Remove o cadastro da visualização direta (ação recomendada apenas quando o cadastro foi efetuado por engano e não possui registros de ponto associados).'
    ]
  },
  {
    id: 'cadastrar-usuarios-no-relogio-via-navegador-admin-login-admin-admin',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Cadastrar usuários no relógio via navegador admin (login admin/admin)',
    content: `Acesse a interface Web nativa do relógio físico para cadastrar digitais ou nomes diretamente no equipamento.`,
    steps: [
      'Conecte o computador na mesma rede local (IP) do relógio de ponto.',
      'Digite o IP do relógio na barra de endereços do navegador.',
      'Realize o login utilizando as credenciais padrão (admin / admin).',
      'Navegue até a aba Gestão de Usuários e adicione os dados correspondentes ao ID do colaborador cadastrado no Wiaponto.'
    ]
  },
  {
    id: 'como-recuperar-colaboradores-excluidos-por-engano',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como recuperar colaboradores excluídos por engano',
    content: `Registros apagados inadvertidamente podem ser restaurados pelo filtro de lixeira/excluídos.`,
    steps: [
      'No menu Usuários, acesse o filtro de Status da listagem.',
      'Selecione a opção "Excluídos / Lixeira".',
      'Localize o colaborador na lista e clique no ícone Restaurar.',
      'O perfil retornará à lista de ativos com o seu histórico preservado.'
    ]
  },
  {
    id: 'como-anexar-atestado-ou-documento-ao-perfil-do-colaborador',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como anexar atestado ou documento ao perfil do colaborador',
    content: `Mantenha documentos médicos, contratos e certificados centralizados na ficha do colaborador.`,
    steps: [
      'Acesse o cadastro do colaborador no módulo Usuários.',
      'Navegue até a aba Documentos / Anexos.',
      'Clique no botão Fazer Upload de Documento.',
      'Selecione o arquivo no computador, informe o título/tipo e confirme o salvamento.'
    ]
  },
  {
    id: 'como-importar-colaboradores-em-massa-pela-planilha-modelo',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como importar colaboradores em massa pela planilha modelo',
    content: `Agilize a implantação importando dados de múltiplos colaboradores via arquivo CSV/Excel.`,
    steps: [
      'No menu Usuários, clique no botão Ações > Importar Planilha.',
      'Baixe a Planilha Modelo fornecida pelo sistema.',
      'Preencha os campos obrigatórios (Nome, CPF, Admissão, Cargo) sem alterar os cabeçalhos.',
      'Faça o upload da planilha e valide as informações no pré-visualizador antes de importar.'
    ]
  },
  {
    id: 'como-recuperar-o-espelho-de-ponto-de-um-ex-colaborador-inativado',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como recuperar o espelho de ponto de um ex-colaborador inativado',
    content: `O histórico de ponto de funcionários inativos fica retido no sistema para fins de auditoria e rescisão.`,
    steps: [
      'Acesse o módulo Espelho de Ponto.',
      'Nos filtros de busca, altere o filtro Status do Colaborador para "Inativos" ou "Todos".',
      'Busque pelo nome ou CPF do ex-colaborador.',
      'Selecione o período retroativo desejado para visualizar ou exportar o espelho.'
    ]
  },
  {
    id: 'como-cadastrar-um-usuario-individualmente',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como cadastrar um usuário individualmente',
    content: `Inclusão manual de novos colaboradores no painel principal.`,
    steps: [
      'No menu Usuários, clique no botão + Novo Usuário.',
      'Preencha a aba Informações Pessoais (Nome, CPF, Data de Nascimento).',
      'Vá para Informações Contratuais (Admissão, Cargo, Departamento e Jornada).',
      'Clique no botão Salvar Cadastro.'
    ]
  },
  {
    id: 'como-cadastrar-colaboradores-em-duas-empresas-do-mesmo-grupo',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como cadastrar colaboradores em duas empresas do mesmo grupo',
    content: `Para colaboradores com vínculo em múltiplos CNPJs no mesmo grupo econômico.`,
    steps: [
      'Cadastre o usuário na primeira empresa no menu Usuários.',
      'Alterne para a segunda empresa no menu superior de seleção de empresas.',
      'Acesse Usuários > Vincular Usuário Existente.',
      'Digite o CPF do colaborador para importar e configurar o segundo vínculo contratual.'
    ]
  },
  {
    id: 'como-anexar-o-atestado-ou-documentos-no-perfil-do-colaborador',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como anexar o atestado ou documentos no perfil do colaborador',
    content: `Armazene comprovantes e atestados de ausência no repositório individual do usuário.`,
    steps: [
      'Abra o cadastro do colaborador no módulo Usuários.',
      'Selecione a guia Documentos.',
      'Escolha a opção Adicionar Documento e selecione a categoria (Atestado Médico / Geral).',
      'Anexe o arquivo PDF ou imagem e salve.'
    ]
  },
  {
    id: 'como-mudar-o-dono-da-conta-para-outro-usuario',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como mudar o dono da conta para outro usuário',
    content: `A transferência da titularidade da conta (Dono/Administrador Master) requer alteração nas permissões Globais.`,
    steps: [
      'Acesse Configurações > Usuários e Permissões do Sistema.',
      'Localize o usuário que assumirá o perfil de Proprietário.',
      'Altere a função do perfil para "Administrador Geral / Dono da Conta".',
      'Confirme a transição via autenticação de segurança ou e-mail de verificação.'
    ]
  },
  {
    id: 'por-que-demora-para-gerar-o-id-de-um-colaborador-recem-cadastrado',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Por que demora para gerar o ID de um colaborador recém-cadastrado',
    content: `O ID numérico do relógio é sincronizado de forma assíncrona entre o banco de dados na nuvem e o hardware de ponto local.`,
    steps: [
      'A geração do ID ocorre em poucos segundos após a validação do CPF.',
      'Verifique se a conexão de rede entre o servidor e o relógio de ponto está ativa.',
      'Se o ID demorar para aparecer no relógio, acesse o painel e solicite a "Forçar Sincronização de Relógio".'
    ]
  },
  {
    id: 'como-cadastrar-dependentes-do-colaborador',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como cadastrar dependentes do colaborador',
    content: `Registro de dependentes para fins de imposto de renda, salário família e benefícios.`,
    steps: [
      'Acesse o módulo Usuários e abra a ficha do colaborador.',
      'Selecione a aba Dependentes na barra lateral.',
      'Clique em + Adicionar Dependente.',
      'Preencha o Nome, CPF, Data de Nascimento e Parentesco, e salve as alterações.'
    ]
  },
  {
    id: 'como-cadastrar-ou-atualizar-a-foto-do-colaborador-para-o-reconhecimento-facial',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como cadastrar ou atualizar a foto do colaborador para o reconhecimento facial',
    content: `Garanta a precisão na validação biométrica ajustando a foto cadastral para a inteligência facial.`,
    steps: [
      'No módulo Usuários, abra o perfil do colaborador.',
      'Na aba Dados de Perfil, clique na imagem de avatar / foto do colaborador.',
      'Faça o upload de uma foto nítida e bem iluminada (fundo neutro e sem acessórios como óculos escuros e boné).',
      'Clique em Salvar e aguarde a sincronização com o aplicativo/relógio.'
    ]
  },
  {
    id: 'como-anexar-atestados-e-documentos-no-perfil-do-colaborador',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como anexar atestados e documentos no perfil do colaborador',
    content: `Centralização de documentação trabalhista na nuvem Wiaponto.`,
    steps: [
      'Abra o menu Usuários e escolha o colaborador.',
      'Vá até a aba Documentos.',
      'Clique em Fazer Upload e selecione o tipo do arquivo.',
      'Confirme o envio para armazená-lo com segurança.'
    ]
  },
  {
    id: 'como-cadastrar-beneficios-do-colaborador',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como cadastrar benefícios do colaborador',
    content: `Atribuição de vale-transporte, vale-refeição e convênios no cadastro do funcionário.`,
    steps: [
      'No módulo Usuários, abra o cadastro do funcionário.',
      'Acesse a guia Benefícios.',
      'Clique em + Associar Benefício.',
      'Selecione o benefício cadastrado na empresa, defina o valor/desconto e confirme.'
    ]
  },
  {
    id: 'como-criar-campos-adicionais-no-cadastro-do-colaborador',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como criar campos adicionais no cadastro do colaborador',
    content: `Personalize a ficha de cadastro incluindo campos sob medida para a necessidade da sua empresa.`,
    steps: [
      'Acesse Configurações do Sistema > Campos Customizados.',
      'Clique em Criar Novo Campo Customizado.',
      'Escolha o tipo de campo (Texto, Seleção, Data ou Número) e defina o nome.',
      'Salve a configuração para que o campo apareça no cadastro de todos os usuários.'
    ]
  },
  {
    id: 'como-dar-acesso-de-gerente-a-filiais-e-departamentos-especificos',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como dar acesso de gerente a filiais e departamentos específicos',
    content: `Configure alçadas de gerenciamento restritas para supervisores de equipe.`,
    steps: [
      'No módulo Usuários, selecione o perfil do gestor/supervisor.',
      'Navegue até a guia Permissões e Acessos.',
      'Defina o perfil de acesso como "Gerente/Supervisor".',
      'Na opção Restrição de Escopo, marque apenas as Filiais e Departamentos que este gerente poderá visualizar/tratar.'
    ]
  },
  {
    id: 'como-alterar-dados-cadastrais-do-colaborador',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como alterar dados cadastrais do colaborador',
    content: `Mantenha atualizadas as informações pessoais, contato e dados bancários do colaborador.`,
    steps: [
      'Acesse o módulo Usuários.',
      'Clique sobre o colaborador desejado.',
      'Edite as informações necessárias diretamente nos campos liberados.',
      'Clique em Salvar no canto inferior da página.'
    ]
  },
  {
    id: 'usuario-e-senha-invalidos-como-resolver',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: '‘Usuário e senha inválidos’: como resolver',
    content: `Passos de diagnóstico quando o colaborador não consegue autenticar no aplicativo ou painel Web.`,
    steps: [
      'Verifique se o CPF foi inserido sem pontos ou traço no login inicial.',
      'Confirme se o status do usuário no painel do gestor está marcado como "Ativo".',
      'No menu Usuários, acesse o cadastro do colaborador e clique no botão Resetar / Enviar Nova Senha.',
      'Oriente o usuário a verificar a caixa de e-mail ou tentar o login padrão inicial.'
    ]
  },
  {
    id: 'como-transferir-um-colaborador-entre-filiais-ou-cnpjs-diferentes',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como transferir um colaborador entre filiais ou CNPJs diferentes',
    content: `Procedimento para transferências de empregados entre empresas do mesmo grupo econômico.`,
    steps: [
      'Acesse Usuários no painel da empresa de origem.',
      'Abra o cadastro do colaborador e selecione Ações > Transferir Empresa/Filial.',
      'Escolha o CNPJ de destino e defina a data de efetivação da transferência.',
      'Confirme a migração para que a nova filial passe a responder pelo histórico do funcionário.'
    ]
  },
  {
    id: 'como-inativar-ou-reativar-um-usuario',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'Como inativar ou reativar um usuário',
    content: `Altere a situação do usuário para liberar licenças de uso ou reabilitar colaboradores recontratados.`,
    steps: [
      'Acesse o menu Usuários no painel de gestão.',
      'Utilize a busca para encontrar o colaborador.',
      'Alterne a chave de Status no canto superior direito da ficha do colaborador entre "Ativo" e "Inativo".',
      'Clique em Salvar para atualizar imediatamente as permissões do perfil.'
    ]
  },
  {
    id: 'cpf-cadastrado-em-outro-usuario-como-resolver',
    categoryId: 'modulo-usuarios',
    category: 'MÓDULO USUÁRIOS',
    role: 'gestor',
    time: 'há 1 dia',
    updated_at: 'há 1 dia',
    title: 'CPF cadastrado em outro usuário: como resolver',
    content: `Resolução de duplicidade de CPF no banco de dados.`,
    steps: [
      'No menu Usuários, utilize o campo de pesquisa global e busque pelo número do CPF informado.',
      'Verifique se o número foi inserido por engano em outro cadastro de colaborador ou se o usuário está na aba "Inativos".',
      'Se for um registro duplicado sem histórico, acesse o cadastro incorreto e corrija o número.',
      'Se o colaborador for recontratado, basta Reativar o cadastro anterior em vez de criar um novo.'
    ]
  }
];
