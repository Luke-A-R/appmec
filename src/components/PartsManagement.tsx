/**
 * =====================================================
 * PARTSMANAGEMENT.TSX - GESTÃO DE ESTOQUE DE PEÇAS
 * =====================================================
 *
 * Este componente mostra o CONTROLE DE ESTOQUE da oficina.
 * É aqui que você gerencia todas as peças do inventário.
 *
 * O QUE ESTA TELA FAZ:
 * 1. Lista todas as peças cadastradas
 * 2. Mostra estatísticas do estoque (total, em estoque, baixo, sem estoque)
 * 3. Permite buscar e filtrar peças
 * 4. Permite editar a quantidade em estoque
 * 5. Permite excluir peças
 * 6. Mostra valor total do estoque
 *
 * STATUS DAS PEÇAS:
 * - Em Estoque (verde): Quantidade acima do mínimo
 * - Estoque Baixo (amarelo): Quantidade no mínimo ou abaixo
 * - Sem Estoque (vermelho): Quantidade zerada
 */

import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, AlertTriangle, CheckCircle, Clock, Trash2, CreditCard as Edit3, ShoppingCart, TrendingDown, TrendingUp } from 'lucide-react';
import { db, Part } from '../lib/supabase';
import ConfirmDialog from './ConfirmDialog';

// Propriedades que o componente recebe
interface PartsManagementProps {
  onNewPart: () => void;      // Função para abrir tela de nova peça
  onClientParts: () => void;  // Função para ver peças dos clientes
}

