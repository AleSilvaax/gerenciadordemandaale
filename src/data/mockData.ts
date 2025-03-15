
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
    avatar: "/lovable-uploads/2e312c47-0298-4854-8d13-f07ec36e7176.png"
  },
  {
    id: "2",
    name: "Hudson",
    avatar: "/lovable-uploads/d17c377b-2186-478e-9ad7-c4992d09fc7b.png"
  },
  {
    id: "3",
    name: "Luiz",
    avatar: "/lovable-uploads/1bdc9d45-f52f-4203-ad83-b9dfc4012386.png"
  },
  {
    id: "4",
    name: "Matheus",
    avatar: "/lovable-uploads/ade02ef5-1423-471b-936c-ced61d8c0bdd.png"
  },
  {
    id: "5",
    name: "Thiago",
    avatar: "/lovable-uploads/726022ec-30b5-413d-be9b-09047cd83dc5.png"
  }
];

// Current user data
export const currentUser = {
  id: "6",
  name: "Christian Paulino",
  avatar: "/lovable-uploads/d17c377b-2186-478e-9ad7-c4992d09fc7b.png",
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
