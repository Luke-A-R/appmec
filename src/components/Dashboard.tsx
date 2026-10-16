/**
 * =====================================================
 * DASHBOARD.TSX - PAINEL PRINCIPAL
 * =====================================================
 *
 * Este componente mostra a TELA INICIAL do sistema.
 * É a primeira coisa que o usuário vê após fazer login.
 *
 * O QUE ESTA TELA MOSTRA:
 * 1. Quantidade total de clientes
 * 2. Quantidade de serviços em andamento
 * 3. Receita mensal
 * 4. Alerta de peças com estoque baixo
 * 5. Alerta de peças sem estoque
 * 6. Lista dos serviços mais recentes
 * 7. Botões de ações rápidas
 *
 * COMO FUNCIONA:
 * - Os dados são buscados do banco de dados assim que a tela abre
 * - Atualiza automaticamente a cada 30 segundos
 * - Clicar nos cartões leva para a seção correspondente
 */

import React, { useState, useEffect } from 'react';
import { Users, Car, DollarSign, TrendingUp, Calendar, AlertTriangle, Plus, Package, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../lib/supabase';

// Propriedades que o Dashboard recebe
interface DashboardProps {
  // Função para navegar para outras telas
  onNavigate: (section: 'dashboard' | 'clients' | 'projects' | 'car-details' | 'schedule' | 'parts') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  // ========================================
  // ESTADOS DO COMPONENTE
  // ========================================

  // Estatísticas que aparecem nos cartões
  const [stats, setStats] = useState({
    totalClients: 0,
    inProgressProjects: 0,
    lowStockParts: 0,
    outOfStockParts: 0,
    monthlyRevenue: 0,
    totalValue: 0
  });

  // Lista dos serviços mais recentes
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  // Se está carregando os dados
  const [isLoading, setIsLoading] = useState(true);

  // Mês selecionado para o card de receita
  const [revenueMonth, setRevenueMonth] = useState(new Date().toISOString().slice(0, 7));

  // ========================================
  // CARREGAR DADOS DO BANCO
  // ========================================
  // Este código roda quando a tela abre e a cada 30 segundos
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [revenueMonth]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const startTime = performance.now();

      const [clients, projects, parts, revenue] = await Promise.all([
        db.getClients(),
        db.getProjects(),
        db.getParts(),
        db.getRevenueRecords(revenueMonth)
      ]);

      const lowStockParts = parts.filter(p => p.status === 'low-stock').length;
      const outOfStockParts = parts.filter(p => p.status === 'out-of-stock').length;
      const monthlyRevenue = revenue
        .filter((r: any) => r.payment_status === 'paid')
        .reduce((sum: number, r: any) => sum + r.amount, 0);

      setStats({
        totalClients: clients.length,
        inProgressProjects: projects.filter((p: any) => p.status === 'in-progress' || p.status === 'not-started').length,
        lowStockParts,
        outOfStockParts,
        monthlyRevenue,
        totalValue: parts.reduce((sum: number, p: any) => sum + (p.current_stock * p.unit_price), 0)
      });

      setRecentProjects(projects.slice(0, 3));

      const endTime = performance.now();
      console.log(`Dashboard loaded in ${endTime - startTime} milliseconds`);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      alert('Erro ao carregar dashboard. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  const statsData = [
    {
      title: 'Total de Clientes',
      value: stats.totalClients.toString(),
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Serviços em Andamento',
      value: stats.inProgressProjects.toString(),
      icon: Car,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
  ];

  const formatMonthLabel = (monthYear: string) => {
    const [year, month] = monthYear.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const shiftMonth = (delta: number) => {
    const [year, month] = revenueMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    setRevenueMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // ========================================
  // FUNÇÕES AUXILIARES PARA EXIBIR STATUS
  // ========================================

  /**
   * Converte o código do status para texto em português
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Finalizado';
      case 'in-progress':
        return 'Em Progresso';
      case 'not-started':
        return 'Não Iniciado';
      case 'on-hold':
        return 'Pausado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Agendado';
    }
  };

  /**
   * Retorna a cor do status (para o Badge/etiqueta)
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-400/10 text-green-400';
      case 'in-progress':
        return 'bg-blue-400/10 text-blue-400';
      case 'not-started':
        return 'bg-yellow-400/10 text-yellow-400';
      case 'on-hold':
        return 'bg-orange-400/10 text-orange-400';
      case 'cancelled':
        return 'bg-red-400/10 text-red-400';
      default:
        return 'bg-gray-400/10 text-gray-400';
    }
  };

  // ========================================
  // TELA DE CARREGANDO
  // ========================================
  // Mostra enquanto os dados estão sendo buscados
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Carregando...</div>
        </div>
      </div>
    );
  }

  // ========================================
  // INTERFACE PRINCIPAL DO DASHBOARD
  // ========================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Título da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Visão geral do seu negócio automotivo</p>
      </div>

      {/* ========================================
          GRADE DE CARTÕES DE ESTATÍSTICAS
          ======================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg cursor-pointer"
              onClick={() => {
                if (stat.title === 'Serviços em Andamento') {
                  onNavigate('projects');
                } else if (stat.title === 'Total de Clientes') {
                  onNavigate('clients');
                }
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-gray-400 text-sm">{stat.title}</p>
              </div>
            </div>
          );
        })}

        {/* Receita Mensal com seletor de mês */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-yellow-400/10">
              <DollarSign className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => shiftMonth(-1)}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-400 capitalize min-w-[90px] text-center">
                {formatMonthLabel(revenueMonth)}
              </span>
              <button
                onClick={() => shiftMonth(1)}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-gray-400 text-sm">Receita do Mês</p>
          </div>
        </div>

        {/* ========================================
            CARTÃO DE PEÇAS COM ESTOQUE BAIXO
            ======================================== */}
        {/* Este cartão mostra quantas peças estão com estoque baixo (amarelo) */}
        <div
          className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-yellow-500/50 transition-all duration-200 hover:shadow-lg cursor-pointer"
          onClick={() => onNavigate('parts')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-yellow-400/10">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
            </div>
            <span className="text-xs text-yellow-400 font-medium">Atenção</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{stats.lowStockParts}</h3>
            <p className="text-gray-400 text-sm">Peças Estoque Baixo</p>
          </div>
        </div>

        {/* ========================================
            CARTÃO DE PEÇAS SEM ESTOQUE
            ======================================== */}
        {/* Este cartão mostra quantas peças estão zeradas (vermelho - crítico) */}
        <div
          className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-200 hover:shadow-lg cursor-pointer"
          onClick={() => onNavigate('parts')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-red-400/10">
              <XCircle className="h-6 w-6 text-red-400" />
            </div>
            <span className="text-xs text-red-400 font-medium">Crítico</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{stats.outOfStockParts}</h3>
            <p className="text-gray-400 text-sm">Peças Sem Estoque</p>
          </div>
        </div>
      </div>

      {/* ========================================
          SERVIÇOS RECENTES E AÇÕES RÁPIDAS
          ======================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ========================================
            LISTA DE SERVIÇOS RECENTES
            ======================================== */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Serviços Recentes</h2>
            <button
              onClick={() => onNavigate('projects')}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Ver todos
            </button>
          </div>

          {/* Lista de serviços */}
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200"
              >
                {/* Nome do cliente e veículo */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-white font-medium">{project.client?.name || 'Cliente não encontrado'}</h3>
                    <p className="text-gray-400 text-sm">
                      {project.vehicle?.brand} {project.vehicle?.model} {project.vehicle?.year}
                    </p>
                  </div>
                  {/* Badge de status */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                </div>

                {/* Descrição do serviço */}
                <p className="text-gray-300 text-sm mb-3">{project.title}</p>

                {/* Barra de progresso */}
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress_percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            ))}

            {/* Mensagem se não houver serviços */}
            {recentProjects.length === 0 && (
              <div className="text-center py-8">
                <Car className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Nenhum serviço encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================
            AÇÕES RÁPIDAS
            ======================================== */}
        {/* Botões grandes para acessar as funções mais comuns */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">Ações Rápidas</h2>

          {/* Grade de botões 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            {/* Botão Novo Cliente */}
            <button
              onClick={() => onNavigate('clients')}
              className="bg-blue-600 hover:bg-blue-700 rounded-lg p-4 transition-colors duration-200 group"
            >
              <Plus className="h-6 w-6 text-white mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium text-sm">Novo Cliente</p>
            </button>

            {/* Botão Novo Serviço */}
            <button
              onClick={() => onNavigate('projects')}
              className="bg-green-600 hover:bg-green-700 rounded-lg p-4 transition-colors duration-200 group"
            >
              <Car className="h-6 w-6 text-white mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium text-sm">Novo Serviço</p>
            </button>

            {/* Botão Agendar */}
            <button
              onClick={() => onNavigate('schedule')}
              className="bg-yellow-600 hover:bg-yellow-700 rounded-lg p-4 transition-colors duration-200 group"
            >
              <Calendar className="h-6 w-6 text-white mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium text-sm">Agendar</p>
            </button>

            {/* Botão Peças */}
            <button
              onClick={() => onNavigate('parts')}
              className="bg-purple-600 hover:bg-purple-700 rounded-lg p-4 transition-colors duration-200 group"
            >
              <Package className="h-6 w-6 text-white mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium text-sm">Peças</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
