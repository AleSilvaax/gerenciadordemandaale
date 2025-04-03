
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { getServices } from "@/services/api";
import { Service } from "@/types/serviceTypes";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft, Filter, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Search: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pendente" | "concluido" | "cancelado">("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();

    const fetchServices = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const filtered = services.filter((service) => {
      // First apply status filter
      if (statusFilter !== "all" && service.status !== statusFilter) {
        return false;
      }
      
      // Then apply search term filter
      if (!searchTerm.trim()) {
        return true;
      }
      
      const term = searchTerm.toLowerCase();
      return (
        service.id.toLowerCase().includes(term) ||
        service.title.toLowerCase().includes(term) ||
        service.location.toLowerCase().includes(term) ||
        (service.client && service.client.toLowerCase().includes(term)) ||
        service.technician.name.toLowerCase().includes(term)
      );
    });
    
    setFilteredServices(filtered);
  }, [searchTerm, services, statusFilter]);

  const clearSearch = () => {
    setSearchTerm("");
    inputRef.current?.focus();
  };

  return (
    <div className="container py-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Busca</h1>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <SearchIcon
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Buscar demandas, clientes, técnicos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <span className="sr-only">Limpar</span>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as "all" | "pendente" | "concluido" | "cancelado")}
        >
          <SelectTrigger className="w-full">
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 space-y-4 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="space-y-3 overflow-x-auto">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum resultado encontrado." : "Digite algo para buscar."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
