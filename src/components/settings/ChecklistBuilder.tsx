import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowDown, ArrowUp, Camera, ListChecks, Plus, Trash2 } from "lucide-react";
import type {
  ChecklistFieldDef, ChecklistFieldType, ChecklistStep, PhotoSlotDef,
} from "@/types/checklist";
import { computations } from "@/templates/computations";

export const FIELD_TYPE_LABELS: Record<ChecklistFieldType, string> = {
  text: "Texto curto",
  textarea: "Texto longo",
  number: "Número",
  select: "Lista suspensa",
  pills: "Botões de escolha",
  cards: "Cartões de escolha",
  binary_list: "Lista SIM / NÃO",
  timestamp: "Data e hora",
  computed: "Cálculo automático",
};

const OPTION_TYPES: ChecklistFieldType[] = ["select", "pills", "cards"];

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "item";

export const uniqueId = (base: string, taken: string[]) => {
  let id = slugify(base);
  let n = 2;
  while (taken.includes(id)) id = `${slugify(base)}_${n++}`;
  return id;
};

const move = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
};

const linesToOptions = (text: string) =>
  text.split("\n").map(l => l.trim()).filter(Boolean).map(l => ({ value: l, label: l }));

interface Props {
  steps: ChecklistStep[];
  photoSlots: PhotoSlotDef[];
  onChange: (steps: ChecklistStep[], photoSlots: PhotoSlotDef[]) => void;
}

