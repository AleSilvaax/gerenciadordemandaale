
import React, { useState, useEffect } from "react";
import { ArrowLeft, Search as SearchIcon, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { getServices } from "@/services/api";
import { Service } from "@/data/mockData";

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add a refresh function to reload data
  const refreshServices = async () => {
    setIsLoading(true);
    try {
      const data = await getServices();
      setServices(data);
      setFilteredServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshServices();
  }, []);

  useEffect(() => {
    // Filter services based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const filtered = services.filter(
        service =>
          service.title.toLowerCase().includes(query) ||
          service.id.toLowerCase().includes(query) ||
          service.location.toLowerCase().includes(query) ||
          service.technician.name.toLowerCase().includes(query) ||
          (service.reportData?.client && service.reportData.client.toLowerCase().includes(query)) ||
          (service.reportData?.servicePhase && 
            (service.reportData.servicePhase === "inspection" && "vistoria".includes(query) ||
             service.reportData.servicePhase === "installation" && "instalação".includes(query))
          )
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services);
    }
  }, [searchQuery, services]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen p-4 pb-20 page-transition">
      <div className="flex items-center mb-6">
        <Link to="/" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10 mr-4">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Pesquisa</h1>
      </div>

      <div className="relative mb-6">
        <div className="relative">
          <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10 pr-10"
            placeholder="Pesquisar demandas, clientes, locais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={clearSearch}
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 size={32} className="animate-spin mb-2 text-primary" />
          <p className="text-muted-foreground">Carregando resultados...</p>
        </div>
      ) : filteredServices.length > 0 ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? `${filteredServices.length} resultado${filteredServices.length !== 1 ? "s" : ""} encontrado${
                    filteredServices.length !== 1 ? "s" : ""
                  }`
                : "Todas as demandas"}
            </p>
            <Button variant="outline" size="sm" onClick={refreshServices}>
              <Loader2 size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              id={service.id}
              title={service.title}
              status={service.status}
              location={service.location}
              technician={service.technician}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <SearchIcon size={64} className="text-muted-foreground mb-4 opacity-20" />
          <h2 className="text-xl font-medium mb-1">Nenhum resultado encontrado</h2>
          <p className="text-muted-foreground">
            Não encontramos nenhuma demanda que corresponda à sua pesquisa
          </p>
          {searchQuery && (
            <Button variant="outline" className="mt-4" onClick={clearSearch}>
              Limpar pesquisa
            </Button>
          )}
          <Button variant="outline" className="mt-2" onClick={refreshServices}>
            <Loader2 size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar dados
          </Button>
        </div>
      )}
    </div>
  );
};

export default Search;
