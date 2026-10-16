/**
 * =====================================================
 * PROJECTMANAGEMENT.TSX - GESTÃO DE SERVIÇOS
 * =====================================================
 *
 * Este componente é responsável por GERENCIAR TODOS OS SERVIÇOS.
 * É aqui que você controla todos os trabalhos da oficina.
 *
 * FUNCIONALIDADES:
 * 1. Listar todos os serviços cadastrados
 * 2. Buscar serviços por cliente, veículo ou título
 * 3. Filtrar por status (em andamento, concluído, etc.)
 * 4. Filtrar por prioridade (urgente, alta, média, baixa)
 * 5. Ver progresso detalhado de cada serviço
 * 6. Marcar serviço como concluído
 * 7. Reabrir serviço pausado ou cancelado
 * 8. Gerar relatório de serviço (PDF)
 * 9. Excluir serviço
 *
 * STATUS DE SERVIÇO:
 * - Não Iniciado: Ainda não começou
 * - Em Progresso: Sendo executado
 * - Pausado: Interrompido temporariamente
 * - Concluído: Terminado
 * - Cancelado: Desistiu do serviço
 */

import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, FileText, RotateCcw, CheckCircle, Camera, X, Play, Trash2, Pencil } from 'lucide-react';
import { db } from '../lib/supabase';
import { generateProjectReport } from '../utils/pdfGenerator';

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};
import ConfirmDialog from './ConfirmDialog';

// Propriedades que o componente recebe
interface ProjectManagementProps {
  onNewProject: () => void;                      // Função para abrir novo serviço
  onProjectProgress: (projectId: string) => void; // Função para ver progresso
}

