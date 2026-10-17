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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useCreateMaterialCategory } from "@/hooks/useInventory";
import { cn } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  color: z.string().min(1, "Cor é obrigatória"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
}

const colorOptions = [
  { value: "#2563EB", label: "Azul" },
  { value: "#10B981", label: "Esmeralda" },
  { value: "#F59E0B", label: "Âmbar" },
  { value: "#F43F5E", label: "Rose" },
  { value: "#8B5CF6", label: "Violeta" },
  { value: "#F97316", label: "Laranja" },
  { value: "#06B6D4", label: "Ciano" },
  { value: "#64748B", label: "Slate" },
];

export const CategoryDialog: React.FC<CategoryDialogProps> = ({
  open,
  onClose,
}) => {
  const createCategory = useCreateMaterialCategory();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#2563EB",
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    try {
      await createCategory.mutateAsync(data as any);
      form.reset();
      onClose();
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Nova Categoria</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Crie uma categoria para organizar o catálogo de materiais
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Nome *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cabos e Condutores" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Descrição
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição opcional da categoria"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Cor de Identificação *
                  </FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {colorOptions.map((color) => {
                        const selected = field.value === color.value;
                        return (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => field.onChange(color.value)}
                            title={color.label}
                            style={{ backgroundColor: color.value }}
                            className={cn(
                              "h-9 w-9 rounded-full flex items-center justify-center transition-transform",
                              selected
                                ? "ring-2 ring-offset-2 ring-slate-900 scale-110"
                                : "opacity-80 hover:opacity-100 hover:scale-105"
                            )}
                          >
                            {selected && (
                              <Check className="h-4 w-4 text-white stroke-[2.5px]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createCategory.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createCategory.isPending ? "Criando..." : "Criar Categoria"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
