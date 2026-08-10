# PUBLI SCREEN — REINICIO v0.8.2

## Vinculación corregida

Se corrige un error introducido en v0.8:

La TV recibía el cambio `is_linked = true` desde Supabase, pero no ejecutaba
`enterLinkedMode()`. Por eso permanecía en “Esperando conexión…” aunque el
código fuera correcto.

Ahora:

1. La TV muestra su código.
2. Se escribe el código en admin.html.
3. Supabase marca la pantalla como vinculada.
4. La TV detecta el cambio en tiempo real.
5. La TV cierra automáticamente la pantalla de vinculación.
6. Carga la playlist existente y continúa mostrando la cartelera.

También conserva la recuperación de TV de v0.8.1.

## No se modifica
- Ofertas
- Avisos
- Imágenes
- Fondos
- Temas
- Carrusel continuo
- Resumen
- Duraciones
- Supabase

No requiere SQL nuevo.

Commit sugerido:
`PUBLI SCREEN reinicio v0.8.2 - Vinculacion corregida`
