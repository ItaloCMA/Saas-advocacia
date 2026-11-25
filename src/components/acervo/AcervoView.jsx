import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
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
  Plus,
  X
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

export const TEMPLATE_SUBFOLDERS = [
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

export default function AcervoView({
  section = 'acervo-modelos', // 'acervo-clientes' | 'acervo-modelos' | 'acervo-pastas'
  onChangeSection,
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
  // Subtópico 1: Dados & Documentos do Cliente
  const [selectedClientId, setSelectedClientId] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  // Subtópico 2: Modelos de Peças
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

  // Subtópico 3: Pastas (Nuvem & PC)
  const [driveUrlInput, setDriveUrlInput] = useState(modelsDriveUrl || 'https://drive.google.com');
  const [localFolderPath, setLocalFolderPath] = useState('%USERPROFILE%\\LexFlow_Modelos');
  const [localPickedFiles, setLocalPickedFiles] = useState([]);
  const [pickedFolderName, setPickedFolderName] = useState('');

  const fileInputRef = useRef(null);
  const supportsDirectoryPicker = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

  useEffect(() => {
    setDriveUrlInput(modelsDriveUrl || 'https://drive.google.com');
  }, [modelsDriveUrl]);

  useEffect(() => {
    if (!selectedClientId && clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (hasNativeServer) {
      getServerStorageInfo().then((info) => {
        if (info && info.templatesFolder) setLocalFolderPath(info.templatesFolder);
      });
    }
  }, [hasNativeServer]);

  useEffect(() => {
    return () => {
      if (previewDoc?.isBlob && previewDoc?.url) URL.revokeObjectURL(previewDoc.url);
    };
  }, [previewDoc]);

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

  const copyValue = async (text, label) => {
    if (!text) return;
    if (onCopyText) {
      await onCopyText(text, label);
    } else {
      await safeCopyToClipboard(text);
      showToast?.(`${label} copiado!`);
    }
  };

  const handlePreviewClientDoc = async (docItem) => {
    try {
      const blob = await getFileFromIndexedDB(docItem.id);
      if (blob) {
        if (previewDoc?.isBlob && previewDoc?.url) URL.revokeObjectURL(previewDoc.url);
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

  const handlePickLocalFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
      const collected = [];

      const scanDir = async (handle, categoryGuess) => {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            if (/\.(docx?|pdf|odt|rtf|txt)$/i.test(entry.name)) {
              const matchedCat =
                TEMPLATE_SUBFOLDERS.find((c) =>
                  categoryGuess && categoryGuess.toLowerCase().includes(c.slice(4, 12).toLowerCase())
                ) ||
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
      if (section === 'acervo-pastas' && onChangeSection) {
        onChangeSection('acervo-modelos');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        showToast?.('Não foi possível ler a pasta selecionada.', 'error');
      }
    }
  };

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
          nativeUrl = `${window.location.origin}/api/templates/file?sub=${encodeURIComponent(
            selectedFolder
          )}&file=${encodeURIComponent(selectedFile.name)}`;
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
      if (previewDoc?.isBlob && previewDoc?.url) URL.revokeObjectURL(previewDoc.url);
      const url = URL.createObjectURL(blob);
      setPreviewDoc({ url, name: tpl.fileName, isBlob: true });
      return;
    }

    window.open('https://docs.google.com/document/create', '_blank', 'noopener,noreferrer');
    showToast?.(
      selectedClient
        ? 'Novo Google Docs aberto com a qualificação do cliente copiada!'
        : 'Novo Google Docs aberto! Para abrir um modelo específico direto no Docs, cadastre o link dele.',
      'info'
    );
  };

  const handleOpenInWordLocal = async (tpl) => {
    if (selectedClient) {
      await safeCopyToClipboard(buildClientQualification(selectedClient));
    }

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
          : 'Arquivo baixado! Clique nele para abrir no Microsoft Word.',
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
    <div className="space-y-6 max-w-6xl">
      {/* SUBTÓPICO 1: DADOS & DOCUMENTOS DE CLIENTES */}
      {section === 'acervo-clientes' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-serif-luxury text-gold-gradient">
                Dados & Documentos de Clientes
              </h2>
              <p className="text-sm text-slate-500">
                Consulte qualificação, processos vinculados e visualize documentos anexados para elaborar peças.
              </p>
            </div>
            {selectedClient && (
              <button
                type="button"
                onClick={() => copyValue(buildClientQualification(selectedClient), 'Qualificação completa')}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-sm cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Copiar Qualificação Completa</span>
              </button>
            )}
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Cliente:</span>
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-none"
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
          </div>

          {!selectedClient ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-2 shadow-2xs">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-base font-bold text-slate-800">Nenhum cliente selecionado</p>
              <p className="text-xs text-slate-500">
                Cadastre clientes no menu Clientes (CRM) para consultar seus dados e documentos aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Ficha + Processos */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ficha Cadastral
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-100">
                      <span className="text-slate-400">CPF / CNPJ</span>
                      <button
                        type="button"
                        onClick={() => copyValue(selectedClient.document, 'CPF/CNPJ')}
                        className="font-mono font-semibold text-slate-900 hover:text-amber-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{selectedClient.document || 'Não informado'}</span>
                        {selectedClient.document && <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-100">
                      <span className="text-slate-400">Telefone</span>
                      <span className="font-medium text-slate-700">{selectedClient.phone || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-100">
                      <span className="text-slate-400">E-mail</span>
                      <span className="font-medium text-slate-700 truncate max-w-[210px]">
                        {selectedClient.email || '—'}
                      </span>
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-400 block mb-1">Endereço</span>
                      <p className="text-slate-700 leading-relaxed">{selectedClient.address || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                    <span>Processos Vinculados ({clientCases.length})</span>
                  </h3>
                  {clientCases.length === 0 ? (
                    <p className="text-xs text-slate-400">Nenhum processo vinculado a este cliente.</p>
                  ) : (
                    <div className="space-y-2">
                      {clientCases.map((proc) => (
                        <div
                          key={proc.id}
                          className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs flex items-center justify-between gap-2"
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
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-amber-700 cursor-pointer shrink-0"
                            title="Copiar CNJ"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Documentos + Preview */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Documentos Anexados ({clientDocs.length})</span>
                  </h3>
                  {selectedClient.driveUrl && (
                    <a
                      href={selectedClient.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1"
                    >
                      <span>Abrir Drive do Cliente</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {previewDoc && (
                  <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                    <div className="px-3.5 py-2 bg-slate-950 text-white flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate">{previewDoc.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (previewDoc.isBlob && previewDoc.url) URL.revokeObjectURL(previewDoc.url);
                          setPreviewDoc(null);
                        }}
                        className="text-slate-400 hover:text-white cursor-pointer"
                        aria-label="Fechar preview"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-slate-800 flex items-center justify-center max-h-80 overflow-auto">
                      {isPreviewImage ? (
                        <img src={previewDoc.url} alt={previewDoc.name} className="max-h-72 object-contain" />
                      ) : isPreviewPdf ? (
                        <iframe src={previewDoc.url} title={previewDoc.name} className="w-full h-72 bg-white" />
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-300">
                          Preview inline disponível para PDF e imagens.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {clientDocs.length === 0 ? (
                  <div className="p-10 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    Nenhum documento anexado a este cliente ainda.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientDocs.map((docItem) => (
                      <div
                        key={docItem.id}
                        className="p-3 rounded-xl bg-slate-50/60 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getFileIcon(docItem.fileName)}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{docItem.fileName}</p>
                            <p className="text-[11px] text-slate-500 truncate">{docItem.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePreviewClientDoc(docItem)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-600" />
                            <span>Visualizar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadClientDoc(docItem)}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Baixar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* SUBTÓPICO 2: MODELOS DE PEÇAS (GOOGLE DOCS / WORD LOCAL) */}
      {section === 'acervo-modelos' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-serif-luxury text-gold-gradient">
                Modelos de Peças & Minutas
              </h2>
              <p className="text-sm text-slate-500">
                Organize seus modelos por área e abra direto no Google Docs (online) ou no Word (local).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {selectedClient && (
                <button
                  type="button"
                  onClick={() => copyValue(buildClientQualification(selectedClient), `Qualificação (${selectedClient.name})`)}
                  className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title={`Copiar qualificação de ${selectedClient.name}`}
                >
                  <Copy className="w-3.5 h-3.5 text-amber-600" />
                  <span>Copiar: {selectedClient.name.split(' ')[0]}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAddForm((prev) => !prev)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>{showAddForm ? 'Fechar Cadastro' : 'Adicionar Modelo'}</span>
              </button>
            </div>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddTemplateSubmit}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => setAddMode('file')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      addMode === 'file' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Arquivo Local (.docx/.pdf)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('link')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      addMode === 'link' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Link Google Docs / Drive
                  </button>
                </div>

                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
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
                  className={`p-5 border-2 border-dashed rounded-xl cursor-pointer text-center transition-all ${
                    isDragOver
                      ? 'border-amber-500 bg-amber-50'
                      : selectedFile
                      ? 'border-emerald-500 bg-emerald-50/40'
                      : 'border-slate-300 hover:border-amber-400 bg-slate-50/50'
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="Nome do modelo (ex: Procuração Padrão)"
                    className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs focus:border-amber-500 focus:outline-none"
                  />
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs focus:border-amber-500 focus:outline-none"
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

          {/* Busca e Categorias */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Buscar modelo de peça por nome..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 focus:bg-white border border-slate-200 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {['Todas', ...TEMPLATE_SUBFOLDERS].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
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

          {previewDoc && (
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
              <div className="px-4 py-2.5 bg-slate-950 text-white flex items-center justify-between gap-2">
                <span className="text-xs font-semibold truncate">{previewDoc.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (previewDoc.isBlob && previewDoc.url) URL.revokeObjectURL(previewDoc.url);
                    setPreviewDoc(null);
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-slate-800 flex items-center justify-center max-h-96 overflow-auto">
                {isPreviewImage ? (
                  <img src={previewDoc.url} alt={previewDoc.name} className="max-h-88 object-contain" />
                ) : isPreviewPdf ? (
                  <iframe src={previewDoc.url} title={previewDoc.name} className="w-full h-88 bg-white" />
                ) : null}
              </div>
            </div>
          )}

          {/* Lista de Modelos */}
          {allTemplates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-2 shadow-2xs">
              <FolderPlus className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-base font-bold text-slate-800">Nenhum modelo cadastrado nesta categoria</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Clique em <strong>+ Adicionar Modelo</strong> para enviar arquivos <code>.docx</code>/<code>.pdf</code> ou vincular links do Google Docs, ou carregue sua pasta local em <strong>Pastas (Nuvem & PC)</strong>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-amber-300 shadow-2xs transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      {tpl.url ? <Link2 className="w-4 h-4 text-blue-600" /> : getFileIcon(tpl.fileName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{tpl.title}</p>
                      <p className="text-xs text-slate-500 truncate">{tpl.category}</p>
                    </div>
                    {tpl.source !== 'fs-handle' && onDeleteTemplate && (
                      <button
                        type="button"
                        onClick={() => onDeleteTemplate(tpl.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Excluir modelo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenInGoogleDocs(tpl)}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Google Docs</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenInWordLocal(tpl)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Word Local</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* SUBTÓPICO 3: PASTAS DE ACERVO (NUVEM & PC) */}
      {section === 'acervo-pastas' && (
        <>
          <div>
            <h2 className="text-2xl font-bold font-serif-luxury text-gold-gradient">
              Pastas do Acervo (Nuvem & Computador)
            </h2>
            <p className="text-sm text-slate-500">
              Conecte sua pasta do Google Drive / OneDrive ou vincule a pasta local de modelos do computador.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Pasta Online */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    Online
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pasta de Modelos na Nuvem</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Configure e abra rapidamente o link da sua pasta compartilhada no Google Drive, OneDrive ou Dropbox.
                  </p>
                </div>
                <form onSubmit={handleSaveUrl} className="space-y-2 pt-1">
                  <label className="block text-xs font-semibold text-slate-700">URL da Pasta:</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={driveUrlInput}
                      onChange={(e) => setDriveUrlInput(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </div>

              <button
                type="button"
                onClick={handleOpenOnlineFolder}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Abrir Pasta na Nuvem</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>

            {/* Card Pasta Local */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                    Computador
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pasta Local de Modelos (PC)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Vincule sua pasta <code>LexFlow_Modelos</code> diretamente no navegador (Chrome/Edge) para abrir arquivos no Word sem servidor extra.
                  </p>
                </div>

                {pickedFolderName && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
                    Pasta vinculada: "{pickedFolderName}" ({localPickedFiles.length} arquivos carregados)
                  </div>
                )}

                {hasNativeServer && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="font-semibold text-slate-600 block">Caminho no Windows:</span>
                    <code className="text-[11px] text-slate-800 break-all">{localFolderPath}</code>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {supportsDirectoryPicker && (
                  <button
                    type="button"
                    onClick={handlePickLocalFolder}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4 text-amber-600" />
                    <span>{pickedFolderName ? 'Trocar Pasta Local' : 'Selecionar Pasta (PC)'}</span>
                  </button>
                )}

                {hasNativeServer && (
                  <button
                    type="button"
                    onClick={handleOpenLocalFolder}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <HardDrive className="w-4 h-4 text-amber-600" />
                    <span>Abrir no Windows</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
