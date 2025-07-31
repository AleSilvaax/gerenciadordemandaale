// Arquivo: src/data/mockData.ts (Dados simulados para demonstração)

export const teamMembers = [
  {
    id: "1",
    name: "Alessandro Santos",
    avatar: "",
    role: "tecnico" as const,
    email: "alessandro@exemplo.com",
    phone: "(11) 98765-4321",
    signature: ""
  },
  {
    id: "2", 
    name: "Maria Silva",
    avatar: "",
    role: "tecnico" as const,
    email: "maria@exemplo.com",
    phone: "(11) 99876-5432",
    signature: ""
  },
  {
    id: "3",
    name: "João Oliveira", 
    avatar: "",
    role: "tecnico" as const,
    email: "joao@exemplo.com",
    phone: "(11) 97654-3210",
    signature: ""
  },
  {
    id: "4",
    name: "Ana Costa",
    avatar: "",
    role: "administrador" as const,
    email: "ana@exemplo.com", 
    phone: "(11) 96543-2109",
    signature: ""
  },
  {
    id: "5",
    name: "Pedro Santos",
    avatar: "",
    role: "gestor" as const,
    email: "pedro@exemplo.com",
    phone: "(11) 95432-1098",
    signature: ""
  }
];

const adminUser = {
  id: "4",
  name: "Ana Costa",
  avatar: "",
  role: "gestor"
};

