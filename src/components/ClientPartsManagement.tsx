/**
 * =====================================================
 * CLIENTPARTSMANAGEMENT.TSX - PEÇAS DOS CLIENTES
 * =====================================================
 *
 * Este componente gerencia as PEÇAS QUE OS CLIENTES TROUXERAM.
 * Às vezes o cliente traz a própria peça para instalar.
 *
 * FUNCIONALIDADES:
 * 1. Listar todas as peças que clientes trouxeram
 * 2. Registrar nova peça trazida por cliente
 * 3. Filtrar por cliente, veículo ou condição
 * 4. Adicionar fotos da peça
 * 5. Ver detalhes de cada peça
 * 6. Excluir registro de peça
 *
 * CONDIÇÕES DA PEÇA:
 * - Nova: Peça comprada nova pelo cliente
 * - Usada: Peça de segunda mão
 * - Recondicionada: Peça restaurada
 * - Danificada: Peça com defeito
 *
 * POR QUE USAR:
 * - Controlar o que o cliente trouxe
 * - Documentar o estado da peça
 * - Evitar problemas com garantia
 */

import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Trash2, Save, Camera, Eye, X, Upload } from 'lucide-react';
import { db } from '../lib/supabase';
import ConfirmDialog from './ConfirmDialog';

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Propriedades que o componente recebe
interface ClientPartsManagementProps {
  onBack: () => void;  // Função para voltar
}

