
-- Adiciona foreign key entre profiles.id e user_roles.user_id
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_fk
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
