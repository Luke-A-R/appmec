/**
 * =====================================================
 * NEWPROJECTFORM.TSX - FORMULÁRIO DE NOVO SERVIÇO
 * =====================================================
 *
 * Este componente é o formulário para CRIAR um novo serviço.
 * Um serviço pode ter várias etapas que devem ser concluídas.
 *
 * O QUE ESTE FORMULÁRIO FAZ:
 * 1. Seleciona cliente e veículo
 * 2. Coleta informações do serviço (título, descrição, preço)
 * 3. Define as etapas do serviço
 * 4. Define o cronograma (data início e previsão de término)
 * 5. Salva o serviço e suas etapas no banco de dados
 *
 * ETAPAS:
 * Cada serviço pode ter múltiplas etapas.
 * Cada etapa pode ter:
 * - Nome/descrição
 * - Responsável
 * - Horas e dias estimados
 * - Lista de peças trocadas
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, FolderOpen, User, Car, Calendar, DollarSign, Save, AlertCircle, Plus, X, Trash2 } from 'lucide-react';
import { db, Client, Vehicle } from '../lib/supabase';

// Estrutura de uma etapa do serviço
interface StepInput {
  name: string;           // Nome da etapa
  parts: string[];        // Lista de peças trocadas
  responsible: string;    // Quem vai fazer
  estimatedHours: number; // Horas previstas
  estimatedDays: number;  // Dias previstos
}

// Propriedades que o formulário recebe
interface NewProjectFormProps {
  onBack: () => void;  // Função para voltar à lista de serviços
}

const NewProjectForm: React.FC<NewProjectFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    clientId: '',
    vehicleId: '',
    title: '',
    description: '',
    estimatedPrice: '',
    startDate: '',
    estimatedCompletion: '',
    priority: 'medium',
    notes: ''
  });

  const [steps, setSteps] = useState<StepInput[]>([
    { name: '', parts: [''], responsible: '', estimatedHours: 0, estimatedDays: 0 }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.clientId) {
      const clientVehicles = vehicles.filter(v => v.client_id === formData.clientId);
      setFilteredVehicles(clientVehicles);
      setFormData(prev => ({ ...prev, vehicleId: '' }));
    } else {
      setFilteredVehicles([]);
    }
  }, [formData.clientId, vehicles]);

  const loadData = async () => {
    try {
      const [clientsData, vehiclesData] = await Promise.all([
        db.getClients(),
        db.getVehicles()
      ]);
      setClients(clientsData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    if (!formData.clientId) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Veículo é obrigatório';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Título do serviço é obrigatório';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória';
    }

    if (!formData.estimatedCompletion) {
      newErrors.estimatedCompletion = 'Data estimada de conclusão é obrigatória';
    }

    if (formData.startDate && formData.estimatedCompletion) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.estimatedCompletion);

      if (endDate <= startDate) {
        newErrors.estimatedCompletion = 'Data de conclusão deve ser posterior à data de início';
      }
    }

    const validSteps = steps.filter(s => s.name.trim());
    if (validSteps.length === 0) {
      newErrors.steps = 'Adicione pelo menos uma etapa ao serviço';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addStep = () => {
    setSteps(prev => [...prev, { name: '', parts: [''], responsible: '', estimatedHours: 0, estimatedDays: 0 }]);
  };

  const removeStep = (index: number) => {
    setSteps((prev: StepInput[]) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof StepInput, value: string | string[] | number) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addStepPart = (stepIndex: number) => {
    setSteps(prev => prev.map((s, i) => i === stepIndex ? { ...s, parts: [...s.parts, ''] } : s));
  };

  const removeStepPart = (stepIndex: number, partIndex: number) => {
    setSteps(prev => prev.map((s, i) => i === stepIndex ? { ...s, parts: s.parts.filter((_, pi) => pi !== partIndex) } : s));
  };

  const updateStepPart = (stepIndex: number, partIndex: number, value: string) => {
    setSteps(prev => prev.map((s, i) => i === stepIndex ? { ...s, parts: s.parts.map((p, pi) => pi === partIndex ? value : p) } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const validSteps = steps.filter(s => s.name.trim());
      const description = formData.description.trim() || validSteps.map((s) => {
        const partsStr = s.parts.filter(p => p.trim()).join(', ');
        return `${s.name}${partsStr ? ': ' + partsStr : ''}`;
      }).join('\n');

      const project = await db.createProject({
        client_id: formData.clientId,
        vehicle_id: formData.vehicleId,
        title: formData.title,
        description: description,
        service_type: formData.title,
        status: 'not-started',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        start_date: formData.startDate,
        estimated_completion: formData.estimatedCompletion,
        estimated_cost: parseFloat(formData.estimatedPrice) || 0,
        actual_cost: 0,
        notes: formData.notes
      });

      // Create project steps
      for (let i = 0; i < validSteps.length; i++) {
        const step = validSteps[i];
        const partsStr = step.parts.filter(p => p.trim()).join(', ');
        await db.createProjectStep({
          servico_id: project.id,
          name: step.name,
          description: partsStr || step.name,
          step_order: i + 1,
          completed: false,
          estimated_hours: step.estimatedHours || 1,
          actual_hours: step.estimatedHours || 0,
          responsible: step.responsible || 'A definir',
          notes: '',
          days_worked: step.estimatedDays || 0
        });
      }

      onBack();
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error);
      setErrors({ general: 'Erro ao salvar projeto. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedClient = clients.find(client => client.id === formData.clientId);
  const selectedVehicle = filteredVehicles.find(vehicle => vehicle.id === formData.vehicleId);

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
          <h1 className="text-3xl font-bold text-white mb-2">Novo Serviço</h1>
          <p className="text-gray-400">Crie um novo serviço automotivo</p>
        </div>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-400">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Selection */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-400" />
            <span>Cliente e Veículo</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cliente *
              </label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.clientId ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="text-red-400 text-sm mt-1">{errors.clientId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Veículo *
              </label>
              <select
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleInputChange}
                disabled={!formData.clientId}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
                  errors.vehicleId ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Selecione um veículo</option>
                {filteredVehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} {vehicle.year}
                  </option>
                ))}
              </select>
              {errors.vehicleId && <p className="text-red-400 text-sm mt-1">{errors.vehicleId}</p>}
            </div>

            {selectedClient && selectedVehicle && (
              <div className="md:col-span-2 p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-400" />
                    <span className="text-white font-medium">{selectedClient.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Car className="h-4 w-4 text-blue-400" />
                    <span className="text-gray-300">
                      {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Service Information */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <FolderOpen className="h-5 w-5 text-blue-400" />
            <span>Informações do Serviço</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Título do Serviço *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Ex: Revisão Completa BMW M5"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prioridade
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preço Estimado
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  name="estimatedPrice"
                  value={formData.estimatedPrice}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Service Steps */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-blue-400" />
              <span>Etapas do Serviço</span>
            </h2>
            <button
              type="button"
              onClick={addStep}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Etapa</span>
            </button>
          </div>

          {errors.steps && (
            <div className="mb-4 p-3 bg-red-400/10 border border-red-400/20 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400 text-sm">{errors.steps}</span>
            </div>
          )}

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-blue-400">Etapa {index + 1}</span>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Remover etapa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Nome do Serviço *</label>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => updateStep(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Ex: Revisão, Suspensão Dianteira"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Responsável</label>
                    <input
                      type="text"
                      value={step.responsible}
                      onChange={(e) => updateStep(index, 'responsible', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Nome do responsável"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Horas Trabalhadas</label>
                    <input
                      type="number"
                      value={step.estimatedHours || ''}
                      onChange={(e) => updateStep(index, 'estimatedHours', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="0"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Dias Trabalhados</label>
                    <input
                      type="number"
                      value={step.estimatedDays || ''}
                      onChange={(e) => updateStep(index, 'estimatedDays', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="0"
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-400">Peças Trocadas / Serviços Realizados</label>
                    <button
                      type="button"
                      onClick={() => addStepPart(index)}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      + Peça
                    </button>
                  </div>
                  <div className="space-y-1">
                    {step.parts.map((part, partIndex) => (
                      <div key={partIndex} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={part}
                          onChange={(e) => updateStepPart(index, partIndex, e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Ex: Filtro de Óleo Mann, Pastilha de Freio Dianteira"
                        />
                        {step.parts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStepPart(index, partIndex)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-400" />
            <span>Cronograma</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Início *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.startDate ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.startDate && <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Conclusão Estimada *
              </label>
              <input
                type="date"
                name="estimatedCompletion"
                value={formData.estimatedCompletion}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.estimatedCompletion ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.estimatedCompletion && <p className="text-red-400 text-sm mt-1">{errors.estimatedCompletion}</p>}
            </div>
          </div>

          {/* Summary of hours and days from steps */}
          {steps.some(s => s.estimatedHours > 0 || s.estimatedDays > 0) && (
            <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Resumo do Trabalho</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {steps.reduce((sum, s) => sum + (s.estimatedHours || 0), 0)}h
                  </div>
                  <div className="text-gray-400 text-sm">Total de Horas</div>
                </div>
                <div className="text-center p-3 bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {steps.reduce((sum, s) => sum + (s.estimatedDays || 0), 0)}
                  </div>
                  <div className="text-gray-400 text-sm">Total de Dias</div>
                </div>
              </div>
            </div>
          )}
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
            <span>{isLoading ? 'Salvando...' : 'Criar Serviço'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewProjectForm;