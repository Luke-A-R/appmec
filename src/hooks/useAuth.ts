/**
 * =====================================================
 * USEAUTH.TS - HOOK DE AUTENTICAÇÃO COM SUPABASE
 * =====================================================
 *
 * Este arquivo contém a lógica de login/logout do sistema.
 * Um "hook" é como se fosse uma ferramenta que outros componentes podem usar.
 *
 * O QUE ESTE HOOK FAZ:
 * 1. Verifica se o usuário já está logado (ao abrir o sistema)
 * 2. Guarda os dados do usuário logado
 * 3. Fornece função para fazer login
 * 4. Fornece função para fazer logout (sair)
 * 5. Gerencia sessão automaticamente via Supabase Auth
 *
 * COMO USAR:
 * const { user, login, logout, isAuthenticated } = useAuth();
 *
 * AUTENTICAÇÃO:
 * Usa o Supabase Auth com JWT para autenticação real.
 * A sessão é gerenciada automaticamente pelo Supabase.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ========================================
// DEFINIÇÃO DO TIPO DE USUÁRIO
// ========================================
// Define quais dados um usuário logado tem
interface User {
  id: string;              // ID único do usuário no Supabase
  email: string;           // Email do usuário
  username: string;        // Nome de exibição (derivado do email)
  isAuthenticated: boolean; // Se está autenticado (logado)
}

// ========================================
// HOOK DE AUTENTICAÇÃO
// ========================================
export const useAuth = () => {
  // Estado que guarda os dados do usuário logado
  // Começa como null (ninguém logado)
  const [user, setUser] = useState<User | null>(null);

  // Estado que indica se está carregando os dados
  // (útil para mostrar animação de loading ao abrir)
  const [isLoading, setIsLoading] = useState(true);

  // ========================================
  // VERIFICAÇÃO INICIAL E MONITORAMENTO
  // ========================================
  // Este código:
  // 1. Verifica se já existe uma sessão ativa
  // 2. Monitora mudanças no estado de autenticação
  useEffect(() => {
    // Função para buscar a sessão atual
    const getInitialSession = async () => {
      try {
        // Busca a sessão atual do Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Erro ao buscar sessão:', error);
          return;
        }

        // Se existe uma sessão, extrai os dados do usuário
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.email?.split('@')[0] || 'Usuário',
            isAuthenticated: true
          };
          setUser(userData);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Busca sessão inicial
    getInitialSession();

    // ========================================
    // MONITORA MUDANÇAS NO ESTADO DE AUTENTICAÇÃO
    // ========================================
    // Este listener é chamado quando:
    // - Usuário faz login
    // - Usuário faz logout
    // - Sessão expira
    // - Token é renovado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          // Usuário fez login
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.email?.split('@')[0] || 'Usuário',
            isAuthenticated: true
          };
          setUser(userData);
        } else if (event === 'SIGNED_OUT') {
          // Usuário fez logout
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token foi renovado - atualiza dados
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.email?.split('@')[0] || 'Usuário',
            isAuthenticated: true
          };
          setUser(userData);
        }
      }
    );

    // Cleanup: remove o listener quando o componente é desmontado
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ========================================
  // FUNÇÃO DE LOGIN
  // ========================================
  // Faz login usando Supabase Auth
  // Retorna objeto com success e error
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Tenta fazer login com email e senha
      const { data: _data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Se houve erro, retorna o erro traduzido
        let errorMessage = 'Erro ao fazer login';

        // Traduz mensagens de erro comuns
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns segundos.';
        }

        return { success: false, error: errorMessage };
      }

      // Login bem-sucedido
      // O onAuthStateChange vai atualizar o estado automaticamente
      return { success: true };
    } catch (error: any) {
      console.error('Erro inesperado no login:', error);
      return { success: false, error: 'Erro inesperado. Tente novamente.' };
    }
  };

  // ========================================
  // FUNÇÃO DE LOGOUT (SAIR)
  // ========================================
  // Faz logout usando Supabase Auth
  const logout = async () => {
    try {
      // Faz logout no Supabase
      await supabase.auth.signOut();

      // Limpa o estado local
      // O onAuthStateChange também vai disparar SIGNED_OUT
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, limpa o estado local
      setUser(null);
    }
  };

  // ========================================
  // RETORNA OS DADOS E FUNÇÕES
  // ========================================
  // Tudo que está aqui pode ser usado por outros componentes
  return {
    user,                                              // Dados do usuário logado (ou null se não logado)
    isLoading,                                         // Se está carregando
    login,                                             // Função para fazer login
    logout,                                            // Função para sair
    isAuthenticated: user?.isAuthenticated || false     // Se está logado
  };
};
