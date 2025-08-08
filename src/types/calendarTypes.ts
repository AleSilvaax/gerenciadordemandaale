
export interface TechnicianSchedule {
  id: string;
  technician_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
  service_id?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado' | 'pendente';
  technician?: {
    id: string;
    name: string;
  };
  service?: {
    id: string;
    number: string;
    client: string;
  };
  location?: string;
}

export interface CreateScheduleData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  service_id?: string;
  location?: string;
}

export interface UpdateScheduleData extends Partial<CreateScheduleData> {
  status?: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
}
