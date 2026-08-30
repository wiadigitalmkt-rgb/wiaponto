/**
 * O QUE É ESTE ARQUIVO:
 * Arquivo de configuração do PostCSS (postcss.config.js ou postcss.config.mjs).
 * O PostCSS é uma ferramenta de compilação que processa o CSS da aplicação 
 * através de plugins JS antes de ser entregue ao navegador.
 *
 * O QUE ELE FAZ:
 * 1. tailwindcss: Ativa o processamento das diretivas do Tailwind CSS (@tailwind base, 
 *    components, utilities), convertendo as classes utilitárias no CSS final.
 * 2. autoprefixer: Adiciona automaticamente os prefixos de fornecedor (vendor prefixes, 
 *    como -webkit-, -moz-) às propriedades CSS para garantir compatibilidade 
 *    com navegadores mais antigos.
 */

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
