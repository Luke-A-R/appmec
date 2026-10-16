/**
 * =====================================================
 * LOGIN.TSX - TELA DE ENTRADA DO SISTEMA
 * =====================================================
 *
 * Esta é a primeira tela que o usuário vê.
 * Ela aparece quando o usuário NÃO está logado.
 *
 * O QUE ESTA TELA FAZ:
 * 1. Pede email e senha
 * 2. Envia para o Supabase Auth verificar
 * 3. Se correto: entra no sistema
 * 4. Se incorreto: mostra mensagem de erro
 *
 * AUTENTICAÇÃO:
 * Usa Supabase Auth com JWT para autenticação real.
 */

import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Car } from 'lucide-react';

// Propriedades que o componente precisa
interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>; // Função que tenta fazer login
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // ========================================
  // ESTADOS DO FORMULÁRIO
  // ========================================
  // Estados guardam o que o usuário digita

  const [email, setEmail] = useState('');          // Email do usuário
  const [password, setPassword] = useState('');    // Senha
  const [showPassword, setShowPassword] = useState(false); // Se mostra a senha ou esconde
  const [error, setError] = useState('');          // Mensagem de erro
  const [isLoading, setIsLoading] = useState(false); // Se está carregando

  // ========================================
  // FUNÇÃO DE ENVIAR O FORMULÁRIO
  // ========================================
  // Esta função é chamada quando o usuário clica em "Entrar"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();     // Impede a página de recarregar
    setError('');            // Limpa erros anteriores
    setIsLoading(true);      // Mostra que está carregando

    try {
      // Tenta fazer login com as credenciais digitadas
      // Aguarda a resposta do Supabase Auth
      const result = await onLogin(email, password);

      // Se não funcionou, mostra mensagem de erro
      if (!result.success) {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      // Erro inesperado
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false); // Para de mostrar carregando
    }
  };

  return (
    // ========================================
    // CONTAINER PRINCIPAL (FUNDO ESCURO)
    // ========================================
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ========================================
            LOGO E TÍTULO
            ======================================== */}
        <div className="text-center mb-8">
          {/* Ícone do logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg">
            <Car className="w-8 h-8 text-white" />
          </div>
          {/* Nome do sistema */}
          <h1 className="text-3xl font-bold text-white mb-2">
            ElvesPR
          </h1>
          {/* Subtítulo */}
          <p className="text-gray-400">
            Gestão Automotiva Profissional
          </p>
        </div>

        {/* ========================================
            FORMULÁRIO DE LOGIN
            ======================================== */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* CAMPO DE EMAIL */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              {/* Campo com ícone de email dentro */}
              <div className="relative">
                {/* Ícone à esquerda */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                {/* Campo de email */}
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700 text-white placeholder-gray-400"
                  placeholder="Digite seu email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* CAMPO DE SENHA */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              {/* Campo com ícone de cadeado e botão mostrar/esconder */}
              <div className="relative">
                {/* Ícone de cadeado à esquerda */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                {/* Campo de senha (pode mostrar ou esconder) */}
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700 text-white placeholder-gray-400"
                  placeholder="Digite sua senha"
                  required
                  autoComplete="current-password"
                />
                {/* Botão para mostrar/esconder senha */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-400 transition-colors"
                >
                  {/* Mostra ícone diferente baseado no estado */}
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />  // Ícone de "esconder"
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />     // Ícone de "mostrar"
                  )}
                </button>
              </div>
            </div>

            {/* MENSAGEM DE ERRO (se houver) */}
            {error && (
              <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* BOTÃO DE ENTRAR */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {isLoading ? (
                // Se está carregando, mostra animação de loading
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Entrando...</span>
                </>
              ) : (
                // Se não está carregando, mostra botão normal
                <>
                  <Lock className="w-5 h-5" />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RODAPÉ DA TELA DE LOGIN */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            © 2025 ElvesPR - Gestão Automotiva. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};
