
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Service, TeamMember } from '@/types/serviceTypes';

interface StatisticsCardsProps {
  services: Service[];
  teamMembers: TeamMember[];
  className?: string;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ services, teamMembers, className }) => {
  // Log para depuração, garantir que sempre vemos quantos dados chegam
  React.useEffect(() => {
    console.log('[StatisticsCards] Dados recebidos - services:', services?.length, 'teamMembers:', teamMembers?.length);
  }, [services, teamMembers]);

  // Service status statistics
  const statusData = React.useMemo(() => {
    // Garantir sempre array válido
    const pendente = services?.filter(s => s.status === 'pendente').length || 0;
    const concluido = services?.filter(s => s.status === 'concluido').length || 0;
    const cancelado = services?.filter(s => s.status === 'cancelado').length || 0;
    return [
      { name: 'Pendentes', value: pendente, color: '#f59e0b' },
      { name: 'Concluídos', value: concluido, color: '#10b981' },
      { name: 'Cancelados', value: cancelado, color: '#ef4444' }
    ];
  }, [services]);

  // Service type statistics
  const typeData = React.useMemo(() => {
    if (!Array.isArray(services)) return [];
    const types = services.reduce((acc, service) => {
      // usa apenas serviceType (certo em nosso model)
      const type = service.serviceType ?? 'outros';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const typeColors = {
      Vistoria: '#8b5cf6',
      Instalação: '#ec4899',
      Manutenção: '#6366f1',
      outros: '#64748b'
    };
    return Object.entries(types).map(([type, count]) => ({
      name: type,
      value: count,
      color: typeColors[type as keyof typeof typeColors] || '#64748b'
    }));
  }, [services]);

  // Service priority statistics
  const priorityData = React.useMemo(() => {
    if (!Array.isArray(services)) return [];
    const priorities = services.reduce((acc, service) => {
      const priority = service.priority || 'media';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const priorityColors = {
      baixa: '#3b82f6',
      media: '#f59e0b',
      alta: '#f97316',
      urgente: '#ef4444'
    };
    const priorityOrder = ['baixa', 'media', 'alta', 'urgente'];
    return priorityOrder.map(priority => ({
      name: priority === 'baixa' ? 'Baixa' :
            priority === 'media' ? 'Média' :
            priority === 'alta' ? 'Alta' : 'Urgente',
      value: priorities[priority] || 0,
      color: priorityColors[priority as keyof typeof priorityColors]
    }));
  }, [services]);

  // Service distribution by technician
  const technicianData = React.useMemo(() => {
    if (!Array.isArray(services)) return [];
    const technicianCounts = services.reduce((acc, service) => {
      // Defensive: se não houver technician ou id, ignora
      const techId = service.technician?.id;
      if (!techId) return acc;
      acc[techId] = (acc[techId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(technicianCounts)
      .map(([techId, count]) => {
        const tech = teamMembers.find(m => m.id === techId);
        return {
          name: tech ? tech.name : 'Desconhecido',
          value: count,
          id: techId
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [services, teamMembers]);

  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded-md shadow-md">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{`Quantidade: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  const CustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-current text-xs font-medium"
      >
        {value}
      </text>
    );
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {/* Status Distribution */}
      <div className="bg-card rounded-xl border border-white/10 p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Status das Demandas</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={renderTooltip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center mt-2 gap-4">
          {statusData.map((entry) => (
            <div key={entry.name} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-1" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Service Type Distribution */}
      <div className="bg-card rounded-xl border border-white/10 p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Tipos de Serviço</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={typeData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={80}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={renderTooltip} />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              label={<CustomLabel />}
            >
              {typeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Priority Distribution */}
      <div className="bg-card rounded-xl border border-white/10 p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Prioridades</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={priorityData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis hide />
            <Tooltip content={renderTooltip} />
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]}
              label={<CustomLabel />}
            >
              {priorityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Workload per Technician */}
      <div className="bg-card rounded-xl border border-white/10 p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Carga por Técnico</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={technicianData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={renderTooltip} />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              fill="#8b5cf6"
              label={<CustomLabel />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

