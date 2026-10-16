/**
 * =====================================================
 * PROPOSALMANAGEMENT.TSX - GESTÃO DE ORÇAMENTOS
 * =====================================================
 *
 * Este componente gerencia todos os ORÇAMENTOS do sistema.
 * Um orçamento é uma proposta de preço para o cliente.
 *
 * FUNCIONALIDADES:
 * 1. Listar todos os orçamentos
 * 2. Filtrar por status (pendente, enviado, assinado, rejeitado)
 * 3. Buscar por cliente ou título
 * 4. Enviar orçamento por WhatsApp ou Email
 * 5. Upload de orçamento assinado pelo cliente
 * 6. Baixar PDF do orçamento
 * 7. Excluir orçamento
 *
 * STATUS DO ORÇAMENTO:
 * - Pendente: Ainda não foi enviado ao cliente
 * - Enviado: Cliente recebeu mas não respondeu
 * - Assinado: Cliente aceitou o orçamento
 * - Rejeitado: Cliente recusou o orçamento
 * - Expirado: Prazo de validade acabou
 */

import React, { useState, useEffect } from 'react';
import { FileText, Send, Check, X, Clock, Upload, MessageSquare, Mail, Phone, Download, Search, Paperclip, CheckCircle } from 'lucide-react';
import { db } from '../lib/supabase';
import { generateServiceProposal } from '../utils/pdfGenerator';
import ConfirmDialog from './ConfirmDialog';

