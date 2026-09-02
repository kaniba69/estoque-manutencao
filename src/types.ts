export interface User {
  id: string;
  name: string;
  username: string;
  role: 'admin';
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
  active: boolean;
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
  requesterName?: string;
  userId?: string;
  userName?: string;
  observation?: string;
  date: string;
  time: string;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  action: string;
  details: string;
  userId?: string;
  userName?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalItemsCount: number;
  totalUnitsAvailable: number;
  lowStockCount: number;
  outOfStockCount: number;
  normalStockCount: number;
  totalWithdrawalsCount: number;
  totalWithdrawnUnits: number;
  todayWithdrawalsCount: number;
  todayWithdrawnUnits: number;
  topWithdrawnItems: Array<{
    name: string;
    code: string;
    count: number;
    qty: number;
  }>;
  recentMovements: Movement[];
  criticalAlerts: Array<{
    id: string;
    name: string;
    code: string;
    quantity: number;
    minStock: number;
    unit: string;
    isZero: boolean;
  }>;
}

export interface TestResult {
  testId: string;
  name: string;
  description: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

export interface FullTestReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  results: TestResult[];
  simulationSummary: {
    passed: boolean;
    stepsExecuted: string[];
    details: string;
  };
}

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    index: number;
    rowCount?: number;
    columnCount?: number;
  }>;
  targetSheetName: string;
}

export interface SheetSyncResult {
  success: boolean;
  message: string;
  source: 'GOOGLE_SHEETS' | 'LOCAL_DATABASE';
  totalSheetRows: number;
  importedItems: number;
  updatedItems: number;
  unchangedItems: number;
  sheetTitle: string;
  spreadsheetId: string;
  timestamp: string;
  pullResult?: SheetSyncResult;
  pushResult?: SheetSyncResult;
}

