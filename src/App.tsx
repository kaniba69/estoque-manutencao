import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { Item, Movement, User, DashboardStats, SystemLog, FullTestReport } from './types';
import { Navbar } from './components/Navbar';
import { PublicCatalog } from './components/PublicCatalog';
import { WithdrawModal } from './components/WithdrawModal';
import { LoginModal } from './components/LoginModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { ItemFormModal } from './components/admin/ItemFormModal';
import { AdjustStockModal } from './components/admin/AdjustStockModal';
import { DeleteConfirmModal } from './components/admin/DeleteConfirmModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [currentView, setCurrentView] = useState<'catalog' | 'admin'>('catalog');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data states
  const [publicItems, setPublicItems] = useState<Item[]>([]);
  const [adminItems, setAdminItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal states
  const [withdrawItem, setWithdrawItem] = useState<Item | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSheetsSyncOpen, setIsSheetsSyncOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);

  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [adjustItem, setAdjustItem] = useState<Item | null>(null);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'items' | 'movements' | 'logs' | 'tests'>('dashboard');

  // Loading & Toasts
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Initial Auth Check
  useEffect(() => {
    const user = api.getCurrentUser();
    if (user && api.getToken()) {
      setCurrentUser(user);
      api.checkAuth().catch(() => {
        api.clearAuth();
        setCurrentUser(null);
      });
    }
  }, []);

  // 2. Fetch Public Items
  const loadPublicData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getPublicItems({
        search: searchQuery || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      });
      setPublicItems(data.items);
      setCategories(data.categories);
    } catch (err: any) {
      console.error('Erro ao buscar dados públicos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedStatus]);

  useEffect(() => {
    loadPublicData();
  }, [loadPublicData]);

  // 3. Fetch Admin Data (when coordinator logged in and in admin view)
  const loadAdminData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const [dashData, itemsData, movData, logsData] = await Promise.all([
        api.getDashboard(),
        api.getAdminItems(true),
        api.getMovements(),
        api.getLogs()
      ]);

      setDashboardStats(dashData.stats);
      setAdminItems(itemsData.items);
      setMovements(movData.movements);
      setLogs(logsData.logs);
      setCategories(itemsData.categories);
    } catch (err: any) {
      console.error('Erro ao buscar dados administrativos:', err);
      if (err.message?.includes('401') || err.message?.includes('Sessão')) {
        api.clearAuth();
        setCurrentUser(null);
        setCurrentView('catalog');
        addToast('error', 'Sessão expirada. Faça login novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentView === 'admin' && currentUser) {
      loadAdminData();
    }
  }, [currentView, currentUser, loadAdminData]);

  // Handler: Withdrawal
  const handleConfirmWithdrawal = async (payload: {
    itemId: string;
    requesterName: string;
    quantity: number;
    observation?: string;
  }) => {
    setIsSubmittingWithdrawal(true);
    try {
      const res = await api.withdrawItem(payload);
      addToast('success', `Retirada registrada com sucesso! (${payload.quantity} un. retiradas por ${payload.requesterName})`);
      
      // Update local state instantly
      setPublicItems((prev) =>
        prev.map((it) => (it.id === res.item.id ? res.item : it))
      );

      // If coordinator is also logged in, refresh admin data
      if (currentUser) {
        loadAdminData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Não foi possível realizar a retirada.');
      throw err;
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  // Handler: Login Success (both from direct login and after forced password change)
  const handleLoginSuccess = () => {
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      addToast('success', `Bem-vindo ao Painel do Coordenador!`);
      setCurrentView('admin');
      loadAdminData();
    }
  };

  // Handler: Logout
  const handleLogout = () => {
    api.clearAuth();
    setCurrentUser(null);
    setCurrentView('catalog');
    addToast('info', 'Você saiu do Painel do Coordenador.');
  };

  // Handler: Save (Create/Edit) Item
  const handleSaveItem = async (formData: any) => {
    setIsSubmittingAdmin(true);
    try {
      if (itemToEdit) {
        const res = await api.updateItem(itemToEdit.id, formData);
        addToast('success', 'Item atualizado com sucesso!');
      } else {
        const res = await api.createItem(formData);
        addToast('success', 'Item cadastrado com sucesso!');
      }
      setIsItemFormOpen(false);
      setItemToEdit(null);
      loadAdminData();
      loadPublicData();
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Handler: Adjust Stock
  const handleAdjustStock = async (itemId: string, delta: number, reason: string) => {
    setIsSubmittingAdmin(true);
    try {
      const res = await api.adjustStock(itemId, { delta, reason });
      addToast('success', 'Ajuste de estoque registrado com sucesso!');
      setAdjustItem(null);
      loadAdminData();
      loadPublicData();
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Handler: Delete Item (Soft Delete)
  const handleDeleteItem = async (itemId: string) => {
    setIsSubmittingAdmin(true);
    try {
      await api.deleteItem(itemId);
      addToast('success', 'Item removido do estoque.');
      setDeleteItem(null);
      loadAdminData();
      loadPublicData();
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao excluir item.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Handler: Restore Item
  const handleRestoreItem = async (itemId: string) => {
    setIsSubmittingAdmin(true);
    try {
      await api.restoreItem(itemId);
      addToast('success', 'Item restaurado no estoque com sucesso!');
      loadAdminData();
      loadPublicData();
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao restaurar item.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Handler: Run Tests
  const handleRunTests = async () => {
    return api.runTests();
  };

  // Handler: Reset Demo
  const handleResetDemo = async () => {
    await api.resetDemo();
    addToast('success', 'Dados de demonstração restaurados aos padrões originais.');
    loadAdminData();
    loadPublicData();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'admin' && !currentUser) {
            setIsLoginModalOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefreshData={() => {
          loadPublicData();
          if (currentView === 'admin') loadAdminData();
        }}
        onOpenSheetsSync={() => setIsSheetsSyncOpen(true)}
        isLoading={isLoading}
      />


      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {currentView === 'catalog' ? (
          <PublicCatalog
            items={publicItems}
            categories={categories}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            onOpenWithdrawModal={(item) => setWithdrawItem(item)}
            isLoading={isLoading}
          />
        ) : (
          <AdminLayout
            stats={dashboardStats}
            items={adminItems}
            movements={movements}
            logs={logs}
            categories={categories}
            activeTab={adminTab}
            onChangeTab={setAdminTab}
            onOpenNewItemModal={() => {
              setItemToEdit(null);
              setIsItemFormOpen(true);
            }}
            onOpenEditModal={(item) => {
              setItemToEdit(item);
              setIsItemFormOpen(true);
            }}
            onOpenAdjustModal={(item) => setAdjustItem(item)}
            onOpenDeleteModal={(item) => setDeleteItem(item)}
            onRestoreItem={handleRestoreItem}
            onRefreshData={loadAdminData}
            onRunTests={handleRunTests}
            onResetDemo={handleResetDemo}
            onOpenSheetsSync={() => setIsSheetsSyncOpen(true)}
            isLoading={isLoading || isSubmittingAdmin}
          />

        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Controle de Almoxarifado • Gestão Ágil e Rastreável de Materiais</span>
          <span className="text-[11px] text-slate-400">Identificação obrigatória em todas as retiradas</span>
        </div>
      </footer>

      {/* Modals */}
      <WithdrawModal
        item={withdrawItem}
        isOpen={!!withdrawItem}
        onClose={() => setWithdrawItem(null)}
        onConfirmWithdrawal={handleConfirmWithdrawal}
        isSubmitting={isSubmittingWithdrawal}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
        isLoading={isLoading}
      />

      <ItemFormModal
        isOpen={isItemFormOpen}
        onClose={() => {
          setIsItemFormOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveItem}
        itemToEdit={itemToEdit}
        existingCategories={categories}
        isLoading={isSubmittingAdmin}
      />

      <AdjustStockModal
        item={adjustItem}
        isOpen={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        onConfirmAdjust={handleAdjustStock}
        isLoading={isSubmittingAdmin}
      />

      <DeleteConfirmModal
        item={deleteItem}
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirmDelete={handleDeleteItem}
        isLoading={isSubmittingAdmin}
      />

      <GoogleSheetsSyncModal
        isOpen={isSheetsSyncOpen}
        onClose={() => setIsSheetsSyncOpen(false)}
        onSyncCompleted={() => {
          loadPublicData();
          if (currentUser) loadAdminData();
          addToast('success', 'Estoque sincronizado com a Google Sheet com sucesso!');
        }}
      />

      {/* Toasts */}

      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}
