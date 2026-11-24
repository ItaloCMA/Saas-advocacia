import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

import { auth, db, appId, isFirebaseConfigured } from './config/firebase';
import { getDeadlineStatus } from './utils/deadlines';
import { triggerGoogleCalendarWebhook } from './utils/calendar';
import { safeCopyToClipboard, isValidDocument } from './utils/formatters';
import { seedSampleData, getSampleDataset } from './services/sampleData';
import { exportBackupJSON, importBackupJSON } from './services/backup';
import {
  checkNativeApi,
  uploadViaNativeApi,
  saveFileToIndexedDB,
  deleteFileFromIndexedDB,
  fetchServerDb,
  saveServerDb
} from './services/documentStorage';

import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Toast from './components/layout/Toast';
import DeleteConfirmModal from './components/common/DeleteConfirmModal';
import TemplatesModal from './components/common/TemplatesModal';

import DashboardTab from './components/dashboard/DashboardTab';
import ClientsTab from './components/clients/ClientsTab';
import ClientModal from './components/clients/ClientModal';
import ClientDocumentsModal from './components/clients/ClientDocumentsModal';

import CasesTab from './components/cases/CasesTab';
import CaseModal from './components/cases/CaseModal';
import CaseTimelineModal from './components/cases/CaseTimelineModal';

import DeadlinesTab from './components/deadlines/DeadlinesTab';
import DeadlineModal from './components/deadlines/DeadlineModal';
import DeployTab from './components/deploy/DeployTab';

