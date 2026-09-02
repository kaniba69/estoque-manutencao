import { db, Item } from './db';

export const DEFAULT_SPREADSHEET_ID = '1v9ORiDO9Fy0xkiXx6vxxV4UZ5rcS2bXRdz3ButABpTI';
export const DEFAULT_GID = '1585513030';

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

export interface SyncResult {
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
  errors?: string[];
}

/**
 * Resolve headers and query parameters for Google Sheets API calls.
 * All API keys are resolved STRICTLY on the server and never returned to the client.
 */
export function getAuthParamsOrHeaders(token?: string): { urlParam?: string; headers: Record<string, string> } {
  // 1. If an explicit client/admin bearer token is provided
  if (token && token.trim()) {
    return {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json'
      }
    };
  }

  // 2. Otherwise, use server-side environment variable API_KEY
  const serverApiKey = process.env.API_KEY || process.env.GOOGLE_SHEETS_API_KEY || process.env.GEMINI_API_KEY;
  if (serverApiKey && serverApiKey.trim()) {
    return {
      urlParam: `key=${encodeURIComponent(serverApiKey.trim())}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  return {
    headers: {
      'Content-Type': 'application/json'
    }
  };
}

export class GoogleSheetsService {
  /**
   * Obtém metadados da planilha e resolve o nome da aba correspondente ao GID fornecido.
   */
  static async getSpreadsheetMetadata(token?: string, spreadsheetId: string = DEFAULT_SPREADSHEET_ID, targetGid: string = DEFAULT_GID): Promise<SheetMetadata> {
    const authConfig = getAuthParamsOrHeaders(token);
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    if (authConfig.urlParam) {
      url += `?${authConfig.urlParam}`;
    }

    const response = await fetch(url, {
      headers: authConfig.headers
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Falha ao acessar Google Sheets (${response.status}): ${response.statusText}`;
      try {
        const json = JSON.parse(errText);
        if (json.error?.message) {
          msg = json.error.message;
        }
      } catch {}
      throw new Error(msg);
    }

    const data = await response.json();
    const sheetsList = (data.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title || 'Sheet1',
      index: s.properties?.index,
      rowCount: s.properties?.gridProperties?.rowCount,
      columnCount: s.properties?.gridProperties?.columnCount
    }));

    const gidNum = parseInt(targetGid, 10);
    const matchedSheet = sheetsList.find((s: any) => s.sheetId === gidNum) || sheetsList[0];
    const targetSheetName = matchedSheet ? matchedSheet.title : 'Sheet1';

    return {
      spreadsheetId: data.spreadsheetId,
      title: data.properties?.title || 'Planilha de Almoxarifado',
      sheets: sheetsList,
      targetSheetName
    };
  }

  /**
   * Lê todas as linhas da aba selecionada na planilha
   */
  static async readSheetValues(token?: string, spreadsheetId: string = DEFAULT_SPREADSHEET_ID, sheetName: string = 'Sheet1', range: string = 'A1:Z5000'): Promise<string[][]> {
    const authConfig = getAuthParamsOrHeaders(token);
    const fullRange = `${sheetName}!${range}`;
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(fullRange)}`;
    if (authConfig.urlParam) {
      url += `?${authConfig.urlParam}`;
    }

    const response = await fetch(url, {
      headers: authConfig.headers
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Falha ao ler dados da planilha (${response.status}): ${response.statusText}`;
      try {
        const json = JSON.parse(errText);
        if (json.error?.message) {
          msg = json.error.message;
        }
      } catch {}
      throw new Error(msg);
    }

    const data = await response.json();
    return data.values || [];
  }

  /**
   * Classifica categoria técnica baseada na descrição
   */
  static classifyCategory(desc: string): string {
    const d = desc.toUpperCase();
    if (d.includes('ANEL') || d.includes('O-RING') || d.includes('ORING') || d.includes('VEDA') || 
        d.includes('GAXETA') || d.includes('SELO') || d.includes('JUNTA') || d.includes('DIAFRAGMA') || 
        d.includes('MEMBRANA') || d.includes('RETENTOR') || d.includes('ANILHA') || d.includes('BORRACHA') || 
        d.includes('VEDANTE')) {
      return 'Vedações e Juntas';
    }
    if (d.includes('FILTRO') || d.includes('AIRLINK') || d.includes('ÓLEO') || d.includes('OLEO') || 
        d.includes('GRAXA') || d.includes('MOBIL') || d.includes('THINNER') || d.includes('LUBRIFICANTE') || 
        d.includes('GLYCOL') || d.includes('REFRIGERADOR') || d.includes('ERSATZFILTER') || d.includes('IPIRANGA')) {
      return 'Filtros e Fluidos';
    }
    if (d.includes('REDUTOR') || d.includes('MOTOREDUTOR') || d.includes('MOTO REDUTOR') || d.includes('MOTOR') || 
        d.includes('BOMBA') || d.includes('EIXO') || d.includes('VEIO') || d.includes('POLIA') || 
        d.includes('CORREIA') || d.includes('ACOPLAMENTO') || d.includes('SEW') || d.includes('SERVO')) {
      return 'Motores e Transmissão';
    }
    if (d.includes('ROLAMENTO') || d.includes('MANCAL') || d.includes('ROLO') || d.includes('GUIDE') || 
        d.includes('BUCHA') || d.includes('CASQUILHO') || d.includes('CARRO GUIA') || d.includes('ARTICULADA') || 
        d.includes('CASTER') || d.includes('BUSHING') || d.includes('ROLLER')) {
      return 'Rolamentos e Guias';
    }
    if (d.includes('VÁLVULA') || d.includes('VALVULA') || d.includes('CILINDRO') || d.includes('MANIFOLD') || 
        d.includes('SILENCIADOR') || d.includes('BUJÃO') || d.includes('PLUGUE') || d.includes('SPIRAX') || 
        d.includes('PNEUMATIC') || d.includes('PNEUMATICA')) {
      return 'Pneumática e Válvulas';
    }
    if (d.includes('SENSOR') || d.includes('MANOMETRO') || d.includes('TERMOELEMENTO') || d.includes('ESCOVA CARVAO') || 
        d.includes('CABOS') || d.includes('CABO') || d.includes('FUSÍVEL') || d.includes('FUSIVEL') || 
        d.includes('RADIO') || d.includes('CARREGADOR') || d.includes('BASE CARREGADORA') || 
        d.includes('ISOLADOR') || d.includes('ELETRICO') || d.includes('ELÉTRICO') || d.includes('CONTROLADOR')) {
      return 'Sensores e Elétrica';
    }
    if (d.includes('PARAFUSO') || d.includes('ARRUELA') || d.includes('PORCA') || d.includes('CONTRA PORCA') || 
        d.includes('CAVILHA') || d.includes('PINO') || d.includes('CALÇO') || d.includes('CALCOS') || 
        d.includes('CALCO') || d.includes('PLACA') || d.includes('FLANGE') || d.includes('GRAMPO') || 
        d.includes('CHAPA') || d.includes('TAMPA') || d.includes('SUPORTE') || d.includes('BLOCO DE JUNÇÃO') || 
        d.includes('ABA DE DOBRAGEM') || d.includes('ALTURA') || d.includes('RAIL HOLDER') || d.includes('CURSOR') || 
        d.includes('MOLA') || d.includes('OLHAL') || d.includes('EMENDA') || d.includes('ARTEFATO') || 
        d.includes('16XM16') || d.includes('ORIFICE PLATE') || d.includes('FIXADOR') || d.includes('CANTONEIRA') || 
        d.includes('ELETROCALHA') || d.includes('ABRACADEIRA') || d.includes('ABRAÇADEIRA') || d.includes('ARGAMASSA') || 
        d.includes('CARDBOARD') || d.includes('DOBRADIÇA') || d.includes('MANÍPULO') || d.includes('PALHETA') || 
        d.includes('TAMPAO') || d.includes('TAMPÃO') || d.includes('CAIXA DE DERIVAÇÃO') || d.includes('HASTE') || 
        d.includes('TENSIONAMENTO')) {
      return 'Fixação e Estrutura';
    }
    if (d.includes('TUBO') || d.includes('MANGUEIRA') || d.includes('ENCAIXE') || d.includes('JUNÇÃO') || 
        d.includes('JUNÇAO') || d.includes('UNIAO') || d.includes('UNIÃO') || d.includes('ENGATE') || 
        d.includes('WINKEL') || d.includes('TERMINAÇÃO') || d.includes('CONECTOR') || d.includes('CONEXÃO') || 
        d.includes('JOELHO') || d.includes('COTOVELO') || d.includes('LUVA') || d.includes('REGISTRO') || 
        d.includes('NIPLE') || d.includes('CANINHO') || d.includes('PRENSA CABO') || d.includes('ZUGENTLASTUNG') || 
        d.includes('KABELTÜLLE')) {
      return 'Tubulações e Conexões';
    }
    if (d.includes('KIT') || d.includes('CONJUNTO') || d.includes('SORTIDO') || d.includes('PEÇA REPOSIÇÃO') || 
        d.includes('PECA REPOSICAO') || d.includes('INSERT') || d.includes('ACESSORIOS') || d.includes('855617064/SIG') || 
        d.includes('QIR-')) {
      return 'Kits e Peças Sobressalentes';
    }
    if (d.includes('FERRAMENTA') || d.includes('CHAVE') || d.includes('GABARITO') || d.includes('ASSEMBLY') || 
        d.includes('EXTRACTOR') || d.includes('VARA DE MANOBRA')) {
      return 'Ferramentas e Gabaritos';
    }
    return 'Fixação e Estrutura';
  }

  /**
   * Converte texto de quantidade em número e unidade
   */
  static parseQuantityAndUnit(qtyStr: string, desc: string): { quantity: number; unit: string } {
    if (!qtyStr || !qtyStr.trim()) {
      return { quantity: 0, unit: 'UN' };
    }
    const clean = qtyStr.trim().toUpperCase();
    if (clean.includes('KITS') || clean.includes('KIT')) {
      const num = parseInt(clean.replace(/[^0-9]/g, ''), 10) || 1;
      return { quantity: num, unit: 'KIT' };
    }
    if (clean.includes('CX') || clean.includes('CAIXA')) {
      const num = parseInt(clean.replace(/[^0-9]/g, ''), 10) || 1;
      return { quantity: num, unit: 'CX' };
    }
    if (desc.toUpperCase().includes('20L') || desc.toUpperCase().includes('10L') || desc.toUpperCase().includes('TAMBOR')) {
      const num = parseInt(clean.replace(/[^0-9]/g, ''), 10) || 1;
      return { quantity: num, unit: 'GL' };
    }
    const num = parseInt(clean.replace(/[^0-9]/g, ''), 10) || 0;
    return { quantity: num, unit: 'UN' };
  }

  /**
   * Sincronização SHEETS ➔ SITE (Puxa dados da Google Sheet e atualiza o banco de dados)
   */
  static async syncFromGoogleSheets(token?: string, spreadsheetId: string = DEFAULT_SPREADSHEET_ID, targetGid: string = DEFAULT_GID): Promise<SyncResult> {
    const meta = await this.getSpreadsheetMetadata(token, spreadsheetId, targetGid);
    const rows = await this.readSheetValues(token, spreadsheetId, meta.targetSheetName, 'A1:F5000');

    if (rows.length <= 1) {
      return {
        success: true,
        message: 'Planilha lida com sucesso, porém não contém linhas de dados após o cabeçalho.',
        source: 'GOOGLE_SHEETS',
        totalSheetRows: 0,
        importedItems: 0,
        updatedItems: 0,
        unchangedItems: 0,
        sheetTitle: meta.targetSheetName,
        spreadsheetId,
        timestamp: new Date().toISOString()
      };
    }

    const header = rows[0].map(h => (h || '').trim().toUpperCase());
    const dataRows = rows.slice(1);

    // Identify column indices
    let colCode = header.findIndex(h => h.includes('CODIGO') || h.includes('CÓDIGO') || h.includes('TETRA'));
    let colBusca = header.findIndex(h => h.includes('BUSCA') || h.includes('FABRICANTE') || h.includes('KLASSMATT'));
    let colQty = header.findIndex(h => h.includes('QUANTIDADE') || h.includes('QTD') || h.includes('ESTOQUE'));
    let colDesc = header.findIndex(h => h.includes('DESCRIÇÃO') || h.includes('DESCRICAO') || h.includes('NOME') || h.includes('ITEM'));
    let colPrat = header.findIndex(h => h.includes('PRATELEIRA') || h.includes('LOCAL') || h.includes('POSIÇÃO'));
    let colData = header.findIndex(h => h.includes('DATA'));

    if (colCode === -1) colCode = 0;
    if (colBusca === -1) colBusca = 1;
    if (colQty === -1) colQty = 2;
    if (colDesc === -1) colDesc = 3;
    if (colPrat === -1) colPrat = 4;
    if (colData === -1) colData = 5;

    let importedCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

    const currentItems = db.getItems(false); // including inactive
    const itemsMapByCode = new Map<string, Item>();
    const itemsMapById = new Map<string, Item>();
    currentItems.forEach(i => {
      itemsMapById.set(i.id, i);
      if (i.code) {
        itemsMapByCode.set(i.code.toUpperCase(), i);
      }
    });

    dataRows.forEach((row, index) => {
      const rawCode = (row[colCode] || '').trim();
      const rawBusca = (row[colBusca] || '').trim();
      const rawQty = (row[colQty] || '').trim();
      const rawDesc = (row[colDesc] || '').trim();
      const rawPrat = (row[colPrat] || '').trim();
      const rawData = (row[colData] || '').trim();

      if (!rawDesc && !rawCode) return; // skip completely empty rows

      const { quantity, unit } = this.parseQuantityAndUnit(rawQty, rawDesc);
      
      let code = rawCode;
      if (!code || code.toUpperCase() === 'NULL') {
        code = `ALM-${rawPrat.replace(/[^A-Za-z0-9]/g, '')}-${String(index + 1).padStart(3, '0')}`;
      }

      const category = this.classifyCategory(rawDesc);
      let location = rawPrat.toUpperCase() === 'SOLTO' 
        ? 'Área de Tambores e Fluidos (SOLTO)' 
        : `Prateleira ${rawPrat}`;
      
      const minStock = quantity > 20 ? 5 : (quantity > 5 ? 2 : (quantity > 0 ? 1 : 0));
      const description = `Fabricante/Sistema: ${rawBusca || 'KLASSMATT'} | Cadastro: ${rawData || '8/26/2026'} | Posição: ${rawPrat}`;

      // Check if item already exists by deterministic ID or code
      const candidateId = `item_sheet_${index + 1}`;
      const existing = itemsMapById.get(candidateId) || itemsMapByCode.get(code.toUpperCase());

      if (existing) {
        // Compare values
        const hasChanges = 
          existing.name !== rawDesc ||
          existing.quantity !== quantity ||
          existing.location !== location ||
          existing.code !== code ||
          !existing.active;

        if (hasChanges) {
          db.updateItem(
            existing.id,
            {
              name: rawDesc || existing.name,
              code,
              category,
              quantity,
              minStock: existing.minStock ?? minStock,
              unit,
              location,
              description
            },
            'SYSTEM_SYNC',
            'Sincronização Google Sheets'
          );
          updatedCount++;
        } else {
          unchangedCount++;
        }
      } else {
        // Create new item
        db.createItem(
          {
            name: rawDesc || `Item ${code}`,
            code,
            category,
            quantity,
            minStock,
            unit,
            location,
            description
          },
          'SYSTEM_SYNC',
          'Sincronização Google Sheets'
        );
        importedCount++;
      }
    });

    db.addLog({
      action: 'SINCRONIZACAO_SHEETS_RECEBIDA',
      details: `Sincronização Google Sheets ➔ Site concluída na aba "${meta.targetSheetName}". Importados: ${importedCount}, Atualizados: ${updatedCount}, Inalterados: ${unchangedCount}.`,
      userName: 'Google Sheets Integration'
    });

    return {
      success: true,
      message: `Sincronização concluída com sucesso a partir da aba "${meta.targetSheetName}".`,
      source: 'GOOGLE_SHEETS',
      totalSheetRows: dataRows.length,
      importedItems: importedCount,
      updatedItems: updatedCount,
      unchangedItems: unchangedCount,
      sheetTitle: meta.targetSheetName,
      spreadsheetId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Sincronização SITE ➔ SHEETS (Envia dados do Almoxarifado para a Google Sheet)
   */
  static async syncToGoogleSheets(token?: string, spreadsheetId: string = DEFAULT_SPREADSHEET_ID, targetGid: string = DEFAULT_GID): Promise<SyncResult> {
    const meta = await this.getSpreadsheetMetadata(token, spreadsheetId, targetGid);
    const activeItems = db.getItems(true);

    const headers = ['CODIGO TETRA PAK', 'BUSCA', 'QUANTIDADE', 'DESCRIÇÃO', 'PRATELEIRA', 'DATA'];
    const rows: string[][] = [headers];

    activeItems.forEach(item => {
      // Extract position / shelf from location string
      let prateleira = 'P1-A1';
      if (item.location.includes('Prateleira ')) {
        prateleira = item.location.replace('Prateleira ', '').trim();
      } else if (item.location.includes('SOLTO')) {
        prateleira = 'SOLTO';
      }

      // Extract manufacturer / date from description
      let busca = 'KLASSMATT';
      if (item.code.startsWith('6-') || item.name.toUpperCase().includes('TETRAPAK') || item.name.toUpperCase().includes('TETRA PAK')) {
        busca = 'TETRA PAK';
      }

      let date = '8/26/2026';
      if (item.description && item.description.includes('Cadastro: ')) {
        const match = item.description.match(/Cadastro:\s*([^|]+)/);
        if (match && match[1]) {
          date = match[1].trim();
        }
      }

      // Quantity formatting with unit if applicable
      let qtyDisplay = String(item.quantity);
      if (item.unit === 'KIT' && item.quantity > 0) {
        qtyDisplay = `${item.quantity} KITS`;
      } else if (item.unit === 'CX' && item.quantity > 0) {
        qtyDisplay = `${item.quantity} CX`;
      }

      const codeVal = item.code.startsWith('ALM-') ? 'NULL' : item.code;

      rows.push([
        codeVal,
        busca,
        qtyDisplay,
        item.name,
        prateleira,
        date
      ]);
    });

    const range = `${meta.targetSheetName}!A1:F${rows.length}`;
    const authConfig = getAuthParamsOrHeaders(token);
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    if (authConfig.urlParam) {
      url += `&${authConfig.urlParam}`;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: authConfig.headers,
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: rows
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Falha ao gravar dados na planilha (${response.status}): ${response.statusText}`;
      try {
        const json = JSON.parse(errText);
        if (json.error?.message) {
          msg = json.error.message;
        }
      } catch {}
      throw new Error(msg);
    }

    db.addLog({
      action: 'SINCRONIZACAO_SHEETS_ENVIADA',
      details: `Sincronização Site ➔ Google Sheets concluída com sucesso. ${activeItems.length} itens gravados na aba "${meta.targetSheetName}".`,
      userName: 'Google Sheets Integration'
    });

    return {
      success: true,
      message: `Dados gravados com sucesso na planilha "${meta.title}" (${meta.targetSheetName}).`,
      source: 'LOCAL_DATABASE',
      totalSheetRows: rows.length - 1,
      importedItems: 0,
      updatedItems: activeItems.length,
      unchangedItems: 0,
      sheetTitle: meta.targetSheetName,
      spreadsheetId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Atualização de quantidade em linha específica da Google Sheet (ex: após retirada)
   */
  static async updateItemStockInSheets(
    itemCode: string, 
    newQuantity: number, 
    unit: string, 
    token?: string, 
    spreadsheetId: string = DEFAULT_SPREADSHEET_ID, 
    targetGid: string = DEFAULT_GID
  ): Promise<boolean> {
    try {
      const meta = await this.getSpreadsheetMetadata(token, spreadsheetId, targetGid);
      const rows = await this.readSheetValues(token, spreadsheetId, meta.targetSheetName, 'A1:D5000');
      
      const cleanTargetCode = itemCode.toUpperCase().trim();
      let targetRowIndex = -1;

      for (let i = 1; i < rows.length; i++) {
        const rowCode = (rows[i][0] || '').toUpperCase().trim();
        if (rowCode === cleanTargetCode || (cleanTargetCode.startsWith('ALM-') && rowCode === 'NULL')) {
          targetRowIndex = i + 1; // 1-indexed for Sheets
          break;
        }
      }

      if (targetRowIndex === -1) {
        return false;
      }

      let formattedQty = String(newQuantity);
      if (unit === 'KIT') formattedQty = `${newQuantity} KITS`;
      if (unit === 'CX') formattedQty = `${newQuantity} CX`;

      const cellRange = `${meta.targetSheetName}!C${targetRowIndex}`;
      const authConfig = getAuthParamsOrHeaders(token);
      let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(cellRange)}?valueInputOption=USER_ENTERED`;
      if (authConfig.urlParam) {
        url += `&${authConfig.urlParam}`;
      }

      const res = await fetch(url, {
        method: 'PUT',
        headers: authConfig.headers,
        body: JSON.stringify({
          range: cellRange,
          values: [[formattedQty]]
        })
      });

      return res.ok;
    } catch (e) {
      console.warn('Falha ao atualizar linha na Google Sheet de forma síncrona:', e);
      return false;
    }
  }
}