export const services = [
  {
    id: "6430",
    title: "Vistoria Pedro Penacchione",
    status: "concluido" as const,
    location: "Av. Airton Pretini",
    technicians: [teamMembers[0]],
    priority: "media" as const,
    dueDate: "2025-04-10",
    creationDate: "2025-03-28",
    reportData: {
      client: "Pedro Penacchione",
      address: "Av. Airton Pretini, 123",
      city: "São Paulo",
      executedBy: "Alessandro",
      servicePhase: "inspection" as const,
      installationDate: "2025-03-28",
      modelNumber: "FIMER FLEX 7.4",
      serialNumberNew: "AB123456",
      serialNumberOld: "",
      homologatedName: "FIMER FLEX 7.4",
      compliesWithNBR17019: true,
      homologatedInstallation: true,
      requiredAdjustment: false,
      adjustmentDescription: "",
      validWarranty: true,
      circuitBreakerEntry: "25A",
      chargerCircuitBreaker: "20A",
      cableGauge: "4mm²",
      chargerStatus: "Funcionando",
      technicalComments: "Instalação em conformidade com as normas técnicas.",
      inspectionDate: "2025-03-28",
      voltage: "220V",
      supplyType: "Bifásico",
      installationDistance: "15m",
      installationObstacles: "Nenhum",
      existingPanel: true,
      panelType: "Disjuntor",
      panelAmps: "63A",
      groundingSystem: "TN-S",
      chargerLoad: "7.4kW",
      wallboxBrand: "FIMER",
      wallboxPower: "7.4kW",
      powerSupplyType: "Bifásico",
      phaseAmperage: "32A",
      cableSection: "4mm²",
      energyMeter: true,
      needsInfrastructure: false,
      artNumber: "ART123456",
      projectNumber: "PROJ2025001",
      installationTime: "4 horas",
      daysCount: "1",
      clientRepresentative: "Pedro Penacchione",
      greenCableLength: "15m",
      blackCableLength: "15m",
      ppCableLength: "15m",
      breakerDetails: "Disjuntor 25A",
      drDetails: "DR 30mA",
      dpsDetails: "DPS Classe II",
      conduitType: "Eletroduto rígido",
      hasGroundingSystem: true,
      groundingDetails: "Haste de aterramento 2,5m",
      earthBarrierDetails: "Barramento de terra",
      neutralBarrierDetails: "Barramento de neutro",
      voltageBetweenPhases: "220V",
      voltageBetweenPhaseAndNeutral: "127V",
      hasThreePhase: false,
      hasMainBreaker: true,
      hasDps: true,
      distanceToPanelAndCharger: "15m",
      conduitInstallationType: "Embutido",
      chargerPositionAgreed: true,
      externalInstallation: false,
      needsScaffolding: false,
      needsTechnicalHole: false,
      needsMasonry: false,
      needsWallPainting: false,
      needsConduitPainting: false,
      needsArtEmission: true,
      needsAdditionalDocumentation: false,
      hasWifiOrCellSignal: true,
      workingHours: "08:00 - 17:00",
      mainBreakerPhoto: "/lovable-uploads/bd3b11fc-9a17-4507-b28b-d47cf1678ad8.png",
      electricalPanelPhoto: "/lovable-uploads/86cd5924-e313-4335-8a20-13c65aedd078.png",
      infraAreaPhoto: "/lovable-uploads/4efdaad5-6ec2-44d7-9128-ce9b043b4377.png",
      chargerLocationPhoto: "/lovable-uploads/a333754c-948f-42e3-b154-d1468a519a75.png",
      clientName: "Pedro Penacchione",
      clientSignature: ""
    },
    photos: [
      "/lovable-uploads/bd3b11fc-9a17-4507-b28b-d47cf1678ad8.png",
      "/lovable-uploads/86cd5924-e313-4335-8a20-13c65aedd078.png",
      "/lovable-uploads/4efdaad5-6ec2-44d7-9128-ce9b043b4377.png",
      "/lovable-uploads/a333754c-948f-42e3-b154-d1468a519a75.png"
    ],
    signatures: {
      client: "",
      technician: ""
    }
  },
  {
    id: "6431",
    title: "Vistoria Pedro Penacchione",
    status: "pendente" as const,
    location: "Av. Airton Pretini",
    technicians: [teamMembers[0]],
    priority: "alta" as const,
    dueDate: "2025-04-15",
    creationDate: "2025-03-30"
  },
  {
    id: "6432",
    title: "Vistoria Luan de Jesus",
    status: "cancelado" as const,
    location: "Av. Airton Pretini",
    technicians: [teamMembers[2]],
    priority: "baixa" as const,
    dueDate: "2025-04-20",
    creationDate: "2025-03-25"
  },
  {
    id: "6433",
    title: "Vistoria Pedro Penacchione",
    status: "concluido" as const,
    location: "Av. Airton Pretini",
    technicians: [teamMembers[0]],
    priority: "media" as const,
    dueDate: "2025-04-05",
    creationDate: "2025-03-20"
  },
  {
    id: "6434",
    title: "Vistoria Luan de Jesus",
    status: "pendente" as const,
    location: "Av. Airton Pretini",
    technicians: [teamMembers[1]],
    priority: "urgente" as const,
    dueDate: "2025-04-07",
    creationDate: "2025-04-01"
  },
  {
    id: "6435",
    title: "Vistoria Luan de Jesus",
    status: "cancelado" as const,
    location: "Av. Airton Pretini",
    technicians: [teamMembers[2]],
    priority: "media" as const,
    dueDate: "2025-04-12",
    creationDate: "2025-03-15"
  },
  {
    id: "6436",
    title: "Vistoria Pedro Penacchione",
    status: "concluido" as const,
    location: "Av. Airton Pretini",
    technicians: [teamMembers[0]],
    priority: "baixa" as const,
    dueDate: "2025-03-30",
    creationDate: "2025-03-10"
  },
  {
    id: "6437",
    title: "Vistoria Luan de Jesus",
    status: "pendente" as const,
    location: "Av. Airton Pretini",
    technicians: [teamMembers[1]],
    priority: "alta" as const,
    dueDate: "2025-04-18",
    creationDate: "2025-03-28"
  },
  {
    id: "6438",
    title: "Vistoria Luan de Jesus",
    status: "cancelado" as const,
    location: "Av. Airton Pretini",
    technicians: [teamMembers[2]],
    priority: "urgente" as const,
    dueDate: "2025-04-03",
    creationDate: "2025-03-29"
  }
];

export const stats = {
  total: 243,
  completed: 143,
  pending: 89,
  cancelled: 11
};

export const chartData = [
  { name: "Concluídos", value: 143 },
  { name: "Pendentes", value: 89 },
  { name: "Cancelados", value: 11 }
];

export const technicianStats = [
  { name: "Alessandro Santos", completed: 45, pending: 12 },
  { name: "Maria Silva", completed: 38, pending: 15 },
  { name: "João Oliveira", completed: 60, pending: 8 }
];

export const monthlyData = [
  { month: "Jan", completed: 12, pending: 8 },
  { month: "Fev", completed: 15, pending: 10 },
  { month: "Mar", completed: 18, pending: 12 },
  { month: "Abr", completed: 22, pending: 15 },
  { month: "Mai", completed: 25, pending: 18 },
  { month: "Jun", completed: 28, pending: 20 }
];