const ClientPartsManagement: React.FC<ClientPartsManagementProps> = ({ onBack }) => {
  // ========================================
  // ESTADOS DO COMPONENTE
  // ========================================

  // Busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');        // Filtro por cliente
  const [filterCondition, setFilterCondition] = useState('all');   // Filtro por condição

  // Controle de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [partToDelete, setPartToDelete] = useState<string | null>(null);

  // Formulário de adicionar
  const [showAddForm, setShowAddForm] = useState(false);

  // Modais de foto
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPartForPhoto, setSelectedPartForPhoto] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Modal de visualização
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Dados carregados do banco
  const [clientParts, setClientParts] = useState<any[]>([]);   // Peças dos clientes
  const [clients, setClients] = useState<any[]>([]);           // Lista de clientes
  const [vehicles, setVehicles] = useState<any[]>([]);         // Lista de veículos
  const [parts, setParts] = useState<any[]>([]);               // Catálogo de peças
  const [isLoading, setIsLoading] = useState(true);

  // Fotos das peças (armazenadas localmente)
  const [partPhotos, setPartPhotos] = useState<Record<string, string[]>>({});

  const [newClientPart, setNewClientPart] = useState({
    client_id: '',
    vehicle_id: '',
    part_name: '',
    quantity: 1,
    condition: 'new' as 'new' | 'used' | 'refurbished' | 'damaged',
    notes: '',
    received_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
    loadPhotosFromStorage();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [clientPartsData, clientsData, vehiclesData, partsData] = await Promise.all([
        db.getClientParts(),
        db.getClients(),
        db.getVehicles(),
        db.getParts()
      ]);

      setClientParts(clientPartsData);
      setClients(clientsData);
      setVehicles(vehiclesData);
      setParts(partsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPhotosFromStorage = () => {
    try {
      const savedPhotos = localStorage.getItem('clientPartPhotos');
      if (savedPhotos) {
        setPartPhotos(JSON.parse(savedPhotos));
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    }
  };

  const savePhotosToStorage = (photos: Record<string, string[]>) => {
    try {
      localStorage.setItem('clientPartPhotos', JSON.stringify(photos));
    } catch (error) {
      console.error('Erro ao salvar fotos:', error);
    }
  };

  const filteredClientParts = clientParts.filter(clientPart => {
    const matchesSearch = searchTerm === '' ||
      clientPart.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (clientPart.part_name || clientPart.part?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = filterClient === 'all' || clientPart.client_id === filterClient;
    const matchesCondition = filterCondition === 'all' || clientPart.condition === filterCondition;

    return matchesSearch && matchesClient && matchesCondition;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewClientPart(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));

    // Reset vehicle when client changes
    if (name === 'client_id') {
      setNewClientPart(prev => ({ ...prev, vehicle_id: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newClientPart.client_id || !newClientPart.vehicle_id || !newClientPart.part_name) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      await db.createClientPart({
        client_id: newClientPart.client_id,
        vehicle_id: newClientPart.vehicle_id,
        part_name: newClientPart.part_name,
        quantity: newClientPart.quantity,
        condition: newClientPart.condition,
        notes: newClientPart.notes,
        received_date: newClientPart.received_date
      });
      await loadData();
      setShowAddForm(false);
      setNewClientPart({
        client_id: '',
        vehicle_id: '',
        part_name: '',
        quantity: 1,
        condition: 'new',
        notes: '',
        received_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Erro ao criar peça do cliente:', error);
      alert('Erro ao salvar peça do cliente');
    }
  };

  const handleDeleteClientPart = (partId: string) => {
    setPartToDelete(partId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (partToDelete) {
      try {
        await db.deleteClientPart(partToDelete);
        
        // Remove photos from storage
        const updatedPhotos = { ...partPhotos };
        delete updatedPhotos[partToDelete];
        setPartPhotos(updatedPhotos);
        savePhotosToStorage(updatedPhotos);
        
        await loadData();
        setPartToDelete(null);
        setShowDeleteDialog(false);
      } catch (error) {
        console.error('Erro ao excluir peça do cliente:', error);
      }
    }
  };

  const cancelDelete = () => {
    setPartToDelete(null);
    setShowDeleteDialog(false);
  };

  const handleManagePhotos = (partId: string) => {
    setSelectedPartForPhoto(partId);
    setShowPhotoModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      alert('Por favor, selecione apenas arquivos de imagem');
      return;
    }
    
    setUploadedFiles(imageFiles);
  };

  const handleSavePhotos = async () => {
    if (!selectedPartForPhoto || uploadedFiles.length === 0) {
      alert('Por favor, selecione pelo menos uma imagem');
      return;
    }

    try {
      // Convert files to base64
      const imageUrls = await Promise.all(
        uploadedFiles.map((file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        })
      );

      const currentPhotos = partPhotos[selectedPartForPhoto] || [];
      const updatedPhotos = {
        ...partPhotos,
        [selectedPartForPhoto]: [...currentPhotos, ...imageUrls]
      };

      setPartPhotos(updatedPhotos);
      savePhotosToStorage(updatedPhotos);

      setShowPhotoModal(false);
      setUploadedFiles([]);
      setSelectedPartForPhoto(null);
      
      alert(`${uploadedFiles.length} foto(s) adicionada(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao salvar fotos:', error);
      alert('Erro ao salvar fotos');
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleRemovePhoto = (partId: string, photoIndex: number) => {
    const updatedPhotos = {
      ...partPhotos,
      [partId]: (partPhotos[partId] || []).filter((_, index) => index !== photoIndex)
    };
    
    setPartPhotos(updatedPhotos);
    savePhotosToStorage(updatedPhotos);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'used':
        return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
      case 'refurbished':
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'damaged':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
      default:
        return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'Nova';
      case 'used':
        return 'Usada';
      case 'refurbished':
        return 'Recondicionada';
      case 'damaged':
        return 'Danificada';
      default:
        return condition;
    }
  };

  const clientVehicles = vehicles.filter(v => v.client_id === newClientPart.client_id);

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
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
            <span>Voltar</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Peças dos Clientes</h1>
            <p className="text-gray-400">Gerencie as peças fornecidas pelos clientes</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nova Peça</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Nova Peça do Cliente</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cliente *
                </label>
                <select
                  name="client_id"
                  value={newClientPart.client_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  Veículo *
                </label>
                <select
                  name="vehicle_id"
                  value={newClientPart.vehicle_id}
                  onChange={handleInputChange}
                  disabled={!newClientPart.client_id}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  required
                >
                  <option value="">Selecione um veículo</option>
                  {clientVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} {vehicle.year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome da Peça *
                </label>
                <input
                  type="text"
                  name="part_name"
                  value={newClientPart.part_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Filtro de óleo, Pastilha de freio"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantidade
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={newClientPart.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Condição
                </label>
                <select
                  name="condition"
                  value={newClientPart.condition}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="new">Nova</option>
                  <option value="used">Usada</option>
                  <option value="refurbished">Recondicionada</option>
                  <option value="damaged">Danificada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Recebimento
                </label>
                <input
                  type="date"
                  name="received_date"
                  value={newClientPart.received_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Observações
              </label>
              <textarea
                name="notes"
                value={newClientPart.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observações sobre a peça..."
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Salvar Peça</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
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

          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Clientes</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas as Condições</option>
            <option value="new">Nova</option>
            <option value="used">Usada</option>
            <option value="refurbished">Recondicionada</option>
            <option value="damaged">Danificada</option>
          </select>
        </div>
      </div>

      {/* Client Parts Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Cliente / Veículo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Peça
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Condição
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Fotos
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredClientParts.map((clientPart) => (
                <tr key={clientPart.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{clientPart.client?.name}</div>
                      <div className="text-gray-400 text-sm">
                        {clientPart.vehicle?.brand} {clientPart.vehicle?.model} {clientPart.vehicle?.year}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">
                        {clientPart.part_name || clientPart.part?.name || 'Não informado'}
                      </div>
                      {clientPart.part && (
                        <div className="text-gray-400 text-sm">
                          {clientPart.part?.brand} • {clientPart.part?.part_number}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">{clientPart.quantity}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getConditionColor(clientPart.condition)}`}>
                      {getConditionText(clientPart.condition)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-400 text-sm">
                      {parseLocalDate(clientPart.received_date).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {partPhotos[clientPart.id] && partPhotos[clientPart.id].length > 0 ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-1">
                            {partPhotos[clientPart.id].slice(0, 3).map((photo, index) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`Foto ${index + 1}`}
                                className="w-8 h-8 rounded-full border-2 border-gray-700 object-cover cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => handleImageClick(photo)}
                              />
                            ))}
                          </div>
                          {partPhotos[clientPart.id].length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{partPhotos[clientPart.id].length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">Sem fotos</span>
                      )}
                      <button
                        onClick={() => handleManagePhotos(clientPart.id)}
                        className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                        title="Gerenciar Fotos"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteClientPart(clientPart.id)}
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

        {filteredClientParts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhuma peça encontrada</h3>
            <p className="text-gray-400">Adicione peças dos clientes para vê-las aqui.</p>
          </div>
        )}
      </div>

      {/* Photo Management Modal */}
      {showPhotoModal && selectedPartForPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPhotoModal(false)}></div>
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Gerenciar Fotos da Peça</h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Photos */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-4">Fotos Atuais</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(partPhotos[selectedPartForPhoto] || []).map((imageUrl: string, index: number) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden cursor-pointer">
                      <img
                        src={imageUrl}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        onClick={() => handleImageClick(imageUrl)}
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePhoto(selectedPartForPhoto, index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover foto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              {(!partPhotos[selectedPartForPhoto] || partPhotos[selectedPartForPhoto].length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  Nenhuma foto adicionada ainda
                </div>
              )}
            </div>

            {/* Upload New Photos */}
            <div className="border-t border-gray-700 pt-6">
              <h4 className="text-white font-medium mb-4">Adicionar Novas Fotos</h4>
              
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-300 mb-2">
                    {uploadedFiles.length} arquivo(s) selecionado(s):
                  </p>
                  <div className="space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="text-xs text-gray-400 flex items-center space-x-2">
                        <Camera className="h-3 w-3" />
                        <span>{file.name}</span>
                        <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowPhotoModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePhotos}
                  disabled={uploadedFiles.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Salvar Fotos</span>
                </button>
              </div>
            </div>
          </div>
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

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Excluir Peça do Cliente"
        message="Tem certeza que deseja excluir esta peça? Esta ação não pode ser desfeita e todas as fotos associadas serão perdidas."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default ClientPartsManagement;