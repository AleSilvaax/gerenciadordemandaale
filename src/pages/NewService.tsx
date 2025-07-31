// Arquivo: src/pages/NewService.tsx (VERSÃO COMPLETA E ATUALIZADA)

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
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
import { ArrowLeft, Plus, Calendar, MapPin, FileText, User, AlertTriangle } from "lucide-react";

// ✅ ESTRUTURA ATUALIZADA
interface ServiceFormData {
  title: string;
  serviceType: string;
  client: string;
  location: string;
  address: string;
  city: string;
  description: string;
  notes: string;
  dueDate: string;
  technicians: TeamMember[]; // <-- ALTERADO para uma lista de técnicos
  priority: ServicePriority;
}

const NewService: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const hasGestorPermission = user?.role === 'gestor' || user?.role === 'administrador';

  // ✅ VALORES PADRÃO ATUALIZADOS
  const form = useForm<ServiceFormData>({
    defaultValues: {
      title: "",
      serviceType: "",
      client: "",
      location: "",
      address: "",
      city: "",
      description: "",
      notes: "",
      dueDate: "",
      technicians: [], // <-- ALTERADO para uma lista vazia
      priority: "media",
    },
  });

  useEffect(() => {
    getServiceTypesFromDatabase()
      .then(setServiceTypes)
      .catch((error) => {
        console.error("Erro ao carregar tipos de serviço:", error);
        toast.error("Erro ao carregar tipos de serviço");
      });
  }, []);

  // ✅ LÓGICA DE ENVIO ATUALIZADA
  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    try {
      // Se o usuário não for gestor e for um técnico, ele é auto-atribuído.
      // A lógica agora garante que 'technicians' seja sempre um array.
      const techniciansToAssign = 
        !hasGestorPermission && user 
        ? [{ id: user.id, name: user.name, avatar: user.avatar || '', role: user.role }]
        : data.technicians;

      if (techniciansToAssign.length === 0 && hasGestorPermission) {
        toast.warning("Nenhum técnico foi atribuído a esta demanda.");
      }
      
      const serviceData = {
        ...data,
        technicians: techniciansToAssign, // Passa a lista correta
        dueDate: data.dueDate ? new Date(data.dueDate + 'T00:00:00').toISOString() : undefined,
        status: "pendente" as const,
        createdBy: user?.id,
      };

      const result = await createService(serviceData);
      
      if (result.created) {
        toast.success("Demanda criada com sucesso!");
        navigate(`/demanda/${result.created.id}`);
      } else {
        throw new Error("Falha ao criar a demanda no servidor.");
      }
    } catch (error) {
      console.error("Erro inesperado ao criar demanda:", error);
      toast.error("Ocorreu um erro inesperado ao criar a demanda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div 
        className="container mx-auto p-6 pb-24 space-y-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="flex items-center gap-4 mb-8"
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        >
          <Link to="/demandas" className="h-12 w-12 rounded-xl flex items-center justify-center bg-card/50 border hover:bg-accent">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Nova Demanda
            </h1>
            <p className="text-muted-foreground mt-1">Crie uma nova demanda de serviço</p>
          </div>
        </motion.div>

        <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Informações da Demanda</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Título */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título da Demanda</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Digite o título da demanda" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {/* Tipo de Serviço */}
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Serviço/Demanda</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de serviço" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceTypes.map(type => (
                              <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  {/* Cliente */}
                  <FormField
                    control={form.control}
                    name="client"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome do cliente" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {/* Prioridade */}
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Selecione a prioridade" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="baixa">Baixa</SelectItem>
                                <SelectItem value="media">Média</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                                <SelectItem value="urgente">Urgente</SelectItem>
                            </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  {/* Localidade */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localidade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Localidade do serviço" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {/* Endereço */}
                   <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Endereço completo" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {/* Cidade */}
                   <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Cidade" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {/* Data de Vencimento */}
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Vencimento</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* ✅ COMPONENTE VISUAL ATUALIZADO */}
                {hasGestorPermission && (
                  <FormField
                    control={form.control}
                    name="technicians"
                    render={({ field }) => (
                      <FormItem>
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
                
                {/* Descrição */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descreva os detalhes da demanda" rows={4} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Notas Adicionais */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Adicionais</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Informações adicionais relevantes" rows={3} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => navigate("/demandas")}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Criando..." : "Criar Demanda"}
                  </Button>
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
