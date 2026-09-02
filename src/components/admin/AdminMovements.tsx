import React, { useState } from 'react';
import { Movement } from '../../types';
import { History, Search, Download, Calendar, Filter, UserCheck, ArrowDownCircle, ArrowUpCircle, RefreshCw, Layers } from 'lucide-react';

interface AdminMovementsProps {
  movements: Movement[];
  categories: string[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const AdminMovements: React.FC<AdminMovementsProps> = ({
  movements,
  categories,
  isLoading,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [requesterSearch, setRequesterSearch] = useState('');

  const filteredMovements = movements.filter((mov) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const match =
        mov.itemName.toLowerCase().includes(q) ||
        mov.itemCode.toLowerCase().includes(q) ||
        (mov.requesterName && mov.requesterName.toLowerCase().includes(q)) ||
        (mov.observation && mov.observation.toLowerCase().includes(q)) ||
        (mov.userName && mov.userName.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (startDate && mov.date < startDate) return false;
    if (endDate && mov.date > endDate) return false;

    if (selectedType !== 'all' && mov.type !== selectedType) return false;
    if (selectedCategory !== 'all' && mov.itemCategory.toLowerCase() !== selectedCategory.toLowerCase()) return false;

    if (requesterSearch.trim()) {
      const rq = requesterSearch.toLowerCase().trim();
      if (!mov.requesterName || !mov.requesterName.toLowerCase().includes(rq)) return false;
    }

    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Data', 'Hora', 'Tipo', 'Código', 'Peça', 'Categoria', 'Quantidade', 'Saldo Anterior', 'Novo Saldo', 'Solicitante / Retirante', 'Responsável Coordenador', 'Observação'];
    const rows = filteredMovements.map(m => [
      m.id,
      m.date,
      m.time,
      m.type,
      m.itemCode,
      `"${m.itemName.replace(/"/g, '""')}"`,
      `"${m.itemCategory.replace(/"/g, '""')}"`,
      m.quantity,
      m.previousQuantity,
      m.newQuantity,
      `"${(m.requesterName || '').replace(/"/g, '""')}"`,
      `"${(m.userName || '').replace(/"/g, '""')}"`,
      `"${(m.observation || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historico_almoxarifado_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case 'RETIRADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ArrowDownCircle className="h-3 w-3 text-emerald-600" />
            Retirada
          </span>
        );
      case 'ENTRADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <ArrowUpCircle className="h-3 w-3 text-blue-600" />
            Entrada
          </span>
        );
      case 'AJUSTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <RefreshCw className="h-3 w-3 text-amber-600" />
            Ajuste
          </span>
        );
      case 'CRIACAO_ITEM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            Criação
          </span>
        );
      case 'EXCLUSAO_ITEM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
            Exclusão
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* Header & Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit',sans-serif]">
              Histórico Completo de Retiradas e Movimentações
            </h3>
            <p className="text-xs text-slate-500">
              Registros detalhados de todas as baixas por colaboradores, entradas e ajustes de estoque.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredMovements.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Atualizar histórico"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          
          {/* General Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por peça, código, motivo..."
              className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Solicitante / Colaborador Name Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <UserCheck className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={requesterSearch}
              onChange={(e) => setRequesterSearch(e.target.value)}
              placeholder="Filtrar por nome do colaborador..."
              className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Movement Type */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Todos os tipos de movimento</option>
              <option value="RETIRADA">Apenas Retiradas (Funcionários)</option>
              <option value="ENTRADA">Apenas Entradas</option>
              <option value="AJUSTE">Apenas Ajustes Manuais</option>
              <option value="CRIACAO_ITEM">Criação de Itens</option>
              <option value="EXCLUSAO_ITEM">Exclusões de Itens</option>
            </select>
          </div>

          {/* Date range picker */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Data Inicial"
              className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <span className="text-slate-400 text-xs">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Data Final"
              className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

        </div>

        {/* Clear filters shortcut */}
        {(searchTerm || startDate || endDate || selectedType !== 'all' || selectedCategory !== 'all' || requesterSearch) && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Exibindo <strong>{filteredMovements.length}</strong> de {movements.length} registros</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
                setSelectedType('all');
                setSelectedCategory('all');
                setRequesterSearch('');
              }}
              className="text-blue-600 font-semibold hover:underline"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3.5">Data / Hora</th>
                <th scope="col" className="px-4 py-3.5">Tipo</th>
                <th scope="col" className="px-4 py-3.5">Peça / Código</th>
                <th scope="col" className="px-4 py-3.5 text-center">Quantidade</th>
                <th scope="col" className="px-4 py-3.5">Quem Retirou / Responsável</th>
                <th scope="col" className="px-4 py-3.5">Motivo / Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-xs">
                    Nenhuma movimentação registrada para os critérios informados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Timestamp */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs text-slate-500">
                      <div className="font-bold text-slate-800">{mov.date}</div>
                      <div className="text-[10px] text-slate-400">{mov.time}</div>
                    </td>

                    {/* Type badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getMovementTypeBadge(mov.type)}
                    </td>

                    {/* Item */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mb-0.5">
                        {mov.itemCode}
                      </span>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                        {mov.itemName}
                      </div>
                      <span className="text-[10px] text-slate-400">{mov.itemCategory}</span>
                    </td>

                    {/* Quantity & Stock Delta */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="text-sm font-black text-slate-900">
                        {mov.type === 'RETIRADA' || (mov.type === 'AJUSTE' && mov.newQuantity < mov.previousQuantity) ? (
                          <span className="text-red-600">-{mov.quantity}</span>
                        ) : (
                          <span className="text-emerald-600">+{mov.quantity}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {mov.previousQuantity} → <strong className="text-slate-600">{mov.newQuantity}</strong>
                      </div>
                    </td>

                    {/* Requester or Coordinator */}
                    <td className="px-4 py-3.5">
                      {mov.requesterName ? (
                        <div>
                          <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide block">
                            Colaborador
                          </span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {mov.requesterName}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
                            Coordenador
                          </span>
                          <span className="font-medium text-slate-700 text-xs">
                            {mov.userName || 'Sistema'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Observation */}
                    <td className="px-4 py-3.5 text-xs text-slate-600 max-w-xs">
                      {mov.observation ? (
                        <p className="italic text-slate-700 leading-relaxed bg-slate-50 p-1.5 rounded border border-slate-200/60">
                          {mov.observation}
                        </p>
                      ) : (
                        <span className="text-slate-400">—</span>
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
