import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateInventoryMovement, useMaterials } from "@/hooks/useInventory";

const movementSchema = z.object({
  material_id: z.string().min(1, "Material é obrigatório"),
  movement_type: z.enum(["entrada", "saida", "ajuste"], {
    required_error: "Tipo de movimentação é obrigatório",
  }),
  quantity: z.coerce.number().min(1, "Quantidade deve ser maior que 0"),
  notes: z.string().optional(),
  cost_per_unit: z.coerce.number().min(0, "Custo deve ser maior ou igual a 0").optional(),
});

type MovementFormData = z.infer<typeof movementSchema>;

interface MovementDialogProps {
  open: boolean;
  onClose: () => void;
}

export const MovementDialog: React.FC<MovementDialogProps> = ({
  open,
  onClose
}) => {
  const { data: materials } = useMaterials();
  const createMovement = useCreateInventoryMovement();

  const form = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      material_id: "",
      movement_type: "entrada",
      quantity: 1,
      notes: "",
      cost_per_unit: 0,
    },
  });

  const onSubmit = async (data: MovementFormData) => {
    try {
      await createMovement.mutateAsync(data as any);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const movementType = form.watch("movement_type");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Movimentação</DialogTitle>
          <DialogDescription>
            Registre uma entrada, saída ou ajuste de estoque
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="material_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials?.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} ({material.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="movement_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Movimentação *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                        <SelectItem value="ajuste">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {movementType === "ajuste" ? "Nova Quantidade Total *" : "Quantidade *"}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      placeholder={movementType === "ajuste" ? "Quantidade final no estoque" : "Quantidade a movimentar"}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {movementType === "entrada" && (
              <FormField
                control={form.control}
                name="cost_per_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo por Unidade</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Motivo da movimentação, fornecedor, etc." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMovement.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMovement.isPending}>
                {createMovement.isPending ? "Registrando..." : "Registrar Movimentação"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};