const loadLocal = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveLocal = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Erro ao salvar no localStorage (${key}):`, e);
  }
};

export default function App() {
  const isLocalMode = !isFirebaseConfigured;

  // Estados de Autenticação e Conexão
  const [user, setUser] = useState(isLocalMode ? { uid: 'usuario-local' } : null);
  const [authLoading, setAuthLoading] = useState(!isLocalMode);
  const [dbError, setDbError] = useState(null);
  const [hasNativeServer, setHasNativeServer] = useState(false);

  // Coleções de Dados
  const [clients, setClients] = useState(() => loadLocal('lexflow_clients', []));
  const [cases, setCases] = useState(() => loadLocal('lexflow_cases', []));
  const [deadlines, setDeadlines] = useState(() => loadLocal('lexflow_deadlines', []));
  const [documents, setDocuments] = useState(() => loadLocal('lexflow_documents', []));

  // Configurações
  const [webhookUrl, setWebhookUrl] = useState(() => {
    const s = loadLocal('lexflow_settings', {});
    return s.webhookUrl || '';
  });
  const [autoSyncCalendar, setAutoSyncCalendar] = useState(() => {
    const s = loadLocal('lexflow_settings', {});
    return s.autoSyncCalendar !== false;
  });
  const [modelsDriveUrl, setModelsDriveUrl] = useState(() => {
    const s = loadLocal('lexflow_settings', {});
    return s.modelsDriveUrl || 'https://drive.google.com';
  });
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [importingBackup, setImportingBackup] = useState(false);

  // Navegação, Visualizações e Busca Global
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [copiedText, setCopiedText] = useState(null);

  // Filtros e Modos de Exibição de Clientes
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('Todos');
  const [clientsView, setClientsView] = useState('cards'); // 'cards' | 'table'
  const [clientSort, setClientSort] = useState('name'); // 'name' | 'recent' | 'cases'

  // Filtros e Modos de Exibição de Processos
  const [caseSearch, setCaseSearch] = useState('');
  const [caseStatusFilter, setCaseStatusFilter] = useState('Todos');
  const [caseAreaFilter, setCaseAreaFilter] = useState('Todas');
  const [casesView, setCasesView] = useState('cards'); // 'cards' | 'table'
  const [caseSort, setCaseSort] = useState('recent'); // 'recent' | 'client' | 'area'

  // Filtros de Prazos
  const [deadlineView, setDeadlineView] = useState('kanban');
  const [deadlineFilterType, setDeadlineFilterType] = useState('Todos');
  const [deadlineStageQuickFilter, setDeadlineStageQuickFilter] = useState('Todos');
  const [deadlineResponsibleFilter, setDeadlineResponsibleFilter] = useState('');

  // Modais
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientDocumentsModal, setClientDocumentsModal] = useState(null);

  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);

  const [caseTimelineModal, setCaseTimelineModal] = useState(null);
  const [newTimelineNote, setNewTimelineNote] = useState('');
  const [newTimelineAuthor, setNewTimelineAuthor] = useState('');

  const [deadlineModalOpen, setDeadlineModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [deadlineAllDay, setDeadlineAllDay] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const toastTimerRef = useRef(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  const copyToClipboard = async (text, label = 'Texto') => {
    if (!text) return;
    await safeCopyToClipboard(text);
    setCopiedText(text);
    showToast(`${label} copiado para a área de transferência!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Detecta se há servidor local nativo respondendo (C# ou Vite middleware)
  useEffect(() => {
    checkNativeApi().then((native) => setHasNativeServer(Boolean(native)));
  }, []);

  // 1. Inicialização de Autenticação Firebase (se configurado)
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn('Falha na autenticação do Firebase. Operando em cache local:', err);
        setDbError('Conexão com a nuvem indisponível no momento. Operando com armazenamento local seguro.');
      } finally {
        setAuthLoading(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [isLocalMode]);

  // 2. Sincronização em Tempo Real via Firestore (se conectado)
  useEffect(() => {
    if (!user || !db || isLocalMode) return;

    const clientsRef = collection(db, 'artifacts', appId, 'public', 'data', 'clients');
    const casesRef = collection(db, 'artifacts', appId, 'public', 'data', 'cases');
    const deadlinesRef = collection(db, 'artifacts', appId, 'public', 'data', 'deadlines');
    const documentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'documents');
    const settingsRef = collection(db, 'artifacts', appId, 'public', 'data', 'settings');

    const unsubClients = onSnapshot(
      clientsRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setClients(list);
        saveLocal('lexflow_clients', list);
      },
      (err) => console.warn('Erro ao ler clientes do Firestore:', err)
    );

    const unsubCases = onSnapshot(
      casesRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setCases(list);
        saveLocal('lexflow_cases', list);
      },
      (err) => console.warn('Erro ao ler processos do Firestore:', err)
    );

    const unsubDeadlines = onSnapshot(
      deadlinesRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        list.sort((a, b) => {
          const dateA = `${a.dueDate || '9999-99-99'} ${a.dueTime || '23:59'}`;
          const dateB = `${b.dueDate || '9999-99-99'} ${b.dueTime || '23:59'}`;
          return dateA.localeCompare(dateB);
        });
        setDeadlines(list);
        saveLocal('lexflow_deadlines', list);
      },
      (err) => console.warn('Erro ao ler prazos do Firestore:', err)
    );

    const unsubDocuments = onSnapshot(
      documentsRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        list.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
        setDocuments(list);
        saveLocal('lexflow_documents', list);
      },
      (err) => console.warn('Erro ao ler documentos do Firestore:', err)
    );

    const unsubSettings = onSnapshot(
      settingsRef,
      (snapshot) => {
        const calDoc = snapshot.docs.find((d) => d.id === 'calendar_config');
        if (calDoc) {
          const data = calDoc.data();
          if (data.webhookUrl !== undefined) setWebhookUrl(data.webhookUrl || '');
          if (data.autoSyncCalendar !== undefined) setAutoSyncCalendar(data.autoSyncCalendar !== false);
          if (data.modelsDriveUrl !== undefined) setModelsDriveUrl(data.modelsDriveUrl || 'https://drive.google.com');
          saveLocal('lexflow_settings', data);
        }
      },
      (err) => console.warn('Erro ao ler configurações do Firestore:', err)
    );

    return () => {
      unsubClients();
      unsubCases();
      unsubDeadlines();
      unsubDocuments();
      unsubSettings();
    };
  }, [user, isLocalMode]);

  useEffect(() => {
    if (caseTimelineModal) {
      const updated = cases.find((c) => c.id === caseTimelineModal.id);
      if (updated) setCaseTimelineModal(updated);
    }
  }, [cases, caseTimelineModal]);

  useEffect(() => {
    saveLocal('lexflow_documents', documents);
  }, [documents]);

  // Sincronização opcional com servidor local C#/Vite quando ativo
  const lastKnownServerUpdateRef = useRef(null);

  const pushServerUpdate = async (overrides = {}) => {
    if (!hasNativeServer) return;
    try {
      const payload = {
        clients: overrides.clients !== undefined ? overrides.clients : clients,
        cases: overrides.cases !== undefined ? overrides.cases : cases,
        deadlines: overrides.deadlines !== undefined ? overrides.deadlines : deadlines,
        documents: overrides.documents !== undefined ? overrides.documents : documents,
        settings:
          overrides.settings !== undefined
            ? overrides.settings
            : {
                webhookUrl,
                autoSyncCalendar,
                modelsDriveUrl
              },
        updatedAt: new Date().toISOString()
      };
      lastKnownServerUpdateRef.current = payload.updatedAt;
      await saveServerDb(payload);
    } catch (e) {
      console.warn('Falha ao sincronizar com servidor local:', e);
    }
  };

  useEffect(() => {
    if (!hasNativeServer) return;
    let isMounted = true;

    const pullFromServer = async () => {
      try {
        const serverData = await fetchServerDb();
        if (!isMounted || !serverData) return;

        if (serverData.updatedAt && serverData.updatedAt !== lastKnownServerUpdateRef.current) {
          lastKnownServerUpdateRef.current = serverData.updatedAt;
          if (Array.isArray(serverData.clients)) {
            setClients(serverData.clients);
            saveLocal('lexflow_clients', serverData.clients);
          }
          if (Array.isArray(serverData.cases)) {
            setCases(serverData.cases);
            saveLocal('lexflow_cases', serverData.cases);
          }
          if (Array.isArray(serverData.deadlines)) {
            setDeadlines(serverData.deadlines);
            saveLocal('lexflow_deadlines', serverData.deadlines);
          }
          if (Array.isArray(serverData.documents)) {
            setDocuments(serverData.documents);
            saveLocal('lexflow_documents', serverData.documents);
          }
          if (serverData.settings) {
            if (serverData.settings.webhookUrl !== undefined) setWebhookUrl(serverData.settings.webhookUrl);
            if (serverData.settings.autoSyncCalendar !== undefined) setAutoSyncCalendar(serverData.settings.autoSyncCalendar);
            if (serverData.settings.modelsDriveUrl !== undefined) setModelsDriveUrl(serverData.settings.modelsDriveUrl);
          }
        } else if (!lastKnownServerUpdateRef.current && (!serverData.clients || serverData.clients.length === 0)) {
          const localClients = loadLocal('lexflow_clients', []);
          const localCases = loadLocal('lexflow_cases', []);
          const localDeadlines = loadLocal('lexflow_deadlines', []);
          const localDocs = loadLocal('lexflow_documents', []);
          const localSettings = loadLocal('lexflow_settings', {});
          if (localClients.length > 0 || localCases.length > 0 || localDeadlines.length > 0) {
            const initialPayload = {
              clients: localClients,
              cases: localCases,
              deadlines: localDeadlines,
              documents: localDocs,
              settings: localSettings,
              updatedAt: new Date().toISOString()
            };
            lastKnownServerUpdateRef.current = initialPayload.updatedAt;
            await saveServerDb(initialPayload);
          }
        }
      } catch (e) {}
    };

    pullFromServer();
    const interval = setInterval(pullFromServer, 3500);
    const handleFocus = () => pullFromServer();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [hasNativeServer]);

  // ==========================================
  // OPERAÇÕES DE DADOS
  // ==========================================

  const handleSaveClient = async (e, pendingDocs = []) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const clientName = formData.get('name')?.trim() || '';
    const clientDocument = formData.get('document')?.trim() || '';

    if (!clientName) {
      showToast('Por favor, informe o nome do cliente.', 'error');
      return;
    }

    if (clientDocument && !isValidDocument(clientDocument)) {
      showToast('CPF ou CNPJ inválido. Verifique os dígitos informados.', 'error');
      return;
    }

    const payload = {
      name: clientName,
      document: clientDocument,
      phone: formData.get('phone')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      address: formData.get('address')?.trim() || '',
      driveUrl: formData.get('driveUrl')?.trim() || '',
      status: formData.get('status') || 'Ativo',
      notes: formData.get('notes')?.trim() || '',
      updatedAt: new Date().toISOString()
    };

    try {
      let targetClientId;
      let updatedClients;
      if (editingClient?.id) {
        targetClientId = editingClient.id;
        updatedClients = clients.map((c) => (c.id === editingClient.id ? { ...c, ...payload } : c));
        updatedClients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setClients(updatedClients);
        saveLocal('lexflow_clients', updatedClients);

        if (db && !isLocalMode) {
          const ref = doc(db, 'artifacts', appId, 'public', 'data', 'clients', editingClient.id);
          await setDoc(ref, { ...payload, id: targetClientId }, { merge: true });
        }
      } else {
        targetClientId = crypto.randomUUID();
        const newClient = {
          id: targetClientId,
          ...payload,
          createdAt: new Date().toISOString()
        };
        updatedClients = [...clients, newClient];
        updatedClients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setClients(updatedClients);
        saveLocal('lexflow_clients', updatedClients);

        if (db && !isLocalMode) {
          const ref = doc(db, 'artifacts', appId, 'public', 'data', 'clients', targetClientId);
          await setDoc(ref, newClient);
        }
      }

      let allDocs = documents;
      if (pendingDocs && pendingDocs.length > 0) {
        const uploadedDocs = [];
        for (const item of pendingDocs) {
          const docId = crypto.randomUUID();
          const nativeRes = hasNativeServer ? await uploadViaNativeApi(clientName, item.file, item.category) : null;
          await saveFileToIndexedDB(docId, item.file);

          const docEntry = {
            id: docId,
            clientId: targetClientId,
            clientName: clientName,
            fileName: item.file.name,
            fileSize: item.file.size,
            fileType: item.file.type || 'application/octet-stream',
            category: item.category,
            note: (item.note || '').trim(),
            diskPath: nativeRes ? nativeRes.path : null,
            clientFolder: nativeRes ? nativeRes.clientFolder : null,
            uploadedAt: new Date().toISOString()
          };
          uploadedDocs.push(docEntry);

          if (db && !isLocalMode) {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'documents', docId);
            await setDoc(docRef, docEntry);
          }
        }

        if (uploadedDocs.length > 0) {
          allDocs = [...uploadedDocs, ...documents];
          setDocuments(allDocs);
        }

        showToast(
          editingClient
            ? `Cliente atualizado com ${uploadedDocs.length} documento(s) anexado(s)!`
            : `Cliente cadastrado com ${uploadedDocs.length} documento(s) anexado(s)!`
        );
      } else {
        showToast(editingClient ? 'Cadastro do cliente atualizado!' : 'Novo cliente cadastrado com sucesso!');
      }

      pushServerUpdate({ clients: updatedClients, documents: allDocs });
      setClientModalOpen(false);
      setEditingClient(null);
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar cliente.', 'error');
    }
  };

  const handleSaveCase = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const clientId = formData.get('clientId') || '';
    const selectedClient = clients.find((c) => c.id === clientId);

    const payload = {
      cnjNumber: formData.get('cnjNumber')?.trim() || '',
      clientId,
      clientName: selectedClient
        ? selectedClient.name
        : editingCase?.clientName || formData.get('clientNameFallback') || 'Não vinculado',
      opposingParty: formData.get('opposingParty')?.trim() || '',
      court: formData.get('court')?.trim() || '',
      area: formData.get('area') || 'Cível',
      phase: formData.get('phase') || 'Inicial',
      status: formData.get('status') || 'Ativo',
      responsible: formData.get('responsible')?.trim() || '',
      courtUrl: formData.get('courtUrl')?.trim() || '',
      driveUrl: formData.get('driveUrl')?.trim() || '',
      actionValue: formData.get('actionValue')?.trim() || formData.get('value')?.trim() || editingCase?.actionValue || '',
      value: formData.get('actionValue')?.trim() || formData.get('value')?.trim() || editingCase?.value || '',
      updatedAt: new Date().toISOString()
    };

    if (!payload.cnjNumber) {
      showToast('Por favor, informe o número do processo.', 'error');
      return;
    }

    try {
      let updatedCases;
      if (editingCase?.id) {
        updatedCases = cases.map((c) => (c.id === editingCase.id ? { ...c, ...payload } : c));
        setCases(updatedCases);
        saveLocal('lexflow_cases', updatedCases);

        if (db && !isLocalMode) {
          const ref = doc(db, 'artifacts', appId, 'public', 'data', 'cases', editingCase.id);
          await setDoc(ref, { ...payload, id: editingCase.id }, { merge: true });
        }
        showToast('Dados do processo atualizados!');
      } else {
        const newCaseId = crypto.randomUUID();
        const initialNote = formData.get('initialNote')?.trim();
        const timeline = initialNote
          ? [
              {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                author: payload.responsible || 'Equipe',
                text: initialNote
              }
            ]
          : [];
        const newCase = {
          id: newCaseId,
          ...payload,
          timeline,
          createdAt: new Date().toISOString()
        };
        updatedCases = [newCase, ...cases];
        setCases(updatedCases);
        saveLocal('lexflow_cases', updatedCases);

        if (db && !isLocalMode) {
          const ref = doc(db, 'artifacts', appId, 'public', 'data', 'cases', newCaseId);
          await setDoc(ref, newCase);
        }
        showToast('Processo cadastrado com sucesso!');
      }

      pushServerUpdate({ cases: updatedCases });
      setCaseModalOpen(false);
      setEditingCase(null);
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar processo.', 'error');
    }
  };

  const handleAddTimelineEntry = async (e) => {
    e.preventDefault();
    if (!caseTimelineModal || !newTimelineNote.trim()) return;

    const currentTimeline = Array.isArray(caseTimelineModal.timeline) ? [...caseTimelineModal.timeline] : [];
    const newEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      author: newTimelineAuthor.trim() || caseTimelineModal.responsible || 'Advogado(a)',
      text: newTimelineNote.trim()
    };

    const updatedTimeline = [newEntry, ...currentTimeline];
    const updatedCases = cases.map((c) =>
      c.id === caseTimelineModal.id ? { ...c, timeline: updatedTimeline, updatedAt: new Date().toISOString() } : c
    );
    setCases(updatedCases);
    saveLocal('lexflow_cases', updatedCases);
    pushServerUpdate({ cases: updatedCases });
    setNewTimelineNote('');

    if (db && !isLocalMode) {
      try {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'cases', caseTimelineModal.id);
        await updateDoc(ref, {
          timeline: updatedTimeline,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error(err);
      }
    }
    showToast('Andamento registrado no histórico!');
  };

  const handleDeleteTimelineEntry = async (entryId) => {
    if (!caseTimelineModal) return;
    const updatedTimeline = (caseTimelineModal.timeline || []).filter((item) => item.id !== entryId);
    const updatedCases = cases.map((c) =>
      c.id === caseTimelineModal.id ? { ...c, timeline: updatedTimeline } : c
    );
    setCases(updatedCases);
    saveLocal('lexflow_cases', updatedCases);
    pushServerUpdate({ cases: updatedCases });

    if (db && !isLocalMode) {
      try {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'cases', caseTimelineModal.id);
        await updateDoc(ref, { timeline: updatedTimeline });
      } catch (err) {
        console.error(err);
      }
    }
    showToast('Anotação removida.');
  };

  const handleSaveDeadline = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const caseId = formData.get('caseId') || '';
    const linkedCase = cases.find((c) => c.id === caseId);
    const isAllDay = formData.get('allDay') === 'on';

    const payload = {
      title: formData.get('title')?.trim() || '',
      caseId,
      caseCnj: linkedCase
        ? linkedCase.cnjNumber
        : formData.get('customCnj')?.trim() || editingDeadline?.caseCnj || '',
      clientName: linkedCase
        ? linkedCase.clientName
        : formData.get('customClientName')?.trim() || editingDeadline?.clientName || '',
      dueDate: formData.get('dueDate') || '',
      dueTime: isAllDay ? '00:00' : formData.get('dueTime') || '14:00',
      endTime: isAllDay ? '23:59' : formData.get('endTime') || '15:00',
      allDay: isAllDay,
      type: formData.get('type') || 'Prazo Fatal',
      priorityLevel: formData.get('priorityLevel') || 'Alta',
      location: formData.get('location')?.trim() || '',
      responsible: formData.get('responsible')?.trim() || '',
      kanbanStage: formData.get('kanbanStage') || 'Triagem / A Fazer',
      minutaUrl: formData.get('minutaUrl')?.trim() || '',
      protocolCode: formData.get('protocolCode')?.trim() || '',
      status:
        formData.get('kanbanStage') === 'Protocolado / Concluído' ||
        formData.get('kanbanStage') === 'Concluído'
          ? 'Concluído'
          : 'Pendente',
      notes: formData.get('notes')?.trim() || '',
      updatedAt: new Date().toISOString()
    };

    if (!payload.title) {
      showToast('Por favor, informe o título do compromisso.', 'error');
      return;
    }

    try {
      let updatedDeadlines;
      if (editingDeadline?.id) {
        updatedDeadlines = deadlines.map((d) => (d.id === editingDeadline.id ? { ...d, ...payload } : d));
        setDeadlines(updatedDeadlines);
        saveLocal('lexflow_deadlines', updatedDeadlines);

        if (db && !isLocalMode) {
          const ref = doc(db, 'artifacts', appId, 'public', 'data', 'deadlines', editingDeadline.id);
          await setDoc(ref, { ...payload, id: editingDeadline.id }, { merge: true });
        }
        showToast('Prazo/Compromisso atualizado!');
      } else {
        const newDeadlineId = crypto.randomUUID();
        const newDeadline = {
          id: newDeadlineId,
          ...payload,
          createdAt: new Date().toISOString()
        };
        updatedDeadlines = [newDeadline, ...deadlines];
        setDeadlines(updatedDeadlines);
        saveLocal('lexflow_deadlines', updatedDeadlines);

        if (db && !isLocalMode) {
          const ref = doc(db, 'artifacts', appId, 'public', 'data', 'deadlines', newDeadlineId);
          await setDoc(ref, newDeadline);
        }

        if (webhookUrl.trim() && autoSyncCalendar) {
          await triggerGoogleCalendarWebhook(payload, linkedCase, webhookUrl.trim());
          showToast('Prazo salvo e sincronizado com a Google Agenda!');
        } else {
          showToast('Novo prazo/audiência agendado!');
        }
      }
      pushServerUpdate({ deadlines: updatedDeadlines });
      setDeadlineModalOpen(false);
      setEditingDeadline(null);
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar prazo.', 'error');
    }
  };

  const handleMoveDeadlineStage = async (deadlineItem, newStage) => {
    const isFinished = newStage === 'Protocolado / Concluído' || newStage === 'Concluído';
    const updatedDeadlines = deadlines.map((d) =>
      d.id === deadlineItem.id
        ? {
            ...d,
            kanbanStage: newStage,
            status: isFinished ? 'Concluído' : 'Pendente',
            updatedAt: new Date().toISOString()
          }
        : d
    );
    setDeadlines(updatedDeadlines);
    saveLocal('lexflow_deadlines', updatedDeadlines);
    pushServerUpdate({ deadlines: updatedDeadlines });

    if (db && !isLocalMode) {
      try {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'deadlines', deadlineItem.id);
        await updateDoc(ref, {
          kanbanStage: newStage,
          status: isFinished ? 'Concluído' : 'Pendente',
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error(err);
      }
    }
    showToast(`Movido para "${newStage}"`);
  };

  const handleSaveModelsUrl = () => {
    const s = loadLocal('lexflow_settings', {});
    const updated = { ...s, modelsDriveUrl };
    saveLocal('lexflow_settings', updated);
    pushServerUpdate({ settings: updated });
    if (db && !isLocalMode) {
      try {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'calendar_config');
        setDoc(ref, updated, { merge: true });
      } catch (err) {}
    }
    showToast('Link da pasta de Modelos salvo com sucesso!');
  };

  const handleAddDocument = async (newDoc) => {
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    pushServerUpdate({ documents: updated });
    if (db && !isLocalMode && newDoc?.id) {
      try {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'documents', newDoc.id);
        await setDoc(ref, newDoc);
      } catch (err) {
        console.error('Erro ao salvar documento no Firestore:', err);
      }
    }
  };

  const handleDeleteDocument = async (docId) => {
    await deleteFileFromIndexedDB(docId);
    const updated = documents.filter((d) => d.id !== docId);
    setDocuments(updated);
    pushServerUpdate({ documents: updated });

    if (db && !isLocalMode) {
      try {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'documents', docId);
        await deleteDoc(ref);
      } catch (err) {
        console.error('Erro ao excluir documento no Firestore:', err);
      }
    }
    showToast('Documento removido.');
  };

  // Confirmação unificada (Exclusões e Ações Críticas como Restauração de Backup)
  const confirmDeleteRecord = async () => {
    if (!deleteConfirm) return;
    if (typeof deleteConfirm.onConfirm === 'function') {
      const action = deleteConfirm.onConfirm;
      setDeleteConfirm(null);
      await action();
      return;
    }

    const { type, id } = deleteConfirm;
    if (type === 'documents') {
      await handleDeleteDocument(id);
      setDeleteConfirm(null);
      return;
    }

    if (type === 'clients') {
      const updated = clients.filter((c) => c.id !== id);
      setClients(updated);
      saveLocal('lexflow_clients', updated);
      pushServerUpdate({ clients: updated });
    } else if (type === 'cases') {
      const updated = cases.filter((c) => c.id !== id);
      setCases(updated);
      saveLocal('lexflow_cases', updated);
      pushServerUpdate({ cases: updated });
    } else if (type === 'deadlines') {
      const updated = deadlines.filter((d) => d.id !== id);
      setDeadlines(updated);
      saveLocal('lexflow_deadlines', updated);
      pushServerUpdate({ deadlines: updated });
    }

    if (db && !isLocalMode) {
      try {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', type, id);
        await deleteDoc(ref);
      } catch (err) {
        console.error(err);
      }
    }

    showToast('Registro excluído com sucesso.');
    setDeleteConfirm(null);
  };

  const handleSaveWebhookSettings = async (e) => {
    e.preventDefault();
    const existing = loadLocal('lexflow_settings', {});
    const settingsPayload = {
      ...existing,
      webhookUrl: webhookUrl.trim(),
      autoSyncCalendar,
      modelsDriveUrl,
      updatedAt: new Date().toISOString()
    };
    saveLocal('lexflow_settings', settingsPayload);
    pushServerUpdate({ settings: settingsPayload });

    if (db && !isLocalMode) {
      try {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'calendar_config');
        await setDoc(ref, settingsPayload, { merge: true });
      } catch (err) {
        console.error(err);
      }
    }
    showToast('Configurações da Google Agenda salvas!');
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      showToast('Cole a URL do Google Apps Script antes de testar.', 'error');
      return;
    }
    setTestingWebhook(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const sampleItem = {
      title: 'Teste de Integração Automática LexFlow',
      type: 'Audiência',
      priorityLevel: 'Alta',
      clientName: 'Escritório LexFlow Advocacia',
      caseCnj: '0000000-00.2025.8.26.0100',
      dueDate: todayStr,
      dueTime: '15:00',
      endTime: '16:00',
      allDay: false,
      location: 'Google Meet / Sala Virtual do Escritório',
      responsible: 'Equipe Jurídica',
      notes: 'Evento de teste disparado automaticamente pelo sistema LexFlow.'
    };
    const ok = await triggerGoogleCalendarWebhook(sampleItem, null, webhookUrl.trim());
    setTestingWebhook(false);
    if (ok) {
      showToast('Evento de teste enviado! Verifique sua Google Agenda em alguns segundos.');
    } else {
      showToast('Falha ao disparar teste. Verifique a URL do script.', 'error');
    }
  };

  const handleLoadSampleData = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      if (isLocalMode || !db) {
        const sample = getSampleDataset();
        setClients(sample.clients);
        setCases(sample.cases);
        setDeadlines(sample.deadlines);
        if (sample.documents) {
          setDocuments(sample.documents);
          saveLocal('lexflow_documents', sample.documents);
        }
        saveLocal('lexflow_clients', sample.clients);
        saveLocal('lexflow_cases', sample.cases);
        saveLocal('lexflow_deadlines', sample.deadlines);
        pushServerUpdate({
          clients: sample.clients,
          cases: sample.cases,
          deadlines: sample.deadlines,
          documents: sample.documents || []
        });
      } else {
        await seedSampleData(db, appId);
      }
      showToast('Dados de demonstração carregados com sucesso!');
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar dados de exemplo.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleExportBackup = () => {
    exportBackupJSON(clients, cases, deadlines, documents);
    showToast('Backup JSON completo exportado com sucesso!');
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingBackup(true);
    try {
      const res = await importBackupJSON(file, isLocalMode ? null : db, appId);
      if (res.clients) {
        setClients(res.clients);
        saveLocal('lexflow_clients', res.clients);
      }
      if (res.cases) {
        setCases(res.cases);
        saveLocal('lexflow_cases', res.cases);
      }
      if (res.deadlines) {
        setDeadlines(res.deadlines);
        saveLocal('lexflow_deadlines', res.deadlines);
      }
      if (res.documents) {
        setDocuments(res.documents);
        saveLocal('lexflow_documents', res.documents);
      }
      pushServerUpdate({
        clients: res.clients || clients,
        cases: res.cases || cases,
        deadlines: res.deadlines || deadlines,
        documents: res.documents || documents
      });
      showToast(
        `Backup restaurado (${res.clientsCount} clientes, ${res.casesCount} processos, ${res.deadlinesCount} prazos, ${res.documentsCount || 0} documentos)!`
      );
    } catch (err) {
      console.error(err);
      showToast('Arquivo de backup inválido ou corrompido.', 'error');
    } finally {
      setImportingBackup(false);
      e.target.value = '';
    }
  };

  // ==========================================
  // VALORES COMPUTADOS
  // ==========================================
  const stats = useMemo(() => {
    const activeClients = clients.filter((c) => c.status === 'Ativo').length;
    const activeCases = cases.filter((c) => c.status === 'Ativo').length;

    let overdueOrToday = 0;
    let next7Days = 0;

    deadlines.forEach((d) => {
      if (d.status === 'Concluído' || d.kanbanStage === 'Protocolado / Concluído' || d.kanbanStage === 'Concluído') return;
      const st = getDeadlineStatus(d.dueDate, d.dueTime, d.status);
      if (st.isOverdue || st.isToday) overdueOrToday++;
      if (st.isNext7Days && !st.isOverdue) next7Days++;
    });

    return { activeClients, activeCases, overdueOrToday, next7Days };
  }, [clients, cases, deadlines]);

  const criticalDeadlines = useMemo(() => {
    return deadlines
      .filter((d) => d.status !== 'Concluído' && d.kanbanStage !== 'Protocolado / Concluído' && d.kanbanStage !== 'Concluído')
      .map((d) => ({ ...d, computedStatus: getDeadlineStatus(d.dueDate, d.dueTime, d.status) }))
      .sort((a, b) => {
        if (a.computedStatus.priority !== b.computedStatus.priority) {
          return a.computedStatus.priority - b.computedStatus.priority;
        }
        return (a.dueDate || '').localeCompare(b.dueDate || '');
      });
  }, [deadlines]);

  const globalSearchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return null;

    const matchedClients = clients.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.document || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
    );

    const matchedCases = cases.filter(
      (c) =>
        (c.cnjNumber || '').toLowerCase().includes(q) ||
        (c.clientName || '').toLowerCase().includes(q) ||
        (c.opposingParty || '').toLowerCase().includes(q) ||
        (c.court || '').toLowerCase().includes(q)
    );

    return { matchedClients, matchedCases };
  }, [globalSearch, clients, cases]);

  const caseCountByClient = useMemo(() => {
    const counts = {};
    cases.forEach((c) => {
      if (c.clientId) counts[c.clientId] = (counts[c.clientId] || 0) + 1;
    });
    return counts;
  }, [cases]);

  const docsCountByClient = useMemo(() => {
    const counts = {};
    documents.forEach((d) => {
      if (d.clientId) counts[d.clientId] = (counts[d.clientId] || 0) + 1;
    });
    return counts;
  }, [documents]);

  const filteredClients = useMemo(() => {
    const list = clients.filter((c) => {
      const q = clientSearch.toLowerCase();
      const matchSearch =
        !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.document || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q);
      const matchStatus = clientStatusFilter === 'Todos' || c.status === clientStatusFilter;
      return matchSearch && matchStatus;
    });

    return [...list].sort((a, b) => {
      if (clientSort === 'recent') {
        return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
      }
      if (clientSort === 'cases') {
        return (caseCountByClient[b.id] || 0) - (caseCountByClient[a.id] || 0);
      }
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [clients, clientSearch, clientStatusFilter, clientSort, caseCountByClient]);

  const filteredCases = useMemo(() => {
    const list = cases.filter((c) => {
      const q = caseSearch.toLowerCase();
      const matchSearch =
        !q ||
        (c.cnjNumber || '').toLowerCase().includes(q) ||
        (c.clientName || '').toLowerCase().includes(q) ||
        (c.opposingParty || '').toLowerCase().includes(q) ||
        (c.court || '').toLowerCase().includes(q) ||
        (c.responsible || '').toLowerCase().includes(q);
      const matchStatus = caseStatusFilter === 'Todos' || c.status === caseStatusFilter;
      const matchArea = caseAreaFilter === 'Todas' || c.area === caseAreaFilter;
      return matchSearch && matchStatus && matchArea;
    });

    return [...list].sort((a, b) => {
      if (caseSort === 'client') {
        return (a.clientName || '').localeCompare(b.clientName || '');
      }
      if (caseSort === 'area') {
        return (a.area || '').localeCompare(b.area || '');
      }
      return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
    });
  }, [cases, caseSearch, caseStatusFilter, caseAreaFilter, caseSort]);

  const filteredDeadlines = useMemo(() => {
    return deadlines
      .map((d) => ({ ...d, computedStatus: getDeadlineStatus(d.dueDate, d.dueTime, d.status) }))
      .filter((d) => {
        const normStage =
          d.kanbanStage === 'A Fazer'
            ? 'Triagem / A Fazer'
            : d.kanbanStage === 'Em Andamento'
            ? 'Em Minuta (Estagiário)'
            : d.kanbanStage === 'Concluído'
            ? 'Protocolado / Concluído'
            : d.kanbanStage || 'Triagem / A Fazer';

        let matchQuick = true;
        if (deadlineStageQuickFilter === 'Revisao') {
          matchQuick = normStage === 'Revisão do Advogado';
        } else if (deadlineStageQuickFilter === 'Minuta') {
          matchQuick = normStage === 'Em Minuta (Estagiário)';
        } else if (deadlineStageQuickFilter === 'Hoje') {
          matchQuick = d.computedStatus.isToday || d.computedStatus.isOverdue;
        } else if (deadlineStageQuickFilter === 'Protocolado') {
          matchQuick = normStage === 'Protocolado / Concluído';
        }

        const matchType = deadlineFilterType === 'Todos' || d.type === deadlineFilterType;
        const matchResp =
          !deadlineResponsibleFilter.trim() ||
          (d.responsible || '').toLowerCase().includes(deadlineResponsibleFilter.toLowerCase()) ||
          (d.title || '').toLowerCase().includes(deadlineResponsibleFilter.toLowerCase()) ||
          (d.clientName || '').toLowerCase().includes(deadlineResponsibleFilter.toLowerCase());

        return matchQuick && matchType && matchResp;
      });
  }, [deadlines, deadlineFilterType, deadlineStageQuickFilter, deadlineResponsibleFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clientsCount={clients.length}
        casesCount={cases.length}
        overdueOrTodayCount={stats.overdueOrToday}
        isLocalMode={isLocalMode}
        hasNativeServer={hasNativeServer}
        onOpenTemplatesModal={() => setTemplatesModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          globalSearchResults={globalSearchResults}
          setActiveTab={setActiveTab}
          setClientSearch={setClientSearch}
          setCaseSearch={setCaseSearch}
          criticalDeadlines={criticalDeadlines}
          isLocalMode={isLocalMode}
          hasNativeServer={hasNativeServer}
          authLoading={authLoading}
          onOpenNewClient={() => {
            setEditingClient(null);
            setClientModalOpen(true);
          }}
          onOpenNewCase={() => {
            setEditingCase(null);
            setCaseModalOpen(true);
          }}
          onOpenNewDeadline={() => {
            setEditingDeadline(null);
            setDeadlineAllDay(false);
            setDeadlineModalOpen(true);
          }}
        />

        {dbError && (
          <div className="mx-4 md:mx-8 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between shadow-2xs">
            <span>{dbError}</span>
            <button onClick={() => setDbError(null)} className="underline font-semibold hover:text-amber-950 cursor-pointer">
              Dispensar
            </button>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6 pb-24 md:pb-10">
          {activeTab === 'dashboard' && (
            <DashboardTab
              stats={stats}
              clients={clients}
              cases={cases}
              criticalDeadlines={criticalDeadlines}
              seeding={seeding}
              onLoadSampleData={handleLoadSampleData}
              onNavigate={setActiveTab}
              onOpenTimeline={setCaseTimelineModal}
              onConcludeDeadline={(item) => handleMoveDeadlineStage(item, 'Protocolado / Concluído')}
              onEditDeadline={(item) => {
                setEditingDeadline(item);
                setDeadlineAllDay(Boolean(item.allDay));
                setDeadlineModalOpen(true);
              }}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsTab
              clients={clients}
              filteredClients={filteredClients}
              clientSearch={clientSearch}
              setClientSearch={setClientSearch}
              clientStatusFilter={clientStatusFilter}
              setClientStatusFilter={setClientStatusFilter}
              clientsView={clientsView}
              setClientsView={setClientsView}
              clientSort={clientSort}
              setClientSort={setClientSort}
              caseCountByClient={caseCountByClient}
              docsCountByClient={docsCountByClient}
              onOpenDocuments={setClientDocumentsModal}
              onOpenNewClient={() => {
                setEditingClient(null);
                setClientModalOpen(true);
              }}
              onEditClient={(client) => {
                setEditingClient(client);
                setClientModalOpen(true);
              }}
              onDeleteClient={(client) => {
                setDeleteConfirm({
                  type: 'clients',
                  id: client.id,
                  title: client.name
                });
              }}
              onFilterCases={(clientName) => {
                setActiveTab('cases');
                setCaseSearch(clientName);
              }}
            />
          )}

          {activeTab === 'cases' && (
            <CasesTab
              cases={cases}
              filteredCases={filteredCases}
              caseSearch={caseSearch}
              setCaseSearch={setCaseSearch}
              caseAreaFilter={caseAreaFilter}
              setCaseAreaFilter={setCaseAreaFilter}
              caseStatusFilter={caseStatusFilter}
              setCaseStatusFilter={setCaseStatusFilter}
              casesView={casesView}
              setCasesView={setCasesView}
              caseSort={caseSort}
              setCaseSort={setCaseSort}
              copiedText={copiedText}
              onCopyCNJ={(cnj) => copyToClipboard(cnj, 'Número CNJ')}
              onOpenNewCase={() => {
                setEditingCase(null);
                setCaseModalOpen(true);
              }}
              onOpenTimeline={setCaseTimelineModal}
              onEditCase={(proc) => {
                setEditingCase(proc);
                setCaseModalOpen(true);
              }}
              onDeleteCase={(proc) => {
                setDeleteConfirm({
                  type: 'cases',
                  id: proc.id,
                  title: `Processo ${proc.cnjNumber}`
                });
              }}
            />
          )}

          {activeTab === 'deadlines' && (
            <DeadlinesTab
              deadlineView={deadlineView}
              setDeadlineView={setDeadlineView}
              deadlineFilterType={deadlineFilterType}
              setDeadlineFilterType={setDeadlineFilterType}
              deadlineStageQuickFilter={deadlineStageQuickFilter}
              setDeadlineStageQuickFilter={setDeadlineStageQuickFilter}
              deadlineResponsibleFilter={deadlineResponsibleFilter}
              setDeadlineResponsibleFilter={setDeadlineResponsibleFilter}
              filteredDeadlines={filteredDeadlines}
              cases={cases}
              webhookUrl={webhookUrl}
              autoSyncCalendar={autoSyncCalendar}
              onOpenDeployTab={() => setActiveTab('deploy')}
              onOpenNewDeadline={() => {
                setEditingDeadline(null);
                setDeadlineAllDay(false);
                setDeadlineModalOpen(true);
              }}
              onEditDeadline={(item) => {
                setEditingDeadline(item);
                setDeadlineAllDay(Boolean(item.allDay));
                setDeadlineModalOpen(true);
              }}
              onDeleteDeadline={(item) => {
                setDeleteConfirm({
                  type: 'deadlines',
                  id: item.id,
                  title: item.title
                });
              }}
              onMoveStage={handleMoveDeadlineStage}
              showToast={showToast}
            />
          )}

          {activeTab === 'deploy' && (
            <DeployTab
              isLocalMode={isLocalMode}
              hasNativeServer={hasNativeServer}
              webhookUrl={webhookUrl}
              setWebhookUrl={setWebhookUrl}
              autoSyncCalendar={autoSyncCalendar}
              setAutoSyncCalendar={setAutoSyncCalendar}
              modelsDriveUrl={modelsDriveUrl}
              setModelsDriveUrl={setModelsDriveUrl}
              onSaveModelsUrl={handleSaveModelsUrl}
              testingWebhook={testingWebhook}
              importingBackup={importingBackup}
              onSaveWebhookSettings={handleSaveWebhookSettings}
              onTestWebhook={handleTestWebhook}
              onExportBackupJSON={handleExportBackup}
              onImportBackupJSON={handleImportBackup}
              onRequestConfirm={setDeleteConfirm}
              copyToClipboard={copyToClipboard}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Modais Globais */}
      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => {
          setClientModalOpen(false);
          setEditingClient(null);
        }}
        editingClient={editingClient}
        hasNativeServer={hasNativeServer}
        existingDocs={editingClient ? documents.filter((d) => d.clientId === editingClient.id) : []}
        onDeleteExistingDoc={handleDeleteDocument}
        onSave={handleSaveClient}
      />

      <CaseModal
        isOpen={caseModalOpen}
        onClose={() => {
          setCaseModalOpen(false);
          setEditingCase(null);
        }}
        editingCase={editingCase}
        clients={clients}
        onSave={handleSaveCase}
      />

      <CaseTimelineModal
        caseTimelineModal={caseTimelineModal}
        onClose={() => setCaseTimelineModal(null)}
        newTimelineAuthor={newTimelineAuthor}
        setNewTimelineAuthor={setNewTimelineAuthor}
        newTimelineNote={newTimelineNote}
        setNewTimelineNote={setNewTimelineNote}
        onAddTimelineEntry={handleAddTimelineEntry}
        onDeleteTimelineEntry={handleDeleteTimelineEntry}
      />

      <DeadlineModal
        isOpen={deadlineModalOpen}
        onClose={() => {
          setDeadlineModalOpen(false);
          setEditingDeadline(null);
        }}
        editingDeadline={editingDeadline}
        cases={cases}
        deadlineAllDay={deadlineAllDay}
        setDeadlineAllDay={setDeadlineAllDay}
        onSave={handleSaveDeadline}
      />

      <DeleteConfirmModal
        deleteConfirm={deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={confirmDeleteRecord}
      />

      <ClientDocumentsModal
        isOpen={Boolean(clientDocumentsModal)}
        client={clientDocumentsModal}
        hasNativeServer={hasNativeServer}
        onClose={() => setClientDocumentsModal(null)}
        documents={documents}
        onAddDocument={handleAddDocument}
        onDeleteDocument={handleDeleteDocument}
        onRequestConfirm={setDeleteConfirm}
        showToast={showToast}
      />

      <TemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        hasNativeServer={hasNativeServer}
        modelsDriveUrl={modelsDriveUrl}
        setModelsDriveUrl={setModelsDriveUrl}
        onSaveModelsUrl={handleSaveModelsUrl}
        showToast={showToast}
      />
    </div>
  );
}
