
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter, Download } from 'lucide-react';
import { FilterState } from '@/hooks/useServiceFilters';
import { TeamMember, ServiceStatus } from '@/types/serviceTypes';

interface ServiceFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onClearFilters: () => void;
  onExport?: () => void;
  technicians: TeamMember[];
  serviceTypes: string[];
  totalResults: number;
}

export const ServiceFilters: React.FC<ServiceFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  onExport,
  technicians,
  serviceTypes,
  totalResults
}) => {
  const statusOptions: { value: ServiceStatus | 'todos'; label: string }[] = [
    { value: 'todos', label: 'Todos os Status' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'concluido', label: 'Concluído' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Filtros e Busca</h3>
          <span className="text-sm text-muted-foreground">
            ({totalResults} resultado{totalResults !== 1 ? 's' : ''})
          </span>
        </div>
        
        <div className="flex gap-2">
          {onExport && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Primeira linha - Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, cliente, local ou descrição..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="pl-10 bg-background/50"
        />
      </div>

      {/* Segunda linha - Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Status */}
        <Select 
          value={filters.status} 
          onValueChange={(value) => onFilterChange('status', value)}
        >
          <SelectTrigger className="bg-background/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Técnico */}
        <Select 
          value={filters.technicianId} 
          onValueChange={(value) => onFilterChange('technicianId', value)}
        >
          <SelectTrigger className="bg-background/50">
            <SelectValue placeholder="Técnico/Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Técnicos</SelectItem>
            {technicians.filter(tech => tech && tech.id && tech.name).map(tech => (
              <SelectItem key={tech.id} value={tech.id}>
                {tech.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tipo de Serviço */}
        <Select 
          value={filters.serviceType} 
          onValueChange={(value) => onFilterChange('serviceType', value)}
        >
          <SelectTrigger className="bg-background/50">
            <SelectValue placeholder="Tipo de Serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {serviceTypes.filter(type => type && type.trim() !== '').map(type => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Período (placeholder) */}
        <Select disabled>
          <SelectTrigger className="bg-background/30">
            <SelectValue placeholder="Período (em breve)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
