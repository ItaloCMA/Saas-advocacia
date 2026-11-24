import React, { useState, useEffect } from 'react';
import { Briefcase, X, Copy, Check } from 'lucide-react';
import { formatCNJ, safeCopyToClipboard } from '../../utils/formatters';

export default function CaseModal({ isOpen, onClose, editingCase, clients, onSave }) {
  const [copiedFolderName, setCopiedFolderName] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyFolderName = async (e) => {
    e.preventDefault();
    const form = e.target.closest('form');
    const cnj = form?.querySelector('[name="cnjNumber"]')?.value || editingCase?.cnjNumber || '0000000-00.0000.0.00.0000';
    const clientId = form?.querySelector('[name="clientId"]')?.value;
    const selectedClient = clients.find(c => c.id === clientId) || { name: editingCase?.clientName || 'Cliente' };
    
    // Padrão sugerido: Sobrenome, Nome - Nº do Processo
    const parts = (selectedClient.name || '').trim().split(' ');
    let formattedName = selectedClient.name;
    if (parts.length > 1) {
      const lastName = parts[parts.length - 1];
      const firstNames = parts.slice(0, parts.length - 1).join(' ');
      formattedName = `${lastName}, ${firstNames}`;
    }
    const folderPattern = `${formattedName} - ${cnj}`;
    await safeCopyToClipboard(folderPattern);
    setCopiedFolderName(true);
    setTimeout(() => setCopiedFolderName(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-modal-title"
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8 animate-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 bg-white border-b border-slate-100 text-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 id="case-modal-title" className="font-bold text-base font-serif-luxury text-gold-gradient">
              {editingCase ? 'Editar Processo Judicial' : 'Cadastrar Novo Processo'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form key={editingCase?.id || 'new-case'} onSubmit={onSave} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Número do Processo (Padrão CNJ) *</label>
              <input
                name="cnjNumber"
                required
                defaultValue={editingCase?.cnjNumber || ''}
                onChange={(e) => {
                  e.target.value = formatCNJ(e.target.value);
                }}
                placeholder="0000000-00.0000.0.00.0000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-amber-900 placeholder-slate-400 text-sm font-mono focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tribunal / Vara / Comarca *</label>
              <input
                name="court"
                required
                defaultValue={editingCase?.court || ''}
                placeholder="Ex: TJSP - 2ª Vara Cível de Campinas"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente Vinculado *</label>
              <select
                name="clientId"
                defaultValue={editingCase?.clientId || ''}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="">-- Selecione um cliente cadastrado --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.document || 'Sem documento'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Parte Contrária (Réu / Autor Adverso)</label>
              <input
                name="opposingParty"
                defaultValue={editingCase?.opposingParty || ''}
                placeholder="Ex: Banco Nacional S/A"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Área do Direito</label>
              <select
                name="area"
                defaultValue={editingCase?.area || 'Cível'}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="Cível">Cível</option>
                <option value="Trabalhista">Trabalhista</option>
                <option value="Previdenciário">Previdenciário</option>
                <option value="Família">Família</option>
                <option value="Criminal">Criminal</option>
                <option value="Tributário">Tributário</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fase Processual</label>
              <select
                name="phase"
                defaultValue={editingCase?.phase || 'Inicial'}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="Inicial">Inicial / Conhecimento</option>
                <option value="Instrução">Instrução Probatória</option>
                <option value="Sentença">Sentença / Julgamento</option>
                <option value="Recurso">Fase Recursal (2º Grau / Tribunais)</option>
                <option value="Execução">Cumprimento de Sentença / Execução</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status do Processo</label>
              <select
                name="status"
                defaultValue={editingCase?.status || 'Ativo'}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="Ativo">Ativo</option>
                <option value="Suspenso">Suspenso / Sobrestado</option>
                <option value="Arquivado">Arquivado</option>
                <option value="Encerrado">Encerrado / Transitado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Advogado(a) Responsável</label>
              <input
                name="responsible"
                defaultValue={editingCase?.responsible || ''}
                placeholder="Ex: Dr. Henrique Silva"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Valor da Causa (Opcional)</label>
              <input
                name="actionValue"
                defaultValue={editingCase?.actionValue || editingCase?.value || ''}
                placeholder="Ex: R$ 45.000,00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Link no Tribunal (PJe / e-SAJ / Projudi)</label>
              <input
                type="url"
                name="courtUrl"
                defaultValue={editingCase?.courtUrl || ''}
                placeholder="https://pje.tjmg.jus.br/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Pasta de Autos no Drive</label>
                <button
                  type="button"
                  onClick={handleCopyFolderName}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
                  title="Copia o padrão: [Sobrenome, Nome] - [Nº CNJ]"
                >
                  {copiedFolderName ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedFolderName ? 'Padrão Copiado!' : 'Copiar Padrão da Pasta'}</span>
                </button>
              </div>
              <input
                type="url"
                name="driveUrl"
                defaultValue={editingCase?.driveUrl || ''}
                placeholder="https://drive.google.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Padrão recomendado: <code>Sobrenome, Nome - Nº CNJ</code>
              </span>
            </div>
          </div>

          {!editingCase && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Anotação Inicial de Andamento (Opcional)</label>
              <textarea
                name="initialNote"
                rows={2}
                placeholder="Ex: Petição inicial distribuída pelo estagiário com pedido de tutela de urgência..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer"
            >
              Salvar Processo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
