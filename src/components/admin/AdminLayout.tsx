import React, { useState } from 'react';
import { LayoutDashboard, Package, History, ShieldCheck, CheckSquare, Sparkles } from 'lucide-react';
import { Item, Movement, DashboardStats, SystemLog } from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { AdminItemsList } from './AdminItemsList';
import { AdminMovements } from './AdminMovements';
import { AdminLogs } from './AdminLogs';
import { AutomatedTestRunner } from './AutomatedTestRunner';

interface AdminLayoutProps {
  stats: DashboardStats | null;
  items: Item[];
  movements: Movement[];
  logs: SystemLog[];
  categories: string[];
  activeTab: 'dashboard' | 'items' | 'movements' | 'logs' | 'tests';
  onChangeTab: (tab: 'dashboard' | 'items' | 'movements' | 'logs' | 'tests') => void;
  onOpenNewItemModal: () => void;
  onOpenEditModal: (item: Item) => void;
  onOpenAdjustModal: (item: Item) => void;
  onOpenDeleteModal: (item: Item) => void;
  onRestoreItem: (itemId: string) => Promise<void>;
  onRefreshData: () => void;
  onRunTests: () => Promise<any>;
  onResetDemo: () => Promise<void>;
  onOpenSheetsSync?: () => void;
  isLoading: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  stats,
  items,
  movements,
  logs,
  categories,
  activeTab,
  onChangeTab,
  onOpenNewItemModal,
  onOpenEditModal,
  onOpenAdjustModal,
  onOpenDeleteModal,
  onRestoreItem,
  onRefreshData,
  onRunTests,
  onResetDemo,
  onOpenSheetsSync,
  isLoading
}) => {

  return (
    <div className="space-y-6">
      
      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        
        <button
          id="tab-admin-dashboard"
          onClick={() => onChangeTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard & Indicadores</span>
        </button>

        <button
          id="tab-admin-items"
          onClick={() => onChangeTab('items')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'items'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Gestão de Itens ({items.length})</span>
        </button>

        <button
          id="tab-admin-movements"
          onClick={() => onChangeTab('movements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'movements'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Histórico de Retiradas ({movements.length})</span>
        </button>

        <button
          id="tab-admin-logs"
          onClick={() => onChangeTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Logs de Auditoria</span>
        </button>

        <button
          id="tab-admin-tests"
          onClick={() => onChangeTab('tests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'tests'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          <span>Testes Automatizados</span>
        </button>

      </div>

      {/* Active Tab View */}
      {activeTab === 'dashboard' && (
        <AdminDashboard
          stats={stats}
          onNavigateTab={onChangeTab}
          onOpenNewItemModal={onOpenNewItemModal}
          onOpenWithdrawalHistory={() => onChangeTab('movements')}
          onOpenSheetsSync={onOpenSheetsSync}
        />
      )}


      {activeTab === 'items' && (
        <AdminItemsList
          items={items}
          categories={categories}
          onOpenNewItemModal={onOpenNewItemModal}
          onOpenEditModal={onOpenEditModal}
          onOpenAdjustModal={onOpenAdjustModal}
          onOpenDeleteModal={onOpenDeleteModal}
          onRestoreItem={onRestoreItem}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'movements' && (
        <AdminMovements
          movements={movements}
          categories={categories}
          isLoading={isLoading}
          onRefresh={onRefreshData}
        />
      )}

      {activeTab === 'logs' && (
        <AdminLogs
          logs={logs}
          isLoading={isLoading}
          onRefresh={onRefreshData}
        />
      )}

      {activeTab === 'tests' && (
        <AutomatedTestRunner
          onRunTests={onRunTests}
          onResetDemo={onResetDemo}
          isLoading={isLoading}
        />
      )}

    </div>
  );
};
