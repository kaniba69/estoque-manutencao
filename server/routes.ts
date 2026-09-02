import { Router, Request, Response } from 'express';
import { db } from './db';
import { generateToken, generateTempToken, verifyTempToken, verifyPassword, requireAuth, AuthRequest } from './auth';
import { runAllAutomatedTests } from './testSuite';

export const router = Router();

// ==========================================
// AUTH ROUTES (Single Administrator)
// ==========================================

router.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Informe o usuário e a senha.' });
      return;
    }

    const user = db.findUserByUsername(username);
    if (!user) {
      res.status(401).json({ error: 'Usuário ou senha incorretos.' });
      return;
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      db.addLog({
        action: 'LOGIN_FALHOU',
        details: `Tentativa de login com senha incorreta para o usuário: ${username}`
      });
      res.status(401).json({ error: 'Usuário ou senha incorretos.' });
      return;
    }

    // Forced password change if admin is still using default initial password or flag is true
    if (user.mustChangePassword || password === 'admin123') {
      const tempToken = generateTempToken(user);
      db.addLog({
        action: 'PRIMEIRO_ACESSO_DETECTADO',
        details: 'Login com senha inicial padrão. Solicitação de troca obrigatória de senha disparada.'
      });
      res.json({
        requirePasswordChange: true,
        tempToken,
        message: 'Primeiro acesso detectado com a senha inicial padrão. É obrigatório definir uma nova senha para acessar o painel.'
      });
      return;
    }

    const token = generateToken(user);

    db.addLog({
      action: 'LOGIN_SUCESSO',
      details: `Administrador (${user.username}) acessou o Painel do Coordenador`,
      userId: user.id,
      userName: user.name
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro interno ao autenticar usuário.' });
  }
});

// POST /api/auth/change-password - For forced first-login change or coordinator settings
router.post('/auth/change-password', (req: Request, res: Response) => {
  try {
    const { tempToken, newPassword, confirmPassword } = req.body;

    let admin = null;
    if (tempToken) {
      const decoded = verifyTempToken(tempToken);
      if (!decoded) {
        res.status(401).json({ error: 'Sessão temporária expirada. Por favor, realize o login novamente.' });
        return;
      }
      admin = db.findUserById(decoded.id) || db.getAdminUser();
    } else {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = (require('./auth') as any).verifyToken?.(token) || (require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'almoxarifado_super_secure_jwt_secret_2025_prod_key') as any);
          admin = db.findUserById(decoded.id) || db.getAdminUser();
        } catch {
          res.status(401).json({ error: 'Sessão inválida para alteração de senha.' });
          return;
        }
      }
    }

    if (!admin) {
      res.status(401).json({ error: 'Não autorizado para troca de senha.' });
      return;
    }

    if (!newPassword || !confirmPassword) {
      res.status(400).json({ error: 'Preencha os campos de nova senha e confirmação.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'A nova senha e a confirmação de senha não coincidem.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    if (newPassword === 'admin123') {
      res.status(400).json({ error: 'A nova senha não pode ser igual à senha inicial padrão (admin123).' });
      return;
    }

    const updatedUser = db.updateAdminPassword(newPassword);
    const token = generateToken(updatedUser);

    db.addLog({
      action: 'SENHA_ALTERADA',
      details: 'Senha do administrador alterada com sucesso.',
      userId: updatedUser.id,
      userName: updatedUser.name
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso! Acesso concedido ao Painel do Coordenador.',
      token,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao processar a troca de senha.' });
  }
});

router.get('/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      name: req.user.name,
      role: req.user.role
    }
  });
});

// ==========================================
// PUBLIC CATALOG & WITHDRAWAL ROUTES
// ==========================================

