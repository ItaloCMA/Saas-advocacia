import { collection, doc, setDoc, addDoc } from 'firebase/firestore';

export const exportBackupJSON = (clients, cases, deadlines, documents = []) => {
  const backupObject = {
    app: 'LexFlow CRM & Processos',
    exportedAt: new Date().toISOString(),
    counts: {
      clients: clients.length,
      cases: cases.length,
      deadlines: deadlines.length,
      documents: documents.length
    },
    data: {
      clients,
      cases,
      deadlines,
      documents
    }
  };
  const blob = new Blob([JSON.stringify(backupObject, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStamp = new Date().toISOString().split('T')[0];
  a.setAttribute('download', `lexflow-backup-${dateStamp}.json`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importBackupJSON = async (file, db, appId) => {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const importedClients = parsed?.data?.clients || [];
  const importedCases = parsed?.data?.cases || [];
  const importedDeadlines = parsed?.data?.deadlines || [];
  const importedDocuments = parsed?.data?.documents || [];

  if (db && appId) {
    for (const c of importedClients) {
      const { id, ...rest } = c;
      if (id) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', id), rest);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'clients'), rest);
      }
    }
    for (const proc of importedCases) {
      const { id, ...rest } = proc;
      if (id) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cases', id), rest);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'cases'), rest);
      }
    }
    for (const dl of importedDeadlines) {
      const { id, ...rest } = dl;
      if (id) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'deadlines', id), rest);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'deadlines'), rest);
      }
    }
  }

  return {
    clients: importedClients,
    cases: importedCases,
    deadlines: importedDeadlines,
    documents: importedDocuments,
    clientsCount: importedClients.length,
    casesCount: importedCases.length,
    deadlinesCount: importedDeadlines.length,
    documentsCount: importedDocuments.length
  };
};
