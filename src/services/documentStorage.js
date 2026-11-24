// Serviço de Armazenamento e Gestão de Documentos dos Clientes
// Suporta: 
// 1. Sincronização centralizada com o banco de dados do servidor C# (lexflow-dados.json)
// 2. Gravação física e download direto de arquivos PDF/Word no Windows, celular e rede local
// 3. Persistência local em IndexedDB para cache offline instantâneo

const DB_NAME = 'LexFlowDocsDB';
const DB_VERSION = 1;
const STORE_NAME = 'files';

const WINDOWS_RESERVED_NAMES = new Set([
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'
]);

// Inicializa IndexedDB
export const initDocsDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Salva arquivo no IndexedDB
export const saveFileToIndexedDB = async (docId, file) => {
  try {
    const db = await initDocsDB();
    if (!db) return false;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const data = {
        id: docId,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        size: file.size,
        blob: file,
        savedAt: new Date().toISOString()
      };
      const req = store.put(data);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Erro ao salvar no IndexedDB:', err);
    return false;
  }
};

// Recupera arquivo do IndexedDB
export const getFileFromIndexedDB = async (docId) => {
  try {
    const db = await initDocsDB();
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(docId);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Erro ao recuperar do IndexedDB:', err);
    return null;
  }
};

// Exclui arquivo do IndexedDB
export const deleteFileFromIndexedDB = async (docId) => {
  try {
    const db = await initDocsDB();
    if (!db) return false;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(docId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Erro ao excluir do IndexedDB:', err);
    return false;
  }
};

// Sanitiza nome para pastas e arquivos no Windows (remove caracteres inválidos e evita traversal)
export const sanitizeWindowsName = (name, fallback = 'Cliente') => {
  if (!name || typeof name !== 'string') return fallback;
  let safe = name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\.{2,}/g, '.')
    .trim()
    .replace(/^\.+|\.+$/g, '')
    .replace(/\s+/g, ' ');

  if (!safe || WINDOWS_RESERVED_NAMES.has(safe.toLowerCase())) {
    safe = `${fallback}_${safe || 'Valido'}`;
  }
  return safe.slice(0, 100);
};

// Converte arquivo para Base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = typeof result === 'string' && result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// ==========================================
// BANCO DE DADOS CENTRALIZADO NO SERVIDOR C#
// ==========================================

// Lê os dados centralizados do servidor C# (database.json)
export const fetchServerDb = async () => {
  try {
    const res = await fetch('/api/db', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(2500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.payload && typeof data.payload === 'object') {
        return {
          ...data.payload,
          updatedAt: data.updatedAt || data.payload.updatedAt
        };
      }
      return data;
    }
  } catch (e) {
    // Servidor offline ou indisponível
  }
  return null;
};

// Salva os dados centralizados no servidor C# (grava diretamente no disco)
export const saveServerDb = async (data) => {
  try {
    const payload = {
      clients: data.clients || [],
      cases: data.cases || [],
      deadlines: data.deadlines || [],
      documents: data.documents || [],
      settings: data.settings || {},
      updatedAt: data.updatedAt || new Date().toISOString()
    };
    // Envia tanto na raiz quanto dentro de payload para compatibilidade universal
    const envelope = {
      ...payload,
      payload
    };
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Falha ao sincronizar banco com servidor C#:', e);
  }
  return null;
};

// ==========================================
// DOCUMENTOS E DOWNLOAD DIRETO VIA NAVEGADOR
// ==========================================

// Retorna URL de download/visualização direta para mobile e PC remoto
export const getDocumentDownloadUrl = (clientName, fileName) => {
  const safeClient = sanitizeWindowsName(clientName, 'Cliente');
  const safeFile = sanitizeWindowsName(fileName, 'documento.pdf');
  return `/api/documents/view?client=${encodeURIComponent(safeClient)}&file=${encodeURIComponent(safeFile)}`;
};

// Retorna URL de download para modelo de peças
export const getTemplateDownloadUrl = (subFolder, fileName) => {
  const safeFolder = subFolder ? sanitizeWindowsName(subFolder, '') : '';
  const safeFile = sanitizeWindowsName(fileName, 'modelo.docx');
  return `/api/templates/file?folder=${encodeURIComponent(safeFolder)}&file=${encodeURIComponent(safeFile)}`;
};

