/**
 * =====================================================
 * CLIENTMANAGEMENT.TSX - GESTÃO DE CLIENTES
 * =====================================================
 *
 * Este componente é responsável por GERENCIAR TODOS OS CLIENTES.
 * É uma das telas mais importantes do sistema.
 *
 * FUNCIONALIDADES:
 * 1. Listar todos os clientes cadastrados
 * 2. Buscar clientes por nome, email ou telefone
 * 3. Editar dados do cliente
 * 4. Excluir cliente (com confirmação)
 * 5. Gerar proposta de serviço (orçamento)
 * 6. Gerar lista de peças para o cliente trazer
 * 7. Ver detalhes dos veículos do cliente
 * 8. Ver checklist de avarias do veículo
 *
 * COMO FUNCIONA:
 * - Carrega clientes e veículos do banco de dados
 * - Mostra em uma tabela organizada
 * - Permite várias ações através de botões e modais
 */

import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, Mail, Phone, Car, User, Trash2, CreditCard as Edit3, X, MessageSquare, Save, AlertTriangle, Download } from 'lucide-react';
import { db } from '../lib/supabase';
import { generateServiceProposal, generatePartsListPDF } from '../utils/pdfGenerator';
import ConfirmDialog from './ConfirmDialog';

// Propriedades que o componente recebe
interface ClientManagementProps {
  onNewClient: () => void;  // Função para abrir tela de novo cliente
}

