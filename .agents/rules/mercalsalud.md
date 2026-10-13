---
trigger: always_on
---

Siempre usar PNPM y no NPM
Escribir codigo limpio
cumplir con los principios SOLID
Validar siempre con PNPM run build y tsc --noEmit para confirmar que no hay errores.
Evitar los typos ANY

hay una regla muy importante que mantengo siempre en Desarrollo y no es crear migraciones incrementales, es decir si se requiere agregar un nuevo campo, se modifica la original "create" y se vuelve a correr migrate:fresh --seed, eso para mantener limpio todo el repositorio
