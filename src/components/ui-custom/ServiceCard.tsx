
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Service } from "@/types/serviceTypes";
import { TeamMemberAvatar } from "./TeamMemberAvatar";
import { StatusBadge } from "./StatusBadge";
import { MapPin, Calendar } from "lucide-react";
import { formatDate } from "@/utils/formatters";

interface ServiceCardProps {
  service: Service;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/demandas/${service.id}`);
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={service.status} />
                <h3 className="font-medium line-clamp-1">
                  {service.title}
                </h3>
              </div>

              <div className="flex items-center text-muted-foreground text-sm gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{service.location}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              <TeamMemberAvatar 
                src={service.technician.avatar} 
                name={service.technician.name} 
                size="sm"
              />
              <span className="text-sm line-clamp-1">{service.technician.name}</span>
            </div>
            
            {service.date && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(service.date)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
