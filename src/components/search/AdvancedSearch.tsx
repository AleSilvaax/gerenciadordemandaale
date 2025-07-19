
import React, { useState, useCallback, useMemo } from 'react';
import { Search, Filter, X, Calendar, MapPin, User, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';

export interface SearchFilters {
  searchTerm: string;
  status: string;
  priority: string;
  serviceType: string;
  client: string;
  location: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  technician: string;
}

interface AdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  serviceTypes?: string[];
  technicians?: { id: string; name: string }[];
  className?: string;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  serviceTypes = [],
  technicians = [],
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  }, [filters, onFiltersChange]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.status !== 'all') count++;
    if (filters.priority !== 'all') count++;
    if (filters.serviceType !== 'all') count++;
    if (filters.client) count++;
    if (filters.location) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.technician !== 'all') count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Card className={cn("bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Busca e Filtros</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro' : 'filtros'} ativo{activeFiltersCount === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4 mr-1" />
                  {isExpanded ? 'Menos' : 'Mais'} Filtros
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Busca Principal */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, cliente, localização..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Filtros Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Status
            </label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Prioridade
            </label>
            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Técnico
            </label>
            <Select value={filters.technician} onValueChange={(value) => handleFilterChange('technician', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Técnicos</SelectItem>
                {technicians.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros Expandidos */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Serviço</label>
                <Select value={filters.serviceType} onValueChange={(value) => handleFilterChange('serviceType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Localização
                </label>
                <Input
                  placeholder="Filtrar por localização..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <Input
                  placeholder="Filtrar por cliente..."
                  value={filters.client}
                  onChange={(e) => handleFilterChange('client', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Período
                </label>
                <div className="flex gap-2">
                  <DatePicker
                    date={filters.dateFrom}
                    onDateChange={(date) => handleFilterChange('dateFrom', date)}
                    placeholder="Data inicial"
                  />
                  <DatePicker
                    date={filters.dateTo}
                    onDateChange={(date) => handleFilterChange('dateTo', date)}
                    placeholder="Data final"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Filtros Ativos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            {filters.searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Busca: "{filters.searchTerm}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('searchTerm', '')} />
              </Badge>
            )}
            {filters.status !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Status: {filters.status}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('status', 'all')} />
              </Badge>
            )}
            {filters.priority !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Prioridade: {filters.priority}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('priority', 'all')} />
              </Badge>
            )}
            {filters.client && (
              <Badge variant="secondary" className="gap-1">
                Cliente: {filters.client}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('client', '')} />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
