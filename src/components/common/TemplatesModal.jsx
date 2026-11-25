import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  FolderOpen,
  ExternalLink,
  HardDrive,
  Cloud,
  Upload,
  CheckCircle2,
  Copy,
  FolderPlus,
  BookOpen,
  Users,
  FileText,
  File,
  Image,
  Eye,
  Download,
  Trash2,
  Search,
  Briefcase,
  Link2,
  Plus
} from 'lucide-react';
import {
  openTemplatesFolderInWindows,
  uploadTemplateViaNativeApi,
  getServerStorageInfo,
  saveFileToIndexedDB,
  getFileFromIndexedDB,
  getDocumentDownloadUrl
} from '../../services/documentStorage';
import { safeCopyToClipboard } from '../../utils/formatters';

const TEMPLATE_SUBFOLDERS = [
  '01. Procurações e Contratos',
  '02. Petições Iniciais',
  '03. Contestações e Defesas',
  '04. Recursos e Agravos',
  '05. Notificações e Acordos'
];

function getFileIcon(fileName = '') {
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-600 shrink-0" />;
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return <Image className="w-4 h-4 text-emerald-600 shrink-0" />;
  return <File className="w-4 h-4 text-amber-600 shrink-0" />;
}

function buildClientQualification(client) {
  if (!client) return '';
  const parts = [client.name];
  if (client.document) parts.push(`inscrito(a) no CPF/CNPJ sob o nº ${client.document}`);
  if (client.address) parts.push(`residente e domiciliado(a) em ${client.address}`);
  if (client.email) parts.push(`e-mail ${client.email}`);
  if (client.phone) parts.push(`telefone/WhatsApp ${client.phone}`);
  return parts.join(', ') + '.';
}

