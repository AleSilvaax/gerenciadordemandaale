# Architecture rules
- Client tracking uses unguessable per-service links and a server-side response with explicit fields and temporary photo URLs; never make service records publicly readable.
- Store signatures, feedback and technical fields as JSON objects, while normalizing legacy JSON strings when reading.
- Signature capture opens in a viewport-filling dialog; store trimmed PNG evidence so saved signatures remain legible.
- Photo annotations save a separate evidence image through the existing photo upload flow, preserving the original photo.
- Guided checklists live in service_types.checklist_steps / photo_slots (JSONB, optional); types without them keep the flat TechnicalFieldsManager. Answers persist in services.custom_fields with a `step` tag per field. Automatic calculations are registered by key in src/templates/computations.ts; the native EV charger template is defined in src/templates/evChargerTemplate.ts.
- Resolve service checklists by service_type_id, using organization-scoped name lookup only for legacy records; never mix equally named types across organizations.
- Persist photo evidence before creating display URLs; guard detail fetches against newer photo state and never replace uploads with a delayed reload.
- Use public/manifest.webmanifest as the PWA metadata source read by Vite; derive all install and favicon sizes from the same square logo to prevent divergent icons.
