
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  CheckCircle,
  Calendar,
  Camera,
  Download,
  ArrowLeft,
  Edit,
  User,
  MapPin,
  ClipboardCheck,
  X
} from "lucide-react";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { Separator } from "@/components/ui/separator";
import { SignatureCapture } from "@/components/ui-custom/SignatureCapture";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";
import { getService, updateService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { downloadPDF, downloadInspectionPDF, downloadInstallationPDF } from "@/utils/pdfGenerator";
import { Service } from "@/types/serviceTypes";
import { CustomFieldRenderer } from "@/components/ui-custom/CustomFieldRenderer";
import { useIsMobile } from "@/hooks/use-mobile";

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [clientSignature, setClientSignature] = useState<string | null>(null);
  const [technicianSignature, setTechnicianSignature] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      
      try {
        const fetchedService = await getService(id);
        setService(fetchedService);
        
        // Initialize signatures if they exist
        if (fetchedService.reportData?.clientSignature) {
          setClientSignature(fetchedService.reportData.clientSignature);
        }
        
        if (fetchedService.technician?.signature) {
          setTechnicianSignature(fetchedService.technician.signature);
        }
        
        // Initialize client name
        if (fetchedService.reportData?.clientName) {
          setClientName(fetchedService.reportData.clientName);
        }
      } catch (error) {
        console.error("Error fetching service:", error);
        toast.error("Erro ao carregar a demanda", {
          description: "Não foi possível carregar os detalhes desta demanda."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const handleStatusChange = async (newStatus: "pendente" | "concluido" | "cancelado") => {
    if (!service) return;
    
    try {
      const updatedService = { ...service, status: newStatus };
      await updateService(updatedService);
      setService(updatedService);
      
      toast.success("Status atualizado", {
        description: `O status da demanda foi alterado para ${
          newStatus === "pendente" ? "pendente" :
          newStatus === "concluido" ? "concluído" : "cancelado"
        }.`
      });
    } catch (error) {
      console.error("Error updating service status:", error);
      toast.error("Erro ao atualizar status", {
        description: "Não foi possível atualizar o status da demanda."
      });
    }
  };

  const saveSignatures = async () => {
    if (!service) return;
    
    try {
      // Update reportData with clientSignature and clientName
      const updatedReportData = {
        ...service.reportData,
        clientSignature,
        clientName
      };
      
      // Update the technician's signature and the reportData
      const updatedService = {
        ...service,
        technician: {
          ...service.technician,
          signature: technicianSignature
        },
        reportData: updatedReportData
      };
      
      await updateService(updatedService);
      setService(updatedService);
      
      toast.success("Assinaturas salvas", {
        description: "As assinaturas foram salvas com sucesso."
      });
    } catch (error) {
      console.error("Error saving signatures:", error);
      toast.error("Erro ao salvar assinaturas", {
        description: "Não foi possível salvar as assinaturas."
      });
    }
  };

  const handleClientSignatureChange = (dataUrl: string) => {
    setClientSignature(dataUrl);
  };

  const handleTechnicianSignatureChange = (dataUrl: string) => {
    setTechnicianSignature(dataUrl);
  };

  const handleAddPhoto = async (file: File, title: string) => {
    if (!service) return "";
    
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target?.result) {
          reject("Failed to read file");
          return;
        }
        
        const photoUrl = event.target.result as string;
        
        try {
          // Create updated photos and photoTitles arrays
          const updatedPhotos = [...(service.photos || []), photoUrl];
          const updatedPhotoTitles = [...(service.photoTitles || []), title];
          
          // Update the service
          const updatedService = {
            ...service,
            photos: updatedPhotos,
            photoTitles: updatedPhotoTitles
          };
          
          await updateService(updatedService);
          setService(updatedService);
          
          toast.success("Foto adicionada", {
            description: "A foto foi adicionada com sucesso."
          });
          
          resolve(photoUrl);
        } catch (error) {
          console.error("Error adding photo:", error);
          reject("Failed to add photo");
        }
      };
      
      reader.onerror = () => {
        reject("Failed to read file");
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = async (index: number) => {
    if (!service) return;
    
    try {
      // Create updated photos and photoTitles arrays
      const updatedPhotos = [...(service.photos || [])];
      const updatedPhotoTitles = [...(service.photoTitles || [])];
      
      // Remove the photo and its title at the specified index
      updatedPhotos.splice(index, 1);
      updatedPhotoTitles.splice(index, 1);
      
      // Update the service
      const updatedService = {
        ...service,
        photos: updatedPhotos,
        photoTitles: updatedPhotoTitles
      };
      
      await updateService(updatedService);
      setService(updatedService);
      
      toast.success("Foto removida", {
        description: "A foto foi removida com sucesso."
      });
    } catch (error) {
      console.error("Error removing photo:", error);
      toast.error("Erro ao remover foto", {
        description: "Não foi possível remover a foto."
      });
    }
  };

  const handleUpdatePhotoTitle = async (index: number, newTitle: string) => {
    if (!service) return;
    
    try {
      // Create updated photoTitles array
      const updatedPhotoTitles = [...(service.photoTitles || [])];
      
      // Update the title at the specified index
      updatedPhotoTitles[index] = newTitle;
      
      // Update the service
      const updatedService = {
        ...service,
        photoTitles: updatedPhotoTitles
      };
      
      await updateService(updatedService);
      setService(updatedService);
      
      toast.success("Título atualizado", {
        description: "O título da foto foi atualizado com sucesso."
      });
    } catch (error) {
      console.error("Error updating photo title:", error);
      toast.error("Erro ao atualizar título", {
        description: "Não foi possível atualizar o título da foto."
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Demanda não encontrada</h1>
        <p className="mb-4">A demanda solicitada não foi encontrada.</p>
        <Button onClick={() => navigate("/demandas")}>Voltar para Demandas</Button>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não especificado";
    
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch (e) {
      return dateString;
    }
  };

  const photos = service.photos || [];
  const photoDetails = photos.map((url, index) => ({
    url,
    title: service.photoTitles?.[index] || `Foto ${index + 1}`
  }));

  return (
    <div className={`container py-4 space-y-6 ${isMobile ? 'pb-28' : 'pb-8'}`}>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Detalhes da Demanda</h1>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
                  <div className="flex items-center mt-1">
                    <StatusBadge status={service.status} className="mr-2" />
                    <span className="text-sm text-muted-foreground">ID: {service.id}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/editar-demanda/${service.id}`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Data da demanda:</span>
                    <span className="ml-2">{formatDate(service.date)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Data de vencimento:</span>
                    <span className="ml-2">{formatDate(service.dueDate)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="ml-2">{service.client || "Não especificado"}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Endereço:</span>
                    <span className="ml-2">{service.address || "Não especificado"}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Cidade:</span>
                    <span className="ml-2">{service.city || "Não especificado"}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Local:</span>
                    <span className="ml-2">{service.location || "Não especificado"}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Notas:</h3>
                <p className="text-sm">{service.notes || "Nenhuma nota adicional."}</p>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0 flex-col items-start">
              <Separator className="my-4 w-full" />
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button 
                  className={`${service.status === "pendente" ? "bg-green-600 hover:bg-green-700" : ""}`}
                  disabled={service.status === "concluido"}
                  onClick={() => handleStatusChange("concluido")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Concluído
                </Button>
                
                <Button 
                  variant={service.status === "pendente" ? "outline" : "default"}
                  disabled={service.status === "pendente"}
                  onClick={() => handleStatusChange("pendente")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Marcar como Pendente
                </Button>
                
                <Button 
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={service.status === "cancelado"}
                  onClick={() => handleStatusChange("cancelado")}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar Demanda
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="details">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Detalhes Técnicos
              </TabsTrigger>
              <TabsTrigger value="photos">
                <Camera className="h-4 w-4 mr-2" />
                Fotos
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Relatório</CardTitle>
                </CardHeader>
                <CardContent>
                  {service.reportData ? (
                    <div className="space-y-6">
                      {/* Render custom fields if any */}
                      {service.reportData.customFields && service.reportData.customFields.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">Campos Personalizados</h3>
                          <CustomFieldRenderer fields={service.reportData.customFields} disabled={true} />
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button 
                          variant="outline" 
                          className="w-full sm:w-auto"
                          onClick={() => downloadInspectionPDF(service)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Gerar Relatório de Vistoria
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full sm:w-auto"
                          onClick={() => downloadInstallationPDF(service)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Gerar Relatório de Instalação
                        </Button>
                        
                        <Button 
                          className="w-full sm:w-auto"
                          onClick={() => downloadPDF(service)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Gerar Relatório
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Nenhum dado de relatório disponível.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="photos" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fotos do Serviço</CardTitle>
                </CardHeader>
                <CardContent>
                  <PhotoUploader
                    photos={photoDetails}
                    onAddPhoto={handleAddPhoto}
                    onRemovePhoto={handleRemovePhoto}
                    onUpdateTitle={handleUpdatePhotoTitle}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:w-1/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Técnico Responsável</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TeamMemberAvatar
                  src={service.technician.avatar}
                  name={service.technician.name}
                  size="lg"
                  className="mr-4"
                />
                <div>
                  <h3 className="font-semibold">{service.technician.name}</h3>
                  <p className="text-sm text-muted-foreground">{service.technician.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="clientName" className="text-sm font-medium">
                  Nome do Cliente
                </label>
                <input
                  id="clientName"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Digite o nome do cliente"
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Assinatura do Cliente</h3>
                <SignatureCapture
                  onSave={handleClientSignatureChange}
                  initialValue={clientSignature || ''}
                  height={150}
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Assinatura do Técnico</h3>
                <SignatureCapture
                  onSave={handleTechnicianSignatureChange}
                  initialValue={technicianSignature || ''}
                  height={150}
                />
              </div>
              
              <Button className="w-full" onClick={saveSignatures}>
                Salvar Assinaturas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
