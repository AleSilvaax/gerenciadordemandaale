import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { TechnicalFieldsManager } from '@/components/ui-custom/TechnicalFieldsManager';
import type { Photo } from '@/components/ui-custom/PhotoUploader';
import type { ChecklistTemplate } from '@/types/checklist';
import type { CustomField } from '@/types/serviceTypes';
import { GuidedChecklist } from './GuidedChecklist';
import { EV_TEMPLATE_NAME, evChargerTemplate } from '@/templates/evChargerTemplate';

interface ChecklistSectionProps {
  serviceType: string;
  currentFields: Array<{ id: string; value: unknown }>;
  photos: Photo[];
  serviceId: string;
  onFieldsUpdate: (fields: CustomField[]) => Promise<void> | void;
  onPhotosChange: (photos: Photo[]) => void;
  disabled?: boolean;
}

/**
 * Decide o modo de checklist do tipo de serviço:
 * - tipo com etapas guiadas (checklist_steps) → wizard com slots de fotos;
 * - demais tipos → campos técnicos simples, como antes.
 */
export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  serviceType,
  currentFields,
  photos,
  serviceId,
  onFieldsUpdate,
  onPhotosChange,
  disabled = false,
}) => {
  const [template, setTemplate] = useState<ChecklistTemplate | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await supabase
          .from('service_types')
          .select('checklist_steps, photo_slots')
          .eq('name', serviceType)
          .limit(1)
          .maybeSingle();

        if (!active) return;
        if (data?.checklist_steps && Array.isArray(data.checklist_steps)) {
          setTemplate({
            steps: data.checklist_steps as unknown as ChecklistTemplate['steps'],
            photoSlots: Array.isArray(data.photo_slots)
              ? (data.photo_slots as unknown as ChecklistTemplate['photoSlots'])
              : [],
          });
        } else if (serviceType === EV_TEMPLATE_NAME) {
          // Template nativo: funciona mesmo sem seed no banco
          setTemplate(evChargerTemplate);
        } else {
          setTemplate(null);
        }
      } catch {
        if (active) setTemplate(serviceType === EV_TEMPLATE_NAME ? evChargerTemplate : null);
      }
    };
    load();
    return () => { active = false; };
  }, [serviceType]);

  if (template === undefined) {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  if (template === null) {
    return (
      <TechnicalFieldsManager
        serviceType={serviceType}
        currentFields={currentFields as never}
        onFieldsUpdate={onFieldsUpdate as never}
      />
    );
  }

  return (
    <GuidedChecklist
      template={template}
      savedFields={currentFields}
      photos={photos}
      serviceId={serviceId}
      onFieldsUpdate={onFieldsUpdate}
      onPhotosChange={onPhotosChange}
      disabled={disabled}
    />
  );
};
