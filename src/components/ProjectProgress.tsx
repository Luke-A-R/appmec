/**
 * =====================================================
 * PROJECTPROGRESS.TSX - ANDAMENTO DO SERVIÇO
 * =====================================================
 *
 * Este componente mostra o ANDAMENTO DETALHADO de um serviço.
 * É aqui que você controla as etapas do trabalho.
 *
 * FUNCIONALIDADES:
 * 1. Ver todas as etapas do serviço
 * 2. Marcar etapas como concluídas
 * 3. Adicionar novas etapas
 * 4. Editar etapas existentes
 * 5. Adicionar fotos (antes/depois)
 * 6. Adicionar observações em cada etapa
 * 7. Registrar horas e dias trabalhados
 * 8. Ver barra de progresso geral
 *
 * COMO FUNCIONA:
 * - Cada etapa pode ser marcada como concluída separadamente
 * - A barra de progresso é calculada automaticamente
 * - As etapas mostram peças usadas e responsável
 */

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Car, Calendar, User, Camera, Plus, CreditCard as Edit3, Save, X, MessageSquare } from 'lucide-react';
import { db } from '../lib/supabase';

// Parses "YYYY-MM-DD" as local date to avoid UTC midnight timezone shift
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Propriedades que o componente recebe
interface ProjectProgressProps {
  projectId?: string;  // Código do serviço a ser exibido
  onBack: () => void;   // Função para voltar à lista de serviços
}

