
import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { TechnicalField } from "@/types/serviceTypes";

interface Props {
  fields: TechnicalField[];
  onEditField: (field: TechnicalField) => void;
  onDeleteField: (fieldId: string) => void;
  onAddField: () => void;
}

export const TechnicalFieldList: React.FC<Props> = ({
  fields,
  onEditField,
  onDeleteField,
  onAddField,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Campos Personalizados</h3>
        <Button size="sm" variant="ghost" onClick={onAddField}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {fields.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>Nenhum campo personalizado definido</p>
          <Button variant="ghost" className="mt-2" onClick={onAddField}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Campo
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Obrigatório</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell>{field.name}</TableCell>
                <TableCell>
                  {field.type === "text" && "Texto"}
                  {field.type === "number" && "Número"}
                  {field.type === "select" && "Seleção"}
                  {field.type === "boolean" && "Sim/Não"}
                  {field.type === "date" && "Data"}
                  {field.type === "textarea" && "Área de Texto"}
                </TableCell>
                <TableCell>{field.required ? "Sim" : "Não"}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => onEditField(field)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDeleteField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