const ClientManagement: React.FC<ClientManagementProps> = ({ onNewClient }) => {
  // ========================================
  // ESTADOS DO COMPONENTE
  // ========================================

  // Lista de clientes carregados do banco
  const [clients, setClients] = useState<any[]>([]);

  // Termo de busca para filtrar clientes
  const [searchTerm, setSearchTerm] = useState('');

  // Se está carregando dados
  const [isLoading, setIsLoading] = useState(true);

  // Controle dos modais (janelas que abrem por cima)
  const [showProposalModal, setShowProposalModal] = useState(false);     // Modal de proposta
  const [showPartsListModal, setShowPartsListModal] = useState(false);   // Modal de lista de peças
  const [showEditModal, setShowEditModal] = useState(false);             // Modal de edição
  const [showPartsViewModal, setShowPartsViewModal] = useState(false);   // Modal de ver peças

  // Cliente selecionado para ações
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Controle do diálogo de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  // Controle de exclusão de lista de peças
  const [showDeletePartsListDialog, setShowDeletePartsListDialog] = useState(false);
  const [partsListToDelete, setPartsListToDelete] = useState<string | null>(null);

  // Controle de exibição de detalhes de avarias
  const [showDamageDetails, setShowDamageDetails] = useState<string | null>(null);

  // Listas de peças dos clientes
  const [allPartsLists, setAllPartsLists] = useState<any[]>([]);
  const [viewingPartsList, setViewingPartsList] = useState<any>(null);
  const [editingPartsListId, setEditingPartsListId] = useState<string | null>(null);

  const [editData, setEditData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const [proposalData, setProposalData] = useState({
    title: '',
    services: [''],
    parts: [''],
    estimatedPrice: '',
    estimatedDuration: '',
    terms: ['']
  });

  const [partsListData, setPartsListData] = useState({
    parts: [''],
    notes: ''
  });

  const [editPartsListData, setEditPartsListData] = useState({
    parts: [''],
    notes: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const startTime = performance.now();
      const data = await db.getClients();

      // Get vehicles for each client
      const clientsWithVehicles = await Promise.all(
        data.map(async (client) => {
          const vehicles = await db.getVehicles();
          const clientVehicles = vehicles.filter(v => v.client_id === client.id);
          return { ...client, vehicles: clientVehicles };
        })
      );

      setClients(clientsWithVehicles);

      // Load parts lists separately - don't block clients if this fails
      try {
        const partsLists = await db.getPartsLists();
        setAllPartsLists(partsLists);
      } catch (partsError) {
        console.error('Erro ao carregar listas de peças:', partsError);
        setAllPartsLists([]);
      }

      const endTime = performance.now();
      console.log(`Clients loaded in ${endTime - startTime} milliseconds`);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      alert('Erro ao carregar clientes. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleDeleteClient = (clientId: string) => {
    setClientToDelete(clientId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (clientToDelete) {
      try {
        await db.deleteClient(clientToDelete);
        await loadClients();
        setClientToDelete(null);
        setShowDeleteDialog(false);
        alert('Cliente excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        alert('Erro ao excluir cliente. Tente novamente.');
      }
    }
  };

  const cancelDelete = () => {
    setClientToDelete(null);
    setShowDeleteDialog(false);
  };

  const handleWhatsApp = (client: any) => {
    const phone = client.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${client.name}! Aqui é da ElvesPR - Gestão Automotiva. Como posso ajudá-lo?`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const handleEditClient = (client: any) => {
    setEditData({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      notes: client.notes || ''
    });
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editData.name.trim() || !editData.phone.trim()) {
      alert('Nome e telefone são obrigatórios');
      return;
    }

    try {
      await db.updateClient(editData.id, {
        name: editData.name.trim(),
        email: editData.email.trim(),
        phone: editData.phone.trim(),
        notes: editData.notes.trim()
      });
      await loadClients();
      setShowEditModal(false);
      setSelectedClient(null);
      alert('Cliente atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      alert('Erro ao atualizar cliente. Tente novamente.');
    }
  };

  const getDamageLabels = (checklist: any) => {
    if (!checklist) return [];
    const labels: { key: string; label: string }[] = [
      { key: 'scratches', label: 'Arranhões' },
      { key: 'dents', label: 'Amassados' },
      { key: 'rust', label: 'Ferrugem' },
      { key: 'paint_damage', label: 'Danos na Pintura' },
      { key: 'broken_parts', label: 'Peças Quebradas' },
      { key: 'interior_damage', label: 'Danos no Interior' },
      { key: 'tire_condition', label: 'Problemas nos Pneus' },
      { key: 'other_issues', label: 'Outros Problemas' },
    ];
    return labels.filter(l => checklist[l.key]);
  };

  const handleGenerateProposal = (client: any) => {
    setSelectedClient(client);
    setProposalData({
      title: 'Orçamento de Serviço Mecânico',
      services: ['Troca de Óleo', 'Revisão Completa', 'Troca de Pastilhas de Freio'],
      parts: [''],
      estimatedPrice: '',
      estimatedDuration: '2-3 dias úteis',
      terms: [
        'Peças originais ou equivalentes de primeira linha',
        'Mão de obra especializada',
        'Pagamento: 50% entrada + 50% na entrega'
      ]
    });
    setShowProposalModal(true);
  };

  const handleGeneratePartsList = (client: any) => {
    setSelectedClient(client);
    setPartsListData({
      parts: [''],
      notes: ''
    });
    setShowPartsListModal(true);
  };

  const handleProposalInputChange = (field: string, value: string | string[]) => {
    setProposalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePartsListInputChange = (field: string, value: string | string[]) => {
    setPartsListData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addServiceField = () => {
    setProposalData(prev => ({
      ...prev,
      services: [...prev.services, '']
    }));
  };

  const removeServiceField = (index: number) => {
    setProposalData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const updateServiceField = (index: number, value: string) => {
    setProposalData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => i === index ? value : service)
    }));
  };

  const addPartField = () => {
    setProposalData(prev => ({
      ...prev,
      parts: [...prev.parts, '']
    }));
  };

  const removePartField = (index: number) => {
    setProposalData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  const updatePartField = (index: number, value: string) => {
    setProposalData(prev => ({
      ...prev,
      parts: prev.parts.map((part, i) => i === index ? value : part)
    }));
  };

  const addTermField = () => {
    setProposalData(prev => ({
      ...prev,
      terms: [...prev.terms, '']
    }));
  };

  const removeTermField = (index: number) => {
    setProposalData(prev => ({
      ...prev,
      terms: prev.terms.filter((_, i) => i !== index)
    }));
  };

  const updateTermField = (index: number, value: string) => {
    setProposalData(prev => ({
      ...prev,
      terms: prev.terms.map((term, i) => i === index ? value : term)
    }));
  };

  const addPartsListField = () => {
    setPartsListData(prev => ({
      ...prev,
      parts: [...prev.parts, '']
    }));
  };

  const removePartsListField = (index: number) => {
    setPartsListData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  const updatePartsListField = (index: number, value: string) => {
    setPartsListData(prev => ({
      ...prev,
      parts: prev.parts.map((part, i) => i === index ? value : part)
    }));
  };

  const handleCreateProposal = async () => {
    if (!selectedClient || !proposalData.title || proposalData.services.filter(s => s.trim()).length === 0) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      const vehicle = selectedClient.vehicles[0]; // Use first vehicle
      if (!vehicle) {
        alert('Cliente não possui veículo cadastrado');
        return;
      }

      // Save proposal to database
      await db.createProposal({
        client_id: selectedClient.id,
        vehicle_id: vehicle.id,
        title: proposalData.title,
        services: proposalData.services.filter(s => s.trim()),
        parts: proposalData.parts.filter(p => p.trim()),
        estimated_price: parseFloat(proposalData.estimatedPrice) || 0,
        estimated_duration: proposalData.estimatedDuration,
        terms: proposalData.terms.filter(t => t.trim()),
        status: 'pending'
      });

      // Generate PDF
      await generateServiceProposal({
        client: selectedClient,
        vehicle: vehicle,
        services: proposalData.services.filter(s => s.trim()),
        parts: proposalData.parts.filter(p => p.trim()),
        estimatedPrice: parseFloat(proposalData.estimatedPrice) || 0,
        estimatedDuration: proposalData.estimatedDuration,
        terms: proposalData.terms.filter(t => t.trim())
      });

      setShowProposalModal(false);
      alert('Orçamento criado e PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      alert('Erro ao criar orçamento');
    }
  };

  const handleCreatePartsList = async () => {
    if (!selectedClient || partsListData.parts.filter(p => p.trim()).length === 0) {
      alert('Por favor, adicione pelo menos uma peça');
      return;
    }

    const vehicle = selectedClient.vehicles?.[0];
    if (!vehicle) {
      alert('Este cliente não possui veículo cadastrado. Cadastre um veículo antes de gerar a lista de peças.');
      return;
    }

    try {
      await db.createPartsList({
        client_id: selectedClient.id,
        vehicle_id: vehicle.id,
        parts: partsListData.parts.filter(p => p.trim()),
        notes: partsListData.notes
      });

      await generatePartsListPDF({
        client: selectedClient,
        vehicle: vehicle,
        parts: partsListData.parts.filter(p => p.trim()),
        notes: partsListData.notes
      });

      await loadClients();
      setShowPartsListModal(false);
      setPartsListData({ parts: [''], notes: '' });
    } catch (error) {
      console.error('Erro ao gerar lista de peças:', error);
      alert('Erro ao gerar lista de peças');
    }
  };

  const handleViewPartsList = (partsList: any) => {
    setViewingPartsList(partsList);
    setEditingPartsListId(null);
    setEditPartsListData({ parts: [...(partsList.parts || [])], notes: partsList.notes || '' });
    setShowPartsViewModal(true);
  };

  const handleSendPartsListWhatsApp = (partsList: any) => {
    const phone = (partsList.client?.phone || '').replace(/\D/g, '');
    const clientName = partsList.client?.name || 'Cliente';
    const vehicleInfo = partsList.vehicle ? `${partsList.vehicle.brand || ''} ${partsList.vehicle.model || ''} ${partsList.vehicle.year || ''}` : '';
    const partsText = (partsList.parts || []).map((p: string, i: number) => `${i + 1}. ${p}`).join('\n');
    const message = encodeURIComponent(`Olá ${clientName}!

Segue acima a lista de peças para compra do seu ${vehicleInfo}:

${partsText}

${partsList.notes ? `Observações: ${partsList.notes}\n\n` : ''}Qualquer dúvida, estou à disposição!

Atenciosamente,
ElvesPR - Gestão Automotiva`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const handleSaveEditPartsList = async () => {
    if (editPartsListData.parts.filter(p => p.trim()).length === 0) {
      alert('Adicione pelo menos uma peça');
      return;
    }

    try {
      await db.updatePartsList(editingPartsListId!, {
        parts: editPartsListData.parts.filter(p => p.trim()),
        notes: editPartsListData.notes
      });

      await loadClients();
      setViewingPartsList((prev: any) => prev ? {
        ...prev,
        parts: editPartsListData.parts.filter(p => p.trim()),
        notes: editPartsListData.notes
      } : null);
      setEditingPartsListId(null);
    } catch (error) {
      console.error('Erro ao atualizar lista:', error);
      alert('Erro ao atualizar lista de peças');
    }
  };

  const addEditPartsListField = () => {
    setEditPartsListData(prev => ({ ...prev, parts: [...prev.parts, ''] }));
  };

  const removeEditPartsListField = (index: number) => {
    setEditPartsListData(prev => ({ ...prev, parts: prev.parts.filter((_, i) => i !== index) }));
  };

  const updateEditPartsListField = (index: number, value: string) => {
    setEditPartsListData(prev => ({ ...prev, parts: prev.parts.map((p, i) => i === index ? value : p) }));
  };

  const handleRegeneratePartsListPDF = async (partsList: any) => {
    try {
      const client = partsList.client || clients.find(c => c.id === partsList.client_id);
      const vehicle = partsList.vehicle || client?.vehicles?.[0];
      await generatePartsListPDF({
        client: client || { name: 'Cliente', email: '', phone: '' },
        vehicle: vehicle || { brand: '', model: '', year: '' },
        parts: partsList.parts || [],
        notes: partsList.notes || ''
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF');
    }
  };

  const getClientPartsLists = (clientId: string) => {
    return allPartsLists.filter(pl => pl.client_id === clientId);
  };

  const handleDeletePartsList = (id: string) => {
    setPartsListToDelete(id);
    setShowDeletePartsListDialog(true);
  };

  const confirmDeletePartsList = async () => {
    if (!partsListToDelete) return;
    try {
      await db.deletePartsList(partsListToDelete);
      setAllPartsLists(prev => prev.filter(pl => pl.id !== partsListToDelete));
      setPartsListToDelete(null);
      setShowDeletePartsListDialog(false);
    } catch (error) {
      console.error('Erro ao excluir lista de peças:', error);
      alert('Erro ao excluir lista de peças. Tente novamente.');
    }
  };

  const cancelDeletePartsList = () => {
    setPartsListToDelete(null);
    setShowDeletePartsListDialog(false);
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
          <h1 className="text-3xl font-bold text-white mb-2">Gestão de Clientes</h1>
          <p className="text-gray-400">Gerencie seus clientes e gere orçamentos</p>
        </div>
        <button
          onClick={onNewClient}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full max-w-md"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 relative group"
          >
            {/* Delete Button */}
            <button
              onClick={() => handleDeleteClient(client.id)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
              title="Excluir cliente"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* Client Info */}
            <div className="mb-4 pr-8">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-400/10 rounded-lg">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{client.name}</h3>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <Mail className="h-4 w-4" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
              </div>

              {/* Quick Actions Row */}
              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={() => handleWhatsApp(client)}
                  className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                  title="Enviar WhatsApp"
                >
                  <MessageSquare className="h-3 w-3" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => handleEditClient(client)}
                  className="flex items-center space-x-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs transition-colors"
                  title="Editar cliente"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Editar</span>
                </button>
              </div>
            </div>

            {/* Vehicles */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Veículos:</h4>
              {client.vehicles && client.vehicles.length > 0 ? (
                <div className="space-y-2">
                  {client.vehicles.map((vehicle: any) => {
                    const damages = getDamageLabels(vehicle.damage_checklist);
                    const vehicleId = vehicle.id;
                    const isExpanded = showDamageDetails === vehicleId;
                    return (
                      <div key={vehicleId} className="bg-gray-700/30 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-gray-400 text-sm">
                            <Car className="h-3 w-3" />
                            <span>{vehicle.brand} {vehicle.model} {vehicle.year}</span>
                            {vehicle.license_plate && (
                              <span className="text-gray-500 text-xs">({vehicle.license_plate})</span>
                            )}
                          </div>
                          {damages.length > 0 && (
                            <button
                              onClick={() => setShowDamageDetails(isExpanded ? null : vehicleId)}
                              className="flex items-center space-x-1 text-yellow-400 hover:text-yellow-300 text-xs"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              <span>{damages.length}</span>
                            </button>
                          )}
                        </div>
                        {isExpanded && damages.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-600">
                            <p className="text-xs text-yellow-400 font-medium mb-1">Avarias:</p>
                            <div className="flex flex-wrap gap-1">
                              {damages.map((d: { key: string; label: string }) => (
                                <span key={d.key} className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 rounded text-xs">
                                  {d.label}
                                </span>
                              ))}
                            </div>
                            {vehicle.damage_checklist?.notes && (
                              <p className="text-xs text-gray-400 mt-1 italic">
                                {vehicle.damage_checklist.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum veículo cadastrado</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4 border-t border-gray-700">
              <button
                onClick={() => handleGenerateProposal(client)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Orçamento</span>
              </button>
              <button
                onClick={() => handleGeneratePartsList(client)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Lista Peças</span>
              </button>
            </div>

            {/* Saved Parts Lists */}
            {getClientPartsLists(client.id).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <h4 className="text-xs font-medium text-gray-400 mb-2">Listas de Peças:</h4>
                <div className="space-y-1">
                  {getClientPartsLists(client.id).map((pl) => (
                    <div key={pl.id} className="flex items-center justify-between bg-gray-700/30 rounded px-2 py-1">
                      <button
                        onClick={() => handleViewPartsList(pl)}
                        className="text-xs text-blue-400 hover:text-blue-300 truncate flex-1 text-left"
                      >
                        {(pl.parts || []).length} peça(s) - {new Date(pl.created_at).toLocaleDateString('pt-BR')}
                      </button>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => handleSendPartsListWhatsApp(pl)}
                          className="p-1 text-green-400 hover:text-green-300"
                          title="Enviar WhatsApp"
                        >
                          <MessageSquare className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleRegeneratePartsListPDF(pl)}
                          className="p-1 text-gray-400 hover:text-white"
                          title="Baixar PDF"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeletePartsList(pl.id)}
                          className="p-1 text-gray-400 hover:text-red-400"
                          title="Excluir lista"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhum cliente encontrado</h3>
          <p className="text-gray-400">Adicione um novo cliente para começar.</p>
        </div>
      )}

      {/* Proposal Modal */}
      {showProposalModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProposalModal(false)}></div>
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Gerar Orçamento</h3>
              <button
                onClick={() => setShowProposalModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Client Info */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Cliente:</h4>
                <p className="text-gray-300">{selectedClient.name}</p>
                <p className="text-gray-400 text-sm">{selectedClient.email} • {selectedClient.phone}</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título do Orçamento
                </label>
                <input
                  type="text"
                  value={proposalData.title}
                  onChange={(e) => handleProposalInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Orçamento de Serviço Mecânico"
                />
              </div>

              {/* Services */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Serviços Propostos
                  </label>
                  <button
                    onClick={addServiceField}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    + Adicionar Serviço
                  </button>
                </div>
                <div className="space-y-2">
                  {proposalData.services.map((service, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={service}
                        onChange={(e) => updateServiceField(index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Troca de Óleo 5W30"
                      />
                      {proposalData.services.length > 1 && (
                        <button
                          onClick={() => removeServiceField(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Parts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Peças (Opcional)
                  </label>
                  <button
                    onClick={addPartField}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    + Adicionar Peça
                  </button>
                </div>
                <div className="space-y-2">
                  {proposalData.parts.map((part, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={part}
                        onChange={(e) => updatePartField(index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Filtro de Óleo Mann W712/75"
                      />
                      <button
                        onClick={() => removePartField(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preço Estimado (R$)
                  </label>
                  <input
                    type="number"
                    value={proposalData.estimatedPrice}
                    onChange={(e) => handleProposalInputChange('estimatedPrice', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prazo Estimado
                  </label>
                  <input
                    type="text"
                    value={proposalData.estimatedDuration}
                    onChange={(e) => handleProposalInputChange('estimatedDuration', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 2-3 dias úteis"
                  />
                </div>
              </div>

              {/* Terms */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Termos e Condições
                  </label>
                  <button
                    onClick={addTermField}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    + Adicionar Termo
                  </button>
                </div>
                <div className="space-y-2">
                  {proposalData.terms.map((term, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={term}
                        onChange={(e) => updateTermField(index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Garantia de 90 dias"
                      />
                      {proposalData.terms.length > 1 && (
                        <button
                          onClick={() => removeTermField(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                <button
                  onClick={() => setShowProposalModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateProposal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Gerar Orçamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parts List Modal */}
      {showPartsListModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPartsListModal(false)}></div>
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Gerar Lista de Peças</h3>
              <button
                onClick={() => setShowPartsListModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Client Info */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Cliente:</h4>
                <p className="text-gray-300">{selectedClient.name}</p>
              </div>

              {/* Parts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Lista de Peças
                  </label>
                  <button
                    onClick={addPartsListField}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    + Adicionar Peça
                  </button>
                </div>
                <div className="space-y-2">
                  {partsListData.parts.map((part, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={part}
                        onChange={(e) => updatePartsListField(index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Filtro de Óleo Mann W712/75"
                      />
                      {partsListData.parts.length > 1 && (
                        <button
                          onClick={() => removePartsListField(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={partsListData.notes}
                  onChange={(e) => handlePartsListInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Observações sobre as peças..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowPartsListModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePartsList}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Gerar Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Editar Cliente</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData((prev: typeof editData) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData((prev: typeof editData) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Telefone *</label>
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData((prev: typeof editData) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Salvar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parts List View Modal */}
      {showPartsViewModal && viewingPartsList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPartsViewModal(false)}></div>
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Lista de Peças</h3>
              <button
                onClick={() => setShowPartsViewModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Client Info */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-1">Cliente:</h4>
                <p className="text-gray-300">{viewingPartsList.client?.name || 'Cliente'}</p>
                {viewingPartsList.vehicle && (
                  <p className="text-gray-400 text-sm">{viewingPartsList.vehicle.brand} {viewingPartsList.vehicle.model} {viewingPartsList.vehicle.year}</p>
                )}
              </div>

              {/* Parts */}
              {editingPartsListId === viewingPartsList.id ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">Editar Lista de Peças</label>
                    <button onClick={addEditPartsListField} className="text-blue-400 hover:text-blue-300 text-sm">+ Adicionar Peça</button>
                  </div>
                  <div className="space-y-2">
                    {editPartsListData.parts.map((part, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={part}
                          onChange={(e) => updateEditPartsListField(index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nome da peça"
                        />
                        {editPartsListData.parts.length > 1 && (
                          <button onClick={() => removeEditPartsListField(index)} className="text-red-400 hover:text-red-300">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                    <textarea
                      value={editPartsListData.notes}
                      onChange={(e) => setEditPartsListData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button onClick={() => setEditingPartsListId(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSaveEditPartsList} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2">
                      <Save className="h-4 w-4" />
                      <span>Salvar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Peças ({(viewingPartsList.parts || []).length})</h4>
                  <div className="space-y-1">
                    {(viewingPartsList.parts || []).map((part: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2 text-gray-300 text-sm bg-gray-700/30 rounded px-3 py-2">
                        <span className="text-blue-400 font-medium">{index + 1}.</span>
                        <span>{part}</span>
                      </div>
                    ))}
                  </div>
                  {viewingPartsList.notes && (
                    <div className="mt-3 p-3 bg-gray-700/30 rounded-lg">
                      <p className="text-xs text-gray-400 font-medium mb-1">Observações:</p>
                      <p className="text-gray-300 text-sm">{viewingPartsList.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleSendPartsListWhatsApp(viewingPartsList)}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => handleRegeneratePartsListPDF(viewingPartsList)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar PDF</span>
                </button>
                {editingPartsListId !== viewingPartsList.id && (
                  <button
                    onClick={() => setEditingPartsListId(viewingPartsList.id)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Editar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e todos os dados relacionados (veículos, serviços, etc.) serão perdidos."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Delete Parts List Dialog */}
      <ConfirmDialog
        isOpen={showDeletePartsListDialog}
        title="Excluir Lista de Peças"
        message="Tem certeza que deseja excluir esta lista de peças? Esta ação não pode ser desfeita."
        onConfirm={confirmDeletePartsList}
        onCancel={cancelDeletePartsList}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ClientManagement;