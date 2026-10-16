/**
 * =====================================================
 * MAIN.TSX - PONTO DE ENTRADA DA APLICAÇÃO
 * =====================================================
 *
 * Este é o arquivo que INICIA todo o sistema.
 * O navegador carrega este arquivo primeiro.
 *
 * O QUE ELE FAZ:
 * 1. Importa o React (biblioteca para criar interfaces)
 * 2. Importa o CSS global (estilos)
 * 3. Importa o componente App (a aplicação inteira)
 * 4. Renderiza tudo na página HTML
 *
 * StrictMode:
 * - Ajuda a encontrar problemas no código
 * - Não aparece na versão final (produção)
 *
 * NÃO É NECESSÁRIO MODIFICAR ESTE ARQUIVO
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Encontra o elemento HTML onde a aplicação será renderizada
// Este elemento está no arquivo index.html com id="root"
createRoot(document.getElementById('root')!).render(
  // StrictMode ajuda a encontrar problemas durante o desenvolvimento
  <StrictMode>
    <App />
  </StrictMode>
);
