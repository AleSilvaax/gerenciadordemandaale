
import React, { useState, useEffect } from "react";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { getServiceTypesFromDatabase, getTeamMembers } from "@/services/servicesDataService";
import { ServiceTypeConfig, TeamMember } from "@/types/serviceTypes";
import { useAuth } from "@/context/AuthContext";

interface DetailsFormSectionProps {
  service: any;
  saving: boolean;
  statusUpdating: boolean;
  onSubmit: (data: any) => void;
}

const DetailsFormSection: React.FC<DetailsFormSectionProps> = ({
  service,
  saving,
  statusUpdating,
  onSubmit
}) => {
  const form = useForm({
    defaultValues: {
      title: service.title,
      status: service.status,
      serviceType: service.serviceType || "Vistoria",
      client: service.client || "",
      location: service.location,
      address: service.address || "",
      city: service.city || "",
      description: service.description || "",
      notes: service.notes || "",
      technicianId: service.technician?.id || "none",
    }
  });

  const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { hasPermission } = useAuth();

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const types = await getServiceTypesFromDatabase();
        console.log('[DetailsFormSection] Tipos carregados:', types);
        setServiceTypes(types.filter(type => type && type.name && type.name.trim() !== ''));
      } catch (error) {
        console.error('[DetailsFormSection] Erro ao carregar tipos:', error);
        setServiceTypes([
        { id: '1', name: 'Vistoria', description: 'Vistoria padrão', technicalFields: [] },
        { id: '2', name: 'Instalação', description: 'Instalação padrão', technicalFields: [] },
        { id: '3', name: 'Manutenção', description: 'Manutenção padrão', technicalFields: [] }
        ]);
      }
    };
    
    fetchTypes();
    
    if (hasPermission("gestor")) {
      getTeamMembers().then(members => {
        setTeamMembers(members.filter(member => member && member.id && member.name));
      });
    }
  }, [hasPermission]);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => {
          let selectedTech = null;
          if (
            hasPermission("gestor") &&
            data.technicianId &&
            data.technicianId !== "none"
          ) {
            const foundTech = teamMembers.find((t) => t.id === data.technicianId);
            if (foundTech) {
              selectedTech = {
                id: foundTech.id,
                name: foundTech.name,
                avatar: foundTech.avatar,
                role: foundTech.role,
                email: foundTech.email,
                phone: foundTech.phone,
                signature: foundTech.signature
              };
            }
          }
          onSubmit({
            ...data,
            technician: selectedTech,
          });
        })}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={statusUpdating}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serviceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Serviço</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceTypes.map(type => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="client"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localidade</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          {/* Campo de técnico para gestores */}
          {hasPermission("gestor") && (
            <FormField
              control={form.control}
              name="technicianId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Técnico Responsável</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar técnico" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Não atribuído</SelectItem>
                      {teamMembers.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          )}
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionais</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DetailsFormSection;
