import { collection, addDoc } from 'firebase/firestore';

export const getSampleDataset = () => {
  const today = new Date();
  const formatYMD = (daysOffset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  const client1Id = crypto.randomUUID();
  const client2Id = crypto.randomUUID();
  const client3Id = crypto.randomUUID();

  const clients = [
    {
      id: client1Id,
      name: 'Roberto Almeida Construtora Ltda',
      document: '14.582.901/0001-45',
      phone: '(11) 99812-4450',
      email: 'juridico@almeidaconstrutora.com.br',
      address: 'Av. Paulista, 1578, Conj. 802 - Bela Vista, São Paulo/SP',
      driveUrl: 'https://drive.google.com/drive/my-drive',
      status: 'Ativo',
      notes: 'Cliente corporativo mensalista. Prioridade em demandas contratuais e trabalhistas.',
      createdAt: new Date().toISOString()
    },
    {
      id: client2Id,
      name: 'Mariana Costa Ribeiro',
      document: '389.412.708-19',
      phone: '(31) 98745-2310',
      email: 'mariana.ribeiro@email.com',
      address: 'Rua da Bahia, 1140 - Centro, Belo Horizonte/MG',
      driveUrl: 'https://drive.google.com/drive/my-drive',
      status: 'Ativo',
      notes: 'Ação de indenização cível e inventário familiar em andamento.',
      createdAt: new Date().toISOString()
    },
    {
      id: client3Id,
      name: 'Carlos Eduardo Fontes',
      document: '215.890.334-02',
      phone: '(21) 99123-8876',
      email: 'carlos.fontes@email.com',
      address: 'Rua Voluntários da Pátria, 45 - Botafogo, Rio de Janeiro/RJ',
      driveUrl: 'https://drive.google.com/drive/my-drive',
      status: 'Prospecção',
      notes: 'Aguardando envio de documentação previdenciária (CNIS e laudos) para fechar contrato de honorários.',
      createdAt: new Date().toISOString()
    }
  ];

  const case1Id = crypto.randomUUID();
  const case2Id = crypto.randomUUID();
  const case3Id = crypto.randomUUID();

  const cases = [
    {
      id: case1Id,
      cnjNumber: '1045892-34.2025.8.26.0100',
      clientId: client1Id,
      clientName: clients[0].name,
      opposingParty: 'Fornecedora Aço Forte S/A',
      court: 'TJSP - 14ª Vara Cível do Foro Central',
      area: 'Cível',
      phase: 'Instrução',
      status: 'Ativo',
      responsible: 'Dr. Henrique Silva',
      courtUrl: 'https://esaj.tjsp.jus.br/',
      driveUrl: 'https://drive.google.com/drive/my-drive',
      value: 'R$ 185.000,00',
      timeline: [
        {
          id: crypto.randomUUID(),
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          author: 'Lucas (Estagiário)',
          text: 'Publicado despacho intimando as partes para especificação de provas em 15 dias úteis.'
        },
        {
          id: crypto.randomUUID(),
          date: new Date(Date.now() - 86400000 * 20).toISOString(),
          author: 'Dr. Henrique Silva',
          text: 'Réplica à contestação protocolada tempestivamente sob nº 884920.'
        }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: case2Id,
      cnjNumber: '0010842-77.2025.5.03.0012',
      clientId: client1Id,
      clientName: clients[0].name,
      opposingParty: 'João Marcos Pereira',
      court: 'TRT-3 - 12ª Vara do Trabalho de Belo Horizonte',
      area: 'Trabalhista',
      phase: 'Inicial',
      status: 'Ativo',
      responsible: 'Dr. Henrique Silva',
      courtUrl: 'https://pje.trt3.jus.br/',
      driveUrl: 'https://drive.google.com/drive/my-drive',
      value: 'R$ 42.500,00',
      timeline: [
        {
          id: crypto.randomUUID(),
          date: new Date(Date.now() - 86400000 * 5).toISOString(),
          author: 'Lucas (Estagiário)',
          text: 'Recebida citação inicial. Designada audiência UNA e abertura de prazo para defesa.'
        }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: case3Id,
      cnjNumber: '5019283-11.2024.8.13.0024',
      clientId: client2Id,
      clientName: clients[1].name,
      opposingParty: 'Seguradora Horizonte Brasil S/A',
      court: 'TJMG - 4ª Vara Cível da Comarca de Belo Horizonte',
      area: 'Cível',
      phase: 'Sentença',
      status: 'Ativo',
      responsible: 'Dr. Henrique Silva',
      courtUrl: 'https://pje.tjmg.jus.br/',
      driveUrl: 'https://drive.google.com/drive/my-drive',
      value: 'R$ 95.000,00',
      timeline: [
        {
          id: crypto.randomUUID(),
          date: new Date(Date.now() - 86400000 * 1).toISOString(),
          author: 'Dr. Henrique Silva',
          text: 'Sentença julgada PROCEDENTE condenando a seguradora ao pagamento integral da apólice.'
        }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  const deadlines = [
    {
      id: crypto.randomUUID(),
      title: 'Minutar Petição de Especificação de Provas e Rol de Peritos',
      caseId: case1Id,
      caseCnj: cases[0].cnjNumber,
      clientName: cases[0].clientName,
      dueDate: formatYMD(0), // HOJE
      dueTime: '17:00',
      endTime: '18:00',
      allDay: false,
      type: 'Prazo Fatal',
      priorityLevel: 'Urgente',
      location: 'Portal e-SAJ TJSP - 14ª Vara Cível',
      responsible: 'Dr. Henrique Silva',
      kanbanStage: 'Revisão do Advogado', // Aguardando revisão do advogado!
      minutaUrl: 'https://docs.google.com/document/d/sample-minuta-especificacao-provas/edit',
      protocolCode: '',
      status: 'Pendente',
      notes: 'Minuta concluída pelo estagiário com base no modelo 01. Revisar quesitos de engenharia e assinar com token A3.',
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: 'Redigir Contestação Trabalhista e Juntar Cartões de Ponto',
      caseId: case2Id,
      caseCnj: cases[1].cnjNumber,
      clientName: cases[1].clientName,
      dueDate: formatYMD(3), // Em 3 dias
      dueTime: '18:00',
      endTime: '19:00',
      allDay: false,
      type: 'Prazo Fatal',
      priorityLevel: 'Alta',
      location: 'PJe TRT-3 - 12ª Vara do Trabalho BH',
      responsible: 'Lucas (Estagiário)',
      kanbanStage: 'Em Minuta (Estagiário)', // Estagiário redigindo
      minutaUrl: 'https://docs.google.com/document/d/sample-minuta-contestacao-trabalhista/edit',
      protocolCode: '',
      status: 'Pendente',
      notes: 'Solicitar contracheques e fichas de registro com o RH da construtora antes de finalizar os tópicos de horas extras.',
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: 'Audiência UNA de Instrução e Conciliação Trabalhista',
      caseId: case2Id,
      caseCnj: cases[1].cnjNumber,
      clientName: cases[1].clientName,
      dueDate: formatYMD(5), // Em 5 dias
      dueTime: '14:00',
      endTime: '15:30',
      allDay: false,
      type: 'Audiência',
      priorityLevel: 'Alta',
      location: 'Videoconferência Zoom - Sala Virtual da 12ª Vara do Trabalho BH',
      responsible: 'Dr. Henrique Silva',
      kanbanStage: 'Triagem / A Fazer',
      minutaUrl: '',
      protocolCode: '',
      status: 'Pendente',
      notes: 'Estagiário já enviou link de acesso e orientações de áudio/vídeo para o preposto e testemunhas.',
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: 'Opor Embargos de Declaração (Omissão nos Honorários Sucumbenciais)',
      caseId: case3Id,
      caseCnj: cases[2].cnjNumber,
      clientName: cases[2].clientName,
      dueDate: formatYMD(-1), // Ontem
      dueTime: '17:00',
      endTime: '18:00',
      allDay: false,
      type: 'Prazo Fatal',
      priorityLevel: 'Urgente',
      location: 'PJe TJMG - 4ª Vara Cível de Belo Horizonte',
      responsible: 'Dr. Henrique Silva',
      kanbanStage: 'Protocolado / Concluído',
      minutaUrl: 'https://docs.google.com/document/d/sample-embargos-declaracao/edit',
      protocolCode: 'PJe-TJMG-2026-881920',
      status: 'Concluído',
      notes: 'Peça protocolada e comprovante salvo na pasta do cliente no Drive.',
      createdAt: new Date().toISOString()
    }
  ];

  const documents = [
    {
      id: crypto.randomUUID(),
      clientId: client1Id,
      clientName: 'Roberto Almeida Construtora Ltda',
      fileName: 'Contrato_Social_Consolidado_2025.pdf',
      fileSize: 2458900,
      fileType: 'application/pdf',
      category: 'Documentos Pessoais (RG/CNH/CPF)',
      note: 'Última alteração contratual arquivada na JUCESP',
      diskPath: '%USERPROFILE%\\LexFlow_Clientes\\Roberto Almeida Construtora Ltda\\Contrato_Social_Consolidado_2025.pdf',
      uploadedAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      clientId: client1Id,
      clientName: 'Roberto Almeida Construtora Ltda',
      fileName: 'Procuracao_Ad_Judicia_Almeida.pdf',
      fileSize: 450120,
      fileType: 'application/pdf',
      category: 'Procuração Ad Judicia',
      note: 'Com poderes especiais para transigir e dar quitação',
      diskPath: '%USERPROFILE%\\LexFlow_Clientes\\Roberto Almeida Construtora Ltda\\Procuracao_Ad_Judicia_Almeida.pdf',
      uploadedAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      clientId: client2Id,
      clientName: 'Mariana Costa Ribeiro',
      fileName: 'Documento_RG_Mariana_Costa.pdf',
      fileSize: 852100,
      fileType: 'application/pdf',
      category: 'Documentos Pessoais (RG/CNH/CPF)',
      note: 'Cópia digitalizada frente e verso',
      diskPath: '%USERPROFILE%\\LexFlow_Clientes\\Mariana Costa Ribeiro\\Documento_RG_Mariana_Costa.pdf',
      uploadedAt: new Date().toISOString()
    }
  ];

  return { clients, cases, deadlines, documents };
};

export const seedSampleData = async (db, appId) => {
  const { clients, cases, deadlines } = getSampleDataset();

  if (!db) {
    return { clients, cases, deadlines };
  }

  const createdClients = [];
  for (const c of clients) {
    const { id, ...data } = c;
    const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'clients'), data);
    createdClients.push({ id: docRef.id, ...data });
  }

  const createdCases = [];
  for (let i = 0; i < cases.length; i++) {
    const { id, ...data } = cases[i];
    const clientIndex = i < 2 ? 0 : 1;
    data.clientId = createdClients[clientIndex].id;
    data.clientName = createdClients[clientIndex].name;
    const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'cases'), data);
    createdCases.push({ id: docRef.id, ...data });
  }

  for (let i = 0; i < deadlines.length; i++) {
    const { id, ...data } = deadlines[i];
    if (i < 3) {
      data.caseId = createdCases[i].id;
      data.caseCnj = createdCases[i].cnjNumber;
      data.clientName = createdCases[i].clientName;
    }
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'deadlines'), data);
  }

  return { clients, cases, deadlines };
};