const ProjectProgress: React.FC<ProjectProgressProps> = ({ projectId, onBack }) => {
  // ========================================
  // ESTADOS DO COMPONENTE
  // ========================================

  // Controle de edição
  const [editingStep, setEditingStep] = useState<string | null>(null);     // Etapa sendo editada
  const [editingNotes, setEditingNotes] = useState(false);                  // Se está editando notas
  const [newNote, setNewNote] = useState('');                               // Nova nota

  // Formulário de adicionar etapa
  const [showAddStepForm, setShowAddStepForm] = useState(false);

  // Dados do serviço
  const [project, setProject] = useState<any>(null);       // Informações do serviço
  const [steps, setSteps] = useState<any[]>([]);           // Lista de etapas
  const [isLoading, setIsLoading] = useState(true);

  // Etapa sendo editada
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editStepData, setEditStepData] = useState({
    name: '',           // Nome da etapa
    responsible: '',    // Responsável
    estimatedHours: 0,  // Horas previstas
    estimatedDays: 0,   // Dias previstos
    parts: [''],        // Peças usadas
    actual_hours: 0,    // Horas reais
    days_worked: 0,     // Dias trabalhados
    notes: ''           // Observações
  });

  const [newStep, setNewStep] = useState({
    name: '',
    responsible: '',
    estimatedHours: 0,
    estimatedDays: 0,
    parts: [''],
    actual_hours: 0,
    days_worked: 0,
    notes: ''
  });

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      const [projectData, stepsData] = await Promise.all([
        db.getProject(projectId!),
        db.getProjectSteps(projectId!)
      ]);

      setProject(projectData);
      setSteps(stepsData);
    } catch (error) {
      console.error('Erro ao carregar dados do projeto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewStep(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const updateNewStepPart = (partIndex: number, value: string) => {
    setNewStep(prev => ({
      ...prev,
      parts: prev.parts.map((p, i) => i === partIndex ? value : p)
    }));
  };

  const addNewStepPart = () => {
    setNewStep(prev => ({
      ...prev,
      parts: [...prev.parts, '']
    }));
  };

  const removeNewStepPart = (partIndex: number) => {
    setNewStep(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== partIndex)
    }));
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStep.name || !newStep.responsible) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      const descriptionFromParts = newStep.parts.filter((p: string) => p.trim()).join(', ');

      const stepData = {
        name: newStep.name,
        responsible: newStep.responsible,
        description: descriptionFromParts,
        estimated_hours: newStep.estimatedHours,
        actual_hours: newStep.actual_hours,
        days_worked: newStep.days_worked,
        notes: newStep.notes,
        servico_id: projectId!,
        step_order: steps.length + 1,
        completed: false
      };

      await db.createProjectStep(stepData);
      await loadProjectData();

      setShowAddStepForm(false);
      setNewStep({
        name: '',
        responsible: '',
        estimatedHours: 0,
        estimatedDays: 0,
        parts: [''],
        actual_hours: 0,
        days_worked: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Erro ao adicionar etapa:', error);
      alert('Erro ao adicionar etapa');
    }
  };

  const handleEditStep = (step: any) => {
    setEditingStepId(step.id);
    const partsArray = step.description
      ? step.description.split(',').map((p: string) => p.trim()).filter((p: string) => p)
      : [''];

    setEditStepData({
      name: step.name,
      responsible: step.responsible,
      estimatedHours: step.estimated_hours || 0,
      estimatedDays: 0,
      parts: partsArray.length > 0 ? partsArray : [''],
      actual_hours: step.actual_hours || 0,
      days_worked: step.days_worked || 0,
      notes: step.notes || ''
    });
  };

  const handleSaveEditStep = async () => {
    if (!editingStepId) return;

    try {
      const descriptionFromParts = editStepData.parts.filter((p: string) => p.trim()).join(', ');

      await db.updateProjectStep(editingStepId, {
        name: editStepData.name,
        responsible: editStepData.responsible,
        description: descriptionFromParts,
        estimated_hours: editStepData.estimatedHours,
        actual_hours: editStepData.actual_hours,
        days_worked: editStepData.days_worked,
        notes: editStepData.notes
      });
      await loadProjectData();
      setEditingStepId(null);
      setEditStepData({
        name: '',
        responsible: '',
        estimatedHours: 0,
        estimatedDays: 0,
        parts: [''],
        actual_hours: 0,
        days_worked: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
      alert('Erro ao salvar etapa');
    }
  };

  const handleCancelEditStep = () => {
    setEditingStepId(null);
    setEditStepData({
      name: '',
      responsible: '',
      estimatedHours: 0,
      estimatedDays: 0,
      parts: [''],
      actual_hours: 0,
      days_worked: 0,
      notes: ''
    });
  };

  const handleEditStepInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setEditStepData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const updateEditStepPart = (partIndex: number, value: string) => {
    setEditStepData(prev => ({
      ...prev,
      parts: prev.parts.map((p, i) => i === partIndex ? value : p)
    }));
  };

  const addEditStepPart = () => {
    setEditStepData(prev => ({
      ...prev,
      parts: [...prev.parts, '']
    }));
  };

  const removeEditStepPart = (partIndex: number) => {
    setEditStepData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== partIndex)
    }));
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'in-progress':
        return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
      case 'on-hold':
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'not-started':
        return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
      default:
        return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-600/10 text-red-400 border-red-400/20';
      case 'high':
        return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
      case 'medium':
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'low':
        return 'bg-green-400/10 text-green-400 border-green-400/20';
      default:
        return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    }
  };

  const toggleStepCompletion = async (stepId: string) => {
    try {
      const step = steps.find(s => s.id === stepId);
      if (!step) return;

      const updates = {
        completed: !step.completed,
        completed_date: !step.completed ? new Date().toISOString().split('T')[0] : undefined
      };

      await db.updateProjectStep(stepId, updates);
      await loadProjectData();
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
    }
  };

  const updateStepNotes = async (stepId: string, notes: string) => {
    try {
      await db.updateProjectStep(stepId, { notes });
      await loadProjectData();
    } catch (error) {
      console.error('Erro ao atualizar observações:', error);
    }
  };

  const addProjectNote = () => {
    if (newNote.trim()) {
      const timestamp = new Date().toLocaleString('pt-BR');
      const noteWithTimestamp = `[${timestamp}] ${newNote}`;
      
      const updatedNotes = project.notes ? `${project.notes}\n\n${noteWithTimestamp}` : noteWithTimestamp;
      
      db.updateProject(project.id, { notes: updatedNotes });
      
      setProject((prev: any) => ({
        ...prev,
        notes: updatedNotes
      }));
      
      setNewNote('');
      setEditingNotes(false);
    }
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

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-white mb-2">Projeto não encontrado</h3>
          <button
            onClick={onBack}
            className="text-blue-400 hover:text-blue-300"
          >
            Voltar para projetos
          </button>
        </div>
      </div>
    );
  }

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const calculatedProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const totalActualHours = steps.reduce((sum, step) => sum + (step.actual_hours || 0), 0);
  const totalDaysWorked = steps.reduce((sum, step) => sum + (step.days_worked || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mr-6"
        >
          <X className="h-5 w-5" />
          <span>Voltar</span>
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
          <p className="text-gray-400">{project.client?.name} • {project.vehicle?.brand} {project.vehicle?.model} {project.vehicle?.year}</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(project.priority)}`}>
            {project.priority === 'urgent' ? 'Urgente' : 
             project.priority === 'high' ? 'Alta' :
             project.priority === 'medium' ? 'Média' : 'Baixa'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
            {project.status === 'in-progress' ? 'Em Progresso' :
             project.status === 'completed' ? 'Concluído' :
             project.status === 'on-hold' ? 'Pausado' : 'Não Iniciado'}
          </span>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">Progresso Geral</h2>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Progresso</span>
              <span className="text-blue-400 font-medium">{calculatedProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-400 h-3 rounded-full transition-all duration-300"
                style={{ width: `${calculatedProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{completedSteps}/{totalSteps}</div>
              <div className="text-gray-400 text-sm">Etapas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalActualHours}h</div>
              <div className="text-gray-400 text-sm">Trabalhadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalDaysWorked || 0}</div>
              <div className="text-gray-400 text-sm">Dias Trabalhados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                R$ {project.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-gray-400 text-sm">Custo Total</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">Informações</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-white font-medium">{project.client?.name}</div>
                <div className="text-gray-400 text-sm">Cliente</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Car className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-white font-medium">{project.vehicle?.brand} {project.vehicle?.model} {project.vehicle?.year}</div>
                <div className="text-gray-400 text-sm">Veículo</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-white font-medium">
                  {project.start_date ? parseLocalDate(project.start_date).toLocaleDateString('pt-BR') : 'Não definido'}
                </div>
                <div className="text-gray-400 text-sm">Data de Início</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-white font-medium">
                  {project.estimated_completion ? parseLocalDate(project.estimated_completion).toLocaleDateString('pt-BR') : 'Não definido'}
                </div>
                <div className="text-gray-400 text-sm">Previsão de Entrega</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Steps */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Etapas do Serviço</h2>
          <button
            onClick={() => setShowAddStepForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Etapa</span>
          </button>
        </div>

        {/* Add Step Form */}
        {showAddStepForm && (
          <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <div className="mb-4">
              <span className="text-sm font-medium text-blue-400">Etapa {steps.length + 1}</span>
            </div>
            <form onSubmit={handleAddStep} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Nome do Serviço *</label>
                  <input
                    type="text"
                    name="name"
                    value={newStep.name}
                    onChange={handleStepInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Ex: Revisão, Suspensão Dianteira"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Responsável</label>
                  <input
                    type="text"
                    name="responsible"
                    value={newStep.responsible}
                    onChange={handleStepInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Nome do responsável"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Horas Trabalhadas</label>
                  <input
                    type="number"
                    name="actual_hours"
                    value={newStep.actual_hours}
                    onChange={handleStepInputChange}
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
                    name="days_worked"
                    value={newStep.days_worked}
                    onChange={handleStepInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-400">Peças Trocadas / Serviços Realizados</label>
                  <button
                    type="button"
                    onClick={addNewStepPart}
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    + Peça
                  </button>
                </div>
                <div className="space-y-1">
                  {newStep.parts.map((part, partIndex) => (
                    <div key={partIndex} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={part}
                        onChange={(e) => updateNewStepPart(partIndex, e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Ex: Filtro de Óleo Mann, Pastilha de Freio Dianteira"
                      />
                      {newStep.parts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeNewStepPart(partIndex)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddStepForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Adicionar</span>
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`border rounded-lg p-4 transition-all duration-200 ${
                step.completed 
                  ? 'border-green-400/20 bg-green-400/5' 
                  : 'border-gray-700 bg-gray-700/30'
              }`}
            >
              {editingStepId === step.id ? (
                <div className="space-y-4">
                  <div className="mb-3">
                    <span className="text-sm font-medium text-blue-400">Etapa {index + 1}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Nome do Serviço *</label>
                      <input
                        type="text"
                        name="name"
                        value={editStepData.name}
                        onChange={handleEditStepInputChange}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Ex: Revisão, Suspensão Dianteira"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Responsável</label>
                      <input
                        type="text"
                        name="responsible"
                        value={editStepData.responsible}
                        onChange={handleEditStepInputChange}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Nome do responsável"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Horas Trabalhadas</label>
                      <input
                        type="number"
                        name="actual_hours"
                        value={editStepData.actual_hours}
                        onChange={handleEditStepInputChange}
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
                        name="days_worked"
                        value={editStepData.days_worked}
                        onChange={handleEditStepInputChange}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="0"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-gray-400">Peças Trocadas / Serviços Realizados</label>
                      <button
                        type="button"
                        onClick={addEditStepPart}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        + Peça
                      </button>
                    </div>
                    <div className="space-y-1">
                      {editStepData.parts.map((part, partIndex) => (
                        <div key={partIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={part}
                            onChange={(e) => updateEditStepPart(partIndex, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Ex: Filtro de Óleo Mann, Pastilha de Freio Dianteira"
                          />
                          {editStepData.parts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEditStepPart(partIndex)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleCancelEditStep}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEditStep}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Salvar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleStepCompletion(step.id)}
                        className={`mt-1 p-1 rounded-full transition-colors duration-200 ${
                          step.completed 
                            ? 'bg-green-400 text-white' 
                            : 'border-2 border-gray-600 text-transparent hover:border-green-400'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      
                      <div className="flex-1">
                        <h3 className={`font-medium ${step.completed ? 'text-green-400' : 'text-white'}`}>
                          {index + 1}. {step.name}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">{step.description}</p>
                        
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                          <span>Responsável: {step.responsible}</span>
                          {step.actual_hours > 0 && (
                            <span>Horas: {step.actual_hours}h</span>
                          )}
                          {step.days_worked > 0 && (
                            <span>Dias: {step.days_worked}</span>
                          )}
                          {step.completed_date && (
                            <span>Concluído: {parseLocalDate(step.completed_date).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {step.images && step.images.length > 0 && (
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                          <Camera className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditStep(step)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        title="Editar Etapa"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingStep(editingStep === step.id ? null : step.id)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Adicionar Observação"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              {editingStep === step.id && (
                <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                  <textarea
                    value={step.notes || ''}
                    onChange={(e) => {
                      const updatedSteps = steps.map(s => 
                        s.id === step.id ? { ...s, notes: e.target.value } : s
                      );
                      setSteps(updatedSteps);
                    }}
                    placeholder="Adicionar observações sobre esta etapa..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      onClick={() => setEditingStep(null)}
                      className="px-3 py-1 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        updateStepNotes(step.id, step.notes || '');
                        setEditingStep(null);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}
              
              {step.notes && editingStep !== step.id && (
                <div className="mt-3 p-3 bg-gray-700/30 rounded-lg">
                  <p className="text-gray-300 text-sm">{step.notes}</p>
                </div>
              )}
              
              {step.images && step.images.length > 0 && (
                <div className="mt-3 flex space-x-2">
                  {step.images.map((image: string, imgIndex: number) => (
                    <img
                      key={imgIndex}
                      src={image}
                      alt={`${step.name} - ${imgIndex + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-600"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Project Notes */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Observações do Serviço</h2>
          <button
            onClick={() => setEditingNotes(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Nota</span>
          </button>
        </div>
        
        {editingNotes && (
          <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Digite sua observação..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => {
                  setEditingNotes(false);
                  setNewNote('');
                }}
                className="px-3 py-1 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addProjectNote}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Salvar Nota
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {project.client_notes && (
            <div className="p-4 bg-blue-400/10 border border-blue-400/20 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-2">Observações do Cliente:</h4>
              <p className="text-gray-300">{project.client_notes}</p>
            </div>
          )}
          
          {project.notes && (
            <div className="p-4 bg-gray-700/30 rounded-lg">
              <h4 className="text-white font-medium mb-2">Observações Internas:</h4>
              <div className="text-gray-300 whitespace-pre-line">{project.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectProgress;
