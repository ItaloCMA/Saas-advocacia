import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  X,
  FileText,
  File,
  Image,
  Trash2,
  Paperclip,
  FolderPlus,
  AlertCircle
} from 'lucide-react';
import { formatDocument, formatPhone, isValidDocument } from '../../utils/formatters';

const CATEGORIES = [
  'Procuração Ad Judicia',
  'Documentos Pessoais (RG/CNH/CPF)',
  'Comprovante de Residência',
  'Contrato de Honorários',
  'Comprovantes de Renda / Extratos',
  'Petições & Decisões Judiciais',
  'Provas & Documentos Diversos'
];

function detectCategory(fileName = '') {
  const name = fileName.toLowerCase();
  if (name.includes('cnh') || name.includes('rg') || name.includes('cpf') || name.includes('identidade') || name.includes('documento')) {
    return 'Documentos Pessoais (RG/CNH/CPF)';
  }
  if (name.includes('procuracao') || name.includes('procuração')) {
    return 'Procuração Ad Judicia';
  }
  if (name.includes('residencia') || name.includes('residência') || name.includes('endereco') || name.includes('endereço') || name.includes('comprovante')) {
    return 'Comprovante de Residência';
  }
  if (name.includes('contrato') || name.includes('honorario') || name.includes('honorário')) {
    return 'Contrato de Honorários';
  }
  if (name.includes('renda') || name.includes('extrato') || name.includes('holerite') || name.includes('salario') || name.includes('salário')) {
    return 'Comprovantes de Renda / Extratos';
  }
  return 'Documentos Pessoais (RG/CNH/CPF)';
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(fileName = '') {
  const ext = fileName.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return <FileText className="w-4 h-4 text-rose-600" />;
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return <FileText className="w-4 h-4 text-blue-600" />;
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return <Image className="w-4 h-4 text-emerald-600" />;
  return <File className="w-4 h-4 text-amber-600" />;
}

export default function ClientModal({
  isOpen,
  onClose,
  editingClient,
  hasNativeServer = false,
  existingDocs = [],
  onDeleteExistingDoc,
  onSave
}) {
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docValue, setDocValue] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPendingFiles([]);
      setIsSubmitting(false);
      setDocValue(editingClient?.document || '');

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, editingClient, onClose]);

  if (!isOpen) return null;

  const docDigits = docValue.replace(/\D/g, '');
  const showDocError = docDigits.length > 0 && !isValidDocument(docValue);

  const handleFilesAdded = (filesList) => {
    if (!filesList || filesList.length === 0) return;
    const newItems = Array.from(filesList).map((file) => ({
      id: crypto.randomUUID(),
      file,
      category: detectCategory(file.name),
      note: ''
    }));
    setPendingFiles((prev) => [...prev, ...newItems]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) handleFilesAdded(e.dataTransfer.files);
  };

  const handleRemovePendingFile = (id) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateCategory = (id, newCategory) => {
    setPendingFiles((prev) => prev.map((f) => (f.id === id ? { ...f, category: newCategory } : f)));
  };

  const handleUpdateNote = (id, newNote) => {
    setPendingFiles((prev) => prev.map((f) => (f.id === id ? { ...f, note: newNote } : f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(e, pendingFiles);
    } finally {
      setIsSubmitting(false);
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
        aria-labelledby="client-modal-title"
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 text-slate-800 flex items-center justify-between shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 id="client-modal-title" className="font-bold text-base font-serif-luxury text-gold-gradient">
                {editingClient ? 'Editar Cadastro do Cliente' : 'Novo Cliente (CRM)'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {editingClient
                  ? 'Atualize os dados cadastrais e documentos vinculados'
                  : 'Dados cadastrais e documentação inicial em um único passo'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form key={editingClient?.id || 'new-client'} onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo / Razão Social *
                </label>
                <input
                  name="name"
                  required
                  defaultValue={editingClient?.name || ''}
                  placeholder="Ex: Carlos Eduardo Fontes"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={editingClient?.status || 'Ativo'}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Prospecção">Prospecção</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CPF ou CNPJ</label>
                <input
                  name="document"
                  value={docValue}
                  onChange={(e) => setDocValue(formatDocument(e.target.value))}
                  placeholder="000.000.000-00"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder-slate-400 text-sm font-mono focus:outline-none ${
                    showDocError
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-300 focus:border-amber-500'
                  }`}
                />
                {showDocError && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>CPF/CNPJ incompleto ou inválido</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  name="phone"
                  defaultValue={editingClient?.phone || ''}
                  onChange={(e) => {
                    e.target.value = formatPhone(e.target.value);
                  }}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingClient?.email || ''}
                  placeholder="cliente@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link da Pasta no Drive / OneDrive
                </label>
                <input
                  type="url"
                  name="driveUrl"
                  defaultValue={editingClient?.driveUrl || ''}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço Completo</label>
              <input
                name="address"
                defaultValue={editingClient?.address || ''}
                placeholder="Rua, Número, Bairro, Cidade/UF e CEP"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Observações do Atendimento</label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={editingClient?.notes || ''}
                placeholder="Resumo do atendimento inicial, combinação de honorários, particularidades..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Documentação */}
          <div className="pt-4 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Documentação do Cliente
                </h4>
              </div>
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
              className={`p-4 border-2 border-dashed rounded-xl cursor-pointer text-center transition-all ${
                isDragOver
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-300 hover:border-amber-400 bg-slate-50/60 hover:bg-amber-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFilesAdded(e.target.files)}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <FolderPlus className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-medium">
                  Arraste os documentos aqui ou <strong className="text-amber-800 underline">clique para anexar</strong>
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-1">
                {hasNativeServer
                  ? 'Ao salvar, os arquivos serão gravados no navegador e na pasta local do cliente.'
                  : 'Os arquivos ficam disponíveis no navegador para visualização e download rápido.'}
              </p>
            </div>

            {pendingFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Novos Documentos a Anexar ({pendingFiles.length})
                </p>
                {pendingFiles.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                        {getFileIcon(item.file.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.file.name}</p>
                        <p className="text-[10px] text-slate-500">{formatFileSize(item.file.size)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={item.category}
                        onChange={(e) => handleUpdateCategory(item.id, e.target.value)}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-amber-500 focus:outline-none"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => handleUpdateNote(item.id, e.target.value)}
                        placeholder="Obs..."
                        className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-amber-500 focus:outline-none w-24 sm:w-32 placeholder-slate-400"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemovePendingFile(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remover anexo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingClient && existingDocs.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Documentos Cadastrados ({existingDocs.length})
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {existingDocs.map((docItem) => (
                    <div
                      key={docItem.id}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(docItem.fileName)}
                        <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-xs">
                          {docItem.fileName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                          {docItem.category}
                        </span>
                      </div>
                      {onDeleteExistingDoc && (
                        <button
                          type="button"
                          onClick={() => onDeleteExistingDoc(docItem.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Excluir documento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Salvando...</span>
              ) : (
                <span>
                  {editingClient ? 'Atualizar Cadastro' : 'Salvar Cliente'}
                  {pendingFiles.length > 0 ? ` (+${pendingFiles.length} docs)` : ''}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