// Lista arquivos físicos do cliente direto do disco
export const getClientDiskFiles = async (clientName) => {
  try {
    const safeClient = sanitizeWindowsName(clientName, 'Cliente');
    const res = await fetch(`/api/documents/list?client=${encodeURIComponent(safeClient)}`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return [];
};

// Informações dinâmicas do servidor (caminhos reais das pastas de clientes e modelos + IPs de rede)
let cachedServerInfo = null;
export const getServerStorageInfo = async () => {
  try {
    const res = await fetch('/api/documents/info', { method: 'GET', signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      cachedServerInfo = data;
      return data;
    }
  } catch (e) { }
  return cachedServerInfo || {
    status: 'local',
    native: false,
    port: 8080,
    networkIps: [],
    networkUrls: ['http://localhost:8080'],
    documentsFolder: '%USERPROFILE%\\LexFlow_Clientes',
    templatesFolder: '%USERPROFILE%\\LexFlow_Modelos'
  };
};

// Informações de rede para compartilhamento com estagiário e celular
export const getNetworkServerInfo = async () => {
  try {
    const res = await fetch('/api/network-info', { method: 'GET', signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return getServerStorageInfo();
};

// Testa se a API nativa do LexFlow (C# ou Vite) está respondendo
export const checkNativeApi = async () => {
  try {
    const res = await fetch('/api/ping', { method: 'GET', signal: AbortSignal.timeout(1200) });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.native);
    }
  } catch (e) { }
  return false;
};

// Upload via Servidor Nativo C# ou Node (Grava direto na pasta física do cliente)
export const uploadViaNativeApi = async (clientName, file, category) => {
  try {
    const base64Data = await fileToBase64(file);
    const payload = {
      clientName: sanitizeWindowsName(clientName, 'Cliente'),
      fileName: sanitizeWindowsName(file.name, 'documento.pdf'),
      category: category || 'Geral',
      fileBase64: base64Data
    };

    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API nativa indisponível para upload direto:', err);
  }
  return null;
};

// Abre a pasta física do cliente no Windows Explorer (no servidor local)
export const openClientFolderInWindows = async (clientName) => {
  try {
    const safeName = sanitizeWindowsName(clientName, 'Cliente');
    const res = await fetch(`/api/documents/open-folder?client=${encodeURIComponent(safeName)}`);
    const ctype = res.headers.get('content-type') || '';
    if (res.ok && ctype.includes('application/json')) {
      const data = await res.json();
      return Boolean(data.success);
    }
  } catch (e) {
    console.warn('Não foi possível disparar o explorer via API nativa:', e);
  }
  return false;
};

// Abre a pasta raiz com todos os clientes no Windows Explorer
export const openRootFolderInWindows = async () => {
  try {
    const res = await fetch('/api/documents/open-root');
    const ctype = res.headers.get('content-type') || '';
    if (res.ok && ctype.includes('application/json')) {
      const data = await res.json();
      return Boolean(data.success);
    }
  } catch (e) { }
  return false;
};

// Abre a pasta física de modelos de peças no Windows Explorer
export const openTemplatesFolderInWindows = async () => {
  try {
    const res = await fetch('/api/templates/open-folder');
    const ctype = res.headers.get('content-type') || '';
    if (res.ok && ctype.includes('application/json')) {
      const data = await res.json();
      return Boolean(data.success);
    }
  } catch (e) {
    console.warn('Não foi possível abrir a pasta de modelos:', e);
  }
  return false;
};

// Faz upload de um modelo de peça local para a pasta física
export const uploadTemplateViaNativeApi = async (fileName, file, subFolder) => {
  try {
    const base64Data = await fileToBase64(file);
    const payload = {
      fileName: sanitizeWindowsName(fileName || file.name, 'modelo.docx'),
      subFolder: subFolder ? sanitizeWindowsName(subFolder, '') : '',
      fileBase64: base64Data
    };

    const res = await fetch('/api/templates/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Erro ao salvar modelo na pasta local:', err);
  }
  return null;
};

// ==========================================
// BACKUP AUTOMÁTICO E PONTOS DE RESTAURAÇÃO
// (A cada 15 min e a cada alteração • Retenção de 7 dias)
// ==========================================

// Consulta histórico de backups automáticos salvos em disco
export const getBackupsList = async () => {
  try {
    const res = await fetch('/api/backups/list', {
      method: 'GET',
      signal: AbortSignal.timeout(2500)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return {
    status: 'ok',
    retentionDays: 7,
    intervalMinutes: 15,
    totalBackups: 0,
    backupsFolder: '%USERPROFILE%\\LexFlow_Clientes\\Backups_Automaticos',
    lastBackupTime: null,
    backups: []
  };
};

// Dispara criação manual imediata de um ponto de restauração
export const createManualBackup = async () => {
  try {
    const res = await fetch('/api/backups/create', {
      method: 'POST',
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Erro ao criar backup:', e);
  }
  return { success: false };
};

// Restaura um ponto de backup selecionado
export const restoreBackupPoint = async (fileName) => {
  try {
    const res = await fetch('/api/backups/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName }),
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Erro ao restaurar backup:', e);
  }
  return { success: false };
};