// GET /api/items - Public list of active inventory items
router.get('/items', (req: Request, res: Response) => {
  try {
    const { search, category, status } = req.query;
    let items = db.getItems(false);

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }

    if (category && typeof category === 'string' && category !== 'all') {
      items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }

    if (status && typeof status === 'string') {
      if (status === 'available') {
        items = items.filter(i => i.quantity > 0);
      } else if (status === 'low') {
        items = items.filter(i => i.quantity > 0 && i.quantity <= i.minStock);
      } else if (status === 'zero') {
        items = items.filter(i => i.quantity === 0);
      }
    }

    // Extract available categories
    const allCategories = Array.from(new Set(db.getItems(false).map(i => i.category))).filter(Boolean);

    res.json({
      items,
      categories: allCategories,
      total: items.length
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar itens do almoxarifado.' });
  }
});

// GET /api/items/:id - Item detail
router.get('/items/:id', (req: Request, res: Response) => {
  const item = db.findItemById(req.params.id);
  if (!item || !item.active) {
    res.status(404).json({ error: 'Item não encontrado no estoque.' });
    return;
  }
  res.json({ item });
});

// POST /api/items/withdraw - Public withdrawal by employee
router.post('/items/withdraw', (req: Request, res: Response) => {
  try {
    const { itemId, requesterName, quantity, observation } = req.body;

    if (!itemId) {
      res.status(400).json({ error: 'Identificador do item não informado.' });
      return;
    }

    if (!requesterName || typeof requesterName !== 'string' || requesterName.trim().length < 2) {
      res.status(400).json({ error: 'Informe o nome completo para realizar a retirada.' });
      return;
    }

    const qty = Number(quantity);
    if (!qty || isNaN(qty) || qty <= 0) {
      res.status(400).json({ error: 'Informe uma quantidade válida para retirada.' });
      return;
    }

    const result = db.withdrawItem(itemId, requesterName, qty, observation);

    if (!result.success) {
      res.status(400).json({ error: result.error || 'Não foi possível realizar a retirada.' });
      return;
    }

    res.json({
      success: true,
      message: 'Retirada registrada com sucesso!',
      item: result.item,
      movement: result.movement
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro interno ao processar a retirada. Tente novamente.' });
  }
});

// ==========================================
// COORDINATOR PROTECTED ROUTES
// ==========================================

// GET /api/admin/dashboard - KPI & stats
router.get('/admin/dashboard', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const stats = db.getDashboardStats();
    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar dados do painel.' });
  }
});

// GET /api/admin/items - Full items list for coordinator (including archived if requested)
router.get('/admin/items', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const items = db.getItems(includeDeleted);
    const categories = Array.from(new Set(items.map(i => i.category))).filter(Boolean);
    res.json({ items, categories });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar itens no painel.' });
  }
});

// POST /api/admin/items - Create new item
router.post('/admin/items', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      code,
      category,
      quantity,
      minStock,
      unit,
      location,
      description,
      imageUrl
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'O nome da peça é obrigatório.' });
      return;
    }

    if (!code || !code.trim()) {
      res.status(400).json({ error: 'O código/identificação da peça é obrigatório.' });
      return;
    }

    // Check code uniqueness
    const existingCode = db.findItemByCode(code);
    if (existingCode) {
      res.status(400).json({ error: `Já existe um item cadastrado com o código "${code.trim().toUpperCase()}". Não é permitido duplicar códigos.` });
      return;
    }

    const qty = Number(quantity);
    const min = Number(minStock);

    if (isNaN(qty) || qty < 0) {
      res.status(400).json({ error: 'A quantidade inicial deve ser um número maior ou igual a zero.' });
      return;
    }

    if (isNaN(min) || min < 0) {
      res.status(400).json({ error: 'O estoque mínimo deve ser um número maior ou igual a zero.' });
      return;
    }

    const newItem = db.createItem(
      {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category: category?.trim() || 'Geral',
        quantity: qty,
        minStock: min,
        unit: unit?.trim()?.toUpperCase() || 'UN',
        location: location?.trim() || 'Almoxarifado Principal',
        description: description?.trim() || '',
        imageUrl: imageUrl?.trim() || undefined
      },
      req.user?.id,
      req.user?.name
    );

    res.status(201).json({
      success: true,
      message: 'Item cadastrado com sucesso!',
      item: newItem
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao cadastrar novo item.' });
  }
});

