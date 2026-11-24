import React from 'react';
import { Copy, Check, History, ExternalLink, FolderOpen, UserCheck, Edit3, Trash2 } from 'lucide-react';

export default function CaseCard({
  proc,
  copiedText,
  onCopyCNJ,
  onOpenTimeline,
  onEditCase,
  onDeleteCase
}) {
  const lastNote = Array.isArray(proc.timeline) && proc.timeline.length > 0 ? proc.timeline[0] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-amber-300 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-2.5 flex-1 min-w-0">
        {/* Linha Superior: CNJ + Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">
              {proc.cnjNumber || 'Sem Número CNJ'}
            </span>
            {proc.cnjNumber && (
              <button
                type="button"
                onClick={() => onCopyCNJ(proc.cnjNumber)}
                className="text-slate-400 hover:text-amber-700 p-0.5 transition-colors cursor-pointer"
                title="Copiar número do processo"
              >
                {copiedText === proc.cnjNumber ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80">
            {proc.area}
          </span>

          <span className="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600">
            Fase: {proc.phase}
          </span>

          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              proc.status === 'Ativo'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : proc.status === 'Suspenso'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {proc.status}
          </span>
        </div>

        {/* Partes e Juízo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 text-sm">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Cliente</span>
            <span className="font-semibold text-slate-900">{proc.clientName}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Parte Contrária</span>
            <span className="font-medium text-slate-700">{proc.opposingParty || 'Não informada'}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Tribunal / Vara / Comarca</span>
            <span className="font-medium text-slate-700">{proc.court || 'Não informado'}</span>
            {(proc.actionValue || proc.value) && (
              <span className="text-[11px] text-amber-900 font-semibold block bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 mt-1 w-fit">
                Valor: {proc.actionValue || proc.value}
              </span>
            )}
          </div>
        </div>

        {/* Último Andamento */}
        {lastNote && (
          <div className="mt-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs text-slate-700 flex items-start gap-2">
            <History className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-slate-900">
                Último andamento ({new Date(lastNote.date).toLocaleDateString('pt-BR')} • {lastNote.author}):{' '}
              </span>
              <span className="text-slate-600">{lastNote.text}</span>
            </div>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex flex-wrap lg:flex-col items-center lg:items-end justify-between gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenTimeline(proc)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span>Histórico ({(proc.timeline || []).length})</span>
          </button>

          {proc.courtUrl && (
            <a
              href={proc.courtUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-all"
              title="Abrir processo no Tribunal"
            >
              <span>Tribunal</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}

          {proc.driveUrl && (
            <a
              href={proc.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-all"
              title="Abrir Pasta de Autos na Nuvem"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Autos</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          {proc.responsible && (
            <span className="text-xs text-slate-500 mr-2 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              {proc.responsible}
            </span>
          )}
          <button
            type="button"
            onClick={() => onEditCase(proc)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Editar Processo"
            aria-label="Editar Processo"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteCase(proc)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Excluir Processo"
            aria-label="Excluir Processo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
