import React, { useState } from 'react';
import { Item } from '../types';
import { Search, MapPin, Tag, AlertTriangle, CheckCircle2, XCircle, LayoutGrid, Table, ArrowDownCircle, X } from 'lucide-react';

interface PublicCatalogProps {
  items: Item[];
  categories: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  onOpenWithdrawModal: (item: Item) => void;
  isLoading: boolean;
}

export const PublicCatalog: React.FC<PublicCatalogProps> = ({
  items,
  categories,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  onOpenWithdrawModal,
  isLoading
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Stock status helper
  const getStockStatus = (item: Item) => {
    if (item.quantity === 0) {
      return {
        label: 'Sem estoque',
        color: 'red',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        dotClass: 'bg-red-500',
        cardBorder: 'border-red-200 bg-red-50/10'
      };
    }
    if (item.quantity <= item.minStock) {
      return {
        label: 'Estoque baixo',
        color: 'yellow',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
        cardBorder: 'border-amber-200'
      };
    }
    return {
      label: 'Estoque normal',
      color: 'green',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
      cardBorder: 'border-slate-200'
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Filters Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4">
        
        {/* Main Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            id="public-catalog-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Digite o nome ou código da peça para pesquisar..."
            className="block w-full pl-11 pr-10 py-3 text-sm sm:text-base bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              id="btn-clear-search"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Category Pills & Status Filter Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 lg:pb-0 scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 mr-1 whitespace-nowrap">
              Categorias:
            </span>
            <button
              id="filter-category-all"
              onClick={() => onSelectCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todas ({items.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                id={`filter-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Filters & View Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
            
            {/* Status Pills */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-medium border border-slate-200">
              <button
                id="filter-status-all"
                onClick={() => onSelectStatus('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedStatus === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                id="filter-status-available"
                onClick={() => onSelectStatus('available')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedStatus === 'available' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Disponíveis
              </button>
              <button
                id="filter-status-low"
                onClick={() => onSelectStatus('low')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedStatus === 'low' ? 'bg-white text-amber-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Estoque Baixo
              </button>
              <button
                id="filter-status-zero"
                onClick={() => onSelectStatus('zero')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedStatus === 'zero' ? 'bg-white text-red-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Sem Estoque
              </button>
            </div>

            {/* Layout Switcher */}
            <div className="hidden sm:inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="btn-view-grid"
                onClick={() => setViewMode('grid')}
                title="Visualização em Cards"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                id="btn-view-table"
                onClick={() => setViewMode('table')}
                title="Visualização em Tabela"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Table className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Carregando catálogo de peças...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div id="catalog-empty-state" className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 font-['Outfit',sans-serif]">
            Nenhum item encontrado
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não encontramos nenhuma peça correspondente aos filtros selecionados. Tente alterar o termo da busca ou categoria.
          </p>
          {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                onSearchChange('');
                onSelectCategory('all');
                onSelectStatus('all');
              }}
              className="mt-2 inline-flex items-center px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      )}

      {/* Grid Mode View */}
      {!isLoading && items.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const status = getStockStatus(item);
            const isOutOfStock = item.quantity === 0;

            return (
              <div
                key={item.id}
                id={`item-card-${item.id}`}
                className={`bg-white rounded-2xl border ${status.cardBorder} p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group`}
              >
                <div>
                  {/* Top metadata row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      <Tag className="h-3 w-3 text-slate-400" />
                      {item.code}
                    </span>

                    {/* Stock Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${status.badgeClass}`}>
                      <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
                      {status.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    {item.name}
                  </h3>

                  {/* Category & Location */}
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Categoria:</span>
                      <span className="text-slate-700 font-medium">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{item.location || 'Almoxarifado Principal'}</span>
                    </div>
                  </div>

                  {item.description && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Bottom Stock Metric and Withdraw Action */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Quantidade
                    </span>
                    <div className={`text-xl font-black leading-tight ${
                      isOutOfStock ? 'text-red-600' : item.quantity <= item.minStock ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {item.quantity} <span className="text-xs font-semibold text-slate-600">{item.unit}</span>
                    </div>
                  </div>

                  <button
                    id={`btn-withdraw-item-${item.id}`}
                    onClick={() => onOpenWithdrawModal(item)}
                    disabled={isOutOfStock}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isOutOfStock
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 cursor-pointer'
                    }`}
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    <span>{isOutOfStock ? 'Sem estoque' : 'Retirar item'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Mode View */}
      {!isLoading && items.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Código / Peça</th>
                  <th scope="col" className="px-5 py-3.5">Categoria</th>
                  <th scope="col" className="px-5 py-3.5">Localização</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Disponível</th>
                  <th scope="col" className="px-5 py-3.5 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const status = getStockStatus(item);
                  const isOutOfStock = item.quantity === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="inline-block text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mb-1">
                          {item.code}
                        </span>
                        <div className="font-bold text-slate-900 leading-snug">
                          {item.name}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-700">
                        {item.category}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{item.location || 'Almoxarifado'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.badgeClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className={`text-base font-extrabold ${
                          isOutOfStock ? 'text-red-600' : item.quantity <= item.minStock ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {item.quantity} <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <button
                          id={`btn-table-withdraw-${item.id}`}
                          onClick={() => onOpenWithdrawModal(item)}
                          disabled={isOutOfStock}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isOutOfStock
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-xs cursor-pointer'
                          }`}
                        >
                          <ArrowDownCircle className="h-3.5 w-3.5" />
                          <span>{isOutOfStock ? 'Sem estoque' : 'Retirar'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
