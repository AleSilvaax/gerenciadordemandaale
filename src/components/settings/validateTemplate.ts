import type { ChecklistStep, PhotoSlotDef } from "@/types/checklist";

/** Retorna a primeira inconsistência do checklist, ou null se estiver pronto para salvar. */
export function validateTemplate(steps: ChecklistStep[], slots: PhotoSlotDef[]): string | null {
  if (steps.length === 0) return "Adicione ao menos uma etapa.";
  for (const s of steps) {
    if (!s.title.trim()) return "Todas as etapas precisam de título.";
    if (s.fields.length === 0) return `A etapa "${s.title}" não tem campos.`;
    for (const f of s.fields) {
      if (!f.label.trim()) return `Há um campo sem nome na etapa "${s.title}".`;
      if (["select", "pills", "cards"].includes(f.type) && !f.options?.length)
        return `O campo "${f.label}" precisa de opções.`;
      if (f.type === "binary_list" && !f.items?.length)
        return `O campo "${f.label}" precisa de itens SIM/NÃO.`;
      if (f.type === "computed" && !f.compute)
        return `Escolha o cálculo do campo "${f.label}".`;
    }
  }
  for (const p of slots) {
    if (!p.title.trim()) return "Todas as fotos precisam de título.";
  }
  return null;
}
