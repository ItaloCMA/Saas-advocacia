import React from 'react';
import { Edit3, Trash2, Briefcase, FolderOpen, MessageCircle, FileText } from 'lucide-react';
import { getWhatsAppLink, getInitials } from '../../utils/formatters';

export default function ClientCard({
  client,
  linkedCount,
  docsCount = 0,
  onOpenDocuments,
  onEdit,
  onDelete,
  onFilterCases
}) {
  const waLink = getWhatsAppLink(client.phone, client.name);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-amber-300 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 ring-1 ring-amber-400/20">
              {getInitials(client.name)}
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 border ${
                  client.status === 'Ativo'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : client.status === 'Prospecção'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {client.status || 'Ativo'}
              </span>
              <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">{client.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(client)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Editar Cliente"
              aria-label="Editar cliente"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(client)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Excluir Cliente"
              aria-label="Excluir cliente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium">CPF/CNPJ</span>
            <span className="font-mono font-semibold text-slate-800">{client.document || 'Não informado'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium">Telefone</span>
            <span className="font-medium text-slate-700">{client.phone || 'Não informado'}</span>
          </div>
          {client.email && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 font-medium">E-mail</span>
              <span className="truncate max-w-[180px] text-slate-700">{client.email}</span>
            </div>
          )}
        </div>

        {client.notes && <p className="text-xs text-slate-500 line-clamp-2 italic">"{client.notes}"</p>}
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onFilterCases(client.name)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Ver Processos deste Cliente"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
            <span>{linkedCount} Processo(s)</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDocuments && onOpenDocuments(client)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Abrir Central de Documentos"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>Docs {docsCount > 0 ? `(${docsCount})` : ''}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {client.driveUrl && (
            <a
              href={client.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 bg-slate-50 hover:bg-amber-50 border border-slate-200 transition-all"
              title="Abrir Pasta na Nuvem"
            >
              <FolderOpen className="w-4 h-4" />
            </a>
          )}

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-2xs transition-all"
              title="Iniciar conversa no WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
