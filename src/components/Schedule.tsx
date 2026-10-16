/**
 * =====================================================
 * SCHEDULE.TSX - AGENDA DA OFICINA
 * =====================================================
 *
 * Este componente mostra a AGENDA da oficina.
 * É aqui que você vê e marca os agendamentos.
 *
 * O QUE ESTA TELA FAZ:
 * 1. Mostra calendário semanal com os agendamentos
 * 2. Permite criar novos agendamentos
 * 3. Permite ver detalhes de cada agendamento
 * 4. Permite mudar o status (agendado, em andamento, concluído, cancelado)
 * 5. Filtra e buscar agendamentos
 *
 * VISUALIZAÇÕES:
 * - Dia: Mostra apenas um dia
 * - Semana: Mostra 7 dias de uma vez (padrão)
 * - Mês: Mostra o mês inteiro
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Car, Plus, ChevronLeft, ChevronRight, Search, Save, X, Eye, Phone, Mail, Trash2 } from 'lucide-react';
import { db } from '../lib/supabase';
import ConfirmDialog from './ConfirmDialog';

// Parses "YYYY-MM-DD" as local date to avoid UTC midnight timezone shift
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const Schedule: React.FC = () => {
  // ========================================
  // ESTADOS DO COMPONENTE
  // ========================================

  // Data atual que está sendo visualizada
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modo de visualização: dia, semana ou mês
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  // Termo de busca para filtrar agendamentos
  const [searchTerm, setSearchTerm] = useState('');

  // Filtro de status (todos, agendados, concluídos, etc.)
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mostra/esconde formulário de novo agendamento
  const [showNewScheduleForm, setShowNewScheduleForm] = useState(false);

  // Mostra/esconde detalhes do agendamento
  const [showScheduleDetails, setShowScheduleDetails] = useState(false);

  // Agendamento selecionado para ver detalhes
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  // Lista de todos os agendamentos
  const [schedules, setSchedules] = useState<any[]>([]);

  // Se está carregando dados
  const [isLoading, setIsLoading] = useState(true);

  // Controle de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  // ========================================
  // DADOS DO NOVO AGENDAMENTO
  // ========================================
  // Campos do formulário de criar agendamento
  const [newSchedule, setNewSchedule] = useState({
    client_id: '',              // Código do cliente (opcional)
    vehicle_id: '',             // Código do veículo (opcional)
    title: '',                  // Título do agendamento
    person_name: '',            // Nome da pessoa
    service: '',                // Tipo de serviço
    scheduled_date: new Date().toISOString().split('T')[0], // Data agendada (hoje por padrão)
    scheduled_time: '09:00',    // Horário (9h por padrão)
    duration_hours: 2,          // Duração em horas
    priority: 'medium' as 'low' | 'medium' | 'high', // Prioridade
    notes: ''                   // Observações
  });

  // Dados de clientes e veículos para o formulário
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // ========================================
  // CARREGAR DADOS DO BANCO
  // ========================================
  // Busca os agendamentos quando a tela abre
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Função que carrega todos os agendamentos do banco
   */
  const loadData = async () => {
    try {
      setIsLoading(true);
      const startTime = performance.now();

      // Busca todos os agendamentos, clientes e veículos
      const [schedulesData, clientsData, vehiclesData] = await Promise.all([
        db.getSchedules(),
        db.getClients(),
        db.getVehicles()
      ]);

      setSchedules(schedulesData);
      setClients(clientsData);
      setVehicles(vehiclesData);

      const endTime = performance.now();
      console.log(`Schedule data loaded in ${endTime - startTime} milliseconds`);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar agenda. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // FUNÇÕES DO FORMULÁRIO
  // ========================================

  /**
   * Atualiza o estado quando o usuário digita nos campos
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewSchedule(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    // Quando muda o cliente, limpa o veículo selecionado
    if (name === 'client_id') {
      setNewSchedule(prev => ({ ...prev, vehicle_id: '' }));
    }
  };

  /**
   * Salva o novo agendamento no banco
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verifica se campos obrigatórios estão preenchidos
    if (!newSchedule.title || !newSchedule.person_name || !newSchedule.scheduled_date || !newSchedule.scheduled_time) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Salva no banco de dados
      await db.createSchedule({
        client_id: newSchedule.client_id || undefined,
        vehicle_id: newSchedule.vehicle_id || undefined,
        title: newSchedule.title,
        service: newSchedule.person_name,
        scheduled_date: newSchedule.scheduled_date,
        scheduled_time: newSchedule.scheduled_time,
        duration_hours: newSchedule.duration_hours,
        priority: newSchedule.priority,
        notes: newSchedule.notes
      });

      // Recarrega a lista
      await loadData();

      // Fecha o formulário
      setShowNewScheduleForm(false);

      // Limpa o formulário para o próximo
      setNewSchedule({
        client_id: '',
        vehicle_id: '',
        title: '',
        person_name: '',
        service: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '09:00',
        duration_hours: 2,
        priority: 'medium',
        notes: ''
      });
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      alert('Erro ao criar agendamento');
    }
  };

  // ========================================
  // FUNÇÕES DE VISUALIZAÇÃO
  // ========================================

  /**
   * Abre o modal de detalhes do agendamento
   */
  const handleViewDetails = (schedule: any) => {
    setSelectedSchedule(schedule);
    setShowScheduleDetails(true);
  };

  /**
   * Atualiza o status do agendamento
   * @param scheduleId - Código do agendamento
   * @param newStatus - Novo status (agendado, em andamento, concluído, cancelado)
   */
  const handleUpdateStatus = async (scheduleId: string, newStatus: 'scheduled' | 'in-progress' | 'completed' | 'cancelled') => {
    try {
      await db.updateSchedule(scheduleId, { status: newStatus });
      await loadData();

      // Atualiza o modal se estiver aberto
      if (selectedSchedule && selectedSchedule.id === scheduleId) {
        setSelectedSchedule({ ...selectedSchedule, status: newStatus });
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    setScheduleToDelete(scheduleId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    try {
      await db.deleteSchedule(scheduleToDelete);
      await loadData();
      setScheduleToDelete(null);
      setShowDeleteDialog(false);
      if (selectedSchedule?.id === scheduleToDelete) {
        setShowScheduleDetails(false);
        setSelectedSchedule(null);
      }
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      alert('Erro ao excluir agendamento. Tente novamente.');
    }
  };

  const cancelDeleteSchedule = () => {
    setScheduleToDelete(null);
    setShowDeleteDialog(false);
  };

  // ========================================
  // FUNÇÕES AUXILIARES PARA EXIBIR INFO
  // ========================================

  /**
   * Retorna a cor do status para exibição
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
      case 'in-progress':
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'completed':
        return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'cancelled':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
      default:
        return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    }
  };

  /**
   * Retorna a cor da borda esquerda baseado na prioridade
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-400';
      case 'medium':
        return 'border-l-yellow-400';
      case 'low':
        return 'border-l-green-400';
      default:
        return 'border-l-gray-400';
    }
  };

  /**
   * Converte código do status para texto em português
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'in-progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  /**
   * Formata a data por extenso em português
   */
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // ========================================
  // NAVEGAÇÃO DO CALENDÁRIO
  // ========================================

  /**
   * Navega para frente ou para trás no calendário
   * @param direction - 'prev' para voltar, 'next' para avançar
   */
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    // Adiciona ou subtrai baseado no modo de visualização
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }

    setCurrentDate(newDate);
  };

  /**
   * Retorna as datas da semana atual
   * Útil para mostrar na visualização semanal
   */
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    // Gera 7 dias a partir do domingo
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }

    return week;
  };

  /**
   * Retorna os agendamentos de uma data específica
   * Aplica filtros de busca e status
   */
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => {
      // Verifica se é na data
      const matchesDate = schedule.scheduled_date === dateStr;

      // Verifica se bate com a busca
      const matchesSearch = searchTerm === '' ||
        schedule.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.vehicle?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.service.toLowerCase().includes(searchTerm.toLowerCase());

      // Verifica o filtro de status
      const matchesFilter = filterStatus === 'all' || schedule.status === filterStatus;

      return matchesDate && matchesSearch && matchesFilter;
    });
  };

  // Calcula as datas da semana e eventos de hoje
  const weekDates = getWeekDates(currentDate);
  const todayEvents = getEventsForDate(new Date());

  // ========================================
  // TELA DE CARREGANDO
  // ========================================
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
  // INTERFACE PRINCIPAL
  // ========================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ========================================
          CABEÇALHO DA PÁGINA
          ======================================== */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Agenda</h1>
          <p className="text-gray-400">Gerencie seus agendamentos e compromissos</p>
        </div>

        {/* Botão de novo agendamento */}
        <button
          onClick={() => setShowNewScheduleForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* ========================================
          FORMULÁRIO DE NOVO AGENDAMENTO
          ======================================== */}
      {/* Aparece quando clica em "Novo Agendamento" */}
      {showNewScheduleForm && (
        <div className="mb-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Novo Agendamento</h2>
            <button
              onClick={() => setShowNewScheduleForm(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Linha 0: Cliente e Veículo (opcionais) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cliente (opcional)
                </label>
                <select
                  name="client_id"
                  value={newSchedule.client_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Veículo (opcional)
                </label>
                <select
                  name="vehicle_id"
                  value={newSchedule.vehicle_id}
                  onChange={handleInputChange}
                  disabled={!newSchedule.client_id}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">Selecione um veículo</option>
                  {vehicles
                    .filter(v => !newSchedule.client_id || v.client_id === newSchedule.client_id)
                    .map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} {vehicle.year}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Linha 1: Título e Nome da Pessoa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  name="title"
                  value={newSchedule.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Consultoria, Reunião com cliente"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome da Pessoa *
                </label>
                <input
                  type="text"
                  name="person_name"
                  value={newSchedule.person_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: João Silva, Maria Santos"
                  required
                />
              </div>
            </div>

            {/* Linha 2: Data, Horário e Duração */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data *
                </label>
                <input
                  type="date"
                  name="scheduled_date"
                  value={newSchedule.scheduled_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Horário *
                </label>
                <input
                  type="time"
                  name="scheduled_time"
                  value={newSchedule.scheduled_time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duração (horas)
                </label>
                <input
                  type="number"
                  name="duration_hours"
                  value={newSchedule.duration_hours}
                  onChange={handleInputChange}
                  min="0.5"
                  step="0.5"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowNewScheduleForm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Salvar Agendamento</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================
          CONTROLES DO CALENDÁRIO
          ======================================== */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Seletor de modo de visualização (Dia/Semana/Mês) */}
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
            {['day', 'week', 'month'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>

          {/* Navegação de data (setas) */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-white font-medium min-w-[200px] text-center">
              {formatDate(currentDate)}
            </span>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Busca e filtro */}
        <div className="flex items-center space-x-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar agendamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="scheduled">Agendados</option>
            <option value="in-progress">Em Andamento</option>
            <option value="completed">Concluídos</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* ========================================
          VISUALIZAÇÃO DO CALENDÁRIO (SEMANA)
          ======================================== */}
      {viewMode === 'week' && (
        <div className="mb-8 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* Cabeçalho com dias da semana */}
          <div className="grid grid-cols-7 border-b border-gray-700">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
              <div key={day} className="p-4 text-center border-r border-gray-700 last:border-r-0">
                <div className="text-gray-400 text-sm font-medium">{day}</div>
                <div className="text-white text-lg font-semibold mt-1">
                  {weekDates[index].getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Grade com os dias e eventos */}
          <div className="grid grid-cols-7 min-h-[300px]">
            {weekDates.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`p-2 border-r border-gray-700 last:border-r-0 ${
                    isToday ? 'bg-blue-600/5' : ''
                  }`}
                >
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-2 rounded text-xs border-l-2 cursor-pointer hover:bg-gray-700/50 transition-colors ${getPriorityColor(event.priority)} ${getStatusColor(event.status)}`}
                        onClick={() => handleViewDetails(event)}
                      >
                        <div className="font-medium truncate">{event.scheduled_time} - {event.client?.name}</div>
                        <div className="text-xs opacity-75 truncate">{event.service}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================
          AGENDAMENTOS DE HOJE
          ======================================== */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-400" />
          <span>Agendamentos de Hoje</span>
        </h2>

        {/* Se não tem agendamentos hoje */}
        {todayEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhum agendamento hoje</h3>
            <p className="text-gray-400">Você não tem compromissos agendados para hoje.</p>
          </div>
        ) : (
          // Lista de agendamentos de hoje
          <div className="space-y-4">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className={`bg-gray-700/50 rounded-lg p-4 border-l-4 ${getPriorityColor(event.priority)} hover:bg-gray-700 transition-colors duration-200`}
              >
                {/* Cabeçalho do evento */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-400/10 rounded-lg">
                      <Car className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{event.title}</h3>
                      <p className="text-gray-400 text-sm">{event.client?.name} - {event.vehicle?.brand} {event.vehicle?.model} {event.vehicle?.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                      {getStatusText(event.status)}
                    </span>
                    <button
                      onClick={() => handleViewDetails(event)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Ver Detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(event.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Excluir Agendamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Informações do evento */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>{event.scheduled_time} ({event.duration_hours}h)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <User className="h-4 w-4" />
                    <span>{event.client?.name}</span>
                  </div>
                  <div className="text-gray-300">
                    {event.service}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================
          MODAL DE DETALHES DO AGENDAMENTO
          ======================================== */}
      {/* Aparece quando clica em um agendamento */}
      {showScheduleDetails && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Fundo escuro com blur */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowScheduleDetails(false)}></div>

          {/* Modal */}
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
            {/* Cabeçalho do modal */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Detalhes do Agendamento</h3>
              <button
                onClick={() => setShowScheduleDetails(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status e Prioridade */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedSchedule.status)}`}>
                    {getStatusText(selectedSchedule.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border-l-4 ${getPriorityColor(selectedSchedule.priority)} bg-gray-700/50 text-gray-300`}>
                    Prioridade: {selectedSchedule.priority === 'high' ? 'Alta' : selectedSchedule.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
              </div>

              {/* Informações do Serviço */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Informações do Serviço</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Título</label>
                    <p className="text-white font-medium">{selectedSchedule.title}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Serviço</label>
                    <p className="text-white">{selectedSchedule.service}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Data</label>
                    <p className="text-white">{parseLocalDate(selectedSchedule.scheduled_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Horário</label>
                    <p className="text-white">{selectedSchedule.scheduled_time} ({selectedSchedule.duration_hours}h)</p>
                  </div>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Informações do Cliente</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">{selectedSchedule.client?.name}</p>
                      <p className="text-gray-400 text-sm">Cliente</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-white">{selectedSchedule.client?.phone}</p>
                      <p className="text-gray-400 text-sm">Telefone</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="text-white">{selectedSchedule.client?.email}</p>
                      <p className="text-gray-400 text-sm">Email</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações do Veículo */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Informações do Veículo</h4>
                <div className="flex items-center space-x-3">
                  <Car className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">
                      {selectedSchedule.vehicle?.brand} {selectedSchedule.vehicle?.model} {selectedSchedule.vehicle?.year}
                    </p>
                    <div className="text-gray-400 text-sm space-x-4">
                      {selectedSchedule.vehicle?.color && <span>Cor: {selectedSchedule.vehicle.color}</span>}
                      {selectedSchedule.vehicle?.license_plate && <span>Placa: {selectedSchedule.vehicle.license_plate}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedSchedule.notes && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Observações</h4>
                  <p className="text-gray-300">{selectedSchedule.notes}</p>
                </div>
              )}

              {/* Botões para mudar status */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Alterar Status</h4>
                <div className="flex flex-wrap gap-2">
                  {(['scheduled', 'in-progress', 'completed', 'cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedSchedule.id, status)}
                      disabled={selectedSchedule.status === status}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSchedule.status === status
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {getStatusText(status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Excluir agendamento */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleDeleteSchedule(selectedSchedule.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Excluir Agendamento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Excluir Agendamento"
        message="Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita."
        onConfirm={confirmDeleteSchedule}
        onCancel={cancelDeleteSchedule}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default Schedule;
