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
      category: 'PRIMEIROS PASSOS',
      title: 'Como acessar o Wiaponto pelo navegador (computador e celular)',
      updated_at: 'há 4 dias',
      content: `Para acessar o sistema Wiaponto de qualquer dispositivo com navegação web, siga as orientações gerais de acesso:

1. Abra o seu navegador de preferência (Google Chrome, Safari, Edge ou Firefox).
2. Acesse o endereço oficial da plataforma fornecido pela sua empresa.
3. Informe suas credenciais de acesso (E-mail ou CPF) e a senha cadastrada.
4. Caso seja o seu primeiro acesso, realize a confirmação de senha exigida por segurança.`,
      steps: [
        'Acesse o site oficial pelo seu navegador.',
        'Insira seu usuário e senha nos campos indicados.',
        'Clique em "Entrar" para acessar o painel principal.'
      ]
    },
    '2': {
      id: '2',
      category: 'TUTORIAL DO COLABORADOR / REGISTROS',
      title: 'Como registrar o ponto com foto e localização',
      updated_at: '1 min de leitura',
      content: `Para registrar a sua jornada diária com facilidade e segurança, siga o passo a passo abaixo através da página principal de registro do WiaPonto:

Acesse a página de registro:
Entre no endereço wiaponto.vercel.app/ponto (ou clique em Bater Ponto no menu principal).

Inicie o registro:
Na tela inicial, clique no botão laranja principal com a escrita "Bater ponto".

Validação de foto e localização:
O sistema verificará automaticamente sua Localização (GPS). Certifique-se de permitir a permissão de localização no seu navegador/celular.
Na opção Selfie de Confirmação, clique em "Tirar Foto" para capturar sua imagem de validação.

Finalize a marcação:
Após a validação da localização e a foto ser capturada, o botão "CONFIRMAR PONTO" ficará ativo.
Clique em "CONFIRMAR PONTO" para salvar seu registro.`,
      steps: [
        'Acesse a página /ponto e clique no botão laranja "Bater ponto".',
        'Verifique se o GPS foi validado e clique em "Tirar Foto" para registrar a selfie.',
        'Clique no botão "CONFIRMAR PONTO" para concluir o registro.'
      ]
    },
    '3': {
      id: '3',
      category: 'DOCUMENTOS E AVISOS',
      title: 'Como assinar folhas de ponto, visualizar documentos e acompanhar avisos',
      updated_at: '2 min de leitura',
      content: `Na área de Documentos, o RH centraliza a assinatura de espelhos de ponto e arquivos e o colaborador visualiza arquivos enviados pelo RH e acompanha comunicados da empresa em tempo real.

Como acessar a área de Documentos:
Você pode acessar esta seção de duas formas simples:
- Opção 1: Clique no item "Documentos" localizado no menu superior (navbar).
- Opção 2: Na página inicial de bater ponto (/ponto), clique no botão "Ver documentos".

1. Assinando os Espelhos de Ponto:
No menu lateral esquerdo da tela de documentos, clique em Espelho.
Na aba Espelhos (Pendentes), localize a folha de ponto referente ao mês/período desejado.
Clique sobre o documento ou na opção de ação para revisar seus horários.
Após conferir os dados, siga as instruções na tela para efetuar a assinatura digital.
Assim que assinado, o documento será movido automaticamente para a aba Espelhos assinados.

2. Visualizando Arquivos Gerais:
No menu lateral esquerdo, clique em Arquivos em GERAL.
Nesta seção você encontrará comprovantes, contratos, manuais ou outros documentos disponibilizados diretamente pela empresa ou setor de RH.

3. Acompanhando Comunicados e Avisos:
No menu lateral esquerdo, selecione a opção Avisos.
Acompanhe em tempo real todos os comunicados, lembretes e notícias importantes publicados pela empresa para manter-se sempre atualizado.`,
      steps: [
        'Acesso: Utilize a opção "Documentos" na barra superior ou o botão "Ver documentos" na tela de registro.',
        'Assinaturas: Acesse a aba Espelho, revise os registros pendentes e realize a assinatura.',
        'Avisos e Arquivos: Navegue pelas abas do menu lateral para conferir informativos da empresa e arquivos em geral.'
      ]
    },
    '4': {
      id: '4',
      category: 'ESPELHO DE PONTO',
      title: 'Como consultar o histórico de registros e solicitar ajustes de ponto',
      updated_at: '2 min de leitura',
      content: `O Espelho de Ponto permite acompanhar todo o seu histórico de batidas, verificar resumos de horas e solicitar correções ou justificativas em casos de esquecimento ou divergências.

Como acessar o Espelho de Ponto e Histórico:
Você pode navegar até essa seção através de duas formas:
- Opção 1: Clique em "Espelho de Ponto" no menu superior (navbar).
- Opção 2: Na página principal de registro (/ponto), clique no botão "Ver histórico de pontos".

1. Consultado o Histórico e Resumos:
Ao acessar a página, você verá o detalhamento completo de todas as marcações do mês selecionado.
É possível conferir o resumo de horas trabalhadas, banco de horas e eventuais atrasos ou horas extras acumuladas no período.

2. Como Solicitar Correção ou Ajuste de Ponto:
Caso tenha esquecido de bater o ponto em algum horário ou precise anexar um atestado/justificativa:
- Acesse a tela principal de registro (/ponto).
- Clique no botão "Solicitar ajuste".
- Preencha as informações necessárias: Data e horário do ajuste necessário, Tipo de solicitação (inclusão de ponto, alteração ou justificativa/atestado) e Motivo/Observação explicando o ocorrido.
- Clique em Enviar para que a sua solicitação seja encaminhada ao setor de RH ou ao seu gestor para aprovação.`,
      steps: [
        'Consulta: Acesse via navbar em "Espelho de Ponto" ou pelo botão "Ver histórico de pontos".',
        'Acompanhamento: Verifique suas marcações diárias e o saldo geral de horas.',
        'Solicitação de Ajuste: Clique em "Solicitar ajuste" na tela inicial para enviar justificativas ou pedir correções de horários ao RH.'
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