export default function TemplatesModal({
  isOpen,
  onClose,
  hasNativeServer = false,
  clients = [],
  cases = [],
  documents = [],
  templates = [],
  onAddTemplate,
  onDeleteTemplate,
  modelsDriveUrl,
  setModelsDriveUrl,
  onSaveModelsUrl,
  onCopyText,
  showToast
}) {
  // Painel Cliente (Esquerda)
  const [selectedClientId, setSelectedClientId] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null); // { url, name, isBlob }

  // Painel Modelos (Direita)
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [templateSearch, setTemplateSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState('file'); // 'file' | 'link'

  const [selectedFolder, setSelectedFolder] = useState(TEMPLATE_SUBFOLDERS[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const [driveUrlInput, setDriveUrlInput] = useState(modelsDriveUrl || 'https://drive.google.com');
  const [localFolderPath, setLocalFolderPath] = useState('%USERPROFILE%\\LexFlow_Modelos');
  const [localPickedFiles, setLocalPickedFiles] = useState([]);
  const [pickedFolderName, setPickedFolderName] = useState('');

  const fileInputRef = useRef(null);
  const supportsDirectoryPicker = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

  useEffect(() => {
    setDriveUrlInput(modelsDriveUrl || 'https://drive.google.com');
  }, [modelsDriveUrl, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      if (previewDoc?.isBlob && previewDoc?.url) URL.revokeObjectURL(previewDoc.url);
      setPreviewDoc(null);
      return;
    }

    if (!selectedClientId && clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }

    if (hasNativeServer) {
      getServerStorageInfo().then((info) => {
        if (info && info.templatesFolder) setLocalFolderPath(info.templatesFolder);
      });
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (previewDoc) {
          if (previewDoc.isBlob && previewDoc.url) URL.revokeObjectURL(previewDoc.url);
          setPreviewDoc(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, hasNativeServer, clients, selectedClientId, previewDoc]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const clientCases = useMemo(
    () => (selectedClient ? cases.filter((c) => c.clientId === selectedClient.id) : []),
    [cases, selectedClient]
  );

  const clientDocs = useMemo(
    () => (selectedClient ? documents.filter((d) => d.clientId === selectedClient.id) : []),
    [documents, selectedClient]
  );

  const allTemplates = useMemo(() => {
    const combined = [...templates, ...localPickedFiles];
    return combined.filter((item) => {
      const matchCat = activeCategory === 'Todas' || item.category === activeCategory;
      const q = templateSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        (item.title || '').toLowerCase().includes(q) ||
        (item.fileName || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [templates, localPickedFiles, activeCategory, templateSearch]);

  if (!isOpen) return null;

  const copyValue = async (text, label) => {
    if (!text) return;
    if (onCopyText) {
      await onCopyText(text, label);
    } else {
      await safeCopyToClipboard(text);
      showToast?.(`${label} copiado!`);
    }
  };

  // --- Preview & Download de Documentos do Cliente ---
  const handlePreviewClientDoc = async (docItem) => {
    try {
      const blob = await getFileFromIndexedDB(docItem.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewDoc({ url, name: docItem.fileName, isBlob: true });
        return;
      }
      if (hasNativeServer && selectedClient) {
        setPreviewDoc({
          url: getDocumentDownloadUrl(selectedClient.name, docItem.fileName),
          name: docItem.fileName,
          isBlob: false
        });
        return;
      }
      showToast?.('Arquivo disponível apenas no dispositivo de origem.', 'warning');
    } catch {
      showToast?.('Não foi possível abrir o documento.', 'error');
    }
  };

  const handleDownloadClientDoc = async (docItem) => {
    const blob = await getFileFromIndexedDB(docItem.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = docItem.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    if (hasNativeServer && selectedClient) {
      window.open(getDocumentDownloadUrl(selectedClient.name, docItem.fileName), '_blank', 'noopener,noreferrer');
      return;
    }
    showToast?.('Arquivo não encontrado no armazenamento local.', 'warning');
  };

  // --- Selecionar Pasta Local do PC (Chrome/Edge File System Access API) ---
  const handlePickLocalFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
      const collected = [];

      const scanDir = async (handle, categoryGuess) => {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            if (/\.(docx?|pdf|odt|rtf|txt)$/i.test(entry.name)) {
              const matchedCat =
                TEMPLATE_SUBFOLDERS.find((c) => categoryGuess && categoryGuess.toLowerCase().includes(c.slice(4, 12).toLowerCase())) ||
                categoryGuess ||
                TEMPLATE_SUBFOLDERS[0];
              collected.push({
                id: `local-${entry.name}-${Math.random().toString(36).slice(2, 8)}`,
                source: 'fs-handle',
                handle: entry,
                title: entry.name.replace(/\.[^.]+$/, ''),
                fileName: entry.name,
                category: matchedCat
              });
            }
          } else if (entry.kind === 'directory') {
            const subCat = TEMPLATE_SUBFOLDERS.find((c) => c === entry.name) || entry.name;
            await scanDir(entry, subCat);
          }
        }
      };

      await scanDir(dirHandle, TEMPLATE_SUBFOLDERS[0]);
      setLocalPickedFiles(collected);
      setPickedFolderName(dirHandle.name);
      showToast?.(`${collected.length} modelo(s) carregado(s) da pasta "${dirHandle.name}".`, 'success');
    } catch (err) {
      if (err?.name !== 'AbortError') {
        showToast?.('Não foi possível ler a pasta selecionada.', 'error');
      }
    }
  };

  // --- Upload de Novo Modelo (Arquivo ou Link Google Docs) ---
  const handleAddTemplateSubmit = async (e) => {
    e.preventDefault();
    if (addMode === 'link') {
      if (!linkTitle.trim() || !linkUrl.trim()) {
        showToast?.('Informe o título e o link do Google Docs/Drive.', 'warning');
        return;
      }
      const newTpl = {
        id: crypto.randomUUID(),
        source: 'gdocs-link',
        title: linkTitle.trim(),
        fileName: `${linkTitle.trim()}.gdoc`,
        url: linkUrl.trim(),
        category: selectedFolder,
        createdAt: new Date().toISOString()
      };
      await onAddTemplate?.(newTpl);
      setLinkTitle('');
      setLinkUrl('');
      setShowAddForm(false);
      showToast?.('Modelo do Google Docs adicionado!', 'success');
      return;
    }

    if (!selectedFile) {
      showToast?.('Selecione um arquivo de modelo (.docx, .pdf, .odt).', 'warning');
      return;
    }

    setUploading(true);
    try {
      const tplId = crypto.randomUUID();
      await saveFileToIndexedDB(tplId, selectedFile);

      let nativeUrl = null;
      if (hasNativeServer) {
        const res = await uploadTemplateViaNativeApi(selectedFile.name, selectedFile, selectedFolder);
        if (res?.success) {
          nativeUrl = `${window.location.origin}/api/templates/file?sub=${encodeURIComponent(selectedFolder)}&file=${encodeURIComponent(selectedFile.name)}`;
        }
      }

      const newTpl = {
        id: tplId,
        source: 'uploaded-file',
        title: selectedFile.name.replace(/\.[^.]+$/, ''),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        category: selectedFolder,
        nativeUrl,
        createdAt: new Date().toISOString()
      };

      await onAddTemplate?.(newTpl);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowAddForm(false);
      showToast?.(`Modelo "${newTpl.title}" salvo em ${selectedFolder}!`, 'success');
    } catch (err) {
      console.error(err);
      showToast?.('Erro ao salvar modelo.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // --- Abertura: Google Docs (Online) ou Word (Local) ---
  const getTemplateBlob = async (tpl) => {
    if (tpl.source === 'fs-handle' && tpl.handle) {
      return await tpl.handle.getFile();
    }
    return await getFileFromIndexedDB(tpl.id);
  };

  const handleOpenInGoogleDocs = async (tpl) => {
    if (selectedClient) {
      await safeCopyToClipboard(buildClientQualification(selectedClient));
    }

    if (tpl.url) {
      window.open(tpl.url, '_blank', 'noopener,noreferrer');
      if (selectedClient) {
        showToast?.('Google Docs aberto! Qualificação do cliente copiada para colar (Ctrl+V).', 'info');
      }
      return;
    }

    const blob = await getTemplateBlob(tpl);
    if (blob && /\.pdf$/i.test(tpl.fileName || '')) {
      const url = URL.createObjectURL(blob);
      setPreviewDoc({ url, name: tpl.fileName, isBlob: true });
      return;
    }

    // Para arquivos .docx locais sem URL pública, abre novo documento no Google Docs com qualificação copiada
    window.open('https://docs.google.com/document/create', '_blank', 'noopener,noreferrer');
    showToast?.(
      selectedClient
        ? 'Novo Google Docs aberto com a qualificação do cliente copiada! Se quiser usar o arquivo local, baixe-o pelo botão Word.'
        : 'Novo Google Docs aberto! Para abrir um modelo específico direto no Docs, cadastre o link dele no botão + Modelo.',
      'info'
    );
  };

  const handleOpenInWordLocal = async (tpl) => {
    if (selectedClient) {
      await safeCopyToClipboard(buildClientQualification(selectedClient));
    }

    // Se houver URL HTTP acessível (ex.: servidor local ou OneDrive/SharePoint), tenta protocolo oficial ms-word:
    const accessibleUrl = tpl.nativeUrl || (tpl.url && !tpl.url.includes('docs.google.com') ? tpl.url : null);
    if (accessibleUrl && /\.docx?$/i.test(tpl.fileName || accessibleUrl)) {
      window.location.href = `ms-word:ofe|u|${accessibleUrl}`;
      showToast?.('Abrindo no Microsoft Word local...', 'success');
      return;
    }

    const blob = await getTemplateBlob(tpl);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = tpl.fileName || `${tpl.title}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast?.(
        selectedClient
          ? 'Arquivo baixado para abrir no Word! Qualificação do cliente já copiada.'
          : 'Arquivo baixado! Clique no arquivo baixado para abrir no Microsoft Word.',
        'success'
      );
      return;
    }

    if (tpl.url) {
      window.open(tpl.url, '_blank', 'noopener,noreferrer');
    } else {
      showToast?.('Arquivo local não disponível neste dispositivo.', 'warning');
    }
  };

  const handleOpenOnlineFolder = () => {
    const url = driveUrlInput.trim() || 'https://drive.google.com';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSaveUrl = (e) => {
    e.preventDefault();
    if (setModelsDriveUrl) setModelsDriveUrl(driveUrlInput);
    if (onSaveModelsUrl) onSaveModelsUrl();
  };

  const handleOpenLocalFolder = async () => {
    const ok = await openTemplatesFolderInWindows();
    if (ok) {
      showToast?.('Pasta de modelos aberta no Windows Explorer!', 'success');
    } else {
      await safeCopyToClipboard(localFolderPath);
      showToast?.(`Pasta local: ${localFolderPath} (caminho copiado)`, 'info');
    }
  };

  const isPreviewImage = previewDoc && /\.(png|jpe?g|webp|gif)$/i.test(previewDoc.name || '');
  const isPreviewPdf = previewDoc && /\.pdf$/i.test(previewDoc.name || '');

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="templates-modal-title"
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
      >
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="templates-modal-title" className="text-base sm:text-lg font-bold font-serif-luxury text-gold-gradient truncate">
                Central de Peças, Modelos & Dados do Cliente
              </h2>
              <p className="text-xs text-slate-500 truncate">
                Consulte dados/documentos do cliente e abra modelos no Google Docs (online) ou Word (local).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo em 2 Colunas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* COLUNA ESQUERDA: DADOS E DOCUMENTOS DO CLIENTE (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                <span>Dados & Documentos do Cliente</span>
              </h3>
              {selectedClient && (
                <button
                  type="button"
                  onClick={() => copyValue(buildClientQualification(selectedClient), 'Qualificação do cliente')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  title="Copiar qualificação jurídica completa para colar na petição"
                >
                  <Copy className="w-3 h-3 text-amber-400" />
                  <span>Copiar Qualificação</span>
                </button>
              )}
            </div>

            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
              aria-label="Selecionar cliente"
            >
              {clients.length === 0 ? (
                <option value="">Nenhum cliente cadastrado ainda</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.document ? `— ${c.document}` : ''}
                  </option>
                ))
              )}
            </select>

            {selectedClient ? (
              <div className="space-y-4 flex-1 overflow-y-auto pr-0.5">
                {/* Ficha Cadastral */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">CPF/CNPJ</span>
                    <button
                      type="button"
                      onClick={() => copyValue(selectedClient.document, 'CPF/CNPJ')}
                      className="font-mono font-semibold text-slate-800 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{selectedClient.document || 'Não informado'}</span>
                      {selectedClient.document && <Copy className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Telefone</span>
                    <span className="font-medium text-slate-700">{selectedClient.phone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">E-mail</span>
                    <span className="truncate max-w-[200px] text-slate-700">{selectedClient.email || '—'}</span>
                  </div>
                  {selectedClient.address && (
                    <div className="pt-1 border-t border-slate-100">
                      <span className="text-slate-400 block mb-0.5">Endereço</span>
                      <p className="text-slate-700 leading-snug">{selectedClient.address}</p>
                    </div>
                  )}
                </div>

                {/* Processos Vinculados */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                    <span>Processos ({clientCases.length})</span>
                  </p>
                  {clientCases.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-white p-3 rounded-xl border border-slate-200/70">
                      Nenhum processo vinculado a este cliente.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {clientCases.map((proc) => (
                        <div
                          key={proc.id}
                          className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-mono font-bold text-slate-900 truncate">{proc.cnjNumber}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {proc.area} • {proc.court || 'Vara N/I'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyValue(proc.cnjNumber, 'CNJ')}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-amber-700 cursor-pointer shrink-0"
                            title="Copiar CNJ"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documentos do Cliente */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Documentos do Cliente ({clientDocs.length})</span>
                  </p>

                  {previewDoc && (
                    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                      <div className="px-3 py-2 bg-slate-950 text-white flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold truncate">{previewDoc.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (previewDoc.isBlob && previewDoc.url) URL.revokeObjectURL(previewDoc.url);
                            setPreviewDoc(null);
                          }}
                          className="text-slate-400 hover:text-white cursor-pointer"
                          aria-label="Fechar preview"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="bg-slate-800 flex items-center justify-center max-h-60 overflow-auto">
                        {isPreviewImage ? (
                          <img src={previewDoc.url} alt={previewDoc.name} className="max-h-56 object-contain" />
                        ) : isPreviewPdf ? (
                          <iframe src={previewDoc.url} title={previewDoc.name} className="w-full h-56 bg-white" />
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-300">
                            Preview inline disponível para PDF e imagens.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {clientDocs.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-white p-3 rounded-xl border border-slate-200/70">
                      Nenhum documento anexado neste cliente.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {clientDocs.map((docItem) => (
                        <div
                          key={docItem.id}
                          className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {getFileIcon(docItem.fileName)}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{docItem.fileName}</p>
                              <p className="text-[10px] text-slate-400 truncate">{docItem.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handlePreviewClientDoc(docItem)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 cursor-pointer"
                              title="Visualizar documento"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadClientDoc(docItem)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 cursor-pointer"
                              title="Baixar documento"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200/70">
                Cadastre um cliente no CRM para consultar os dados e documentos aqui.
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: MODELOS DE PEÇAS (GOOGLE DOCS / WORD LOCAL) (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Ações Superiores de Modelos */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm((prev) => !prev)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showAddForm ? 'Fechar Cadastro' : 'Adicionar Modelo'}</span>
                </button>

                {supportsDirectoryPicker && (
                  <button
                    type="button"
                    onClick={handlePickLocalFolder}
                    className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    title="Ler pasta local de modelos do computador diretamente pelo navegador"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>{pickedFolderName ? `Pasta: ${pickedFolderName}` : 'Ler Pasta Local (PC)'}</span>
                  </button>
                )}

                {hasNativeServer && (
                  <button
                    type="button"
                    onClick={handleOpenLocalFolder}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                    <span>Abrir no Windows</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleOpenOnlineFolder}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Abrir pasta de modelos configurada no Google Drive / OneDrive"
              >
                <Cloud className="w-3.5 h-3.5 text-amber-600" />
                <span>Pasta na Nuvem</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            {/* Formulário Expansível de Cadastro de Modelo */}
            {showAddForm && (
              <form
                onSubmit={handleAddTemplateSubmit}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center">
                    <button
                      type="button"
                      onClick={() => setAddMode('file')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        addMode === 'file' ? 'bg-slate-900 text-white' : 'text-slate-600'
                      }`}
                    >
                      Arquivo Local (.docx/.pdf)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddMode('link')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        addMode === 'link' ? 'bg-slate-900 text-white' : 'text-slate-600'
                      }`}
                    >
                      Link Google Docs / Drive
                    </button>
                  </div>

                  <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                  >
                    {TEMPLATE_SUBFOLDERS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {addMode === 'file' ? (
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-4 border-2 border-dashed rounded-xl cursor-pointer text-center transition-all ${
                      isDragOver
                        ? 'border-amber-500 bg-amber-50'
                        : selectedFile
                        ? 'border-emerald-500 bg-emerald-50/40'
                        : 'border-slate-300 hover:border-amber-400 bg-white'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".docx,.doc,.pdf,.odt,.txt,.rtf"
                      onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{selectedFile.name}</span>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-slate-600">
                        Arraste seu modelo (.docx, .pdf) aqui ou{' '}
                        <span className="text-amber-700 underline">clique para escolher</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="Nome do modelo (ex: Procuração Padrão)"
                      className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:border-amber-500 focus:outline-none"
                    />
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://docs.google.com/document/d/..."
                      className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {addMode === 'file' ? (
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{uploading ? 'Salvando...' : 'Salvar Modelo'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Busca e Filtro por Categoria */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Buscar modelo de peça por nome..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100/80 focus:bg-white border border-slate-200 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['Todas', ...TEMPLATE_SUBFOLDERS].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold shrink-0 transition-all cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Modelos com Escolha: Google Docs Online vs Word Local */}
            <div className="flex-1 space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
              {allTemplates.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <FolderPlus className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Nenhum modelo cadastrado nesta categoria</p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Clique em <strong>Adicionar Modelo</strong> para subir seus arquivos <code>.docx</code>/<code>.pdf</code> ou vincular links do Google Docs, ou clique em <strong>Ler Pasta Local (PC)</strong>.
                  </p>
                </div>
              ) : (
                allTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3 rounded-xl bg-white border border-slate-200/80 hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                        {tpl.url ? (
                          <Link2 className="w-4 h-4 text-blue-600" />
                        ) : (
                          getFileIcon(tpl.fileName)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{tpl.title}</p>
                        <p className="text-[10.5px] text-slate-500 truncate">
                          {tpl.category} •{' '}
                          {tpl.source === 'fs-handle'
                            ? 'Pasta do PC'
                            : tpl.url
                            ? 'Link Online'
                            : 'Arquivo Local'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleOpenInGoogleDocs(tpl)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        title="Abrir no Google Docs Online"
                      >
                        <Cloud className="w-3 h-3" />
                        <span>Google Docs</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenInWordLocal(tpl)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        title="Abrir no Microsoft Word localmente"
                      >
                        <FileText className="w-3 h-3 text-amber-400" />
                        <span>Word Local</span>
                      </button>

                      {tpl.source !== 'fs-handle' && onDeleteTemplate && (
                        <button
                          type="button"
                          onClick={() => onDeleteTemplate(tpl.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Excluir modelo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Configuração Rápida da Pasta Drive */}
            <form onSubmit={handleSaveUrl} className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <input
                type="url"
                value={driveUrlInput}
                onChange={(e) => setDriveUrlInput(e.target.value)}
                placeholder="Link da pasta geral de modelos no Google Drive..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shrink-0 cursor-pointer"
              >
                Salvar Link Drive
              </button>
            </form>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-b-2xl shrink-0">
          <p className="text-[11px] text-slate-500">
            Dica: ao abrir um modelo, a qualificação do cliente selecionado já é copiada automaticamente para você colar (Ctrl+V).
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition-all cursor-pointer self-end sm:self-auto"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
