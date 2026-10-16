/**
 * =====================================================
 * NEWPARTFORM.TSX - FORMULÁRIO DE NOVA PEÇA
 * =====================================================
 *
 * Este componente é o formulário para ADICIONAR uma peça ao estoque.
 *
 * O QUE ESTE FORMULÁRIO FAZ:
 * 1. Coleta dados da peça (nome, categoria, marca, código)
 * 2. Coleta dados de estoque (atual, mínimo, máximo)
 * 3. Coleta preço e localização
 * 4. Salva a peça no banco de dados
 *
 * VALIDAÇÕES:
 * - Nome, categoria, marca e código são obrigatórios
 * - Estoque não pode ser negativo
 * - Estoque máximo deve ser maior que o mínimo
 */

import React, { useState } from 'react';
import { ArrowLeft, Package, Save, AlertCircle } from 'lucide-react';
import { db } from '../lib/supabase';

// Propriedades que o formulário recebe
interface NewPartFormProps {
  onBack: () => void;            // Função para voltar à lista de peças
  onPartCreated?: () => void;   // Função chamada após criar (opcional)
}

const NewPartForm: React.FC<NewPartFormProps> = ({ onBack, onPartCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    part_number: '',
    description: '',
    current_stock: 0,
    min_stock: 0,
    max_stock: 100,
    unit_price: 0,
    supplier: '',
    location: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'Filtros',
    'Freios',
    'Lubrificantes',
    'Motor',
    'Suspensão',
    'Elétrica',
    'Pneus',
    'Carroceria',
    'Interior',
    'Acessórios'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da peça é obrigatório';
    }

    if (!formData.category) {
      newErrors.category = 'Categoria é obrigatória';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Marca é obrigatória';
    }

    if (!formData.part_number.trim()) {
      newErrors.part_number = 'Código da peça é obrigatório';
    }

    if (formData.current_stock < 0) {
      newErrors.current_stock = 'Estoque atual não pode ser negativo';
    }

    if (formData.min_stock < 0) {
      newErrors.min_stock = 'Estoque mínimo não pode ser negativo';
    }

    if (formData.max_stock < formData.min_stock) {
      newErrors.max_stock = 'Estoque máximo deve ser maior que o mínimo';
    }

    if (formData.unit_price < 0) {
      newErrors.unit_price = 'Preço unitário não pode ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await db.createPart(formData);
      
      if (onPartCreated) {
        onPartCreated();
      }
      
      onBack();
    } catch (error: any) {
      console.error('Erro ao criar peça:', error);
      if (error.message.includes('duplicate key')) {
        setErrors({ part_number: 'Este código de peça já existe' });
      } else {
        setErrors({ general: 'Erro ao salvar peça. Tente novamente.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mr-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Voltar</span>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Nova Peça</h1>
          <p className="text-gray-400">Adicione uma nova peça ao catálogo</p>
        </div>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-400">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-400" />
            <span>Informações Básicas</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome da Peça *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Ex: Filtro de Óleo"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Categoria *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.category ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Marca *
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.brand ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Ex: Bosch, Mann Filter"
              />
              {errors.brand && <p className="text-red-400 text-sm mt-1">{errors.brand}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código da Peça *
              </label>
              <input
                type="text"
                name="part_number"
                value={formData.part_number}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.part_number ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Ex: W712/75"
              />
              {errors.part_number && <p className="text-red-400 text-sm mt-1">{errors.part_number}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrição detalhada da peça..."
              />
            </div>
          </div>
        </div>

        {/* Stock Information */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">Informações de Estoque</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estoque Atual
              </label>
              <input
                type="number"
                name="current_stock"
                value={formData.current_stock}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.current_stock ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="0"
              />
              {errors.current_stock && <p className="text-red-400 text-sm mt-1">{errors.current_stock}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estoque Mínimo
              </label>
              <input
                type="number"
                name="min_stock"
                value={formData.min_stock}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.min_stock ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="0"
              />
              {errors.min_stock && <p className="text-red-400 text-sm mt-1">{errors.min_stock}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estoque Máximo
              </label>
              <input
                type="number"
                name="max_stock"
                value={formData.max_stock}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.max_stock ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="100"
              />
              {errors.max_stock && <p className="text-red-400 text-sm mt-1">{errors.max_stock}</p>}
            </div>
          </div>
        </div>

        {/* Pricing and Location */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">Preço e Localização</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preço Unitário (R$)
              </label>
              <input
                type="number"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.unit_price ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="0.00"
              />
              {errors.unit_price && <p className="text-red-400 text-sm mt-1">{errors.unit_price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fornecedor
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome do fornecedor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Localização
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Estante A-1"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span>{isLoading ? 'Salvando...' : 'Salvar Peça'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPartForm;