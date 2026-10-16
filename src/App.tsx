/**
 * =====================================================
 * APP.TSX - COMPONENTE PRINCIPAL DA APLICAÇÃO
 * =====================================================
 *
 * Este é o arquivo principal que controla toda a aplicação.
 * Ele decide qual tela mostrar baseado em:
 * 1. Se o usuário está logado ou não
 * 2. Qual seção o usuário selecionou no menu
 *
 * FUNCIONAMENTO:
 * - Se não logado: Mostra tela de Login
 * - Se logado: Mostra o Header + a seção ativa (Dashboard, Clientes, etc.)
 *
 * SEÇÕES DISPONÍVEIS:
 * - dashboard: Visão geral do sistema
 * - clients: Lista e gestão de clientes
 * - projects: Lista e gestão de serviços
 * - parts: Controle de estoque de peças
 * - schedule: Agenda de agendamentos
 * - proposals: Orçamentos
 * - revenue: Controle de receitas
 */

import React, { useState } from 'react';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { useAuth } from './hooks/useAuth';
import Dashboard from './components/Dashboard';
import ClientManagement from './components/ClientManagement';
import ProjectManagement from './components/ProjectManagement';
import NewClientForm from './components/NewClientForm';
import NewProjectForm from './components/NewProjectForm';
import Schedule from './components/Schedule';
import PartsManagement from './components/PartsManagement';
import ProjectProgress from './components/ProjectProgress';
import NewPartForm from './components/NewPartForm';
import ClientPartsManagement from './components/ClientPartsManagement';
import SystemHealthCheck from './components/SystemHealthCheck';
import ProposalManagement from './components/ProposalManagement';
import RevenueManagement from './components/RevenueManagement';

// Tipos de seções que podem ser exibidas - cada uma representa uma tela do sistema
type ActiveSection = 'dashboard' | 'clients' | 'projects' | 'new-client' | 'new-project' | 'schedule' | 'parts' | 'project-progress' | 'new-part' | 'client-parts' | 'health-check' | 'proposals' | 'revenue';

function App() {
  // ========================================
  // ESTADOS DA APLICAÇÃO
  // ========================================

  // Informações do usuário logado (vem do hook useAuth)
  const { user, isLoading, login, logout, isAuthenticated } = useAuth();

  // Controla qual tela está sendo exibida atualmente
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');

  // Guarda o ID do projeto selecionado para mostrar o progresso
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // ========================================
  // MONITORAMENTO DE PERFORMANCE
  // ========================================
  // Este código monitora quanto tempo a página leva para carregar
  // Útil para identificar problemas de lentidão
  React.useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          console.log(`Tempo de carregamento: ${entry.duration} milissegundos`);
        }
      }
    });
    observer.observe({ entryTypes: ['navigation'] });

    return () => observer.disconnect();
  }, []);

  // ========================================
  // FUNÇÃO PARA EXIBIR A SEÇÃO ATIVA
  // ========================================
  // Esta função decide qual componente mostrar baseado na seção selecionada
  const renderActiveSection = () => {
    switch (activeSection) {
      // Dashboard - Tela inicial com resumo do sistema
      case 'dashboard':
        return <Dashboard onNavigate={setActiveSection} />;

      // Clientes - Lista todos os clientes cadastrados
      case 'clients':
        return <ClientManagement onNewClient={() => setActiveSection('new-client')} />;

      // Projetos/Serviços - Lista todos os serviços
      case 'projects':
        return <ProjectManagement
          onNewProject={() => setActiveSection('new-project')}
          onProjectProgress={(projectId) => {
            setSelectedProjectId(projectId);
            setActiveSection('project-progress');
          }}
        />;

      // Formulário para cadastrar novo cliente
      case 'new-client':
        return <NewClientForm onBack={() => setActiveSection('clients')} />;

      // Formulário para criar novo serviço
      case 'new-project':
        return <NewProjectForm onBack={() => setActiveSection('projects')} />;

      // Agenda de agendamentos
      case 'schedule':
        return <Schedule />;

      // Gestão de peças (estoque)
      case 'parts':
        return <PartsManagement
          onNewPart={() => setActiveSection('new-part')}
          onClientParts={() => setActiveSection('client-parts')}
        />;

      // Progresso de um serviço específico
      case 'project-progress':
        return <ProjectProgress
          projectId={selectedProjectId}
          onBack={() => setActiveSection('projects')}
        />;

      // Formulário para cadastrar nova peça
      case 'new-part':
        return <NewPartForm
          onBack={() => setActiveSection('parts')}
          onPartCreated={() => setActiveSection('parts')}
        />;

      // Peças que os clientes trouxeram
      case 'client-parts':
        return <ClientPartsManagement
          onBack={() => setActiveSection('parts')}
        />;

      // Verificação de saúde do sistema
      case 'health-check':
        return <SystemHealthCheck />;

      // Gestão de orçamentos
      case 'proposals':
        return <ProposalManagement />;

      // Controle de receitas
      case 'revenue':
        return <RevenueManagement />;

      // Caso padrão: mostra o dashboard
      default:
        return <Dashboard onNavigate={setActiveSection} />;
    }
  };

  // ========================================
  // TELA DE CARREGAMENTO
  // ========================================
  // Mostra enquanto o sistema verifica se o usuário está logado
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          {/* Animação de loading - círculo girando */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // TELA DE LOGIN
  // ========================================
  // Se o usuário não está autenticado, mostra a tela de login
  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  // ========================================
  // APLICAÇÃO PRINCIPAL
  // ========================================
  // Aqui o usuário já está logado, então mostra:
  // 1. Header com menu de navegação
  // 2. A seção ativa (tela que o usuário selecionou)
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header - Menu superior com logo e navegação */}
      <Header
        user={user}
        onLogout={logout}
        activeSection={activeSection}
        onNavigate={setActiveSection}
      />

      {/* Conteúdo principal - A tela ativa é renderizada aqui */}
      <main className="pt-24 lg:pt-20">
        {renderActiveSection()}
      </main>
    </div>
  );
}

export default App;