export const ChecklistBuilder: React.FC<Props> = ({ steps, photoSlots, onChange }) => {
  const allFieldIds = steps.flatMap(s => s.fields.map(f => f.id));
  const setSteps = (next: ChecklistStep[]) => onChange(next, photoSlots);
  const setSlots = (next: PhotoSlotDef[]) => onChange(steps, next);

  const updateStep = (i: number, patch: Partial<ChecklistStep>) =>
    setSteps(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const updateField = (si: number, fi: number, patch: Partial<ChecklistFieldDef>) =>
    updateStep(si, { fields: steps[si].fields.map((f, idx) => (idx === fi ? { ...f, ...patch } : f)) });

  const addStep = () =>
    setSteps([...steps, { id: uniqueId(`etapa_${steps.length + 1}`, steps.map(s => s.id)), title: `Etapa ${steps.length + 1}`, fields: [] }]);

  const addField = (si: number) => {
    const id = uniqueId("novo_campo", allFieldIds);
    updateStep(si, { fields: [...steps[si].fields, { id, label: "Novo campo", type: "text", required: false }] });
  };

  const addSlot = () =>
    setSlots([...photoSlots, { id: uniqueId(`foto_${photoSlots.length + 1}`, photoSlots.map(p => p.id)), title: "Nova foto", instruction: "", required: true }]);

  return (
    <Tabs defaultValue="steps" className="w-full">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="steps"><ListChecks className="h-4 w-4 mr-1.5" />Etapas ({steps.length})</TabsTrigger>
        <TabsTrigger value="photos"><Camera className="h-4 w-4 mr-1.5" />Fotos ({photoSlots.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="steps" className="space-y-3 mt-3">
        {steps.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma etapa ainda. Adicione a primeira etapa do checklist.</p>
        )}
        {steps.map((step, si) => (
          <div key={step.id} className="border rounded-lg p-3 space-y-3 bg-card">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="shrink-0">{si + 1}</Badge>
              <Input
                aria-label="Título da etapa"
                value={step.title}
                onChange={e => updateStep(si, { title: e.target.value })}
                className="font-medium"
              />
              <Button size="icon" variant="ghost" aria-label="Subir etapa" onClick={() => setSteps(move(steps, si, -1))}><ArrowUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Descer etapa" onClick={() => setSteps(move(steps, si, 1))}><ArrowDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Excluir etapa" onClick={() => setSteps(steps.filter((_, i) => i !== si))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            <Input
              placeholder="Aviso para o técnico nesta etapa (opcional)"
              value={step.notice || ""}
              onChange={e => updateStep(si, { notice: e.target.value || undefined })}
            />

            <div className="space-y-2">
              {step.fields.map((field, fi) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  otherFields={steps.flatMap(s => s.fields).filter(f => f.id !== field.id && OPTION_TYPES.includes(f.type))}
                  onChange={patch => updateField(si, fi, patch)}
                  onUp={() => updateStep(si, { fields: move(step.fields, fi, -1) })}
                  onDown={() => updateStep(si, { fields: move(step.fields, fi, 1) })}
                  onDelete={() => updateStep(si, { fields: step.fields.filter((_, i) => i !== fi) })}
                />
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => addField(si)}>
              <Plus className="h-4 w-4 mr-1" />Adicionar campo
            </Button>
          </div>
        ))}
        <Button onClick={addStep} variant="secondary" className="w-full">
          <Plus className="h-4 w-4 mr-1" />Adicionar etapa
        </Button>
      </TabsContent>

      <TabsContent value="photos" className="space-y-2 mt-3">
        {photoSlots.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma foto definida. Cada foto aqui vira um espaço com título fixo na demanda.</p>
        )}
        {photoSlots.map((slot, i) => (
          <div key={slot.id} className="border rounded-lg p-3 space-y-2 bg-card">
            <div className="flex items-center gap-2">
              <Input
                aria-label="Título da foto"
                value={slot.title}
                onChange={e => setSlots(photoSlots.map((p, idx) => idx === i ? { ...p, title: e.target.value } : p))}
              />
              <Button size="icon" variant="ghost" aria-label="Subir foto" onClick={() => setSlots(move(photoSlots, i, -1))}><ArrowUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Descer foto" onClick={() => setSlots(move(photoSlots, i, 1))}><ArrowDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Excluir foto" onClick={() => setSlots(photoSlots.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            <Input
              placeholder="Instrução (ex: foto do quadro aberto, mostrando os disjuntores)"
              value={slot.instruction}
              onChange={e => setSlots(photoSlots.map((p, idx) => idx === i ? { ...p, instruction: e.target.value } : p))}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={slot.required}
                onCheckedChange={v => setSlots(photoSlots.map((p, idx) => idx === i ? { ...p, required: v } : p))}
              />
              <Label className="text-sm">Obrigatória</Label>
            </div>
          </div>
        ))}
        <Button onClick={addSlot} variant="secondary" className="w-full">
          <Plus className="h-4 w-4 mr-1" />Adicionar foto
        </Button>
      </TabsContent>
    </Tabs>
  );
};

interface FieldEditorProps {
  field: ChecklistFieldDef;
  otherFields: ChecklistFieldDef[];
  onChange: (patch: Partial<ChecklistFieldDef>) => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, otherFields, onChange, onUp, onDown, onDelete }) => {
  const condField = otherFields.find(f => f.id === field.showIf?.field);
  return (
    <div className="rounded-md border border-dashed p-2.5 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Nome do campo"
          value={field.label}
          onChange={e => onChange({ label: e.target.value })}
          className="flex-1 min-w-[160px]"
        />
        <Select value={field.type} onValueChange={v => onChange({ type: v as ChecklistFieldType })}>
          <SelectTrigger className="w-[170px]" aria-label="Tipo do campo"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(FIELD_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Switch checked={!!field.required} onCheckedChange={v => onChange({ required: v })} aria-label="Obrigatório" />
          <span className="text-xs text-muted-foreground">Obrig.</span>
        </div>
        <div className="flex">
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Subir campo" onClick={onUp}><ArrowUp className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Descer campo" onClick={onDown}><ArrowDown className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Excluir campo" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
        </div>
      </div>

      {OPTION_TYPES.includes(field.type) && (
        <Textarea
          rows={3}
          placeholder="Opções, uma por linha"
          value={(field.options || []).map(o => o.label).join("\n")}
          onChange={e => onChange({ options: linesToOptions(e.target.value) })}
        />
      )}

      {field.type === "binary_list" && (
        <Textarea
          rows={3}
          placeholder="Itens para responder SIM/NÃO, um por linha"
          value={(field.items || []).map(i => i.title).join("\n")}
          onChange={e => {
            const titles = e.target.value.split("\n");
            const taken: string[] = [];
            onChange({
              items: titles.filter(t => t.trim()).map(t => {
                const id = uniqueId(t, taken); taken.push(id);
                return { id, title: t.trim() };
              }),
            });
          }}
        />
      )}

      {field.type === "computed" && (
        <Select value={field.compute || ""} onValueChange={v => onChange({ compute: v })}>
          <SelectTrigger aria-label="Cálculo"><SelectValue placeholder="Escolha o cálculo" /></SelectTrigger>
          <SelectContent>
            {Object.keys(computations).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {["text", "textarea", "number"].includes(field.type) && (
        <Input
          placeholder="Texto de exemplo (opcional)"
          value={field.placeholder || ""}
          onChange={e => onChange({ placeholder: e.target.value || undefined })}
        />
      )}

      {otherFields.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Mostrar só quando</span>
          <Select
            value={field.showIf?.field || "__always"}
            onValueChange={v => onChange({ showIf: v === "__always" ? undefined : { field: v, in: [] } })}
          >
            <SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__always">Sempre visível</SelectItem>
              {otherFields.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {condField && (
            <>
              <span className="text-muted-foreground">for</span>
              {(condField.options || []).map(o => {
                const active = field.showIf?.in.includes(o.value);
                return (
                  <Badge
                    key={o.value}
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => onChange({
                      showIf: {
                        field: condField.id,
                        in: active ? field.showIf!.in.filter(x => x !== o.value) : [...(field.showIf?.in || []), o.value],
                      },
                    })}
                  >{o.label}</Badge>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};
