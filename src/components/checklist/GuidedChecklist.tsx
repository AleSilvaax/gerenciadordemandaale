import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building, Building2, Camera, Check, ChevronLeft, ChevronRight, Home,
  Loader2, Play, Save, Store, Truck, Zap, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type {
  ChecklistAnswers, ChecklistFieldDef, ChecklistStep, ChecklistTemplate,
} from '@/types/checklist';
import { computations } from '@/templates/computations';
import type { CustomField } from '@/types/serviceTypes';
import { PhotoSlots } from './PhotoSlots';
import type { Photo } from '@/components/ui-custom/PhotoUploader';

const CARD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home, building: Building, buildings: Building2,
  store: Store, zap: Zap, truck: Truck,
};

interface GuidedChecklistProps {
  template: ChecklistTemplate;
  /** respostas salvas em services.custom_fields */
  savedFields: Array<{ id: string; value: unknown }>;
  photos: Photo[];
  serviceId: string;
  onFieldsUpdate: (fields: CustomField[]) => Promise<void> | void;
  onPhotosChange: (photos: Photo[]) => void;
  disabled?: boolean;
}

const isEmpty = (v: unknown): boolean =>
  v === undefined || v === null || v === '' || (typeof v === 'object' && Object.keys(v as object).length === 0);

const matchesRule = (rule: { field: string; in: string[] } | undefined, answers: ChecklistAnswers): boolean =>
  !rule || rule.in.includes(String(answers[rule.field] ?? ''));

