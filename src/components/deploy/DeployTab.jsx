import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CalendarPlus,
  Send,
  Copy,
  Database,
  Download,
  Upload,
  Wifi,
  Smartphone,
  FolderOpen,
  HardDrive,
  Clock,
  History,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  Cloud,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../../config/googleAppsScript';
import {
  openRootFolderInWindows,
  getServerStorageInfo,
  getNetworkServerInfo,
  getBackupsList,
  createManualBackup,
  restoreBackupPoint
} from '../../services/documentStorage';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatBackupDate(isoOrDateStr) {
  if (!isoOrDateStr) return 'Recente';
  try {
    const d = new Date(isoOrDateStr);
    if (isNaN(d.getTime())) return isoOrDateStr;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return isoOrDateStr;
  }
}

export default function DeployTab({
  isLocalMode,
  hasNativeServer,
  webhookUrl,
  setWebhookUrl,
  autoSyncCalendar,
  setAutoSyncCalendar,
  modelsDriveUrl,
  setModelsDriveUrl,
  onSaveModelsUrl,
  testingWebhook,
  importingBackup,
  onSaveWebhookSettings,
  onTestWebhook,
  onExportBackupJSON,
  onImportBackupJSON,
  onRequestConfirm,
  copyToClipboard,
  showToast
}) {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [backupsData, setBackupsData] = useState(null);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringFile, setRestoringFile] = useState(null);
  const [showLocalSection, setShowLocalSection] = useState(Boolean(hasNativeServer));

  const fetchBackups = async () => {
    if (!hasNativeServer) return;
    const res = await getBackupsList();
    if (res) setBackupsData(res);
  };

  useEffect(() => {
    setShowLocalSection(Boolean(hasNativeServer));
    if (!hasNativeServer) return;

    getNetworkServerInfo().then((info) => {
      if (info) setNetworkInfo(info);
    });
    fetchBackups();

    const interval = setInterval(fetchBackups, 30000);
    return () => clearInterval(interval);
  }, [hasNativeServer]);

  const handleCreateBackupNow = async () => {
    setCreatingBackup(true);
    const res = await createManualBackup();
    setCreatingBackup(false);
    if (res.success) {
      if (showToast) showToast('Ponto de restauração criado com sucesso!', 'success');
      fetchBackups();
    } else {
      if (showToast) showToast('Não foi possível gerar o backup agora.', 'error');
    }
  };

  const executeRestoreBackup = async (fileName) => {
    setRestoringFile(fileName);
    const res = await restoreBackupPoint(fileName);
    setRestoringFile(null);

    if (res.success) {
      if (showToast) showToast(`Dados restaurados a partir de ${fileName}! Atualizando...`, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      if (showToast) showToast('Falha ao restaurar ponto de backup.', 'error');
    }
  };

  const handleRestoreBackup = (fileName) => {
    if (onRequestConfirm) {
      onRequestConfirm({
        variant: 'warning',
        heading: 'Restaurar Ponto de Backup',
        subtitle: 'Uma cópia de segurança do estado atual será salva antes.',
        confirmLabel: 'Confirmar Restauração',
        description: `Deseja restaurar todos os dados do sistema para o snapshot "${fileName}"?`,
        onConfirm: () => executeRestoreBackup(fileName)
      });
    } else {
      executeRestoreBackup(fileName);
    }
  };

  const serverPort = networkInfo?.port || 8080;
  const primaryIp =
    networkInfo?.networkIps && networkInfo.networkIps.length > 0
      ? networkInfo.networkIps[0]
      : '192.168.1.100';
  const localNetworkUrl = `http://${primaryIp}:${serverPort}`;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Banner Principal Online-First */}
      <div className="bg-white text-slate-800 p-6 md:p-7 rounded-2xl shadow-2xs border border-slate-200/80 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold uppercase tracking-wider">
          <Cloud className="w-3.5 h-3.5 text-amber-600" />
          <span>Cloud, Agenda & Segurança de Dados</span>
        </div>
        <h2 className="text-2xl font-bold font-serif-luxury text-gold-gradient">
          Central Online, Sincronização & Backups
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-3xl">
          Gerencie o status da nuvem, a integração automática com a Google Agenda, o link do acervo online e a exportação/importação integral dos dados do escritório em arquivo <code>.JSON</code>.
        </p>

        {/* Status Cards Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Sincronização em Nuvem
            </span>
            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  !isLocalMode ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>{!isLocalMode ? 'Firebase Cloud Ativo' : 'Cache Local (Sem .env Cloud)'}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Google Agenda
            </span>
            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2
                className={`w-4 h-4 ${
                  webhookUrl.trim() && autoSyncCalendar ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span>{webhookUrl.trim() && autoSyncCalendar ? 'Webhook Ativo' : 'Modo 1-Clique Manual'}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Armazenamento Offline
            </span>
            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>LocalStorage + IndexedDB</span>
            </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO A: INTEGRAÇÃO GOOGLE AGENDA & MODELOS ONLINE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-amber-600 flex items-center justify-center shrink-0">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Sincronização com Google Agenda (Webhook)</h3>
              <p className="text-xs text-slate-500">
                Lança automaticamente prazos e audiências com lembretes de 48h (e-mail) e 2h (pop-up).
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border self-start sm:self-center ${
              webhookUrl.trim() && autoSyncCalendar
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {webhookUrl.trim() && autoSyncCalendar ? 'Sincronização Ativa' : 'Modo Manual'}
          </span>
        </div>

        <form onSubmit={onSaveWebhookSettings} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL do App da Web (Google Apps Script)
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm font-mono focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                Salvar URL
              </button>
              <button
                type="button"
                onClick={onTestWebhook}
                disabled={testingWebhook}
                className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-amber-600" />
                <span>{testingWebhook ? 'Testando...' : 'Testar'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoSyncCalendar"
              checked={autoSyncCalendar}
              onChange={(e) => setAutoSyncCalendar(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="autoSyncCalendar" className="text-xs text-slate-700 font-medium cursor-pointer">
              Sincronizar prazos e audiências com o Google Calendar automaticamente ao salvar
            </label>
          </div>
        </form>

        {/* Link da Pasta de Modelos Online */}
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Link da Pasta de Modelos de Peças na Nuvem (Google Drive / OneDrive)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={modelsDriveUrl}
              onChange={(e) => setModelsDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={onSaveModelsUrl}
              className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              Salvar Link da Pasta
            </button>
          </div>
        </div>

        {/* Código Google Apps Script */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Código Google Apps Script (lembretes automáticos de 48h e 2h):
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard && copyToClipboard(GOOGLE_APPS_SCRIPT_CODE, 'Código Google Apps Script')}
              className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-amber-600" />
              <span>Copiar Código</span>
            </button>
          </div>
          <pre className="bg-slate-900 text-amber-300 p-3.5 rounded-xl text-xs font-mono border border-slate-800 overflow-x-auto">
            {GOOGLE_APPS_SCRIPT_CODE}
          </pre>
        </div>
      </div>

      {/* SEÇÃO B: BACKUP MANUAL INTEGRAL (.JSON) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Database className="w-5 h-5 text-amber-600" />
            <span>Exportação / Importação Integral (.JSON)</span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Exporte todos os clientes, processos, prazos e metadados em arquivo único JSON para backup externo ou migração entre ambientes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExportBackupJSON}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Exportar (.JSON)</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer border border-slate-200 transition-all">
            <Upload className="w-4 h-4 text-amber-600" />
            <span>{importingBackup ? 'Restaurando...' : 'Importar (.JSON)'}</span>
            <input type="file" accept=".json,application/json" onChange={onImportBackupJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* SEÇÃO C (SECUNDÁRIA / COLAPSÁVEL): MODO HÍBRIDO LOCAL WINDOWS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowLocalSection((prev) => !prev)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Modo Híbrido Local (Servidor Windows, Rede LAN & Snapshots em Disco)
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    hasNativeServer
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {hasNativeServer ? 'Detectado' : 'Opcional'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Recursos para uso via servidor portátil C# no escritório (pastas no Windows Explorer, Tailscale e snapshots locais).
              </p>
            </div>
          </div>
          {showLocalSection ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {showLocalSection && (
          <div className="p-6 pt-2 border-t border-slate-100 space-y-6">
            {!hasNativeServer && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Você está acessando a versão web padrão. Os recursos abaixo ficam ativos automaticamente quando o sistema é executado através do servidor local do escritório.
              </div>
            )}

            {/* Backups em disco */}
            {hasNativeServer && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-600" />
                      <span>Snapshots Automáticos em Disco (7 dias)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      {backupsData?.totalBackups || 0} snapshot(s) disponíveis •{' '}
                      <code>{backupsData?.backupsFolder || 'LexFlow_Dados\\Backups'}</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchBackups}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer"
                      title="Atualizar lista"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateBackupNow}
                      disabled={creatingBackup}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{creatingBackup ? 'Gerando...' : 'Criar Snapshot Agora'}</span>
                    </button>
                  </div>
                </div>

                {backupsData?.backups?.length > 0 && (
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                    {backupsData.backups.slice(0, 12).map((b, idx) => (
                      <div
                        key={b.fileName}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate font-mono">{b.fileName}</p>
                          <p className="text-[11px] text-slate-500">
                            {formatBackupDate(b.lastModified || b.createdAt)} • {formatBytes(b.fileSize)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRestoreBackup(b.fileName)}
                          disabled={restoringFile === b.fileName}
                          className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer self-end sm:self-auto"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-600" />
                          <span>{restoringFile === b.fileName ? 'Restaurando...' : 'Restaurar'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rede Local + Tailscale + Pastas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-amber-600" />
                    <span>Rede Local (Porta {serverPort})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard && copyToClipboard(localNetworkUrl, 'Link da Rede Local')}
                    className="text-amber-800 hover:underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </button>
                </div>
                <div className="font-mono text-xs bg-white p-2 rounded-lg border border-slate-200 text-center select-all text-slate-800">
                  {localNetworkUrl}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    <span>VPN Tailscale (Acesso Externo)</span>
                  </span>
                  <a
                    href="https://tailscale.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:underline text-xs font-semibold"
                  >
                    tailscale.com
                  </a>
                </div>
                <div className="font-mono text-xs bg-white p-2 rounded-lg border border-slate-200 text-center text-slate-700">
                  http://[IP-TAILSCALE]:{serverPort}
                </div>
              </div>
            </div>

            {hasNativeServer && (
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800">Pasta Central no Windows Explorer</p>
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    {networkInfo?.documentsFolder || '%USERPROFILE%\\LexFlow_Clientes'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await openRootFolderInWindows();
                    if (!ok && copyToClipboard) {
                      const info = await getServerStorageInfo();
                      copyToClipboard(info?.documentsFolder || '%USERPROFILE%\\LexFlow_Clientes', 'Caminho');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-amber-600" />
                  <span>Abrir Pasta</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
