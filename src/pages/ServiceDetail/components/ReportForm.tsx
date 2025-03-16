
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

interface ReportFormProps {
  formState: {
    client: string;
    address: string;
    city: string;
    executedBy: string;
    installationDate: string;
    modelNumber: string;
    serialNumberNew: string;
    serialNumberOld: string;
    homologatedName: string;
    compliesWithNBR17019: boolean;
    homologatedInstallation: boolean;
    requiredAdjustment: boolean;
    adjustmentDescription: string;
    validWarranty: boolean;
    circuitBreakerEntry: string;
    chargerCircuitBreaker: string;
    cableGauge: string;
    chargerStatus: string;
    technicalComments: string;
  };
  onChange: (field: string, value: any) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ formState, onChange }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem>
          <FormLabel>Cliente</FormLabel>
          <FormControl>
            <Input 
              value={formState.client} 
              onChange={(e) => onChange("client", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Endereço</FormLabel>
          <FormControl>
            <Input 
              value={formState.address} 
              onChange={(e) => onChange("address", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Cidade</FormLabel>
          <FormControl>
            <Input 
              value={formState.city} 
              onChange={(e) => onChange("city", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Executante</FormLabel>
          <FormControl>
            <Input 
              value={formState.executedBy} 
              onChange={(e) => onChange("executedBy", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Data da Instalação</FormLabel>
          <FormControl>
            <Input 
              value={formState.installationDate} 
              onChange={(e) => onChange("installationDate", e.target.value)} 
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
              onChange={(e) => onChange("modelNumber", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Número de Série (novo)</FormLabel>
          <FormControl>
            <Input 
              value={formState.serialNumberNew} 
              onChange={(e) => onChange("serialNumberNew", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Número de Série (antigo)</FormLabel>
          <FormControl>
            <Input 
              value={formState.serialNumberOld} 
              onChange={(e) => onChange("serialNumberOld", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Nome do Homologado</FormLabel>
          <FormControl>
            <Input 
              value={formState.homologatedName} 
              onChange={(e) => onChange("homologatedName", e.target.value)} 
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
              onCheckedChange={(checked) => onChange("compliesWithNBR17019", checked)}
            />
            <Label htmlFor="compliesWithNBR17019">Instalação existente atende NBR17019</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="homologatedInstallation" 
              checked={formState.homologatedInstallation}
              onCheckedChange={(checked) => onChange("homologatedInstallation", checked)}
            />
            <Label htmlFor="homologatedInstallation">Foi realizada com homologado</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="requiredAdjustment" 
              checked={formState.requiredAdjustment}
              onCheckedChange={(checked) => onChange("requiredAdjustment", checked)}
            />
            <Label htmlFor="requiredAdjustment">Foi necessário adequação</Label>
          </div>

          {formState.requiredAdjustment && (
            <FormItem>
              <FormLabel>Descreva a adequação realizada</FormLabel>
              <FormControl>
                <Textarea 
                  value={formState.adjustmentDescription}
                  onChange={(e) => onChange("adjustmentDescription", e.target.value)}
                />
              </FormControl>
            </FormItem>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="validWarranty" 
              checked={formState.validWarranty}
              onCheckedChange={(checked) => onChange("validWarranty", checked)}
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
                onChange={(e) => onChange("circuitBreakerEntry", e.target.value)}
              />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel>Disjuntor do carregador</FormLabel>
            <FormControl>
              <Input 
                value={formState.chargerCircuitBreaker}
                onChange={(e) => onChange("chargerCircuitBreaker", e.target.value)}
              />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel>Bitola do cabo</FormLabel>
            <FormControl>
              <Input 
                value={formState.cableGauge}
                onChange={(e) => onChange("cableGauge", e.target.value)}
              />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel>Status do carregador</FormLabel>
            <FormControl>
              <Input 
                value={formState.chargerStatus}
                onChange={(e) => onChange("chargerStatus", e.target.value)}
              />
            </FormControl>
          </FormItem>
        </div>

        <FormItem>
          <FormLabel>Comentários técnicos</FormLabel>
          <FormControl>
            <Textarea 
              value={formState.technicalComments}
              onChange={(e) => onChange("technicalComments", e.target.value)}
              className="min-h-[100px]" 
            />
          </FormControl>
        </FormItem>
      </div>
    </>
  );
};

export default ReportForm;
