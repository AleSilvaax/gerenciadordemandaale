export type ServiceStatus = "concluido" | "pendente" | "cancelado";
export type UserRole = "tecnico" | "administrador" | "gestor";

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role?: UserRole;
}

export interface Service {
  id: string;
  title: string;
  status: ServiceStatus;
  location: string;
  technician: TeamMember;
  reportData?: ReportData;
  photos?: string[];
}

export interface ReportData {
  client?: string;
  address?: string;
  city?: string;
  executedBy?: string;
  servicePhase?: "inspection" | "installation";
  installationDate?: string;
  modelNumber?: string;
  serialNumberNew?: string;
  serialNumberOld?: string;
  homologatedName?: string;
  compliesWithNBR17019?: boolean;
  homologatedInstallation?: boolean;
  requiredAdjustment?: boolean;
  adjustmentDescription?: string;
  validWarranty?: boolean;
  circuitBreakerEntry?: string;
  chargerCircuitBreaker?: string;
  cableGauge?: string;
  chargerStatus?: string;
  technicalComments?: string;
  inspectionDate?: string;
  voltage?: string;
  supplyType?: string;
  installationDistance?: string;
  installationObstacles?: string;
  existingPanel?: boolean;
  panelType?: string;
  panelAmps?: string;
  groundingSystem?: string;
  chargerLoad?: string;
}

export interface StatData {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
}

export interface ChartData {
  name: string;
  value: number;
}

// Team members data
export const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Alessandro",
    avatar: "/lovable-uploads/2e312c47-0298-4854-8d13-f07ec36e7176.png",
    role: "tecnico"
  },
  {
    id: "2",
    name: "Hudson",
    avatar: "/lovable-uploads/86cd5924-e313-4335-8a20-13c65aedd078.png",
    role: "tecnico"
  },
  {
    id: "3",
    name: "Luiz",
    avatar: "/lovable-uploads/ade02ef5-1423-471b-936c-ced61d8c0bdd.png",
    role: "tecnico"
  },
  {
    id: "4",
    name: "Matheus",
    avatar: "/lovable-uploads/373df2cb-1338-42cc-aebf-c1ce0a83b032.png",
    role: "tecnico"
  },
  {
    id: "5",
    name: "Thiago",
    avatar: "/lovable-uploads/d17c377b-2186-478e-9ad7-c4992d09fc7b.png",
    role: "administrador"
  }
];

// Current user data
export const currentUser = {
  id: "6",
  name: "Christian Paulino",
  avatar: "/lovable-uploads/b58598a4-1c9d-4b38-a808-fb9627d2c39e.png",
  role: "gestor"
};

// Services data with report data
export const services: Service[] = [
  {
    id: "6430",
    title: "Vistoria Pedro Penacchione",
    status: "concluido",
    location: "Av. Airton Pretini",
    technician: teamMembers[0],
    reportData: {
      client: "Pedro Penacchione",
      address: "Av. Airton Pretini, 123",
      city: "São Paulo",
      executedBy: "Alessandro",
      servicePhase: "inspection",
      installationDate: "15/05/2023",
      modelNumber: "EVA007KI/XSTO",
      serialNumberNew: "",
      serialNumberOld: "050447A7MR51840167",
      homologatedName: "BYD",
      compliesWithNBR17019: true,
      homologatedInstallation: true,
      requiredAdjustment: false,
      adjustmentDescription: "",
      validWarranty: true,
      circuitBreakerEntry: "50",
      chargerCircuitBreaker: "32",
      cableGauge: "10mm²",
      chargerStatus: "Carregador apenas acende o Led Branco e não carrega",
      technicalComments: "Necessário substituição do carregador",
      inspectionDate: "15/05/2023",
      voltage: "220V",
      supplyType: "AC",
      installationDistance: "10m",
      installationObstacles: "Nenhum",
      existingPanel: true,
      panelType: "Panel Type",
      panelAmps: "10A",
      groundingSystem: "Grounding System",
      chargerLoad: "10A"
    },
    photos: [
      "/lovable-uploads/bd3b11fc-9a17-4507-b28b-d47cf1678ad8.png",
      "/lovable-uploads/86cd5924-e313-4335-8a20-13c65aedd078.png",
      "/lovable-uploads/4efdaad5-6ec2-44d7-9128-ce9b043b4377.png",
      "/lovable-uploads/a333754c-948f-42e3-b154-d1468a519a75.png"
    ]
  },
  {
    id: "6431",
    title: "Vistoria Pedro Penacchione",
    status: "pendente",
    location: "Av. Airton Pretini",
    technician: teamMembers[0]
  },
  {
    id: "6432",
    title: "Vistoria Luan de Jesus",
    status: "cancelado",
    location: "Av. Airton Pretini",
    technician: teamMembers[2]
  },
  {
    id: "6433",
    title: "Vistoria Pedro Penacchione",
    status: "concluido",
    location: "Av. Airton Pretini",
    technician: teamMembers[0]
  },
  {
    id: "6434",
    title: "Vistoria Luan de Jesus",
    status: "pendente",
    location: "Av. Airton Pretini",
    technician: teamMembers[1]
  },
  {
    id: "6435",
    title: "Vistoria Luan de Jesus",
    status: "cancelado",
    location: "Av. Airton Pretini",
    technician: teamMembers[2]
  },
  {
    id: "6436",
    title: "Vistoria Pedro Penacchione",
    status: "concluido",
    location: "Av. Airton Pretini",
    technician: teamMembers[0]
  },
  {
    id: "6437",
    title: "Vistoria Luan de Jesus",
    status: "pendente",
    location: "Av. Airton Pretini",
    technician: teamMembers[1]
  },
  {
    id: "6438",
    title: "Vistoria Luan de Jesus",
    status: "cancelado",
    location: "Av. Airton Pretini",
    technician: teamMembers[2]
  }
];

// Stats data
export const stats: StatData = {
  total: 243,
  completed: 143,
  pending: 80,
  cancelled: 20
};

// Monthly chart data
export const monthlyData: ChartData[] = [
  { name: "Jan", value: 20 },
  { name: "Fev", value: 40 },
  { name: "Mar", value: 15 },
  { name: "Abr", value: 35 },
  { name: "Mai", value: 50 },
  { name: "Jun", value: 74 }
];

// Team performance data
export const teamPerformance = [
  { name: "Hudson", color: "#ef4444" },
  { name: "Thiago", color: "#3b82f6" },
  { name: "Alessandro", color: "#a855f7" },
  { name: "Luiz", color: "#6366f1" }
];

// Additional chart data for statistics
export const weeklyData: ChartData[] = [
  { name: "Seg", value: 5 },
  { name: "Ter", value: 12 },
  { name: "Qua", value: 8 },
  { name: "Qui", value: 15 },
  { name: "Sex", value: 10 },
  { name: "Sáb", value: 4 },
  { name: "Dom", value: 0 }
];

export const serviceTypeData = [
  { name: "Instalação", value: 45 },
  { name: "Manutenção", value: 30 },
  { name: "Reparo", value: 15 },
  { name: "Vistoria", value: 10 }
];

export const regionData = [
  { name: "Norte", value: 20 },
  { name: "Sul", value: 35 },
  { name: "Leste", value: 25 },
  { name: "Oeste", value: 20 }
];