const PartsManagement: React.FC<PartsManagementProps> = ({ onNewPart, onClientParts }) => {
  // ========================================
  // ESTADOS DO COMPONENTE
  // ========================================

  // Termo de busca para filtrar peças
  const [searchTerm, setSearchTerm] = useState('');

  // Filtro de categoria selecionado
  const [filterCategory, setFilterCategory] = useState('all');

  // Filtro de status selecionado
  const [filterStatus, setFilterStatus] = useState('all');

  // Controle do diálogo de confirmação de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [partToDelete, setPartToDelete] = useState<string | null>(null);

  // Controle da edição de estoque inline
  const [editingPart, setEditingPart] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);

  // Lista de peças carregadas do banco
  const [parts, setParts] = useState<Part[]>([]);

  // Se está carregando dados
  const [isLoading, setIsLoading] = useState(true);

  // ========================================
  // LISTA DE CATEGORIAS DISPONÍVEIS
  // ========================================
  // Cada categoria é um tipo diferente de peça
  const categories = ['all', 'Filtros', 'Freios', 'Lubrificantes', 'Motor', 'Suspensão', 'Elétrica', 'Pneus', 'Carroceria', 'Interior', 'Acessórios'];

  // ========================================
  // CARREGAR DADOS DO BANCO
  // ========================================
  // Busca as peças quando a tela abre
  useEffect(() => {
    loadParts();
  }, []);

  /**
   * Função que carrega todas as peças do banco de dados
   */
  const loadParts = async () => {
    try {
      setIsLoading(true);
      const startTime = performance.now();

      // Busca todas as peças do banco
      const data = await db.getParts();
      setParts(data);

      const endTime = performance.now();
      console.log(`Parts loaded in ${endTime - startTime} milliseconds`);
    } catch (error) {
      console.error('Erro ao carregar peças:', error);
      alert('Erro ao carregar peças. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // FUNÇÕES AUXILIARES PARA EXIBIR STATUS
  // ========================================

  /**
   * Retorna a classe CSS do status (cor)
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'low-stock':
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'out-of-stock':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
      default:
        return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    }
  };

  /**
   * Retorna o ícone do status
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <CheckCircle className="h-4 w-4" />;      // Check verde
      case 'low-stock':
        return <AlertTriangle className="h-4 w-4" />;    // Alerta amarelo
      case 'out-of-stock':
        return <Clock className="h-4 w-4" />;             // Relógio vermelho
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  /**
   * Converte código do status para texto em português
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'Em Estoque';
      case 'low-stock':
        return 'Estoque Baixo';
      case 'out-of-stock':
        return 'Sem Estoque';
      default:
        return status;
    }
  };

  // ========================================
  // FILTRAR PEÇAS
  // ========================================
  // Aplica todos os filtros (busca, categoria, status)
  const filteredParts = parts.filter(part => {
    // Verifica se bate com a busca (nome, marca ou código)
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.part_number.toLowerCase().includes(searchTerm.toLowerCase());

    // Verifica se bate com a categoria
    const matchesCategory = filterCategory === 'all' || part.category === filterCategory;

    // Verifica se bate com o status
    const matchesStatus = filterStatus === 'all' || part.status === filterStatus;

    // Retorna apenas se bater com todos os filtros
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ========================================
  // FUNÇÕES DE EXCLUSÃO
  // ========================================

  /**
   * Abre o diálogo de confirmação para excluir
   */
  const handleDeletePart = (partId: string) => {
    setPartToDelete(partId);
    setShowDeleteDialog(true);
  };

  /**
   * Confirma e executa a exclusão
   */
  const confirmDelete = async () => {
    if (partToDelete) {
      try {
        await db.deletePart(partToDelete);
        await loadParts(); // Recarrega a lista
        setPartToDelete(null);
        setShowDeleteDialog(false);
      } catch (error) {
        console.error('Erro ao excluir peça:', error);
      }
    }
  };

  /**
   * Cancela a exclusão
   */
  const cancelDelete = () => {
    setPartToDelete(null);
    setShowDeleteDialog(false);
  };

  // ========================================
  // FUNÇÕES DE EDIÇÃO DE ESTOQUE
  // ========================================

  /**
   * Entra no modo de edição de estoque
   */
  const handleEditStock = (partId: string, currentStock: number) => {
    setEditingPart(partId);
    setEditStock(currentStock);
  };

  /**
   * Salva o novo valor de estoque
   */
  const saveStockEdit = async () => {
    if (editingPart) {
      try {
        await db.updatePart(editingPart, { current_stock: editStock });
        await loadParts(); // Recarrega a lista
        setEditingPart(null);
        setEditStock(0);
      } catch (error) {
        console.error('Erro ao atualizar estoque:', error);
      }
    }
  };

  /**
   * Cancela a edição
   */
  const cancelStockEdit = () => {
    setEditingPart(null);
    setEditStock(0);
  };

  // ========================================
  // ESTATÍSTICAS DO ESTOQUE
  // ========================================
  // Calcula números para mostrar nos cartões
  const stats = {
    totalParts: parts.length,                                                      // Total de peças
    inStock: parts.filter(p => p.status === 'in-stock').length,                    // Peças com estoque OK
    lowStock: parts.filter(p => p.status === 'low-stock').length,                  // Peças com estoque baixo
    outOfStock: parts.filter(p => p.status === 'out-of-stock').length,            // Peças sem estoque
    totalValue: parts.reduce((sum, part) => sum + (part.current_stock * part.unit_price), 0) // Valor total R$
  };

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
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciamento de Peças</h1>
          <p className="text-gray-400">Controle seu estoque de peças e componentes</p>
        </div>

        {/* Botões de ação */}
        <div className="flex space-x-4">
          {/* Botão de peças dos clientes */}
          <button
            onClick={onClientParts}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <Package className="h-5 w-5" />
            <span>Peças dos Clientes</span>
          </button>

          {/* Botão de nova peça */}
          <button
            onClick={onNewPart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Nova Peça</span>
          </button>
        </div>
      </div>

      {/* ========================================
          CARTÕES DE ESTATÍSTICAS
          ======================================== */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {/* Total de Peças */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Package className="h-8 w-8 text-blue-400" />
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{stats.totalParts}</h3>
          <p className="text-gray-400 text-sm">Total de Peças</p>
        </div>

        {/* Em Estoque */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 text-green-400" />
            <span className="text-xs text-green-400 font-medium">
              {stats.totalParts > 0 ? Math.round((stats.inStock / stats.totalParts) * 100) : 0}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white">{stats.inStock}</h3>
          <p className="text-gray-400 text-sm">Em Estoque</p>
        </div>

        {/* Estoque Baixo */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
            <TrendingDown className="h-4 w-4 text-yellow-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{stats.lowStock}</h3>
          <p className="text-gray-400 text-sm">Estoque Baixo</p>
        </div>

        {/* Sem Estoque */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-8 w-8 text-red-400" />
            <span className="text-xs text-red-400 font-medium">Crítico</span>
          </div>
          <h3 className="text-2xl font-bold text-white">{stats.outOfStock}</h3>
          <p className="text-gray-400 text-sm">Sem Estoque</p>
        </div>

        {/* Valor Total */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="h-8 w-8 text-purple-400" />
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">
            R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-gray-400 text-sm">Valor Total</p>
        </div>
      </div>

      {/* ========================================
          FILTROS
          ======================================== */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar peças..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de categoria */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Todas as Categorias' : category}
              </option>
            ))}
          </select>

          {/* Filtro de status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="in-stock">Em Estoque</option>
            <option value="low-stock">Estoque Baixo</option>
            <option value="out-of-stock">Sem Estoque</option>
          </select>
        </div>
      </div>

      {/* ========================================
          TABELA DE PEÇAS
          ======================================== */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Cabeçalho da tabela */}
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Peça
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Estoque
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Preço Unit.
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>

            {/* Corpo da tabela */}
            <tbody className="divide-y divide-gray-700">
              {filteredParts.map((part) => (
                <tr key={part.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                  {/* Nome e marca da peça */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{part.name}</div>
                      <div className="text-gray-400 text-sm">{part.brand} • {part.part_number}</div>
                    </div>
                  </td>

                  {/* Categoria */}
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-400/10 text-blue-400 rounded-full text-xs font-medium">
                      {part.category}
                    </span>
                  </td>

                  {/* Estoque (editável inline) */}
                  <td className="px-6 py-4">
                    {/* Se está editando esta peça */}
                    {editingPart === part.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                          min="0"
                        />
                        {/* Botão salvar */}
                        <button
                          onClick={saveStockEdit}
                          className="text-green-400 hover:text-green-300"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        {/* Botão cancelar */}
                        <button
                          onClick={cancelStockEdit}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      /* Mostra quantidade normal com botão de editar */
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="text-white font-medium">{part.current_stock}</div>
                          <div className="text-gray-400 text-xs">
                            Min: {part.min_stock} • Max: {part.max_stock}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditStock(part.id, part.current_stock)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Preço unitário e total */}
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">
                      R$ {part.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Total: R$ {(part.current_stock * part.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>

                  {/* Status com ícone */}
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 w-fit ${getStatusColor(part.status)}`}>
                      {getStatusIcon(part.status)}
                      <span>{getStatusText(part.status)}</span>
                    </span>
                  </td>

                  {/* Localização e fornecedor */}
                  <td className="px-6 py-4">
                    <div className="text-white">{part.location}</div>
                    <div className="text-gray-400 text-xs">{part.supplier}</div>
                  </td>

                  {/* Botão de excluir */}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeletePart(part.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mensagem se não encontrar peças */}
        {filteredParts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhuma peça encontrada</h3>
            <p className="text-gray-400">Tente ajustar os filtros ou adicione uma nova peça.</p>
          </div>
        )}
      </div>

      {/* ========================================
          DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO
          ======================================== */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Excluir Peça"
        message="Tem certeza que deseja excluir esta peça? Esta ação não pode ser desfeita e afetará o controle de estoque."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default PartsManagement;