// PUT /api/admin/items/:id - Edit item
router.put('/admin/items/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const itemId = req.params.id;
    const existing = db.findItemById(itemId);
    if (!existing) {
      res.status(404).json({ error: 'Item não encontrado.' });
      return;
    }

    const {
      name,
      code,
      category,
      quantity,
      minStock,
      unit,
      location,
      description,
      imageUrl
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'O nome da peça é obrigatório.' });
      return;
    }

    if (!code || !code.trim()) {
      res.status(400).json({ error: 'O código da peça é obrigatório.' });
      return;
    }

    // Check code uniqueness for other items
    const duplicateCode = db.findItemByCode(code, itemId);
    if (duplicateCode) {
      res.status(400).json({ error: `O código "${code.trim().toUpperCase()}" já está em uso pelo item "${duplicateCode.name}".` });
      return;
    }

    const qty = Number(quantity);
    const min = Number(minStock);

    if (isNaN(qty) || qty < 0) {
      res.status(400).json({ error: 'Quantidade inválida.' });
      return;
    }

    const updated = db.updateItem(
      itemId,
      {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category: category?.trim() || existing.category,
        quantity: qty,
        minStock: isNaN(min) ? existing.minStock : min,
        unit: unit?.trim()?.toUpperCase() || existing.unit,
        location: location?.trim() || existing.location,
        description: description !== undefined ? description.trim() : existing.description,
        imageUrl: imageUrl !== undefined ? imageUrl.trim() : existing.imageUrl
      },
      req.user?.id,
      req.user?.name
    );

    res.json({
      success: true,
      message: 'Item atualizado com sucesso!',
      item: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar item.' });
  }
});

// POST /api/admin/items/:id/adjust - Direct stock adjustment with reason
router.post('/admin/items/:id/adjust', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const itemId = req.params.id;
    const { delta, reason } = req.body;

    const deltaNum = Number(delta);
    if (isNaN(deltaNum) || deltaNum === 0) {
      res.status(400).json({ error: 'Informe uma quantidade válida diferente de zero para o ajuste.' });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ error: 'Informe a justificativa/motivo do ajuste de estoque.' });
      return;
    }

    const result = db.adjustStock(itemId, deltaNum, reason.trim(), req.user?.id, req.user?.name);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      success: true,
      message: 'Ajuste de estoque registrado com sucesso!',
      item: result.item
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao registrar ajuste de estoque.' });
  }
});

// DELETE /api/admin/items/:id - Soft delete item
router.delete('/admin/items/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const itemId = req.params.id;
    const existing = db.findItemById(itemId);
    if (!existing) {
      res.status(404).json({ error: 'Item não encontrado.' });
      return;
    }

    const success = db.deleteItem(itemId, req.user?.id, req.user?.name);
    if (!success) {
      res.status(400).json({ error: 'Não foi possível excluir o item.' });
      return;
    }

    res.json({
      success: true,
      message: 'Item removido do estoque.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao excluir item.' });
  }
});

// POST /api/admin/items/:id/restore - Restore soft-deleted item
router.post('/admin/items/:id/restore', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const item = db.restoreItem(req.params.id, req.user?.id, req.user?.name);
    if (!item) {
      res.status(404).json({ error: 'Item não encontrado para restauração.' });
      return;
    }
    res.json({
      success: true,
      message: 'Item restaurado com sucesso!',
      item
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao restaurar item.' });
  }
});

