import React, { useState, useRef, useEffect } from 'react';
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
  BookOpen
} from 'lucide-react';
import {
  openTemplatesFolderInWindows,
  uploadTemplateViaNativeApi,
  getServerStorageInfo
} from '../../services/documentStorage';

const TEMPLATE_SUBFOLDERS = [
  '01. Procurações e Contratos',
  '02. Petições Iniciais',
  '03. Contestações e Defesas',
  '04. Recursos e Agravos',
  '05. Notificações e Acordos'
];

export default function TemplatesModal({
  isOpen,
  onClose,
  hasNativeServer = false,
  modelsDriveUrl,
  setModelsDriveUrl,
  onSaveModelsUrl,
  showToast
}) {
  const [selectedFolder, setSelectedFolder] = useState(TEMPLATE_SUBFOLDERS[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [driveUrlInput, setDriveUrlInput] = useState(modelsDriveUrl || 'https://drive.google.com');
  const [localFolderPath, setLocalFolderPath] = useState('%USERPROFILE%\\LexFlow_Modelos');

  const fileInputRef = useRef(null);

  useEffect(() => {
    setDriveUrlInput(modelsDriveUrl || 'https://drive.google.com');
  }, [modelsDriveUrl, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (hasNativeServer) {
      getServerStorageInfo().then((info) => {
        if (info && info.templatesFolder) {
          setLocalFolderPath(info.templatesFolder);
        }
      });
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, hasNativeServer]);

  if (!isOpen) return null;

  const handleOpenLocalFolder = async () => {
    const success = await openTemplatesFolderInWindows();
    if (success) {
      if (showToast) showToast('Pasta de modelos aberta no Windows Explorer!', 'success');
    } else {
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(localFolderPath);
        } catch (e) {}
      }
      if (showToast) showToast(`Pasta no computador: ${localFolderPath} (caminho copiado)`, 'info');
    }
  };

  const handleCopyPath = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(localFolderPath);
        if (showToast) showToast('Caminho copiado!', 'success');
      } catch (e) {}
    }
  };

  const handleOpenOnline = () => {
    const url = driveUrlInput.trim() || 'https://drive.google.com';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSaveUrl = (e) => {
    e.preventDefault();
    if (setModelsDriveUrl) setModelsDriveUrl(driveUrlInput);
    if (onSaveModelsUrl) onSaveModelsUrl();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  const handleUploadTemplate = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      const res = await uploadTemplateViaNativeApi(selectedFile.name, selectedFile, selectedFolder);
      if (res && res.success) {
        if (showToast) showToast(`Modelo "${selectedFile.name}" salvo em ${selectedFolder}!`, 'success');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else if (showToast) {
        showToast('Servidor local não detectado para gravação física.', 'info');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Erro ao gravar modelo local.', 'error');
    } finally {
      setUploading(false);
    }
  };

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
        aria-labelledby="templates-modal-title"
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="templates-modal-title" className="text-base sm:text-lg font-bold font-serif-luxury text-gold-gradient">
                Modelos de Peças & Minutas
              </h2>
              <p className="text-xs text-slate-500">
                Acesse seu acervo online na nuvem ou sua estrutura organizada de minutas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          <div className={`grid grid-cols-1 ${hasNativeServer ? 'md:grid-cols-2' : ''} gap-4`}>
            {/* Modelos Online */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                    Acervo Online
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">Modelos na Nuvem</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Abra sua pasta compartilhada no <strong>Google Drive</strong>, <strong>OneDrive</strong> ou <strong>Dropbox</strong> com toda a equipe.
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Link da Pasta na Nuvem:</label>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={driveUrlInput}
                      onChange={(e) => setDriveUrlInput(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveUrl}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenOnline}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <span>Acessar Modelos Online</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>

            {/* Modelos Locais (quando servidor local ativo) */}
            {hasNativeServer && (
              <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                      Local Windows
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Documentos Locais</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
                      Pasta física no Windows Explorer com arquivos <strong>.docx</strong> e <strong>.pdf</strong>.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="font-semibold">Localização:</span>
                      <button
                        type="button"
                        onClick={handleCopyPath}
                        className="text-amber-700 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </button>
                    </div>
                    <p className="font-mono text-[11px] text-slate-700 truncate" title={localFolderPath}>
                      {localFolderPath}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenLocalFolder}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-amber-600" />
                  <span>Abrir Pasta no Windows</span>
                </button>
              </div>
            )}
          </div>

          {hasNativeServer && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Adicionar Modelo na Pasta Local
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500">Word (.docx, .doc) ou PDF</span>
              </div>

              <form onSubmit={handleUploadTemplate} className="space-y-3">
                <div
                  onDrop={handleDrop}
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
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-slate-300 hover:border-amber-400 bg-white'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc,.pdf,.odt,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{selectedFile.name}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-700">
                      Arraste seu modelo aqui ou <span className="text-amber-700 underline">clique para selecionar</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700 shrink-0">Subpasta:</label>
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

                  <button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{uploading ? 'Gravando...' : 'Salvar Modelo'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-2xl">
          <p className="text-xs text-slate-500">Categorias sugeridas: Procurações, Iniciais, Defesas, Recursos e Acordos.</p>
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
