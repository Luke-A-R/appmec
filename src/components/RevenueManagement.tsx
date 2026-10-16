/**
 * =====================================================
 * REVENUEMANAGEMENT.TSX - CONTROLE FINANCEIRO
 * =====================================================
 *
 * Este componente gerencia o CONTROLE FINANCEIRO da oficina.
 * É aqui que você controla todas as receitas (entradas de dinheiro).
 *
 * FUNCIONALIDADES:
 * 1. Listar todas as receitas do mês
 * 2. Adicionar nova receita
 * 3. Filtrar por categoria (serviço, peças, mão de obra)
 * 4. Filtrar por status (pago, pendente, vencido)
 * 5. Buscar por cliente ou descrição
 * 6. Ver resumo financeiro do mês
 * 7. Excluir registro de receita
 *
 * CATEGORIAS:
 * - Serviço: Receita de serviços realizados
 * - Peças: Venda de peças
 * - Mão de obra: Cobrança de horas trabalhadas
 * - Outros: Qualquer outra receita
 *
 * STATUS DE PAGAMENTO:
 * - Pago: Cliente já pagou
 * - Pendente: Ainda não pagou
 * - Parcial: Pagou parte
 * - Vencido: Passou do prazo
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Search, CreditCard, Banknote, Smartphone, Building, FileCheck, Trash2 } from 'lucide-react';
import { db } from '../lib/supabase';
import ConfirmDialog from './ConfirmDialog';

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const RevenueManagement: React.FC = () => {
  // ========================================
  // ESTADOS DO COMPONENTE
  // ========================================

  // Lista de receitas
  const [revenueRecords, setRevenueRecords] = useState<any[]>([]);

  // Mês selecionado (padrão: mês atual)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');  // Filtro de categoria
  const [filterStatus, setFilterStatus] = useState('all');      // Filtro de status

  // Se está carregando
  const [isLoading, setIsLoading] = useState(true);

  // Formulário de adicionar receita
  const [showAddForm, setShowAddForm] = useState(false);

  // Lista de clientes (para selecionar)
  const [clients, setClients] = useState<any[]>([]);

  // Controle de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const [newRecord, setNewRecord] = useState({
    client_id: '',
    description: '',
    amount: '',
    category: 'service' as 'service' | 'parts' | 'labor' | 'other',
    payment_method: 'cash' as 'cash' | 'card' | 'pix' | 'transfer' | 'check',
    payment_status: 'paid' as 'pending' | 'paid' | 'partial' | 'overdue',
    due_date: null as string | null,
    paid_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const startTime = performance.now();
      const [revenueData, clientsData] = await Promise.all([
        db.getRevenueRecords(selectedMonth),
        db.getClients()
      ]);
      setRevenueRecords(revenueData);
      setClients(clientsData);
      const endTime = performance.now();
      console.log(`Revenue data loaded in ${endTime - startTime} milliseconds`);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar receitas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = revenueRecords.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || record.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || record.payment_status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const monthlyStats = {
    totalRevenue: filteredRecords.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + r.amount, 0),
    pendingRevenue: filteredRecords.filter(r => r.payment_status === 'pending').reduce((sum, r) => sum + r.amount, 0),
    overdueRevenue: filteredRecords.filter(r => r.payment_status === 'overdue').reduce((sum, r) => sum + r.amount, 0),
    totalRecords: filteredRecords.length,
    paidRecords: filteredRecords.filter(r => r.payment_status === 'paid').length
  };

  const categoryStats = {
    service: filteredRecords.filter(r => r.category === 'service' && r.payment_status === 'paid').reduce((sum, r) => sum + r.amount, 0),
    parts: filteredRecords.filter(r => r.category === 'parts' && r.payment_status === 'paid').reduce((sum, r) => sum + r.amount, 0),
    labor: filteredRecords.filter(r => r.category === 'labor' && r.payment_status === 'paid').reduce((sum, r) => sum + r.amount, 0),
    other: filteredRecords.filter(r => r.category === 'other' && r.payment_status === 'paid').reduce((sum, r) => sum + r.amount, 0)
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRecord(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(newRecord.amount);
    
    if (!newRecord.client_id || !newRecord.description.trim() || !newRecord.amount || amount <= 0 || isNaN(amount)) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      const recordData = {
        client_id: newRecord.client_id,
        description: newRecord.description.trim(),
        amount: amount,
        category: newRecord.category,
        payment_method: newRecord.payment_method,
        payment_status: newRecord.payment_status,
        due_date: newRecord.due_date && newRecord.due_date.trim() !== '' ? newRecord.due_date : undefined,
        paid_date: newRecord.paid_date && newRecord.paid_date.trim() !== '' ? newRecord.paid_date : undefined,
        month_year: selectedMonth,
        notes: newRecord.notes.trim() || undefined
      };
      
      console.log('Salvando receita:', recordData);
      await db.createRevenueRecord(recordData);
      
      await loadData();
      setShowAddForm(false);
      setNewRecord({
        client_id: '',
        description: '',
        amount: '',
        category: 'service',
        payment_method: 'cash',
        payment_status: 'paid',
        due_date: null,
        paid_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      alert('Receita salva com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar registro:', error);
      alert(`Erro ao salvar registro: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'pix':
        return <Smartphone className="h-4 w-4" />;
      case 'transfer':
        return <Building className="h-4 w-4" />;
      case 'check':
        return <FileCheck className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'card':
        return 'Cartão';
      case 'pix':
        return 'PIX';
      case 'transfer':
        return 'Transferência';
      case 'check':
        return 'Cheque';
      default:
        return 'Dinheiro';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'pending':
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'partial':
        return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
      case 'overdue':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
      default:
        return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'service':
        return 'bg-blue-400/10 text-blue-400';
      case 'parts':
        return 'bg-purple-400/10 text-purple-400';
      case 'labor':
        return 'bg-green-400/10 text-green-400';
      case 'other':
        return 'bg-orange-400/10 text-orange-400';
      default:
        return 'bg-gray-400/10 text-gray-400';
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecordToDelete(recordId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (recordToDelete) {
      try {
        await db.deleteRevenueRecord(recordToDelete);
        await loadData();
        setRecordToDelete(null);
        setShowDeleteDialog(false);
        alert('Receita excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir receita:', error);
        alert('Erro ao excluir receita. Tente novamente.');
      }
    }
  };

  const cancelDelete = () => {
    setRecordToDelete(null);
    setShowDeleteDialog(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Controle de Receita</h1>
          <p className="text-gray-400">Gerencie receitas e acompanhe o faturamento mensal</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nova Receita</span>
        </button>
      </div>

      {/* Month Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Mês/Ano
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-400/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">
            R$ {monthlyStats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-gray-400 text-sm">Receita Recebida</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-400/10 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-400" />
            </div>
            <span className="text-xs text-yellow-400 font-medium">Pendente</span>
          </div>
          <h3 className="text-2xl font-bold text-white">
            R$ {monthlyStats.pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-gray-400 text-sm">A Receber</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-400/10 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-400" />
            </div>
            <span className="text-xs text-red-400 font-medium">Vencido</span>
          </div>
          <h3 className="text-2xl font-bold text-white">
            R$ {monthlyStats.overdueRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-gray-400 text-sm">Em Atraso</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-400/10 rounded-lg">
              <FileCheck className="h-6 w-6 text-blue-400" />
            </div>
            <span className="text-xs text-blue-400 font-medium">
              {monthlyStats.totalRecords > 0 ? Math.round((monthlyStats.paidRecords / monthlyStats.totalRecords) * 100) : 0}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white">{monthlyStats.paidRecords}</h3>
          <p className="text-gray-400 text-sm">Pagamentos</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mb-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">Receita por Categoria</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(categoryStats).map(([category, amount]) => (
            <div key={category} className="text-center p-3">
              <div className={`p-3 rounded-lg mb-2 ${getCategoryColor(category)}`}>
                <span className="font-medium capitalize">{category === 'service' ? 'Serviços' : category === 'parts' ? 'Peças' : category === 'labor' ? 'Mão de Obra' : 'Outros'}</span>
              </div>
              <div className="text-sm md:text-lg font-bold text-white">
                R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Revenue Form */}
      {showAddForm && (
        <div className="mb-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">Nova Receita</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cliente *
                </label>
                <select
                  name="client_id"
                  value={newRecord.client_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  Valor *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={newRecord.amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  name="category"
                  value={newRecord.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="service">Serviços</option>
                  <option value="parts">Peças</option>
                  <option value="labor">Mão de Obra</option>
                  <option value="other">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Método de Pagamento
                </label>
                <select
                  name="payment_method"
                  value={newRecord.payment_method}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Dinheiro</option>
                  <option value="card">Cartão</option>
                  <option value="pix">PIX</option>
                  <option value="transfer">Transferência</option>
                  <option value="check">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  name="payment_status"
                  value={newRecord.payment_status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                  <option value="partial">Parcial</option>
                  <option value="overdue">Vencido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Pagamento *
                </label>
                <input
                  type="date"
                  name="paid_date"
                  value={newRecord.paid_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={newRecord.due_date || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                name="description"
                value={newRecord.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrição do serviço ou produto"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Observações
              </label>
              <textarea
                name="notes"
                value={newRecord.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observações adicionais..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Salvar Receita
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar receitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas as Categorias</option>
            <option value="service">Serviços</option>
            <option value="parts">Peças</option>
            <option value="labor">Mão de Obra</option>
            <option value="other">Outros</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
            <option value="partial">Parcial</option>
            <option value="overdue">Vencido</option>
          </select>
        </div>
      </div>

      {/* Revenue Records Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Cliente / Descrição
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{record.client?.name}</div>
                      <div className="text-gray-400 text-sm">{record.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">
                      R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(record.category)}`}>
                      {record.category === 'service' ? 'Serviços' : 
                       record.category === 'parts' ? 'Peças' : 
                       record.category === 'labor' ? 'Mão de Obra' : 'Outros'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-gray-300">
                      {getPaymentMethodIcon(record.payment_method)}
                      <span>{getPaymentMethodText(record.payment_method)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.payment_status)}`}>
                      {record.payment_status === 'paid' ? 'Pago' :
                       record.payment_status === 'pending' ? 'Pendente' :
                       record.payment_status === 'partial' ? 'Parcial' : 'Vencido'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-400 text-sm">
                      {record.paid_date ? parseLocalDate(record.paid_date).toLocaleDateString('pt-BR') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-2 hover:bg-red-400/10 rounded-lg"
                      title="Excluir receita"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhuma receita encontrada</h3>
            <p className="text-gray-400">Adicione receitas para acompanhar o faturamento.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Excluir Receita"
        message="Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default RevenueManagement;
