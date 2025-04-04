
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileSpreadsheet, FilePenLine } from "lucide-react";
import { getService } from '@/services/api';
import { Service } from '@/types/serviceTypes';
import { toast } from "sonner";
import { exportServicesToExcel, exportServicesToPDF } from '@/utils/reportExport';

const ServiceDetail: React.FC<{ editMode?: boolean }> = ({ editMode = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchServiceDetails = async () => {
      setIsLoading(true);
      try {
        const data = await getService(id);
        setService(data);
      } catch (error) {
        console.error('Error fetching service details:', error);
        toast.error('Erro ao carregar detalhes da demanda');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServiceDetails();
  }, [id]);

  const handleExportReport = (type: 'excel' | 'pdf') => {
    if (!service) return;
    
    try {
      if (type === 'excel') {
        exportServicesToExcel([service]);
        toast.success('Relatório Excel gerado com sucesso');
      } else {
        exportServicesToPDF([service]);
        toast.success('Relatório PDF gerado com sucesso');
      }
    } catch (error) {
      console.error(`Error exporting ${type} report:`, error);
      toast.error(`Erro ao gerar relatório ${type.toUpperCase()}`);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Carregando detalhes...</div>;
  }

  if (!service) {
    return <div className="p-6 text-center">Demanda não encontrada</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Detalhes da Demanda</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExportReport('excel')}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExportReport('pdf')}
          >
            <FilePenLine className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">{service.title}</h2>
        <p className="text-gray-600 mb-4">{service.description || "Sem descrição adicional"}</p>
      </div>
    </div>
  );
};

export default ServiceDetail;
