import React from 'react';
import { Item } from '../../types';
import { AlertTriangle, Trash2, X, Check, ShieldCheck } from 'lucide-react';

interface DeleteConfirmModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (itemId: string) => Promise<void>;
  isLoading: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirmDelete,
  isLoading
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div 
        id="delete-confirm-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight font-['Outfit',sans-serif]">
                Confirmar Exclusão de Item
              </h3>
              <p className="text-xs text-red-100">
                Remoção do catálogo do almoxarifado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-red-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
            <p className="text-xs font-bold text-red-950 uppercase tracking-wide">
              Tem certeza que deseja excluir este item?
            </p>
            <div className="text-sm font-bold text-slate-900">
              "{item.name}" <span className="font-mono text-xs text-slate-500 font-normal">({item.code})</span>
            </div>
            <p className="text-xs text-slate-600">
              Estoque atual em saldo: <strong>{item.quantity} {item.unit}</strong>
            </p>
          </div>

          {/* Soft delete preservation note */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-950">
            <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-blue-900">Histórico de Retiradas Preservado (Soft Delete)</span>
              <p className="text-blue-800 leading-relaxed">
                O item deixará de aparecer para os funcionários no estoque normal, mas todas as retiradas e movimentações anteriores continuarão armazenadas com segurança no histórico para fins de controle e auditoria.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              id="btn-cancel-delete"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btn-confirm-delete"
              disabled={isLoading}
              onClick={() => onConfirmDelete(item.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-red-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Excluindo...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Confirmar Exclusão</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