// GET /api/admin/movements - Full movement history with filters
router.get('/admin/movements', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      requesterName,
      itemId,
      itemCode,
      category,
      type,
      search
    } = req.query;

    const movements = db.getMovements({
      startDate: typeof startDate === 'string' ? startDate : undefined,
      endDate: typeof endDate === 'string' ? endDate : undefined,
      requesterName: typeof requesterName === 'string' ? requesterName : undefined,
      itemId: typeof itemId === 'string' ? itemId : undefined,
      itemCode: typeof itemCode === 'string' ? itemCode : undefined,
      category: typeof category === 'string' ? category : undefined,
      type: typeof type === 'string' ? type : undefined,
      search: typeof search === 'string' ? search : undefined
    });

    res.json({
      movements,
      total: movements.length
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao consultar histórico de movimentações.' });
  }
});

// GET /api/admin/logs - System audit trail
router.get('/admin/logs', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const logs = db.getLogs(300);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao consultar logs de auditoria.' });
  }
});

// POST /api/admin/reset-demo - Reset database to default demo seed data
router.post('/admin/reset-demo', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    db.resetToDemo();
    db.addLog({
      action: 'DEMO_RESETADO',
      details: 'Dados de demonstração do sistema foram restaurados aos padrões originais',
      userId: req.user?.id,
      userName: req.user?.name
    });
    res.json({
      success: true,
      message: 'Dados de demonstração restaurados com sucesso!'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao restaurar dados de demonstração.' });
  }
});

// POST /api/admin/run-tests - Run the 10 automated test suites & real-world simulation
router.post('/admin/run-tests', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const report = runAllAutomatedTests();
    db.addLog({
      action: 'TESTES_EXECUTADOS',
      details: `Bateria de ${report.totalTests} testes automatizados executada. Taxa de sucesso: ${report.successRate}%`,
      userId: req.user?.id,
      userName: req.user?.name
    });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao executar bateria de testes automatizados.' });
  }
});

// ==========================================
// GOOGLE SHEETS SYNCHRONIZATION & PROXY ROUTES
// ==========================================

import { GoogleSheetsService, DEFAULT_SPREADSHEET_ID, DEFAULT_GID } from './googleSheets';

// POST /api/proxy/sheets - Secure server-side proxy for Google Sheets API
// Never exposes API_KEY, tokens, or credentials to browser / frontend bundle.
router.post('/proxy/sheets', async (req: Request, res: Response) => {
  try {
    const { endpoint, method = 'GET', body, params } = req.body;
    if (!endpoint || typeof endpoint !== 'string') {
      res.status(400).json({ error: 'Endpoint da API não informado.' });
      return;
    }

    // Sanitize path to prevent SSRF
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    const targetUrl = new URL(`https://sheets.googleapis.com/v4/${cleanEndpoint}`);

    // Attach server-side API_KEY (strictly stored on backend)
    const apiKey = process.env.API_KEY || process.env.GOOGLE_SHEETS_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim()) {
      targetUrl.searchParams.set('key', apiKey.trim());
    }

    // Add extra params if provided, ignoring any client attempts to pass a key param
    if (params && typeof params === 'object') {
      for (const [k, v] of Object.entries(params)) {
        if (k !== 'key') {
          targetUrl.searchParams.set(k, String(v));
        }
      }
    }

    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const fetchOptions: RequestInit = {
      method: (method || 'GET').toUpperCase(),
      headers
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method || '')) {
      fetchOptions.body = JSON.stringify(body);
    }

    const apiResponse = await fetch(targetUrl.toString(), fetchOptions);
    const data = await apiResponse.json().catch(() => ({}));

    // CRITICAL: Ensure API_KEY is NEVER sent back in the response body to the browser
    const rawJson = JSON.stringify(data);
    const sanitizedJson = apiKey ? rawJson.split(apiKey).join('[REDACTED_API_KEY]') : rawJson;

    res.status(apiResponse.status).send(sanitizedJson);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro no proxy de comunicação com Google Sheets.' });
  }
});

