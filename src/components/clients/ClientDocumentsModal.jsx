import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  File,
  Image,
  FolderOpen,
  Download,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Search,
  HardDrive,
  Eye
} from 'lucide-react';
import {
  uploadViaNativeApi,
  openClientFolderInWindows,
  saveFileToIndexedDB,
  getFileFromIndexedDB,
  getDocumentDownloadUrl
} from '../../services/documentStorage';

const CATEGORIES = [
  'Procuração Ad Judicia',
  'Documentos Pessoais (RG/CNH/CPF)',
  'Comprovante de Residência',
  'Contrato de Honorários',
  'Comprovantes de Renda / Extratos',
  'Petições & Decisões Judiciais',
  'Provas & Documentos Diversos'
];

export default function ClientDocumentsModal({
  isOpen,
  onClose,
  client,
  hasNativeServer = false,
  documents = [],
  onAddDocument,
  onDeleteDocument,
  onRequestConfirm,
  showToast
}) {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [fileNote, setFileNote] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null); // { url, name, type }

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (previewDoc?.isBlob && previewDoc?.url) {
        URL.revokeObjectURL(previewDoc.url);
      }
      setPreviewDoc(null);
      return;
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
  }, [isOpen, onClose, previewDoc]);

  if (!isOpen || !client) return null;

  const clientDocs = documents.filter((d) => d.clientId === client.id);

  const filteredDocs = clientDocs.filter((d) => {
    const matchCategory = filterCategory === 'Todas' || d.category === filterCategory;
    const matchSearch =
      !searchTerm.trim() ||
      d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.note || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  const handleSubmitUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      if (showToast) showToast('Selecione um arquivo para enviar.', 'warning');
      return;
    }

    setUploading(true);
    try {
      const docId = crypto.randomUUID();
      const nativeResult = hasNativeServer
        ? await uploadViaNativeApi(client.name, selectedFile, selectedCategory)
        : null;

      await saveFileToIndexedDB(docId, selectedFile);

      const newDoc = {
        id: docId,
        clientId: client.id,
        clientName: client.name,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || 'application/octet-stream',
        category: selectedCategory,
        note: fileNote.trim(),
        diskPath: nativeResult ? nativeResult.path : null,
        clientFolder: nativeResult ? nativeResult.clientFolder : null,
        uploadedAt: new Date().toISOString()
      };

      onAddDocument(newDoc);

      setSelectedFile(null);
      setFileNote('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (showToast) {
        showToast(
          nativeResult && nativeResult.success
            ? `Documento salvo no sistema e na pasta "${client.name}"!`
            : 'Documento armazenado com sucesso no LexFlow!',
          'success'
        );
      }
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      if (showToast) showToast('Erro ao processar o upload do arquivo.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (docItem) => {
    try {
      const blob = await getFileFromIndexedDB(docItem.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewDoc({
          url,
          name: docItem.fileName,
          type: docItem.fileType || blob.type || '',
          isBlob: true
        });
        return;
      }

      if (hasNativeServer) {
        const nativeUrl = getDocumentDownloadUrl(client.name, docItem.fileName);
        setPreviewDoc({
          url: nativeUrl,
          name: docItem.fileName,
          type: docItem.fileType || '',
          isBlob: false
        });
        return;
      }

      if (showToast) {
        showToast('Arquivo binário disponível apenas no dispositivo onde foi enviado.', 'warning');
      }
    } catch (err) {
      console.error('Erro ao visualizar:', err);
      if (showToast) showToast('Não foi possível abrir a visualização deste arquivo.', 'error');
    }
  };

  const handleDownload = async (docItem) => {
    try {
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

      if (hasNativeServer) {
        window.open(getDocumentDownloadUrl(client.name, docItem.fileName), '_blank', 'noopener,noreferrer');
        return;
      }

      if (showToast) showToast('Arquivo não encontrado no armazenamento local deste navegador.', 'warning');
    } catch (err) {
      console.error('Erro ao baixar:', err);
    }
  };

  const handleOpenFolder = async () => {
    const success = await openClientFolderInWindows(client.name);
    if (success) {
      if (showToast) showToast(`Pasta de "${client.name}" aberta no Windows Explorer!`, 'success');
    } else if (showToast) {
      showToast(`Pasta no computador: LexFlow_Clientes\\${client.name}`, 'info');
    }
  };

  const handleRequestDelete = (docItem) => {
    if (onRequestConfirm) {
      onRequestConfirm({
        type: 'documents',
        id: docItem.id,
        title: docItem.fileName
      });
    } else {
      onDeleteDocument(docItem.id);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName = '') => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return <FileText className="w-5 h-5 text-rose-600" />;
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return <FileText className="w-5 h-5 text-blue-600" />;
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return <Image className="w-5 h-5 text-emerald-600" />;
    return <File className="w-5 h-5 text-amber-600" />;
  };

  const isPreviewableImage = previewDoc && /\.(png|jpe?g|webp|gif)$/i.test(previewDoc.name || '');
  const isPreviewablePdf = previewDoc && /\.pdf$/i.test(previewDoc.name || '');

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-docs-modal-title"
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
      >
        {/* Cabeçalho */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="client-docs-modal-title" className="text-base sm:text-lg font-bold text-slate-900 truncate font-serif-luxury">
                  Documentos & Arquivos
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {clientDocs.length} {clientDocs.length === 1 ? 'arquivo' : 'arquivos'}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Cliente: <strong className="text-slate-800">{client.name}</strong> • CPF/CNPJ:{' '}
                {client.document || 'Não informado'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasNativeServer && (
              <button
                type="button"
                onClick={handleOpenFolder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all cursor-pointer"
                title="Abrir pasta física deste cliente no Windows Explorer"
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Abrir Pasta</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra Informativa */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">
              {hasNativeServer ? (
                <>
                  Pasta local vinculada: <strong className="text-slate-800">LexFlow_Clientes\{client.name}</strong>
                </>
              ) : (
                'Visualização e download instantâneos no navegador (PDF e imagens com preview integrado).'
              )}
            </span>
          </div>
          {client.driveUrl && (
            <a
              href={client.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-800 hover:underline font-semibold shrink-0"
            >
              Abrir Pasta no Drive →
            </a>
          )}
        </div>

        {/* Corpo */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Preview Inline */}
          {previewDoc && (
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
              <div className="px-4 py-2.5 bg-slate-950 text-white flex items-center justify-between gap-3">
                <span className="text-xs font-semibold truncate">{previewDoc.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-amber-400 hover:underline"
                  >
                    Abrir em Nova Aba
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (previewDoc.isBlob && previewDoc.url) URL.revokeObjectURL(previewDoc.url);
                      setPreviewDoc(null);
                    }}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Fechar pré-visualização"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-800 flex items-center justify-center min-h-[280px] max-h-[420px] overflow-auto">
                {isPreviewableImage ? (
                  <img src={previewDoc.url} alt={previewDoc.name} className="max-h-[400px] object-contain" />
                ) : isPreviewablePdf ? (
                  <iframe src={previewDoc.url} title={previewDoc.name} className="w-full h-[400px] bg-white" />
                ) : (
                  <div className="p-8 text-center text-slate-300 space-y-2">
                    <p className="text-xs">Pré-visualização inline disponível para PDFs e imagens.</p>
                    <a
                      href={previewDoc.url}
                      download={previewDoc.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Arquivo</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload */}
          <form onSubmit={handleSubmitUpload} className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>Novo Upload</span>
              </span>
              <span className="text-[11px] text-slate-400">PDF, Word, Imagens</span>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 border-2 border-dashed rounded-xl cursor-pointer text-center transition-all ${
                isDragOver
                  ? 'border-amber-500 bg-amber-50/80'
                  : selectedFile
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-slate-300 hover:border-amber-400 bg-white'
              }`}
            >
              <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)} • Clique para trocar</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-500">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">
                    Arraste o arquivo aqui ou <span className="text-amber-700 underline font-bold">clique para selecionar</span>
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:border-amber-500 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observação (Opcional)</label>
                <input
                  type="text"
                  value={fileNote}
                  onChange={(e) => setFileNote(e.target.value)}
                  placeholder="Ex: Assinado em cartório..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:border-amber-500 focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-2xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>{uploading ? 'Salvando...' : 'Salvar Documento'}</span>
              </button>
            </div>
          </form>

          {/* Listagem */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Documentos Cadastrados</span>
                <span className="text-xs text-slate-500 font-normal">({clientDocs.length})</span>
              </h3>

              {clientDocs.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filtrar arquivos..."
                      className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Todas">Todas as Categorias</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {clientDocs.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200/80">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Nenhum documento anexado ainda</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Use a área acima para enviar procurações, documentos pessoais, contratos ou petições.
                </p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Nenhum arquivo encontrado para os filtros selecionados.
              </p>
            ) : (
              <div className="space-y-2">
                {filteredDocs.map((docItem) => (
                  <div
                    key={docItem.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                        {getFileIcon(docItem.fileName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 truncate">{docItem.fileName}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                            {docItem.category}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{formatFileSize(docItem.fileSize)}</span>
                          <span>•</span>
                          <span>{new Date(docItem.uploadedAt).toLocaleDateString('pt-BR')}</span>
                          {docItem.note && (
                            <>
                              <span>•</span>
                              <span className="italic text-slate-600">"{docItem.note}"</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePreview(docItem)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        title="Visualizar arquivo"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-600" />
                        <span>Visualizar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(docItem)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        title="Baixar arquivo"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Baixar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRequestDelete(docItem)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Excluir documento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 rounded-b-2xl">
          <p className="text-xs text-slate-500">
            Visualização segura de documentos no LexFlow PRO.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
