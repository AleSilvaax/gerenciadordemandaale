import React, { useState, useEffect } from "react";
import { ArrowLeft, Search as SearchIcon, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { getServices } from "@/services/servicesDataService";
import { Service } from "@/types/serviceTypes";


const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    // Load services
    const fetchServices = async () => {
      try {
        const data = await getServices();
        setServices(data);
        setFilteredServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredServices(services);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = services.filter(
      (service) =>
        service.title.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.location.toLowerCase().includes(query) ||
        service.client?.toLowerCase().includes(query) ||
        service.technician?.name?.toLowerCase().includes(query) ||
        service.id.toLowerCase().includes(query)
    );

    setFilteredServices(results);

    // Save to recent searches if not already present
    if (searchQuery.trim() && !recentSearches.includes(searchQuery)) {
      const updatedSearches = [searchQuery, ...recentSearches.slice(0, 4)];
      setRecentSearches(updatedSearches);
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    }
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    
    // Implementation of the search logic when clicking on recent search
    const query = search.toLowerCase();
    const results = services.filter(
      (service) =>
        service.title.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.location.toLowerCase().includes(query) ||
        service.client?.toLowerCase().includes(query) ||
        service.technician?.name?.toLowerCase().includes(query) ||
        service.id.toLowerCase().includes(query)
    );

    setFilteredServices(results);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilteredServices(services);
  };

  // Render suggestions based on recent searches and recent services
  const renderSuggestions = () => {
    if (searchQuery || filteredServices.length !== services.length) {
      return null;
    }

    return (
      <div className="space-y-6 mt-4">
        {recentSearches.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Buscas recentes</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  onClick={() => handleRecentSearchClick(search)}
                >
                  <Clock className="h-3 w-3 mr-2" />
                  {search}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium mb-2">Sugestões</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="flex items-center" onClick={() => handleRecentSearchClick("pendente")}>
              <SearchIcon className="h-3 w-3 mr-2" />
              pendente
            </Button>
            <Button variant="outline" size="sm" className="flex items-center" onClick={() => handleRecentSearchClick("instalação")}>
              <SearchIcon className="h-3 w-3 mr-2" />
              instalação
            </Button>
            <Button variant="outline" size="sm" className="flex items-center" onClick={() => handleRecentSearchClick("vistoria")}>
              <SearchIcon className="h-3 w-3 mr-2" />
              vistoria
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 pb-20 page-transition">
      <div className="flex items-center mb-6">
        <Link
          to="/"
          className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10 mr-4"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Buscar demandas</h1>
      </div>

      <div className="relative">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Buscar por título, local, cliente, técnico..."
          className="pr-20"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-12 top-1/2 transform -translate-y-1/2 h-8 px-2"
            onClick={handleClearSearch}
          >
            Limpar
          </Button>
        )}
        <Button
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-10"
          size="sm"
          onClick={handleSearch}
        >
          <SearchIcon size={16} />
        </Button>
      </div>

      {renderSuggestions()}

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">
                {searchQuery ? `Resultados para "${searchQuery}"` : "Todas as demandas"}
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredServices.length} demandas encontradas
              </span>
            </div>

            {filteredServices.length > 0 ? (
              <div className="space-y-4">
                {filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhuma demanda encontrada para "{searchQuery}".
                </p>
                <Button className="mt-4" onClick={handleClearSearch}>
                  Limpar busca
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Search;
