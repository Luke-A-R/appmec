/**
 * =====================================================
 * HEADER.TSX - BARRA SUPERIOR DO SISTEMA
 * =====================================================
 *
 * Este componente é a barra que aparece no topo de todas as telas.
 * Ela contém:
 * 1. Logo do sistema (ElvesPR)
 * 2. Menu de navegação para todas as seções
 * 3. Nome do usuário logado
 * 4. Botão de sair (logout)
 *
 * RESPONSIVIDADE:
 * - No computador: mostra todos os itens do menu lado a lado
 * - No celular: mostra os itens em uma barra que pode rolar horizontalmente
 */

import React from 'react';
import { LogOut, User, Car, Home, Users, FolderOpen, Calendar, Package, FileText, DollarSign, Activity } from 'lucide-react';

// Define quais seções podem ser acessadas pelo menu
type ActiveSection = 'dashboard' | 'clients' | 'projects' | 'schedule' | 'parts' | 'proposals' | 'revenue' | 'health-check';

// Propriedades que o componente precisa receber
interface HeaderProps {
  user: { username: string } | null;     // Dados do usuário logado
  onLogout: () => void;                  // Função para sair do sistema
  activeSection: ActiveSection;           // Qual seção está ativa agora
  onNavigate: (section: ActiveSection) => void; // Função para mudar de seção
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, activeSection, onNavigate }) => {
  // ========================================
  // ITENS DO MENU DE NAVEGAÇÃO
  // ========================================
  // Cada item tem: id (identificador), label (texto que aparece), icon (ícone)
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },      // Tela inicial
    { id: 'clients', label: 'Clientes', icon: Users },        // Gestão de clientes
    { id: 'projects', label: 'Serviços', icon: FolderOpen },   // Gestão de serviços
    { id: 'schedule', label: 'Agenda', icon: Calendar },       // Agenda
    { id: 'parts', label: 'Peças', icon: Package },            // Estoque de peças
    { id: 'proposals', label: 'Orçamentos', icon: FileText },  // Orçamentos
    { id: 'revenue', label: 'Receitas', icon: DollarSign },    // Controle financeiro
    { id: 'health-check', label: 'Sistema', icon: Activity },  // Status do sistema
  ];

  return (
    // ========================================
    // BARRA SUPERIOR (FIXA NO TOPO)
    // ========================================
    <header className="bg-gray-800 shadow-lg border-b border-gray-700 fixed top-0 left-0 right-0 z-50 min-h-[80px] lg:min-h-[64px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12 lg:h-16">

          {/* ========================================
              LOGO DO SISTEMA
              ======================================== */}
          <div className="flex items-center space-x-3">
            {/* Ícone do logo - quadrado azul com carro */}
            <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-lg">
              <Car className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
            </div>
            {/* Nome do sistema */}
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-white">
                ElvesPR
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                Gestão Automotiva
              </p>
            </div>
          </div>

          {/* ========================================
              MENU DE NAVEGAÇÃO (VAI APARECER NO COMPUTADOR)
              ======================================== */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              // Verifica se este item é o que está ativo (selecionado)
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as ActiveSection)}
                  // Se ativo: fundo azul e texto branco
                  // Se não ativo: texto cinza que fica branco ao passar mouse
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ========================================
              MENU DO USUÁRIO (DIREITA)
              ======================================== */}
          {user && (
            <div className="flex items-center space-x-2 lg:space-x-4">
              {/* Nome do usuário logado */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-300">
                <User className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="font-medium text-xs lg:text-sm">{user.username}</span>
              </div>

              {/* Botão de SAIR */}
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm text-gray-300 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                title="Sair do sistema"
              >
                <LogOut className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================
            MENU MOVEL (VAI APARECER NO CELULAR/TABLET)
            ======================================== */}
        <div className="lg:hidden pb-3 overflow-hidden">
          {/* Barra que rola horizontalmente quando não cabe na tela */}
          <div className="flex overflow-x-auto space-x-1 scrollbar-hide py-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as ActiveSection)}
                  // Layout vertical para economizar espaço no celular
                  className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 min-w-[70px] ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="text-[10px] leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