export const GuidedChecklist: React.FC<GuidedChecklistProps> = ({
  template,
  savedFields,
  photos,
  serviceId,
  onFieldsUpdate,
  onPhotosChange,
  disabled = false,
}) => {
  const [answers, setAnswers] = useState<ChecklistAnswers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const manuallyEdited = useRef<Set<string>>(new Set());

  // Restaura respostas salvas
  useEffect(() => {
    const restored: ChecklistAnswers = {};
    for (const field of savedFields || []) {
      if (field?.id && !isEmpty(field.value)) {
        restored[field.id] = field.value;
        manuallyEdited.current.add(field.id);
      }
    }
    setAnswers(restored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(savedFields)]);

  const setAnswer = (id: string, value: unknown, manual = true) => {
    if (manual) manuallyEdited.current.add(id);
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const computedValue = (field: ChecklistFieldDef): string | number => {
    if (!field.compute || !computations[field.compute]) return '';
    return computations[field.compute].compute(answers);
  };

  // Campos calculados editáveis: preenche automaticamente enquanto não houver edição manual
  useEffect(() => {
    const updates: ChecklistAnswers = {};
    for (const step of template.steps) {
      for (const field of step.fields) {
        if (field.type === 'number' && field.compute && !manuallyEdited.current.has(field.id)) {
          const value = computedValue(field);
          if (value !== '' && value !== answers[field.id]) updates[field.id] = value;
        }
      }
    }
    if (Object.keys(updates).length > 0) setAnswers(prev => ({ ...prev, ...updates }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers.config_ligacao, answers.distancia_quadro_carregador, answers.potencia_carregador]);

  const lookupCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data?.erro) return;
      setAnswers(prev => ({
        ...prev,
        logradouro: prev.logradouro || data.logradouro || '',
        bairro: prev.bairro || data.bairro || '',
        cidade_uf: prev.cidade_uf || (data.localidade ? `${data.localidade}/${data.uf}` : ''),
      }));
    } catch {
      // sem preenchimento automático se a consulta falhar
    }
  };

  const totalSteps = template.steps.length + 1; // + aba de fotos
  const isPhotoStep = stepIndex === template.steps.length;
  const currentStep: ChecklistStep | undefined = template.steps[stepIndex];

  const visibleFields = (step: ChecklistStep) =>
    step.fields.filter(f => matchesRule(f.showIf, answers));

  const validateStep = (step: ChecklistStep): string | null => {
    for (const field of visibleFields(step)) {
      if (!field.required) continue;
      const value = answers[field.id];
      if (field.type === 'binary_list') {
        const map = (value as Record<string, string>) || {};
        const missing = (field.items || []).filter(item => !map[item.id]);
        if (missing.length > 0) return `Responda SIM ou NÃO para todos os itens de "${field.label}".`;
      } else if (isEmpty(value)) {
        return `Preencha o campo obrigatório: ${field.label}.`;
      }
    }
    return null;
  };

  const handleNext = () => {
    if (currentStep) {
      const error = validateStep(currentStep);
      if (error) { toast.error(error); return; }
    }
    setStepIndex(i => Math.min(i + 1, totalSteps - 1));
  };

  const buildPayload = (): CustomField[] => {
    const payload: CustomField[] = [];
    for (const step of template.steps) {
      for (const field of step.fields) {
        let value = answers[field.id];
        if (field.type === 'computed') value = computedValue(field);
        if (isEmpty(value)) continue;
        payload.push({ id: field.id, label: field.label, type: field.type, value, step: step.title });
      }
    }
    return payload;
  };

  const handleSave = async () => {
    for (const step of template.steps) {
      const error = validateStep(step);
      if (error) { toast.error(`${step.title}: ${error}`); return; }
    }
    setSaving(true);
    try {
      await onFieldsUpdate(buildPayload());
      toast.success('Checklist salvo com sucesso!');
    } catch {
      toast.error('Não foi possível salvar o checklist.');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: ChecklistFieldDef) => {
    const value = answers[field.id];
    const common = { id: field.id, disabled };

    switch (field.type) {
      case 'text':
        return (
          <Input
            {...common}
            value={String(value ?? '')}
            placeholder={field.placeholder}
            onChange={e => setAnswer(field.id, e.target.value)}
            onBlur={field.id === 'cep' ? e => lookupCep(e.target.value) : undefined}
          />
        );
      case 'number':
        return (
          <div className="flex items-center gap-2">
            {field.compute && computations[field.compute]?.color && (
              <span
                className="h-3.5 w-3.5 rounded-full shrink-0 border border-black/10"
                style={{ backgroundColor: computations[field.compute].color }}
              />
            )}
            <Input
              {...common}
              type="number"
              inputMode="decimal"
              value={value === undefined || value === null ? '' : String(value)}
              onChange={e => setAnswer(field.id, e.target.value === '' ? '' : Number(e.target.value))}
            />
            {field.compute && <span className="text-xs text-muted-foreground whitespace-nowrap">m</span>}
          </div>
        );
      case 'textarea':
        return (
          <Textarea
            {...common}
            value={String(value ?? '')}
            placeholder={field.placeholder}
            rows={3}
            onChange={e => setAnswer(field.id, e.target.value)}
          />
        );
      case 'select':
        return (
          <Select value={String(value ?? '')} onValueChange={v => setAnswer(field.id, v)} disabled={disabled}>
            <SelectTrigger id={field.id}><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {(field.options || []).map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'pills':
        return (
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map(opt => {
              const active = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => setAnswer(field.id, opt.value)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 bg-background hover:border-primary/50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        );
      case 'cards':
        return (
          <div className="grid grid-cols-3 gap-2">
            {(field.options || []).map(opt => {
              const Icon = (opt.icon && CARD_ICONS[opt.icon]) || Home;
              const active = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => setAnswer(field.id, opt.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted-foreground/25 bg-background hover:border-primary/50'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        );
      case 'binary_list': {
        const map = (value as Record<string, string>) || {};
        return (
          <div className="space-y-2">
            {(field.items || []).map(item => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{item.title}</p>
                  {item.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {['SIM', 'NÃO'].map(option => {
                    const active = map[item.id] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={disabled}
                        onClick={() => setAnswer(field.id, { ...map, [item.id]: option })}
                        className={`rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${
                          active
                            ? option === 'SIM'
                              ? 'border-green-600 bg-green-600 text-white'
                              : 'border-red-600 bg-red-600 text-white'
                            : 'border-muted-foreground/30 bg-background'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      }
      case 'timestamp': {
        const formatted = typeof value === 'string' && value
          ? new Date(value).toLocaleString('pt-BR')
          : null;
        return (
          <Button
            type="button"
            variant={formatted ? 'outline' : 'default'}
            disabled={disabled}
            onClick={() => setAnswer(field.id, new Date().toISOString())}
          >
            <Play className="h-4 w-4 mr-2" />
            {formatted ? `Início: ${formatted}` : 'Registrar início da vistoria'}
          </Button>
        );
      }
      case 'computed': {
        const computed = computedValue(field);
        if (isEmpty(computed)) {
          return <p className="text-xs text-muted-foreground">Preencha os campos acima para gerar automaticamente.</p>;
        }
        if (field.compute === 'ev_spec') {
          const parts = String(computed).split(' | ');
          return (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs font-bold text-primary flex items-center gap-1.5 mb-2">
                <Zap className="h-3.5 w-3.5" /> ESPECIFICAÇÃO GERADA
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {parts.map(part => {
                  const [k, ...rest] = part.split(': ');
                  return (
                    <div key={part} className="rounded-md bg-background border px-2 py-1.5">
                      <p className="text-[10px] uppercase text-muted-foreground">{k}</p>
                      <p className="text-xs font-semibold">{rest.join(': ')}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return (
          <div className="rounded-lg bg-muted/60 border px-3 py-2 flex items-center justify-between">
            <span className="text-sm font-semibold">{field.label}</span>
            <span className="text-lg font-bold text-primary">{computed} m</span>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const highlighted = currentStep?.highlightIf && matchesRule(currentStep.highlightIf, answers);

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">Etapa {stepIndex + 1} de {totalSteps}</span>
          <span className="font-semibold text-foreground">
            {isPhotoStep ? 'Fotos da Vistoria' : currentStep?.title}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {[...template.steps.map(s => s.title), 'Fotos'].map((title, idx) => (
            <button
              key={title}
              type="button"
              onClick={() => setStepIndex(idx)}
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                idx === stepIndex
                  ? 'bg-primary text-primary-foreground'
                  : idx < stepIndex
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {idx < stepIndex && <Check className="inline h-3 w-3 mr-0.5" />}
              {title}
            </button>
          ))}
        </div>
      </div>

      {isPhotoStep ? (
        <PhotoSlots
          slots={template.photoSlots}
          photos={photos}
          serviceId={serviceId}
          onPhotosChange={onPhotosChange}
          disabled={disabled}
        />
      ) : currentStep && (
        <div className="space-y-4">
          {currentStep.notice && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5">
              <Camera className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">{currentStep.notice}</p>
            </div>
          )}
          {highlighted && (
            <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs">Imóvel do tipo {String(answers.tipo_imovel)}: os itens de condomínio/apartamento abaixo são prioritários.</p>
            </div>
          )}
          {visibleFields(currentStep).map(field => (
            <div key={field.id} className="space-y-1.5">
              {field.type !== 'computed' && field.type !== 'timestamp' && (
                <Label htmlFor={field.id} className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
              )}
              {renderField(field)}
              {field.help && <p className="text-xs text-muted-foreground italic">{field.help}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Navegação */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex(i => Math.max(i - 1, 0))}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleSave} disabled={saving || disabled}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
          {!isPhotoStep && (
            <Button type="button" size="sm" onClick={handleNext} disabled={disabled}>
              Avançar <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
