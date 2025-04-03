
import React from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, MapPin, ChevronRight, Trash2, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "@/utils/formatters";
import { Service } from "@/types/serviceTypes";

interface ServiceCardProps {
  service: Service;
  onDelete?: (id: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onDelete }) => {
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    navigate(`/demandas/${service.id}`);
  };
  
  const handleEditService = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/demandas/${service.id}/edit`);
  };
  
  const handleDeleteService = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(service.id);
    }
  };
  
  return (
    <Card 
      className="hover:border-primary/30 transition-colors cursor-pointer"
      onClick={handleViewDetails}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold text-lg truncate">{service.title}</h3>
                <StatusBadge status={service.status} />
              </div>
              <div className="block md:hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-3.5 w-3.5" />
              <span className="truncate">{service.location}</span>
            </div>
            
            {service.date && (
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                <span>{formatDate(service.date)}</span>
              </div>
            )}
            
            <div className="hidden md:flex items-center pt-2">
              <div className="flex items-center flex-1">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={service.technician.avatar} />
                  <AvatarFallback>{service.technician.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{service.technician.name}</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-end justify-between">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <div className="flex space-x-1 mt-auto">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={handleEditService}
              >
                <Edit className="h-3.5 w-3.5" />
                <span className="sr-only">Editar</span>
              </Button>
              
              {onDelete && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleDeleteService}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Excluir</span>
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex md:hidden justify-between items-center mt-4 pt-4 border-t">
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={service.technician.avatar} />
                <AvatarFallback>{service.technician.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{service.technician.name}</span>
            </div>
            
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={handleEditService}
              >
                <Edit className="h-3.5 w-3.5" />
                <span className="sr-only">Editar</span>
              </Button>
              
              {onDelete && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleDeleteService}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Excluir</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
