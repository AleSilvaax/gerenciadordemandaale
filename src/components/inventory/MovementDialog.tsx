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
import { toast } from "sonner";

const movementSchema = z.object({
  material_id: z.string().min(1, "Selecione um material"),
  movement_type: z.enum(["entrada", "saida", "ajuste"], {
    required_error: "Selecione o tipo de movimentação",
  }),
  quantity: z.coerce.number().min(0.01, "A quantidade deve ser maior que 0"),
  notes: z.string().optional(),
  cost_per_unit: z.coerce.number().min(0).optional(),
});

type MovementFormData = z.infer<typeof movementSchema>;

interface MovementDialogProps {
  open: boolean;
  onClose: () => void;
}

export const MovementDialog: React.FC<MovementDialogProps> = ({
  open,
  onClose,
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

  const handleMaterialChange = (materialId: string) => {
    form.setValue("material_id", materialId, { shouldValidate: true });
    const selectedMat = materials?.find((m) => m.id === materialId);
    if (selectedMat && selectedMat.cost_per_unit) {
      form.setValue("cost_per_unit", selectedMat.cost_per_unit);
    }
  };

  const onSubmit = async (data: MovementFormData) => {
    try {
      await createMovement.mutateAsync({
        material_id: data.material_id,
        movement_type: data.movement_type,
        quantity: Number(data.quantity),
        cost_per_unit: Number(data.cost_per_unit || 0),
        notes: data.notes || "",
      } as any);
      toast.success("Movimentação de estoque registrada!");
      form.reset();
      onClose();
    } catch (error: any) {
      console.error("Erro ao criar movimentação:", error);
      toast.error("Erro ao registrar movimentação", {
        description: error?.message || "Verifique os dados informados.",
      });
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const movementType = form.watch("movement_type");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Nova Movimentação
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Registre uma entrada, saída ou ajuste de saldo no estoque
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="material_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Material *
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={handleMaterialChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials?.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name} ({material.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="movement_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Tipo de Movimentação *
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada (+)</SelectItem>
                      <SelectItem value="saida">Saída (-)</SelectItem>
                      <SelectItem value="ajuste">Ajuste de Saldo (=)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      {movementType === "ajuste"
                        ? "Novo Saldo *"
                        : "Quantidade *"}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="any" min="0.01" {...field} />
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
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Custo Unit. (R$)
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Observações
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nota fiscal, fornecedor ou motivo..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMovement.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createMovement.isPending
                  ? "Registrando..."
                  : "Registrar Movimentação"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
