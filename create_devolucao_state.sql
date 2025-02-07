create table public.devolucao_state (
  id uuid not null default gen_random_uuid (),
  user_id uuid null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  state jsonb null,
  constraint devolucao_state_pkey primary key (id),
  constraint fk_user foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;
