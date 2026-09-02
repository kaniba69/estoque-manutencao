import React, { useState } from 'react';
import { Item } from '../../types';
import { PlusCircle, Search, Edit3, Trash2, ArrowUpDown, RotateCcw, MapPin, Tag, AlertTriangle, CheckCircle2, XCircle, Filter, Eye } from 'lucide-react';

interface AdminItemsListProps {
  items: Item[];
  categories: string[];
  onOpenNewItemModal: () => void;
  onOpenEditModal: (item: Item) => void;
  onOpenAdjustModal: (item: Item) => void;
  onOpenDeleteModal: (item: Item) => void;
  onRestoreItem: (itemId: string) => Promise<void>;
  isLoading: boolean;
}

export const AdminItemsList: React.FC<AdminItemsListProps> = ({
  items,
  categories,
  onOpenNewItemModal,
  onOpenEditModal,
  onOpenAdjustModal,
  onOpenDeleteModal,
  onRestoreItem,
  isLoading
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'normal' | 'low' | 'zero' | 'deleted'>('all');

  const filteredItems = items.filter((item) => {
    // Deleted status filter
    if (selectedStatus === 'deleted') {
      if (item.active) return false;
    } else {
      if (!item.active) return false; // hide deleted unless selected
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matches =
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      if (!matches) return false;
    }

    if (selectedCategory !== 'all' && item.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }

    if (selectedStatus === 'normal') {
      return item.quantity > item.minStock;
    }
    if (selectedStatus === 'low') {
      return item.quantity > 0 && item.quantity <= item.minStock;
    }
    if (selectedStatus === 'zero') {
      return item.quantity === 0;
    }

    return true;
  });

  const getStatusBadge = (item: Item) => {
    if (!item.active) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Excluído (Arquivado)
        </span>
      );
    }
    if (item.quantity === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Sem Estoque
        </span>
      );
    }
    if (item.quantity <= item.minStock) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Estoque Baixo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Normal
      </span>
    );
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit',sans-serif]">
              Gerenciamento de Itens e Estoque
            </h3>
            <p className="text-xs text-slate-500">
              Cadastre novos itens, altere cadastros, ajuste saldos e configure níveis mínimos.
            </p>
          </div>

          <button
            id="admin-btn-add-item"
            onClick={onOpenNewItemModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Novo Item</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              id="admin-items-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, peça ou local..."
              className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            />
          </div>

          {/* Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              <option value="all">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="block w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              <option value="all">Todos os status (Ativos)</option>
              <option value="normal">Estoque Normal</option>
              <option value="low">Estoque Baixo (Alerta)</option>
              <option value="zero">Sem Estoque (Zerados)</option>
              <option value="deleted">Itens Excluídos (Arquivados)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3.5">Código / Peça</th>
                <th scope="col" className="px-4 py-3.5">Categoria</th>
                <th scope="col" className="px-4 py-3.5">Localização</th>
                <th scope="col" className="px-4 py-3.5 text-center">Saldo / Mínimo</th>
                <th scope="col" className="px-4 py-3.5 text-center">Status</th>
                <th scope="col" className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-xs">
                    Nenhum item encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className={`hover:bg-slate-50/70 transition-colors ${!item.active ? 'opacity-70 bg-slate-50/40' : ''}`}>
                    
                    {/* Code & Name */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mb-0.5">
                        {item.code}
                      </span>
                      <div className="font-bold text-slate-900 leading-snug">
                        {item.name}
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{item.description}</p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-700 font-medium">
                      {item.category}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.location || 'Almoxarifado'}</span>
                      </div>
                    </td>

                    {/* Quantity & Min Stock */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className={`text-base font-black ${
                        item.quantity === 0 ? 'text-red-600' : item.quantity <= item.minStock ? 'text-amber-600' : 'text-slate-900'
                      }`}>
                        {item.quantity}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold ml-1">{item.unit}</span>
                      <span className="block text-[10px] text-slate-400 font-medium">Mín: {item.minStock} {item.unit}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {getStatusBadge(item)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {item.active ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            id={`btn-admin-adjust-${item.id}`}
                            onClick={() => onOpenAdjustModal(item)}
                            title="Ajustar saldo de estoque"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </button>
                          <button
                            id={`btn-admin-edit-${item.id}`}
                            onClick={() => onOpenEditModal(item)}
                            title="Editar informações"
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            id={`btn-admin-delete-${item.id}`}
                            onClick={() => onOpenDeleteModal(item)}
                            title="Excluir item (Soft Delete)"
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`btn-admin-restore-${item.id}`}
                          onClick={() => onRestoreItem(item.id)}
                          title="Restaurar item no almoxarifado"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restaurar</span>
                        </button>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