const ProjectManagement: React.FC<ProjectManagementProps> = ({ onNewProject, onProjectProgress }) => {
  // ========================================
  // ESTADOS DO COMPONENTE
  // ========================================

  // Lista de serviços carregados do banco
  const [projects, setProjects] = useState<any[]>([]);

  // Termo de busca
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros
  const [filterStatus, setFilterStatus] = useState('all');     // Filtro de status
  const [filterPriority, setFilterPriority] = useState('all'); // Filtro de prioridade

  // Se está carregando
  const [isLoading, setIsLoading] = useState(true);

  // Controle de modais
  const [showImageModal, setShowImageModal] = useState(false);     // Modal de fotos
  const [selectedImage, setSelectedImage] = useState('');          // Imagem selecionada
  const [showConfirmDialog, setShowConfirmDialog] = useState(false); // Confirmação de ação
  const [actionType, setActionType] = useState<'complete' | 'reopen'>('complete'); // Tipo de ação

  // Serviço selecionado
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Controle de exclusão
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Controle de edição
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    service_type: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    estimated_cost: '',
    start_date: '',
    estimated_completion: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const startTime = performance.now();
      const data = await db.getProjects();
      setProjects(data);
      const endTime = performance.now();
      console.log(`Projects loaded in ${endTime - startTime} milliseconds`);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      alert('Erro ao carregar projetos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchTerm === '' ||
      project.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.vehicle?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.vehicle?.model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || project.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

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
      case 'cancelled':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'in-progress':
        return 'Em Progresso';
      case 'on-hold':
        return 'Pausado';
      case 'not-started':
        return 'Não Iniciado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return priority;
    }
  };

  const handleCompleteProject = (project: any) => {
    setSelectedProject(project);
    setActionType('complete');
    setShowConfirmDialog(true);
  };

  const handleReopenProject = (project: any) => {
    setSelectedProject(project);
    setActionType('reopen');
    setShowConfirmDialog(true);
  };

  const confirmAction = async () => {
    if (!selectedProject) return;

    try {
      if (actionType === 'complete') {
        await db.updateProject(selectedProject.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          actual_completion: new Date().toISOString().split('T')[0],
          progress_percentage: 100
        });
        alert('Projeto concluído com sucesso!');
      } else if (actionType === 'reopen') {
        await db.updateProject(selectedProject.id, {
          status: 'in-progress',
          completed_at: undefined,
          actual_completion: undefined
        });
        alert('Projeto reaberto! Você pode editá-lo na aba "Em Progresso".');
      }

      await loadProjects();
      setShowConfirmDialog(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      alert('Erro ao atualizar projeto');
    }
  };

  const cancelAction = () => {
    setShowConfirmDialog(false);
    setSelectedProject(null);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await db.deleteProject(projectToDelete);
      await loadProjects();
      setShowDeleteProjectDialog(false);
      setProjectToDelete(null);
      alert('Serviço excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      alert('Erro ao excluir serviço');
    }
  };

  const cancelDeleteProject = () => {
    setShowDeleteProjectDialog(false);
    setProjectToDelete(null);
  };

  const handleStartProject = async (projectId: string) => {
    try {
      await db.updateProject(projectId, {
        status: 'in-progress',
        started_at: new Date().toISOString()
      });
      await loadProjects();
      alert('Projeto iniciado com sucesso!');
    } catch (error) {
      console.error('Erro ao iniciar projeto:', error);
      alert('Erro ao iniciar projeto');
    }
  };

  const handleGenerateReport = async (project: any) => {
    try {
      const [projectData, stepsData] = await Promise.all([
        db.getProject(project.id),
        db.getProjectSteps(project.id)
      ]);

      const completedSteps = stepsData.filter((step: any) => step.completed).length;
      const totalSteps = stepsData.length;
      const totalActualHours = stepsData.reduce((sum: number, step: any) => sum + (Number(step.actual_hours) || 0), 0);
      const totalDaysWorked = stepsData.reduce((sum: number, step: any) => sum + (Number(step.days_worked) || 0), 0);

      const reportData = {
        project: projectData,
        steps: stepsData,
        completedSteps,
        totalSteps,
        totalEstimatedHours: stepsData.reduce((sum: number, step: any) => sum + (Number(step.estimated_hours) || 0), 0),
        totalActualHours,
        totalDaysWorked
      };

      await generateProjectReport(reportData);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório');
    }
  };

  const handleOpenEdit = (project: any) => {
    setEditingProject(project);
    setEditForm({
      title: project.title || '',
      description: project.description || '',
      service_type: project.service_type || '',
      priority: project.priority || 'medium',
      estimated_cost: project.estimated_cost?.toString() || '',
      start_date: project.start_date || '',
      estimated_completion: project.estimated_completion || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProject || !editForm.title.trim()) {
      alert('O título do serviço é obrigatório.');
      return;
    }
    try {
      await db.updateProject(editingProject.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        service_type: editForm.service_type.trim(),
        priority: editForm.priority,
        estimated_cost: parseFloat(editForm.estimated_cost) || 0,
        start_date: editForm.start_date || undefined,
        estimated_completion: editForm.estimated_completion || undefined
      });
      await loadProjects();
      setShowEditModal(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      alert('Erro ao salvar alterações. Tente novamente.');
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'in-progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    notStarted: projects.filter(p => p.status === 'not-started').length
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
          <h1 className="text-3xl font-bold text-white mb-2">Gestão de Serviços</h1>
          <p className="text-gray-400">Gerencie seus serviços automotivos</p>
        </div>
        <button
          onClick={onNewProject}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
          <p className="text-gray-400 text-sm">Total de Serviços</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-2xl font-bold text-blue-400">{stats.inProgress}</h3>
          <p className="text-gray-400 text-sm">Em Progresso</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-2xl font-bold text-green-400">{stats.completed}</h3>
          <p className="text-gray-400 text-sm">Concluídos</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-2xl font-bold text-gray-400">{stats.notStarted}</h3>
          <p className="text-gray-400 text-sm">Não Iniciados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="not-started">Não Iniciados</option>
            <option value="in-progress">Em Progresso</option>
            <option value="completed">Concluídos</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200"
          >
            {/* Project Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{project.title}</h3>
                <div className="text-gray-400 text-sm">
                  <p>{project.client?.name}</p>
                  <p>{project.vehicle?.brand} {project.vehicle?.model} {project.vehicle?.year}</p>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(project.priority)}`}>
                  {getPriorityText(project.priority)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Progresso</span>
                <span className="text-sm text-blue-400 font-medium">{project.progress_percentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress_percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Project Details */}
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Descrição:</span>
                <span className="text-white text-right max-w-[200px] truncate" title={project.description}>
                  {project.description}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tipo:</span>
                <span className="text-white">{project.service_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Custo:</span>
                <span className="text-white">R$ {project.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              {project.start_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Início:</span>
                  <span className="text-white">{parseLocalDate(project.start_date).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
              {project.estimated_completion && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Previsão:</span>
                  <span className="text-white">{parseLocalDate(project.estimated_completion).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>

            {/* Images Preview */}
            {((project.before_images && project.before_images.length > 0) ||
              (project.after_images && project.after_images.length > 0)) && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Camera className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Fotos do Projeto</span>
                </div>
                <div className="flex space-x-2">
                  {project.before_images?.slice(0, 3).map((image: string, index: number) => (
                    <img
                      key={`before-${index}`}
                      src={image}
                      alt={`Antes ${index + 1}`}
                      className="w-12 h-12 rounded object-cover cursor-pointer hover:scale-110 transition-transform border border-gray-600"
                      onClick={() => handleImageClick(image)}
                    />
                  ))}
                  {project.after_images?.slice(0, 3).map((image: string, index: number) => (
                    <img
                      key={`after-${index}`}
                      src={image}
                      alt={`Depois ${index + 1}`}
                      className="w-12 h-12 rounded object-cover cursor-pointer hover:scale-110 transition-transform border border-green-600"
                      onClick={() => handleImageClick(image)}
                    />
                  ))}
                  {((project.before_images?.length || 0) + (project.after_images?.length || 0)) > 6 && (
                    <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                      +{((project.before_images?.length || 0) + (project.after_images?.length || 0)) - 6}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2 pt-4 border-t border-gray-700">
              {project.status === 'not-started' && (
                <>
                  <button
                    onClick={() => handleStartProject(project.id)}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    <span>Iniciar</span>
                  </button>
                  <button
                    onClick={() => onProjectProgress(project.id)}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Ver</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(project)}
                    className="flex items-center justify-center px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                    title="Editar serviço"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setProjectToDelete(project.id); setShowDeleteProjectDialog(true); }}
                    className="flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors ml-auto"
                    title="Excluir serviço"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}

              {project.status === 'in-progress' && (
                <>
                  <button
                    onClick={() => onProjectProgress(project.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Progresso</span>
                  </button>
                  <button
                    onClick={() => handleCompleteProject(project)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                    title="Concluir Projeto"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Concluir</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(project)}
                    className="flex items-center justify-center px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                    title="Editar serviço"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setProjectToDelete(project.id); setShowDeleteProjectDialog(true); }}
                    className="flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                    title="Excluir serviço"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}

              {project.status === 'completed' && (
                <>
                  <button
                    onClick={() => handleReopenProject(project)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                    title="Reabrir Projeto"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reabrir</span>
                  </button>
                  <button
                    onClick={() => handleGenerateReport(project)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Relatório</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(project)}
                    className="flex items-center justify-center px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                    title="Editar serviço"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setProjectToDelete(project.id); setShowDeleteProjectDialog(true); }}
                    className="flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                    title="Excluir serviço"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}

              {(project.status === 'on-hold' || project.status === 'cancelled') && (
                <>
                  <button
                    onClick={() => handleOpenEdit(project)}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                    title="Editar serviço"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => { setProjectToDelete(project.id); setShowDeleteProjectDialog(true); }}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                    title="Excluir serviço"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhum serviço encontrado</h3>
          <p className="text-gray-400">Crie um novo serviço para começar.</p>
        </div>
      )}

      {/* Image Zoom Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedImage}
              alt="Imagem ampliada"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={actionType === 'complete' ? 'Concluir Projeto' : 'Reabrir Projeto'}
        message={
          actionType === 'complete'
            ? 'Tem certeza que deseja marcar este serviço como concluído? O progresso será definido como 100%.'
            : 'Tem certeza que deseja reabrir este serviço? Ele voltará para o status "Em Progresso".'
        }
        onConfirm={confirmAction}
        onCancel={cancelAction}
        confirmText={actionType === 'complete' ? 'Concluir' : 'Reabrir'}
        cancelText="Cancelar"
        type={actionType === 'complete' ? 'info' : 'warning'}
      />

      {/* Delete Project Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteProjectDialog}
        title="Excluir Serviço"
        message="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos."
        onConfirm={confirmDeleteProject}
        onCancel={cancelDeleteProject}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Editar Serviço</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Título do Serviço *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Troca de freios dianteiros"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Serviço</label>
                <input
                  type="text"
                  value={editForm.service_type}
                  onChange={(e) => setEditForm(p => ({ ...p, service_type: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Mecânica, Funilaria, Pintura"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição detalhada do serviço"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prioridade</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm(p => ({ ...p, priority: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Custo Estimado (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.estimated_cost}
                    onChange={(e) => setEditForm(p => ({ ...p, estimated_cost: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Data de Início</label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Previsão de Término</label>
                  <input
                    type="date"
                    value={editForm.estimated_completion}
                    onChange={(e) => setEditForm(p => ({ ...p, estimated_completion: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
