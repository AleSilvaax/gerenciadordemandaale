
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { useServiceDetail } from "../context/ServiceDetailContext";

const ReportForm: React.FC = () => {
  const { formState, handleFormChange } = useServiceDetail();
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem>
          <FormLabel>Cliente</FormLabel>
          <FormControl>
            <Input 
              value={formState.client} 
              onChange={(e) => handleFormChange("client", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Endereço</FormLabel>
          <FormControl>
            <Input 
              value={formState.address} 
              onChange={(e) => handleFormChange("address", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Cidade</FormLabel>
          <FormControl>
            <Input 
              value={formState.city} 
              onChange={(e) => handleFormChange("city", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Executante</FormLabel>
          <FormControl>
            <Input 
              value={formState.executedBy} 
              onChange={(e) => handleFormChange("executedBy", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Data da Instalação</FormLabel>
          <FormControl>
            <Input 
              value={formState.installationDate} 
              onChange={(e) => handleFormChange("installationDate", e.target.value)} 
              type="text" 
              placeholder="DD/MM/AAAA" 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Marca e Modelo</FormLabel>
          <FormControl>
            <Input 
              value={formState.modelNumber} 
              onChange={(e) => handleFormChange("modelNumber", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Número de Série (novo)</FormLabel>
          <FormControl>
            <Input 
              value={formState.serialNumberNew} 
              onChange={(e) => handleFormChange("serialNumberNew", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Número de Série (antigo)</FormLabel>
          <FormControl>
            <Input 
              value={formState.serialNumberOld} 
              onChange={(e) => handleFormChange("serialNumberOld", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Nome do Homologado</FormLabel>
          <FormControl>
            <Input 
              value={formState.homologatedName} 
              onChange={(e) => handleFormChange("homologatedName", e.target.value)} 
            />
          </FormControl>
        </FormItem>
      </div>

      <div className="space-y-4 mt-4">
        <h3 className="text-lg font-medium">Características da Instalação</h3>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="compliesWithNBR17019" 
              checked={formState.compliesWithNBR17019}
              onCheckedChange={(checked) => handleFormChange("compliesWithNBR17019", checked)}
            />
            <Label htmlFor="compliesWithNBR17019">Instalação existente atende NBR17019</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="homologatedInstallation" 
              checked={formState.homologatedInstallation}
              onCheckedChange={(checked) => handleFormChange("homologatedInstallation", checked)}
            />
            <Label htmlFor="homologatedInstallation">Foi realizada com homologado</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="requiredAdjustment" 
              checked={formState.requiredAdjustment}
              onCheckedChange={(checked) => handleFormChange("requiredAdjustment", checked)}
            />
            <Label htmlFor="requiredAdjustment">Foi necessário adequação</Label>
          </div>

          {formState.requiredAdjustment && (
            <FormItem>
              <FormLabel>Descreva a adequação realizada</FormLabel>
              <FormControl>
                <Textarea 
                  value={formState.adjustmentDescription}
                  onChange={(e) => handleFormChange("adjustmentDescription", e.target.value)}
                />
              </FormControl>
            </FormItem>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="validWarranty" 
              checked={formState.validWarranty}
              onCheckedChange={(checked) => handleFormChange("validWarranty", checked)}
            />
            <Label htmlFor="validWarranty">Garantia Procede</Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormItem>
            <FormLabel>Disjuntor de entrada</FormLabel>
            <FormControl>
              <Input 
                value={formState.circuitBreakerEntry}
                onChange={(e) => handleFormChange("circuitBreakerEntry", e.target.value)}
              />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel>Disjuntor do carregador</FormLabel>
            <FormControl>
              <Input 
                value={formState.chargerCircuitBreaker}
                onChange={(e) => handleFormChange("chargerCircuitBreaker", e.target.value)}
              />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel>Bitola do cabo</FormLabel>
            <FormControl>
              <Input 
                value={formState.cableGauge}
                onChange={(e) => handleFormChange("cableGauge", e.target.value)}
              />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel>Status do carregador</FormLabel>
            <FormControl>
              <Input 
                value={formState.chargerStatus}
                onChange={(e) => handleFormChange("chargerStatus", e.target.value)}
              />
            </FormControl>
          </FormItem>
        </div>

        <FormItem>
          <FormLabel>Comentários técnicos</FormLabel>
          <FormControl>
            <Textarea 
              value={formState.technicalComments}
              onChange={(e) => handleFormChange("technicalComments", e.target.value)}
              className="min-h-[100px]" 
            />
          </FormControl>
        </FormItem>
      </div>
    </>
  );
};

export default ReportForm;
