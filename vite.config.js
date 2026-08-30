/**
 * O QUE É ESTE ARQUIVO:
 * Arquivo de configuração do Vite (vite.config.js ou vite.config.ts), o bundler e servidor 
 * de desenvolvimento da aplicação.
 *
 * O QUE ELE FAZ:
 * 1. logLevel: Define o nível de logs do terminal para 'error', ocultando avisos (warnings) 
 *    e mensagens informativas comuns durante a execução para manter o console limpo.
 * 2. plugins: Habilita o plugin oficial do React (`@vitejs/plugin-react`), garantindo suporte 
 *    a Fast Refresh (atualização instantânea ao salvar arquivos) e compilação do JSX/TSX.
 * 3. resolve.alias: Configura o atalho de caminho `@` apontando para o diretório `./src`. 
 *    Isso permite importar componentes e módulos de forma limpa (ex: `import Button from '@/components/Button'`) 
 *    evitando caminhos relativos longos (ex: `../../components/Button`).
 */

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
