-- PUBLI SCREEN v0.5
-- Agrega texto de llamado a la acción para publicaciones tipo AVISO.
-- No elimina ni modifica datos existentes.
alter table public.screen_playlist_items
add column if not exists cta_text text not null default '';
