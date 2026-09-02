import React from 'react';
import { DashboardStats, Item } from '../../types';
import { Package, AlertTriangle, XCircle, TrendingDown, ArrowUpRight, History, PlusCircle, CheckCircle2, ShieldAlert, Sparkles, Layers, FileSpreadsheet } from 'lucide-react';

interface AdminDashboardProps {
  stats: DashboardStats | null;
  onNavigateTab: (tab: 'items' | 'movements' | 'logs' | 'tests') => void;
  onOpenNewItemModal: () => void;
  onOpenWithdrawalHistory: () => void;
  onOpenSheetsSync?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  onNavigateTab,
  onOpenNewItemModal,
  onOpenWithdrawalHistory,
  onOpenSheetsSync
}) => {

  if (!stats) {
    return (
      <div className="py-12 flex justify-center items-center text-slate-500">
        <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Carregando indicadores do painel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Welcome & Quick Actions Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 text-white shadow-md border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            Visão Geral do Almoxarifado
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-['Outfit',sans-serif] tracking-tight text-white">
            Painel de Controle e Estoque
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Acompanhe a disponibilidade de peças, alertas de estoque crítico e o fluxo de retiradas em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {onOpenSheetsSync && (
            <button
              id="dashboard-btn-sheets-sync"
              onClick={onOpenSheetsSync}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 border border-emerald-500/40 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Google Sheets Sync</span>
            </button>
          )}
          <button
            id="dashboard-btn-new-item"
            onClick={onOpenNewItemModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Novo Item</span>
          </button>
          <button
            id="dashboard-btn-view-movements"
            onClick={onOpenWithdrawalHistory}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-600 transition-colors"
          >
            <History className="h-4 w-4" />
            <span>Histórico de Retiradas</span>
          </button>
        </div>

      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Itens Cadastrados */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total de Itens
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit',sans-serif]">
              {stats.totalItemsCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>{stats.totalUnitsAvailable} unidades físicas em saldo</span>
            </p>
          </div>
        </div>

        {/* Card 2: Estoque Baixo */}
        <div 
          onClick={() => onNavigateTab('items')}
          className="bg-white rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Estoque Baixo
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-600 font-['Outfit',sans-serif]">
              {stats.lowStockCount}
            </div>
            <p className="text-[11px] text-amber-700 mt-1 font-medium">
              Abaixo do estoque mínimo estipulado
            </p>
          </div>
        </div>

        {/* Card 3: Sem Estoque */}
        <div 
          onClick={() => onNavigateTab('items')}
          className="bg-white rounded-2xl border border-red-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:border-red-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">
              Sem Estoque
            </span>
            <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-red-600 font-['Outfit',sans-serif]">
              {stats.outOfStockCount}
            </div>
            <p className="text-[11px] text-red-700 mt-1 font-medium">
              Itens zerados (retiradas desabilitadas)
            </p>
          </div>
        </div>

        {/* Card 4: Total de Retiradas */}
        <div 
          onClick={() => onNavigateTab('movements')}
          className="bg-white rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Retiradas
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-['Outfit',sans-serif]">
              {stats.totalWithdrawalsCount}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">
              Hoje: {stats.todayWithdrawalsCount} retiradas ({stats.todayWithdrawnUnits} un.)
            </p>
          </div>
        </div>

      </div>

      {/* Two Column Layout: Critical Stock Alerts & Top Withdrawn */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Critical Stock Alerts (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base font-['Outfit',sans-serif]">
                Alertas de Reposição de Estoque
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('items')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Ver todos os itens</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {stats.criticalAlerts.length === 0 ? (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-medium">Todos os itens estão com estoque em níveis normais!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.criticalAlerts.slice(0, 6).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    alert.isZero
                      ? 'bg-red-50/70 border-red-200 text-red-950'
                      : 'bg-amber-50/70 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${alert.isZero ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <div className="min-w-0">
                      <span className="font-bold block truncate">{alert.name}</span>
                      <span className="text-[11px] text-slate-500">Cód: {alert.code}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[11px] text-slate-500 block">
                      Saldo: <strong className={alert.isZero ? 'text-red-700' : 'text-amber-700'}>{alert.quantity} {alert.unit}</strong>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Mínimo: {alert.minStock} {alert.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Withdrawn Items (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base font-['Outfit',sans-serif]">
                Itens Mais Retirados
              </h3>
              <Layers className="h-4 w-4 text-slate-400" />
            </div>

            <div className="mt-3 space-y-3">
              {stats.topWithdrawnItems.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Nenhuma retirada registrada ainda.
                </p>
              ) : (
                stats.topWithdrawnItems.map((item, idx) => (
                  <div key={item.code} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400">{item.code}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="font-extrabold text-blue-700 block">{item.qty} un.</span>
                      <span className="text-[10px] text-slate-400">{item.count} retiradas</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('movements')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 transition-colors"
            >
              Ver Todas as Movimentações
            </button>
          </div>
        </div>

      </div>

      {/* Recent Movements Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base font-['Outfit',sans-serif]">
            Últimas Movimentações Registradas
          </h3>
          <button
            onClick={() => onNavigateTab('movements')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Ver histórico completo</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-3 py-2">Data/Hora</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Peça</th>
                <th className="px-3 py-2">Quantidade</th>
                <th className="px-3 py-2">Responsável / Solicitante</th>
                <th className="px-3 py-2">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentMovements.slice(0, 5).map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-500 font-mono">
                    {mov.date} {mov.time}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      mov.type === 'RETIRADA'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : mov.type === 'ENTRADA'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : mov.type === 'EXCLUSAO_ITEM'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {mov.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {mov.itemName} <span className="text-slate-400 font-normal">({mov.itemCode})</span>
                  </td>
                  <td className="px-3 py-2 font-bold text-slate-800">
                    {mov.quantity}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-semibold text-slate-900">
                      {mov.requesterName || mov.userName || 'Sistema'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500 truncate max-w-xs">
                    {mov.observation || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
