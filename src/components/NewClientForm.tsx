/**
 * =====================================================
 * NEWCLIENTFORM.TSX - FORMULÁRIO DE NOVO CLIENTE
 * =====================================================
 *
 * Este componente é o formulário para CADASTRAR um novo cliente.
 * Ele também cadastra o primeiro veículo do cliente junto.
 *
 * O QUE ESTE FORMULÁRIO FAZ:
 * 1. Coleta dados pessoais do cliente (nome, email, telefone)
 * 2. Coleta dados do veículo (marca, modelo, ano, cor, placa)
 * 3. Coleta checklist de avarias do veículo
 * 4. Salva cliente e veículo no banco de dados
 *
 * VALIDAÇÕES:
 * - Nome: obrigatório
 * - Email: opcional, mas se preenchido deve ser válido
 * - Telefone: obrigatório
 * - Marca, Modelo, Ano do veículo: obrigatórios
 */

import React, { useState } from 'react';
import { ArrowLeft, User, Car, Save, AlertCircle } from 'lucide-react';
import { db } from '../lib/supabase';

// Propriedades que o formulário recebe
interface NewClientFormProps {
  onBack: () => void;  // Função para voltar à lista de clientes
}

const NewClientForm: React.FC<NewClientFormProps> = ({ onBack }) => {
  // ========================================
  // ESTADOS DO FORMULÁRIO
  // ========================================
  // Dados do formulário - todos os campos que serão preenchidos
  const [formData, setFormData] = useState({
    // Dados do cliente
    name: '',           // Nome completo
    email: '',          // Email de contato
    phone: '',          // Telefone
    // Dados do veículo
    carBrand: '',       // Marca (ex: BMW, Ford)
    carModel: '',       // Modelo (ex: M5, Mustang)
    carYear: '',        // Ano de fabricação
    carColor: '',       // Cor do veículo
    licensePlate: '',   // Placa
    notes: '',          // Observações gerais
    // Checklist de avarias - marca o estado do veículo ao chegar
    damageChecklist: {
      scratches: false,        // Arranhões
      dents: false,             // Amassados
      rust: false,              // Ferrugem
      paint_damage: false,      // Danos na pintura
      broken_parts: false,      // Peças quebradas
      interior_damage: false,   // Danos no interior
      tire_condition: false,    // Problemas nos pneus
      other_issues: false,      // Outros problemas
      notes: ''                 // Observações sobre as avarias
    }
  });

  // Erros de validação de cada campo
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Se está salvando (mostra loading)
  const [isLoading, setIsLoading] = useState(false);

  // ========================================
  // FUNÇÕES DO FORMULÁRIO
  // ========================================

  /**
   * Atualiza o estado quando o usuário digita em um campo
   * Também limpa o erro do campo quando o usuário começa a digitar
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpa o erro quando o usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Atualiza os campos do checklist de avarias
   * @param field - Nome do campo (arranhões, amassados, etc.)
   * @param value - Valor (true/false para checkbox, string para notas)
   */
  const handleChecklistChange = (field: string, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      damageChecklist: {
        ...prev.damageChecklist,
        [field]: value
      }
    }));
  };

  /**
   * Valida todos os campos do formulário
   * Retorna true se tudo está válido
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Nome é obrigatório
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    // Email é opcional, mas se preenchido deve ser válido
    if (!formData.email.trim()) {
      // Email não é obrigatório
    } else if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Telefone é obrigatório
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    }

    // Dados do veículo são obrigatórios
    if (!formData.carBrand.trim()) {
      newErrors.carBrand = 'Marca do veículo é obrigatória';
    }

    if (!formData.carModel.trim()) {
      newErrors.carModel = 'Modelo do veículo é obrigatório';
    }

    // Ano deve estar entre 1900 e o próximo ano
    if (!formData.carYear.trim()) {
      newErrors.carYear = 'Ano do veículo é obrigatório';
    } else if (parseInt(formData.carYear) < 1900 || parseInt(formData.carYear) > new Date().getFullYear() + 1) {
      newErrors.carYear = 'Ano inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Envia o formulário para salvar no banco de dados
   * 1. Valida os campos
   * 2. Cria o cliente
   * 3. Cria o veículo vinculado ao cliente
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Se a validação falhar, não continua
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const startTime = performance.now();

      // PASSO 1: Cria o cliente no banco
      const client = await db.createClient({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes
      });

      // PASSO 2: Cria o veículo vinculado ao cliente
      await db.createVehicle({
        client_id: client.id,      // Conecta com o cliente criado
        brand: formData.carBrand,
        model: formData.carModel,
        year: parseInt(formData.carYear),
        color: formData.carColor,
        license_plate: formData.licensePlate,
        damage_checklist: formData.damageChecklist  // Salva checklist de avarias
      });

      const endTime = performance.now();
      console.log(`Client created in ${endTime - startTime} milliseconds`);

      // Volta para a lista de clientes
      onBack();
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);

      // Mostra mensagem de erro amigável
      if (error?.message) {
        setErrors({ general: `Erro ao salvar: ${error.message}` });
      } else {
        setErrors({ general: 'Erro inesperado ao salvar cliente. Tente novamente.' });
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
          <h1 className="text-3xl font-bold text-white mb-2">Novo Cliente</h1>
          <p className="text-gray-400">Cadastre um novo cliente e seu veículo</p>
        </div>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-400">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Information */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-400" />
            <span>Informações do Cliente</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Digite o nome completo"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="cliente@email.com (opcional)"
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="(11) 99999-9999"
              />
              {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Car className="h-5 w-5 text-blue-400" />
            <span>Informações do Veículo</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Marca *
              </label>
              <input
                type="text"
                name="carBrand"
                value={formData.carBrand}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.carBrand ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="BMW, Audi, Ford..."
              />
              {errors.carBrand && <p className="text-red-400 text-sm mt-1">{errors.carBrand}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Modelo *
              </label>
              <input
                type="text"
                name="carModel"
                value={formData.carModel}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.carModel ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="M5, A4, Mustang..."
              />
              {errors.carModel && <p className="text-red-400 text-sm mt-1">{errors.carModel}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ano *
              </label>
              <input
                type="number"
                name="carYear"
                value={formData.carYear}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.carYear ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="2020"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
              {errors.carYear && <p className="text-red-400 text-sm mt-1">{errors.carYear}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cor
              </label>
              <input
                type="text"
                name="carColor"
                value={formData.carColor}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Preto, Branco, Azul..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Placa
              </label>
              <input
                type="text"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ABC-1234"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Damage Checklist */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Car className="h-5 w-5 text-blue-400" />
            <span>Checklist de Avarias do Veículo</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <label className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.damageChecklist.scratches}
                onChange={(e) => handleChecklistChange('scratches', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-white">Arranhões</span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.damageChecklist.dents}
                onChange={(e) => handleChecklistChange('dents', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-white">Amassados</span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.damageChecklist.rust}
                onChange={(e) => handleChecklistChange('rust', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-white">Ferrugem</span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.damageChecklist.paint_damage}
                onChange={(e) => handleChecklistChange('paint_damage', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-white">Danos na Pintura</span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.damageChecklist.broken_parts}
                onChange={(e) => handleChecklistChange('broken_parts', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-white">Peças Quebradas</span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.damageChecklist.interior_damage}
                onChange={(e) => handleChecklistChange('interior_damage', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-white">Danos no Interior</span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.damageChecklist.tire_condition}
                onChange={(e) => handleChecklistChange('tire_condition', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-white">Problemas nos Pneus</span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.damageChecklist.other_issues}
                onChange={(e) => handleChecklistChange('other_issues', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-white">Outros Problemas</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Observações sobre Avarias
            </label>
            <textarea
              value={formData.damageChecklist.notes}
              onChange={(e) => handleChecklistChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva detalhadamente as avarias encontradas no veículo..."
            />
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
            <span>{isLoading ? 'Salvando...' : 'Salvar Cliente'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewClientForm;