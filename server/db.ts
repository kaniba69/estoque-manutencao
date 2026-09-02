import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { realSpreadsheetItems } from './realSpreadsheetData';

export interface User {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  mustChangePassword: boolean;
  role: 'admin';
  createdAt: string;
  updatedAt?: string;
}

export interface Item {
  id: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  location: string;
  description: string;
  imageUrl?: string;
  active: boolean; // For soft delete
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type MovementType = 'ENTRADA' | 'RETIRADA' | 'AJUSTE' | 'EXCLUSAO_ITEM' | 'CRIACAO_ITEM';

export interface Movement {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  itemCategory: string;
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  requesterName?: string; // Nome da pessoa que retirou (obrigatório para RETIRADA)
  userId?: string; // ID do coordenador quando aplicável
  userName?: string; // Nome do coordenador
  observation?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  createdAt: string; // ISO
}

export interface SystemLog {
  id: string;
  action: string;
  details: string;
  userId?: string;
  userName?: string;
  ip?: string;
  timestamp: string;
}

export interface DatabaseSchema {
  users: User[];
  items: Item[];
  movements: Movement[];
  logs: SystemLog[];
}

const DB_FILE = path.join(process.cwd(), 'almoxarifado_db.json');

// Default initial demo seed data
function getInitialSeedData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('admin123', salt);

  const initialUsers: User[] = [
    {
      id: 'admin_usr_1',
      username: 'admin',
      name: 'Administrador',
      passwordHash: defaultPasswordHash,
      mustChangePassword: true,
      role: 'admin',
      createdAt: new Date().toISOString(),
    }
  ];

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  const initialItems: Item[] = realSpreadsheetItems;

  const initialMovements: Movement[] = [
    {
      id: 'mov_init_1',
      itemId: 'item_sheet_1',
      itemName: 'FILTRO PLANO TROX (PEQUENO)',
      itemCode: '5045671',
      itemCategory: 'Filtros e Fluidos',
      type: 'ENTRADA',
      quantity: 2,
      previousQuantity: 0,
      newQuantity: 2,
      userName: 'Sistema / Carga da Planilha',
      observation: 'Carga inicial oficial da planilha de inventário',
      date: dateStr,
      time: timeStr,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'mov_init_2',
      itemId: 'item_sheet_43',
      itemName: 'RAIL HOLDER',
      itemCode: '2699437-0000',
      itemCategory: 'Fixação e Estrutura',
      type: 'ENTRADA',
      quantity: 9,
      previousQuantity: 0,
      newQuantity: 9,
      userName: 'Sistema / Carga da Planilha',
      observation: 'Carga inicial oficial da planilha de inventário',
      date: dateStr,
      time: timeStr,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ];

  const initialLogs: SystemLog[] = [
    {
      id: 'log_1',
      action: 'PLANILHA_INTEGRADA',
      details: 'Base de dados provisionada com 479 itens oficiais da planilha de inventário.',
      userName: 'Sistema',
      timestamp: now.toISOString()
    }
  ];

  return {
    users: initialUsers,
    items: initialItems,
    movements: initialMovements,
    logs: initialLogs
  };
}

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.items && parsed.movements && parsed.logs) {
          // Check if existing file has old placeholder demo items or previous partial data
          const isOldDummyData = parsed.items.length < 479 || parsed.items.some((i: any) => i.code === 'PAR-M8-40' || i.name?.includes('Parafuso Sextavado M8'));
          if (isOldDummyData) {
            console.log('Migrando banco de dados para os 479 itens oficiais da planilha...');
            const seed = getInitialSeedData();
            if (parsed.users && parsed.users.length > 0) {
              seed.users = parsed.users;
            }
            this.saveDataDirect(seed);
            return seed;
          }

          // Ensure single admin user exists and conforms to schema
          const salt = bcrypt.genSaltSync(10);
          const defaultPasswordHash = bcrypt.hashSync('admin123', salt);
          let admin = parsed.users?.find((u: any) => u.username === 'admin');
          if (!admin) {
            admin = {
              id: 'admin_usr_1',
              username: 'admin',
              name: 'Administrador',
              passwordHash: defaultPasswordHash,
              mustChangePassword: true,
              role: 'admin',
              createdAt: new Date().toISOString()
            };
          }
          parsed.users = [admin];
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error reading DB_FILE, creating fresh database:', err);
    }
    const fresh = getInitialSeedData();
    this.saveDataDirect(fresh);
    return fresh;
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  public save() {
    this.saveDataDirect(this.data);
  }

  public resetToDemo(): DatabaseSchema {
    this.data = getInitialSeedData();
    this.save();
    return this.data;
  }

  // --- Users Operations (Single Shared Admin) ---
  public getAdminUser(): User {
    let admin = this.data.users.find(u => u.username?.toLowerCase() === 'admin');
    if (!admin) {
      const salt = bcrypt.genSaltSync(10);
      admin = {
        id: 'admin_usr_1',
        username: 'admin',
        name: 'Administrador',
        passwordHash: bcrypt.hashSync('admin123', salt),
        mustChangePassword: true,
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      this.data.users = [admin];
      this.save();
    }
    return admin;
  }

  public findUserByUsername(username: string): User | undefined {
    const clean = username.trim().toLowerCase();
    const admin = this.getAdminUser();
    if (admin.username.toLowerCase() === clean) {
      return admin;
    }
    return undefined;
  }

  public findUserById(id: string): User | undefined {
    return this.getAdminUser();
  }

  public updateAdminPassword(newPassword: string): User {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    const admin = this.getAdminUser();
    admin.passwordHash = hash;
    admin.mustChangePassword = false;
    admin.updatedAt = new Date().toISOString();

    this.addLog({
      action: 'SENHA_ALTERADA',
      details: 'Senha do administrador alterada com sucesso.',
      userName: admin.name
    });

    this.save();
    return admin;
  }

  // --- Items Operations ---
  public getItems(includeDeleted = false): Item[] {
    if (includeDeleted) {
      return [...this.data.items];
    }
    return this.data.items.filter(i => i.active);
  }

  public findItemById(id: string): Item | undefined {
    return this.data.items.find(i => i.id === id);
  }

  public findItemByCode(code: string, excludeId?: string): Item | undefined {
    const cleanCode = code.trim().toUpperCase();
    return this.data.items.find(
      i => i.code.trim().toUpperCase() === cleanCode && (excludeId ? i.id !== excludeId : true)
    );
  }

  public createItem(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'active' | 'deletedAt'>, userId?: string, userName?: string): Item {
    const now = new Date();
    const newItem: Item = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      active: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      deletedAt: null
    };

    this.data.items.unshift(newItem);

    // Record creation movement
    if (newItem.quantity > 0) {
      this.addMovement({
        itemId: newItem.id,
        itemName: newItem.name,
        itemCode: newItem.code,
        itemCategory: newItem.category,
        type: 'CRIACAO_ITEM',
        quantity: newItem.quantity,
        previousQuantity: 0,
        newQuantity: newItem.quantity,
        userId,
        userName: userName || 'Coordenador',
        observation: `Cadastro de novo item com saldo inicial de ${newItem.quantity} ${newItem.unit}`
      });
    }

    this.addLog({
      action: 'ITEM_CRIADO',
      details: `Item "${newItem.name}" (${newItem.code}) cadastrado com estoque inicial de ${newItem.quantity} ${newItem.unit}`,
      userId,
      userName
    });

    this.save();
    return newItem;
  }

  public updateItem(id: string, updateData: Partial<Item>, userId?: string, userName?: string): Item | null {
    const itemIndex = this.data.items.findIndex(i => i.id === id);
    if (itemIndex === -1) return null;

    const currentItem = this.data.items[itemIndex];
    const prevQty = currentItem.quantity;
    const newQty = updateData.quantity !== undefined ? updateData.quantity : prevQty;

    const updatedItem: Item = {
      ...currentItem,
      ...updateData,
      id: currentItem.id, // Immutable
      updatedAt: new Date().toISOString()
    };

    this.data.items[itemIndex] = updatedItem;

    // If stock was adjusted directly in edit form
    if (newQty !== prevQty) {
      const diff = newQty - prevQty;
      this.addMovement({
        itemId: updatedItem.id,
        itemName: updatedItem.name,
        itemCode: updatedItem.code,
        itemCategory: updatedItem.category,
        type: 'AJUSTE',
        quantity: Math.abs(diff),
        previousQuantity: prevQty,
        newQuantity: newQty,
        userId,
        userName: userName || 'Coordenador',
        observation: `Ajuste manual de estoque de ${prevQty} para ${newQty} ${updatedItem.unit}`
      });
    }

    this.addLog({
      action: 'ITEM_ATUALIZADO',
      details: `Dados do item "${updatedItem.name}" (${updatedItem.code}) foram atualizados`,
      userId,
      userName
    });

    this.save();
    return updatedItem;
  }

  public adjustStock(itemId: string, quantityChange: number, reason: string, userId?: string, userName?: string): { success: boolean; item?: Item; error?: string } {
    const item = this.findItemById(itemId);
    if (!item) {
      return { success: false, error: 'Item não encontrado' };
    }

    const prevQty = item.quantity;
    const newQty = prevQty + quantityChange;

    if (newQty < 0) {
      return { success: false, error: 'O estoque não pode ficar negativo.' };
    }

    item.quantity = newQty;
    item.updatedAt = new Date().toISOString();

    const movType: MovementType = quantityChange > 0 ? 'ENTRADA' : 'AJUSTE';
    this.addMovement({
      itemId: item.id,
      itemName: item.name,
      itemCode: item.code,
      itemCategory: item.category,
      type: movType,
      quantity: Math.abs(quantityChange),
      previousQuantity: prevQty,
      newQuantity: newQty,
      userId,
      userName: userName || 'Coordenador',
      observation: reason || `Ajuste manual de estoque (${quantityChange > 0 ? '+' : ''}${quantityChange} ${item.unit})`
    });

    this.addLog({
      action: 'ESTOQUE_AJUSTADO',
      details: `Estoque do item "${item.name}" ajustado de ${prevQty} para ${newQty} (${reason})`,
      userId,
      userName
    });

    this.save();
    return { success: true, item };
  }

  // Withdraw item (Retirada por funcionário)
  public withdrawItem(itemId: string, requesterName: string, quantityToWithdraw: number, observation?: string): { success: boolean; item?: Item; movement?: Movement; error?: string } {
    const cleanName = requesterName?.trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Informe o nome completo para realizar a retirada.' };
    }

    const qty = Number(quantityToWithdraw);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      return { success: false, error: 'A quantidade a retirar deve ser um número inteiro maior que zero.' };
    }

    const item = this.findItemById(itemId);
    if (!item || !item.active) {
      return { success: false, error: 'Item não encontrado ou inativo.' };
    }

    if (item.quantity < qty) {
      return { success: false, error: `Quantidade solicitada (${qty} ${item.unit}) é maior que o estoque disponível (${item.quantity} ${item.unit}).` };
    }

    const prevQty = item.quantity;
    const newQty = prevQty - qty;

    item.quantity = newQty;
    item.updatedAt = new Date().toISOString();

    const movement = this.addMovement({
      itemId: item.id,
      itemName: item.name,
      itemCode: item.code,
      itemCategory: item.category,
      type: 'RETIRADA',
      quantity: qty,
      previousQuantity: prevQty,
      newQuantity: newQty,
      requesterName: cleanName,
      observation: observation?.trim() || 'Retirada padrão de almoxarifado'
    });

    this.addLog({
      action: 'RETIRADA_REALIZADA',
      details: `Retirada de ${qty} ${item.unit} de "${item.name}" por "${cleanName}". Motivo: ${observation || 'Nenhum'}`
    });

    this.save();
    return { success: true, item, movement };
  }

  // Soft Delete
  public deleteItem(id: string, userId?: string, userName?: string): boolean {
    const item = this.findItemById(id);
    if (!item) return false;

    item.active = false;
    item.deletedAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();

    this.addMovement({
      itemId: item.id,
      itemName: item.name,
      itemCode: item.code,
      itemCategory: item.category,
      type: 'EXCLUSAO_ITEM',
      quantity: item.quantity,
      previousQuantity: item.quantity,
      newQuantity: 0,
      userId,
      userName: userName || 'Coordenador',
      observation: `Item excluído do catálogo (Soft Delete). Histórico preservado.`
    });

    this.addLog({
      action: 'ITEM_EXCLUIDO',
      details: `Item "${item.name}" (${item.code}) excluído pelo coordenador ${userName || ''}`,
      userId,
      userName
    });

    this.save();
    return true;
  }

  // Restore Soft-Deleted Item
  public restoreItem(id: string, userId?: string, userName?: string): Item | null {
    const item = this.data.items.find(i => i.id === id);
    if (!item) return null;

    item.active = true;
    item.deletedAt = null;
    item.updatedAt = new Date().toISOString();

    this.addLog({
      action: 'ITEM_RESTAURADO',
      details: `Item "${item.name}" (${item.code}) restaurado pelo coordenador ${userName || ''}`,
      userId,
      userName
    });

    this.save();
    return item;
  }

  // --- Movements Operations ---
  public addMovement(movementData: Omit<Movement, 'id' | 'date' | 'time' | 'createdAt'>): Movement {
    const now = new Date();
    // Use pt-BR timezone or local formatting
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const newMovement: Movement = {
      ...movementData,
      id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      date: dateStr,
      time: timeStr,
      createdAt: now.toISOString()
    };

    this.data.movements.unshift(newMovement);
    return newMovement;
  }

  public getMovements(filters?: {
    startDate?: string;
    endDate?: string;
    requesterName?: string;
    itemId?: string;
    itemCode?: string;
    category?: string;
    type?: string;
    search?: string;
  }): Movement[] {
    let list = [...this.data.movements];

    if (!filters) return list;

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(m =>
        m.itemName.toLowerCase().includes(q) ||
        m.itemCode.toLowerCase().includes(q) ||
        (m.requesterName && m.requesterName.toLowerCase().includes(q)) ||
        (m.observation && m.observation.toLowerCase().includes(q))
      );
    }

    if (filters.startDate) {
      list = list.filter(m => m.date >= filters.startDate!);
    }
    if (filters.endDate) {
      list = list.filter(m => m.date <= filters.endDate!);
    }
    if (filters.requesterName) {
      const name = filters.requesterName.toLowerCase().trim();
      list = list.filter(m => m.requesterName && m.requesterName.toLowerCase().includes(name));
    }
    if (filters.itemId) {
      list = list.filter(m => m.itemId === filters.itemId);
    }
    if (filters.itemCode) {
      const code = filters.itemCode.toUpperCase().trim();
      list = list.filter(m => m.itemCode.toUpperCase().includes(code));
    }
    if (filters.category) {
      list = list.filter(m => m.itemCategory.toLowerCase() === filters.category!.toLowerCase());
    }
    if (filters.type) {
      list = list.filter(m => m.type === filters.type);
    }

    return list;
  }

  // --- Logs & Auditing ---
  public addLog(logData: Omit<SystemLog, 'id' | 'timestamp'>): SystemLog {
    const newLog: SystemLog = {
      ...logData,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString()
    };
    this.data.logs.unshift(newLog);
    // Keep max 1000 logs
    if (this.data.logs.length > 1000) {
      this.data.logs = this.data.logs.slice(0, 1000);
    }
    return newLog;
  }

  public getLogs(limit = 200): SystemLog[] {
    return this.data.logs.slice(0, limit);
  }

  // --- Dashboard Metrics ---
  public getDashboardStats() {
    const activeItems = this.getItems(false);
    const totalItemsCount = activeItems.length;
    const totalUnitsAvailable = activeItems.reduce((acc, curr) => acc + curr.quantity, 0);

    const lowStockItems = activeItems.filter(i => i.quantity > 0 && i.quantity <= i.minStock);
    const outOfStockItems = activeItems.filter(i => i.quantity === 0);
    const normalStockItems = activeItems.filter(i => i.quantity > i.minStock);

    const withdrawals = this.data.movements.filter(m => m.type === 'RETIRADA');
    const totalWithdrawalsCount = withdrawals.length;
    const totalWithdrawnUnits = withdrawals.reduce((acc, curr) => acc + curr.quantity, 0);

    // Today's withdrawals
    const todayStr = new Date().toISOString().split('T')[0];
    const todayWithdrawals = withdrawals.filter(m => m.date === todayStr);

    // Top withdrawn items
    const itemWithdrawCount: Record<string, { name: string; code: string; count: number; qty: number }> = {};
    withdrawals.forEach(w => {
      if (!itemWithdrawCount[w.itemId]) {
        itemWithdrawCount[w.itemId] = { name: w.itemName, code: w.itemCode, count: 0, qty: 0 };
      }
      itemWithdrawCount[w.itemId].count += 1;
      itemWithdrawCount[w.itemId].qty += w.quantity;
    });

    const topItems = Object.values(itemWithdrawCount)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      totalItemsCount,
      totalUnitsAvailable,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      normalStockCount: normalStockItems.length,
      totalWithdrawalsCount,
      totalWithdrawnUnits,
      todayWithdrawalsCount: todayWithdrawals.length,
      todayWithdrawnUnits: todayWithdrawals.reduce((acc, curr) => acc + curr.quantity, 0),
      topWithdrawnItems: topItems,
      recentMovements: this.data.movements.slice(0, 10),
      criticalAlerts: [...outOfStockItems, ...lowStockItems].map(i => ({
        id: i.id,
        name: i.name,
        code: i.code,
        quantity: i.quantity,
        minStock: i.minStock,
        unit: i.unit,
        isZero: i.quantity === 0
      }))
    };
  }
}

export const db = new DatabaseStore();
