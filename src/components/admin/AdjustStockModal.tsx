import React, { useState, useEffect } from 'react';
import { Item } from '../../types';
import { X, ArrowUpDown, AlertCircle, Plus, Minus, Check } from 'lucide-react';

interface AdjustStockModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAdjust: (itemId: string, delta: number, reason: string) => Promise<void>;
  isLoading: boolean;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirmAdjust,
  isLoading
}) => {
  const [mode, setMode] = useState<'add' | 'subtract'>('add');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode('add');
      setQuantity(1);
      setReason('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const currentStock = item.quantity;
  const delta = mode === 'add' ? quantity : -quantity;
  const finalStock = currentStock + delta;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      setErrorMessage('Informe uma quantidade válida maior que zero.');
      return;
    }

    if (finalStock < 0) {
      setErrorMessage(`O estoque não pode ficar negativo (mínimo permitido: 0 ${item.unit}).`);
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Informe a justificativa ou motivo do ajuste de estoque para auditoria.');
      return;
    }

    try {
      await onConfirmAdjust(item.id, delta, reason.trim());
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar ajuste de estoque.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        id="adjust-stock-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold">
              <ArrowUpDown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight font-['Outfit',sans-serif]">
                Ajuste Manual de Estoque
              </h3>
              <p className="text-xs text-slate-300">
                Entrada, baixa extraordinária ou inventário
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Target Item summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-blue-700 font-mono block">{item.code}</span>
            <span className="font-bold text-slate-900 text-sm block truncate">{item.name}</span>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Saldo Atual:</span>
              <strong className="text-slate-800 font-bold">{currentStock} {item.unit}</strong>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mode Switcher: Entrada (+) vs Baixa/Ajuste (-) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Tipo de Movimentação
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-mode-add"
                onClick={() => setMode('add')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  mode === 'add'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Entrada (+ Adicionar)</span>
              </button>

              <button
                type="button"
                id="btn-mode-subtract"
                onClick={() => setMode('subtract')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  mode === 'subtract'
                    ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Minus className="h-3.5 w-3.5" />
                <span>Baixa (- Reduzir)</span>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Quantidade ({item.unit}) <span className="text-red-500">*</span>
            </label>
            <input
              id="input-adjust-qty"
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="block w-full px-3.5 py-2 text-base font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            />
          </div>

          {/* Live Preview Calculation */}
          <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs">
            <span className="text-blue-900 font-medium">Novo Saldo Resultante:</span>
            <span className={`font-black text-sm ${finalStock < 0 ? 'text-red-600' : 'text-blue-950'}`}>
              {finalStock} {item.unit}
            </span>
          </div>

          {/* Mandatory Justification */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Justificativa / Motivo do Ajuste <span className="text-red-500">*</span>
            </label>
            <input
              id="input-adjust-reason"
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Recebimento NF 1042 / Contagem de inventário / Descarte avariado"
              className="block w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            />
            <p className="text-[10px] text-slate-400 mt-1">Registrado no histórico para fins de auditoria.</p>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-adjust"
              disabled={isLoading || finalStock < 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>Confirmar Ajuste</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
