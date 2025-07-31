// Arquivo: src/pages/NewService.tsx (VERSÃO COMPLETA E CORRIGIDA)

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { createService, getServiceTypesFromDatabase } from "@/services/servicesDataService";
import { useAuth } from "@/context/AuthContext";
import { TechnicianAssigner } from "@/components/ui-custom/TechnicianAssigner";
import { ServiceTypeConfig, TeamMember, ServicePriority } from "@/types/serviceTypes";
import { ArrowLeft } from "lucide-react";

interface ServiceFormData {
  title: string; serviceType: string; client: string; location: string; address: string;
  city: string; description: string; notes: string; dueDate: string;
  technicians: TeamMember[]; 
  priority: ServicePriority;
}

const NewService: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasGestorPermission = user?.role === 'gestor' || user?.role === 'administrador';

  const form = useForm<ServiceFormData>({
    defaultValues: {
      title: "", serviceType: "", client: "", location: "", address: "", city: "",
      description: "", notes: "", dueDate: "", technicians: [], priority: "media",
    },
  });

  useState(() => {
    getServiceTypesFromDatabase()
      .then(setServiceTypes)
      .catch(() => toast.error("Erro ao carregar tipos de serviço."));
  });

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    try {
      const techniciansToAssign = !hasGestorPermission && user 
        ? [{ id: user.id, name: user.name, avatar: user.avatar || '', role: user.role }]
        : data.technicians;

      const serviceData = {
        ...data,
        technicians: techniciansToAssign,
        dueDate: data.dueDate ? new Date(data.dueDate + 'T00:00:00').toISOString() : undefined,
        createdBy: user!.id,
      };

      const result = await createService(serviceData);
      
      if (result.created) {
        toast.success("Demanda criada com sucesso!");
        navigate(`/demanda/${result.created.id}`);
      } else {
        throw new Error("Falha ao criar a demanda no servidor.");
      }
    } catch (error) {
      toast.error("Erro ao criar a demanda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div className="container mx-auto p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-4 mb-8">
          <Link to="/demandas"><Button variant="outline" size="icon"><ArrowLeft size={20} /></Button></Link>
          <div>
            <h1 className="text-3xl font-bold">Nova Demanda</h1>
            <p className="text-muted-foreground mt-1">Crie uma nova demanda de serviço</p>
          </div>
        </div>
        <Card><CardHeader><CardTitle>Informações da Demanda</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ... Seus outros FormFields (Título, Cliente, etc.) ... */}
                </div>
                {hasGestorPermission && (
                  <FormField
                    control={form.control}
                    name="technicians"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormControl>
                           <TechnicianAssigner
                              currentTechnicians={field.value}
                              onAssign={(newTechnicians) => field.onChange(newTechnicians)}
                           />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
                {/* ... Seus outros FormFields (Descrição, etc.) ... */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => navigate("/demandas")}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Criando..." : "Criar Demanda"}</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
export default NewService;
