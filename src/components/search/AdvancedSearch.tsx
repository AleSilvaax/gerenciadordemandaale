
import React, { useState } from 'react';
import { Search, Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const getActiveFiltersCount = () => {
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
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="card-enhanced">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Busca Avançada
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} filtros ativos
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  {isExpanded ? 'Ocultar Filtros' : 'Mais Filtros'}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Busca Principal */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, cliente, local..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Prioridades</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.serviceType} onValueChange={(value) => updateFilter('serviceType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de Serviço" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="Vistoria">Vistoria</SelectItem>
              <SelectItem value="Instalação">Instalação</SelectItem>
              <SelectItem value="Manutenção">Manutenção</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtros Avançados */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Cliente"
                value={filters.client}
                onChange={(e) => updateFilter('client', e.target.value)}
              />
              <Input
                placeholder="Local"
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom || undefined}
                      onSelect={(date) => updateFilter('dateFrom', date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo || undefined}
                      onSelect={(date) => updateFilter('dateTo', date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
