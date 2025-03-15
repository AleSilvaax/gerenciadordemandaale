
export type ServiceStatus = "concluido" | "pendente" | "cancelado";

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
}

export interface Service {
  id: string;
  title: string;
  status: ServiceStatus;
  location: string;
  technician: TeamMember;
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
    avatar: "/lovable-uploads/9d2cadff-bdb9-4bc9-ae7b-570abad8e23d.png"
  },
  {
    id: "2",
    name: "Hudson",
    avatar: "/lovable-uploads/5cb696cc-6e38-4576-9018-37b9404a8b1e.png"
  },
  {
    id: "3",
    name: "Luiz",
    avatar: "/lovable-uploads/0171b2a3-44de-458d-bd3d-3e1206f82be7.png"
  },
  {
    id: "4",
    name: "Matheus",
    avatar: "/lovable-uploads/6d2887c4-21be-4d34-a140-0ec123066762.png"
  },
  {
    id: "5",
    name: "Thiago",
    avatar: "/lovable-uploads/2a36603c-4739-42fa-a6ca-3491cc8fe0b5.png"
  }
];

// Current user data
export const currentUser = {
  id: "6",
  name: "Christian Paulino",
  avatar: "/lovable-uploads/e6b9037e-cd6c-4f3d-8020-7963c71e941f.png",
  role: "Coordenador de projetos"
};

// Services data
export const services: Service[] = [
  {
    id: "6430",
    title: "Vistoria Pedro Penacchione",
    status: "concluido",
    location: "Av. Airton Pretini",
    technician: teamMembers[0]
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