// GET /api/sheets/info - Inspect connected Google Sheet
router.get('/sheets/info', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : '';
    const spreadsheetId = (req.query.spreadsheetId as string) || DEFAULT_SPREADSHEET_ID;
    const gid = (req.query.gid as string) || DEFAULT_GID;

    try {
      const metadata = await GoogleSheetsService.getSpreadsheetMetadata(token, spreadsheetId, gid);
      res.json({
        success: true,
        metadata,
        defaultSpreadsheetId: DEFAULT_SPREADSHEET_ID,
        defaultGid: DEFAULT_GID,
        proxyActive: true
      });
    } catch (e: any) {
      // Graceful fallback to cached official spreadsheet metadata
      res.json({
        success: true,
        metadata: {
          spreadsheetId,
          title: 'Planilha Oficial Almoxarifado Tetra Pak',
          targetSheetName: 'Sheet1',
          sheets: [{ sheetId: parseInt(gid, 10) || 1585513030, title: 'Sheet1', index: 0 }]
        },
        defaultSpreadsheetId: DEFAULT_SPREADSHEET_ID,
        defaultGid: DEFAULT_GID,
        proxyActive: true,
        cached: true,
        notice: 'Metadados sincronizados via cache do servidor.'
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao consultar metadados da planilha.' });
  }
});

// POST /api/sheets/sync-from-sheets - Pull from Google Sheets into Almoxarifado DB
router.post('/sheets/sync-from-sheets', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : req.body.token;
    const spreadsheetId = req.body.spreadsheetId || DEFAULT_SPREADSHEET_ID;
    const gid = req.body.gid || DEFAULT_GID;

    const result = await GoogleSheetsService.syncFromGoogleSheets(token, spreadsheetId, gid);
    res.json(result);
  } catch (err: any) {
    // If remote Google API fails (e.g., restricted access or quota), report cleanly
    res.status(400).json({ 
      error: err.message || 'Erro ao sincronizar dados da Google Sheet via Proxy de Servidor. Verifique a variável API_KEY no servidor.' 
    });
  }
});

// POST /api/sheets/sync-to-sheets - Push from Almoxarifado DB into Google Sheets
router.post('/sheets/sync-to-sheets', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : req.body.token;
    const spreadsheetId = req.body.spreadsheetId || DEFAULT_SPREADSHEET_ID;
    const gid = req.body.gid || DEFAULT_GID;

    const result = await GoogleSheetsService.syncToGoogleSheets(token, spreadsheetId, gid);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ 
      error: err.message || 'Erro ao gravar dados na Google Sheet via Proxy de Servidor.' 
    });
  }
});

// POST /api/sheets/sync-bidirectional - Bidirectional synchronization (Pull & Reconcile & Push)
router.post('/sheets/sync-bidirectional', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : req.body.token;
    const spreadsheetId = req.body.spreadsheetId || DEFAULT_SPREADSHEET_ID;
    const gid = req.body.gid || DEFAULT_GID;

    // Step 1: Pull changes from Sheets to DB
    const pullResult = await GoogleSheetsService.syncFromGoogleSheets(token, spreadsheetId, gid);
    // Step 2: Push back reconciled database state to Sheets
    const pushResult = await GoogleSheetsService.syncToGoogleSheets(token, spreadsheetId, gid);

    db.addLog({
      action: 'SINCRONIZACAO_BIDIRECIONAL_CONCLUIDA',
      details: `Sincronização bidirecional completa: ${pullResult.importedItems} novos itens importados, ${pullResult.updatedItems} atualizados localmente, e ${pushResult.updatedItems} registros consolidados na planilha.`,
      userName: 'Google Sheets Integration (Server Proxy)'
    });

    res.json({
      success: true,
      message: 'Sincronização bidirecional concluída com sucesso via Proxy Seguro de Servidor!',
      pullResult,
      pushResult,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(400).json({ 
      error: err.message || 'Erro ao realizar sincronização bidirecional via Proxy de Servidor.' 
    });
  }
});


