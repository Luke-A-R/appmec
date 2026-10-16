/**
 * =====================================================
 * CONFIRMDIALOG.TSX - DIÁLOGO DE CONFIRMAÇÃO
 * =====================================================
 *
 * Este componente é uma janela que pede confirmação do usuário.
 * É usado antes de fazer ações perigosas como EXCLUIR dados.
 *
 * QUANDO USAR:
 * - Antes de excluir um cliente
 * - Antes de excluir uma peça
 * - Antes de cancelar um serviço
 * - Qualquer ação que não pode ser desfeita
 *
 * TIPOS:
 * - danger (vermelho): Para ações destrutivas como excluir
 * - warning (amarelo): Para alertas
 * - info (azul): Para confirmações neutras
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

// Propriedades que o diálogo recebe
interface ConfirmDialogProps {
  isOpen: boolean;              // Se o diálogo está visível
  title: string;                // Título da janela
  message: string;              // Mensagem explicativa
  onConfirm: () => void;        // Função quando confirma
  onCancel: () => void;         // Função quando cancela
  confirmText?: string;         // Texto do botão confirmar (padrão: "Confirmar")
  cancelText?: string;          // Texto do botão cancelar (padrão: "Cancelar")
  type?: 'danger' | 'warning' | 'info';  // Tipo visual do diálogo
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  // Se não está aberto, não mostra nada
  if (!isOpen) return null;

  /**
   * Retorna os estilos baseado no tipo do diálogo
   * Define cores do ícone e do botão de confirmar
   */
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        // Vermelho - para ações perigosas como excluir
        return {
          icon: 'text-red-400',
          iconBg: 'bg-red-400/10',
          confirmBtn: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        // Amarelo - para alertas
        return {
          icon: 'text-yellow-400',
          iconBg: 'bg-yellow-400/10',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        // Azul - para confirmações neutras
        return {
          icon: 'text-blue-400',
          iconBg: 'bg-blue-400/10',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    // Container fixo que cobre toda a tela
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fundo escuro com blur */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel}></div>

      {/* Caixa do diálogo */}
      <div className="relative bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
        {/* Botão X para fechar */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabeçalho com ícone e título */}
        <div className="flex items-center space-x-3 mb-4">
          <div className={`p-3 rounded-lg ${styles.iconBg}`}>
            <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>

        {/* Mensagem explicativa */}
        <p className="text-gray-300 mb-6">{message}</p>

        {/* Botões de ação */}
        <div className="flex space-x-3">
          {/* Botão Cancelar */}
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {cancelText}
          </button>

          {/* Botão Confirmar (cor varia pelo tipo) */}
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 ${styles.confirmBtn} text-white rounded-lg font-medium transition-colors duration-200`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
