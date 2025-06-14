
-- 1. Criar tabela de campos técnicos personalizados vinculados ao tipo de serviço
create table public.technical_fields (
  id uuid primary key default gen_random_uuid(),
  service_type_id uuid not null references service_types(id) on delete cascade,
  name text not null,
  description text,
  type text not null, -- 'text', 'number', 'select', 'boolean', 'date', 'textarea'
  required boolean not null default false,
  options jsonb, -- array de strings para o tipo 'select', pode ser nulo para outros tipos
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- 2. Habilitar RLS para technical_fields
alter table public.technical_fields enable row level security;

-- 3. Permitir leitura/autoria para admins e gestores, leitura para técnicos
create policy "Somente logados podem ver campos" on public.technical_fields
  for select using (auth.uid() is not null);

create policy "Admins e gestores podem criar e editar campos técnicos" on public.technical_fields
  for all to authenticated
  using (public.get_current_user_role() in ('administrador', 'gestor'))
  with check (public.get_current_user_role() in ('administrador', 'gestor'));

-- 4. Adicionar exemplos para testes
insert into public.technical_fields (service_type_id, name, type, required, options, description)
select id, 'Equipamento', 'text', true, null, null from service_types where name = 'Manutenção' limit 1;

insert into public.technical_fields (service_type_id, name, type, required, options, description)
select id, 'Modelo', 'text', true, null, null from service_types where name = 'Manutenção' limit 1;

insert into public.technical_fields (service_type_id, name, type, required, options, description)
select id, 'Tipo de Manutenção', 'select', true, '["Preventiva","Corretiva","Preditiva"]'::jsonb, null from service_types where name = 'Manutenção' limit 1;
