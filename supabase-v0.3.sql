-- PUBLI SCREEN REINICIO v0.3
alter table public.screens
add column if not exists display_settings jsonb not null default '{}'::jsonb;