const ProposalManagement: React.FC = () => {
  // ========================================
  // ESTADOS DO COMPONENTE
  // ========================================

  // Lista de orçamentos
  const [proposals, setProposals] = useState<any[]>([]);

  // Busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Se está carregando
  const [isLoading, setIsLoading] = useState(true);

  // Modais
  const [showSendModal, setShowSendModal] = useState(false);             // Modal de enviar
  const [showSignedUploadModal, setShowSignedUploadModal] = useState(false); // Modal de upload assinado

  // Orçamento selecionado
  const [selectedProposal, setSelectedProposal] = useState<any>(null);

  // Dados do envio
  const [sendMessage, setSendMessage] = useState('');                   // Mensagem a enviar
  const [sendMethod, setSendMethod] = useState<'whatsapp' | 'email'>('whatsapp'); // Método de envio

  // Upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);   // Arquivo assinado
  const [uploadNotes, setUploadNotes] = useState('');                    // Notas do upload

  // Controle de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      setIsLoading(true);
      const startTime = performance.now();
      const data = await db.getProposals();
      setProposals(data);
      const endTime = performance.now();
      console.log(`Proposals loaded in ${endTime - startTime} milliseconds`);
    } catch (error) {
      console.error('Erro ao carregar propostas:', error);
      alert('Erro ao carregar propostas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = searchTerm === '' || 
      proposal.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || proposal.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'sent':
        return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
      case 'signed':
        return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'rejected':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
      case 'expired':
        return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
      default:
        return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'signed':
        return <Check className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      case 'expired':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'sent':
        return 'Enviada';
      case 'signed':
        return 'Assinada';
      case 'rejected':
        return 'Rejeitada';
      case 'expired':
        return 'Expirada';
      default:
        return status;
    }
  };

  const handleSendProposal = (proposal: any) => {
    setSelectedProposal(proposal);
    setSendMessage(`Olá ${proposal.client?.name}!

Segue em anexo o orçamento de serviço para seu ${proposal.vehicle?.brand} ${proposal.vehicle?.model}.

Valor: R$ ${proposal.estimated_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Prazo: ${proposal.estimated_duration}

Para confirmar o serviço, favor assinar o documento e nos enviar de volta. A assinatura pode ser digital (Gov.br ou outra plataforma validada) ou física.

Qualquer dúvida, estou à disposição!

Atenciosamente,
ElvesPR`);
    setShowSendModal(true);
  };

  const handleSend = async () => {
    if (!selectedProposal) return;

    try {
      const proposalData = {
        client: selectedProposal.client,
        vehicle: selectedProposal.vehicle,
        services: selectedProposal.services,
        estimatedPrice: selectedProposal.estimated_price,
        estimatedDuration: selectedProposal.estimated_duration,
        terms: selectedProposal.terms
      };

      await generateServiceProposal(proposalData);

      await db.updateProposal(selectedProposal.id, {
        status: 'sent',
        notes: `Enviada via ${sendMethod} em ${new Date().toLocaleString('pt-BR')}`
      });

      if (sendMethod === 'whatsapp') {
        const phone = selectedProposal.client?.phone.replace(/\D/g, '');
        const message = encodeURIComponent(sendMessage);
        window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');

        setTimeout(() => {
          alert('O PDF do orçamento foi baixado. No WhatsApp, clique no clipe de papel (anexo) para enviar o arquivo PDF junto com a mensagem.');
        }, 1000);
      } else {
        const subject = encodeURIComponent(`Orçamento de Serviço - ${selectedProposal.title}`);
        const body = encodeURIComponent(sendMessage);
        window.open(`mailto:${selectedProposal.client?.email}?subject=${subject}&body=${body}`, '_blank');
      }

      await loadProposals();
      setShowSendModal(false);
      setSelectedProposal(null);
      setSendMessage('');
    } catch (error) {
      console.error('Erro ao enviar proposta:', error);
      alert('Erro ao enviar proposta');
    }
  };

  const handleUploadSignedPDF = (proposal: any) => {
    setSelectedProposal(proposal);
    setShowSignedUploadModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Por favor, selecione apenas arquivos PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Limite de 10MB');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleUploadSignedDocument = async () => {
    if (!selectedProposal || !uploadedFile) {
      alert('Por favor, selecione um arquivo PDF');
      return;
    }

    try {
      const fileBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(uploadedFile);
      });
      
      await db.updateProposal(selectedProposal.id, {
        status: 'signed',
        signed_date: new Date().toISOString(),
        signed_pdf_url: fileBase64,
        notes: uploadNotes || `Documento assinado anexado em ${new Date().toLocaleString('pt-BR')}`
      });

      await loadProposals();
      setShowSignedUploadModal(false);
      setSelectedProposal(null);
      setUploadedFile(null);
      setUploadNotes('');
      
      alert('Documento assinado anexado com sucesso!');
    } catch (error) {
      console.error('Erro ao anexar documento:', error);
      alert('Erro ao anexar documento');
    }
  };

  const handleDownloadSignedPDF = (proposal: any) => {
    if (proposal.signed_pdf_url) {
      const link = document.createElement('a');
      link.href = proposal.signed_pdf_url;
      link.target = '_blank';
      link.download = `documento-assinado-${proposal.client?.name || 'cliente'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    if (confirm('Tem certeza que deseja marcar esta proposta como rejeitada?')) {
      try {
        await db.updateProposal(proposalId, { 
          status: 'rejected',
          notes: `Proposta rejeitada em ${new Date().toLocaleString('pt-BR')}`
        });
        await loadProposals();
      } catch (error) {
        console.error('Erro ao rejeitar proposta:', error);
      }
    }
  };

  const handleDeleteProposal = (proposalId: string) => {
    setProposalToDelete(proposalId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteProposal = async () => {
    if (proposalToDelete) {
      try {
        await db.deleteProposal(proposalToDelete);
        await loadProposals();
        setProposalToDelete(null);
        setShowDeleteDialog(false);
        alert('Proposta excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir proposta:', error);
        alert('Erro ao excluir proposta. Tente novamente.');
      }
    }
  };

  const cancelDeleteProposal = () => {
    setProposalToDelete(null);
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
          <h1 className="text-3xl font-bold text-white mb-2">Gestão de Orçamentos</h1>
          <p className="text-gray-400">Gerencie propostas de serviço e acompanhe assinaturas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar orçamentos..."
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
            <option value="pending">Pendentes</option>
            <option value="sent">Enviadas</option>
            <option value="signed">Assinadas</option>
            <option value="rejected">Rejeitadas</option>
            <option value="expired">Expiradas</option>
          </select>
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProposals.map((proposal) => (
          <div
            key={proposal.id}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 relative group"
          >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(proposal.status)}`}>
                  {getStatusIcon(proposal.status)}
                  <span>{getStatusText(proposal.status)}</span>
                </span>
                <button
                  onClick={() => handleDeleteProposal(proposal.id)}
                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Excluir orçamento"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Proposal Header */}
            <div className="mb-4 pr-20">
              <h3 className="text-lg font-semibold text-white mb-2">{proposal.title}</h3>
              <div className="text-gray-400 text-sm">
                <p>{proposal.client?.name}</p>
                <p>{proposal.vehicle?.brand} {proposal.vehicle?.model} {proposal.vehicle?.year}</p>
              </div>
            </div>

            {/* Services */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Serviços:</h4>
              <div className="space-y-1">
                {proposal.services.slice(0, 3).map((service: string, index: number) => (
                  <div key={index} className="text-sm text-gray-400 flex items-center space-x-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                    <span>{service}</span>
                  </div>
                ))}
                {proposal.services.length > 3 && (
                  <div className="text-sm text-gray-500">
                    +{proposal.services.length - 3} mais...
                  </div>
                )}
              </div>
            </div>

            {/* Price and Duration */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400">Valor</div>
                <div className="text-lg font-semibold text-blue-400">
                  R$ {proposal.estimated_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Prazo</div>
                <div className="text-sm text-white">{proposal.estimated_duration}</div>
              </div>
            </div>

            {/* Signed Document Indicator */}
            {proposal.signed_pdf_url && (
              <div className="mb-4 p-3 bg-green-400/10 border border-green-400/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Paperclip className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">Documento Assinado Anexado</span>
                </div>
                <button
                  onClick={() => handleDownloadSignedPDF(proposal)}
                  className="text-green-300 hover:text-green-200 text-xs mt-1 underline"
                >
                  Visualizar documento
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-700">
              {proposal.status === 'pending' && (
                <button
                  onClick={() => handleSendProposal(proposal)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>Enviar Orçamento</span>
                </button>
              )}
              
              {proposal.status === 'sent' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUploadSignedPDF(proposal)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                  >
                    <Upload className="h-3 w-3" />
                    <span>Anexar Assinado</span>
                  </button>
                  <button
                    onClick={() => handleRejectProposal(proposal.id)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    <X className="h-3 w-3" />
                    <span>Rejeitar</span>
                  </button>
                </div>
              )}

              {proposal.status === 'signed' && proposal.signed_pdf_url && (
                <button
                  onClick={() => handleDownloadSignedPDF(proposal)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Assinado</span>
                </button>
              )}

              <div className="text-xs text-gray-500 text-center">
                {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProposals.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhuma proposta encontrada</h3>
          <p className="text-gray-400">Crie propostas na gestão de clientes.</p>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSendModal(false)}></div>
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-6">Enviar Orçamento</h3>

            {/* Send Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Método de Envio
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSendMethod('whatsapp')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    sendMethod === 'whatsapp'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => setSendMethod('email')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    sendMethod === 'email'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
              <h4 className="text-white font-medium mb-2">Destinatário:</h4>
              <div className="text-gray-300 text-sm">
                <p>{selectedProposal.client?.name}</p>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-1">
                    <Phone className="h-3 w-3" />
                    <span>{selectedProposal.client?.phone}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    <span>{selectedProposal.client?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mensagem
              </label>
              <textarea
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite sua mensagem..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signed Document Upload Modal */}
      {showSignedUploadModal && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSignedUploadModal(false)}></div>
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-6">Anexar Documento Assinado</h3>

            {/* Client Info */}
            <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
              <h4 className="text-white font-medium mb-2">Orçamento:</h4>
              <div className="text-gray-300 text-sm">
                <p>{selectedProposal.title}</p>
                <p>{selectedProposal.client?.name}</p>
              </div>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Documento Assinado (PDF) *
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              {uploadedFile && (
                <div className="mt-2 p-2 bg-green-400/10 border border-green-400/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 text-sm">{uploadedFile.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Observações
              </label>
              <textarea
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observações sobre o documento assinado..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowSignedUploadModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUploadSignedDocument}
                disabled={!uploadedFile}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Anexar Documento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Excluir Orçamento"
        message="Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita."
        onConfirm={confirmDeleteProposal}
        onCancel={cancelDeleteProposal}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ProposalManagement;
