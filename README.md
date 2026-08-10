# PUBLI SCREEN — REINICIO v0.8.1

## Recuperar una TV ya vinculada

La televisión ahora muestra siempre un `Código TV` de seis dígitos de forma discreta.

Si el teléfono pierde la sesión del navegador:

1. Abre `admin.html`.
2. Escribe el Código TV que aparece en la televisión.
3. Pulsa `Vincular televisión`.

La app vuelve a tomar control de la MISMA pantalla de Supabase.

No se borran:
- ofertas;
- avisos;
- imágenes;
- fondos;
- temas;
- configuración;
- lista de reproducción.

La vinculación genera un nuevo `control_token` para el teléfono, pero conserva el mismo
registro de pantalla y todo el contenido asociado.

## Supabase
No requiere SQL nuevo.

Commit sugerido:
`PUBLI SCREEN reinicio v0.8.1 - Recuperacion de TV`
