import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { X, CheckCircle2, AlertCircle, Minus, Plus, MapPin, Tag, UserCheck, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WithdrawModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmWithdrawal: (payload: {
    itemId: string;
    requesterName: string;
    quantity: number;
    observation?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirmWithdrawal,
  isSubmitting
}) => {
  const [requesterName, setRequesterName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  useEffect(() => {
    if (isOpen && item) {
      setRequesterName('');
      setQuantity(1);
      setObservation('');
      setErrorMessage(null);
      setStep('form');
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleNextToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = requesterName.trim();
    if (!cleanName) {
      setErrorMessage('Informe o nome completo para realizar a retirada.');
      return;
    }

    if (cleanName.length < 3) {
      setErrorMessage('Por favor, informe seu nome e sobrenome completos.');
      return;
    }

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      setErrorMessage('A quantidade a retirar deve ser um número inteiro maior que zero.');
      return;
    }

    if (quantity > item.quantity) {
      setErrorMessage(`Quantidade solicitada (${quantity} ${item.unit}) maior que o estoque disponível (${item.quantity} ${item.unit}).`);
      return;
    }

    setStep('confirm');
  };

  const handleFinalSubmit = async () => {
    try {
      setErrorMessage(null);
      await onConfirmWithdrawal({
        itemId: item.id,
        requesterName: requesterName.trim(),
        quantity,
        observation: observation.trim() || undefined
      });

      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}

      setStep('success');
      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível realizar a retirada. Tente novamente.');
      setStep('form');
    }
  };

  const handleIncrement = () => {
    if (quantity < item.quantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        id="withdraw-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight font-['Outfit',sans-serif]">
                {step === 'success' ? 'Retirada Concluída' : 'Registrar Retirada de Item'}
              </h3>
              <p className="text-xs text-slate-300">
                Almoxarifado Geral • Baixa imediata de estoque
              </p>
            </div>
          </div>
          {step !== 'success' && (
            <button
              id="btn-close-withdraw-modal"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Item Highlight Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 mb-1">
                  <Tag className="h-3 w-3" />
                  {item.code}
                </span>
                <h4 className="font-bold text-slate-900 text-base leading-snug">
                  {item.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{item.location || 'Almoxarifado Principal'}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">{item.category}</span>
                </div>
              </div>

              {/* Available Stock Tag */}
              <div className="text-right flex-shrink-0 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Disponível
                </span>
                <div className="text-lg font-extrabold text-emerald-600 leading-none mt-0.5">
                  {item.quantity} <span className="text-xs font-semibold text-slate-600">{item.unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Form Input */}
          {step === 'form' && (
            <form onSubmit={handleNextToConfirm} className="space-y-4">
              
              {errorMessage && (
                <div id="withdraw-error-message" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Atenção</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Nome Completo (MANDATÓRIO) */}
              <div>
                <label htmlFor="requester-name-input" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                  Nome Completo de Quem Está Retirando <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="requester-name-input"
                    type="text"
                    required
                    autoFocus
                    value={requesterName}
                    onChange={(e) => {
                      setRequesterName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Ex: João Carlos da Silva"
                    className="block w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Obrigatório para identificação no histórico e prestação de contas.
                </p>
              </div>

              {/* Quantidade a Retirar */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                  Quantidade a Retirar ({item.unit}) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-decrement-qty"
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="h-10 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-300 disabled:opacity-40 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <input
                    id="withdraw-quantity-input"
                    type="number"
                    min="1"
                    max={item.quantity}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setQuantity(Math.min(Math.max(1, val), item.quantity));
                      } else {
                        setQuantity(1);
                      }
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="block w-full text-center py-2 text-base font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-xs"
                  />

                  <button
                    type="button"
                    id="btn-increment-qty"
                    onClick={handleIncrement}
                    disabled={quantity >= item.quantity}
                    className="h-10 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-300 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                  <span>Mínimo: 1 {item.unit}</span>
                  <span className="font-medium text-slate-700">Máximo disponível: {item.quantity} {item.unit}</span>
                </div>
              </div>

              {/* Observação / Motivo (Opcional) */}
              <div>
                <label htmlFor="withdraw-observation-input" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                  Observação ou Motivo <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  id="withdraw-observation-input"
                  type="text"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ex: Manutenção da Máquina 03, Obra Setor B, etc."
                  className="block w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-cancel-withdraw"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-proceed-confirm-withdraw"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <span>Avançar para Confirmação</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </form>
          )}

          {/* Step 2: Clear Confirmation Dialog */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-950 mb-1">
                    Confirmação de Retirada
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    Confirma a retirada de <strong className="text-amber-950 font-bold">{quantity} {item.unit}</strong> de <strong className="text-amber-950 font-bold">"{item.name}"</strong>?
                  </p>
                </div>
              </div>

              {/* Summary Table */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Colaborador Solicitante:</span>
                  <span className="font-bold text-slate-900">{requesterName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Quantidade a Baixar:</span>
                  <span className="font-bold text-emerald-700">{quantity} {item.unit}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Estoque Restante Após Retirada:</span>
                  <span className="font-bold text-slate-800">{item.quantity - quantity} {item.unit}</span>
                </div>
                {observation && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Motivo/Obs:</span>
                    <span className="font-medium text-slate-700 italic">{observation}</span>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons for Confirm Step */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-back-to-edit-withdraw"
                  disabled={isSubmitting}
                  onClick={() => setStep('form')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Voltar e Alterar
                </button>
                <button
                  type="button"
                  id="btn-final-confirm-withdrawal"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>Confirmar Retirada</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success State */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-3 animate-fadeIn">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 shadow-inner">
                <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 font-['Outfit',sans-serif]">
                Retirada registrada com sucesso!
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                O estoque foi atualizado para <strong>{item.quantity - quantity} {item.unit}</strong> e a movimentação foi armazenada no histórico.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
