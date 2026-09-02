import React, { useState, useEffect } from 'react';
import { Item } from '../../types';
import { X, Save, AlertCircle, Package, Tag, Layers, MapPin, Hash, Check } from 'lucide-react';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  itemToEdit: Item | null;
  existingCategories: string[];
  isLoading: boolean;
}

const DEFAULT_CATEGORIES = [
  'Fixação e Parafusos',
  'Rolamentos e Transmissão',
  'Filtros e Fluidos',
  'Componentes Elétricos',
  'Ferramentas Manuais',
  'Pneumática e Hidráulica',
  'Equipamentos de Proteção (EPI)',
  'Geral'
];

const COMMON_UNITS = ['UN', 'PC', 'KG', 'M', 'L', 'CX', 'PAR', 'RL', 'KIT'];

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  existingCategories,
  isLoading
}) => {
  const isEditing = !!itemToEdit;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Fixação e Parafusos');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [unit, setUnit] = useState('UN');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories])).filter(Boolean);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (itemToEdit) {
        setName(itemToEdit.name);
        setCode(itemToEdit.code);
        if (allCategories.includes(itemToEdit.category)) {
          setCategory(itemToEdit.category);
          setIsCustomCategory(false);
        } else {
          setCategory('CUSTOM');
          setCustomCategory(itemToEdit.category);
          setIsCustomCategory(true);
        }
        setQuantity(itemToEdit.quantity);
        setMinStock(itemToEdit.minStock);
        setUnit(itemToEdit.unit || 'UN');
        setLocation(itemToEdit.location || '');
        setDescription(itemToEdit.description || '');
        setImageUrl(itemToEdit.imageUrl || '');
      } else {
        setName('');
        setCode('');
        setCategory(allCategories[0] || 'Fixação e Parafusos');
        setCustomCategory('');
        setIsCustomCategory(false);
        setQuantity(10);
        setMinStock(5);
        setUnit('UN');
        setLocation('');
        setDescription('');
        setImageUrl('');
      }
    }
  }, [isOpen, itemToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    const finalCategory = isCustomCategory ? customCategory.trim() : category;

    if (!cleanName) {
      setErrorMessage('O nome da peça é obrigatório.');
      return;
    }

    if (!cleanCode) {
      setErrorMessage('O código/identificação da peça é obrigatório.');
      return;
    }

    if (!finalCategory) {
      setErrorMessage('Selecione ou informe uma categoria para o item.');
      return;
    }

    if (quantity < 0 || isNaN(quantity)) {
      setErrorMessage('A quantidade não pode ser negativa.');
      return;
    }

    if (minStock < 0 || isNaN(minStock)) {
      setErrorMessage('O estoque mínimo não pode ser negativo.');
      return;
    }

    try {
      await onSave({
        name: cleanName,
        code: cleanCode,
        category: finalCategory,
        quantity: Number(quantity),
        minStock: Number(minStock),
        unit: unit.trim().toUpperCase(),
        location: location.trim() || 'Almoxarifado Principal',
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar item.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        id="item-form-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight font-['Outfit',sans-serif]">
                {isEditing ? 'Editar Item do Estoque' : 'Cadastrar Novo Item no Almoxarifado'}
              </h3>
              <p className="text-xs text-slate-300">
                {isEditing ? `Atualizando informações de ${itemToEdit.code}` : 'Preencha os campos para disponibilizar o item no catálogo'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-item-form-modal"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {errorMessage && (
            <div id="item-form-error" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Nome da Peça */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Nome da Peça / Item <span className="text-red-500">*</span>
            </label>
            <input
              id="input-item-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Rolamento Rígido de Esferas 6204 DDU"
              className="block w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
            />
          </div>

          {/* Row 2: Código & Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Código / Identificação Única <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Tag className="h-4 w-4" />
                </div>
                <input
                  id="input-item-code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ROL-6204-DDU"
                  className="block w-full pl-9 pr-3.5 py-2.5 text-sm font-mono font-bold bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs uppercase"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Não são permitidos códigos duplicados.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                id="select-item-category"
                value={isCustomCategory ? 'CUSTOM' : category}
                onChange={(e) => {
                  if (e.target.value === 'CUSTOM') {
                    setIsCustomCategory(true);
                  } else {
                    setIsCustomCategory(false);
                    setCategory(e.target.value);
                  }
                }}
                className="block w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="CUSTOM">+ Outra categoria (personalizada)...</option>
              </select>

              {isCustomCategory && (
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Digite o nome da nova categoria..."
                  className="mt-2 block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Row 3: Quantidade, Estoque Mínimo, Unidade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                {isEditing ? 'Quantidade em Saldo' : 'Quantidade Inicial'} <span className="text-red-500">*</span>
              </label>
              <input
                id="input-item-quantity"
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="block w-full px-3.5 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Estoque Mínimo <span className="text-red-500">*</span>
              </label>
              <input
                id="input-item-min-stock"
                type="number"
                min="0"
                required
                value={minStock}
                onChange={(e) => setMinStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="block w-full px-3.5 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">Dispara alerta amarelo</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Unidade de Medida
              </label>
              <select
                id="select-item-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="block w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Localização */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Localização no Almoxarifado
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="h-4 w-4" />
              </div>
              <input
                id="input-item-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Prateleira B3 - Caixa 12 - Corredor 2"
                className="block w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Row 5: Descrição */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Descrição Detalhada / Aplicação
            </label>
            <textarea
              id="input-item-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Especificações técnicas, dimensões, marcas compatíveis ou instruções..."
              className="block w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 flex-shrink-0">
            <button
              type="button"
              id="btn-cancel-item-form"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-save-item"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Item'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
