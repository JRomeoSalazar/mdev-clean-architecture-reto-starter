# Reto de Clean Architecture: sistema de aprobación de gastos

Este repositorio contiene el punto de partida del reto final del curso. Incluye el enunciado, los escenarios de aceptación y una configuración TypeScript estricta, pero no propone una estructura arquitectónica.

## Requisitos

- Bun 1.2 o posterior.
- Un editor con soporte para TypeScript.

## Preparación

```bash
bun install --frozen-lockfile
```

Lee primero [`ENUNCIADO.md`](./ENUNCIADO.md) y los escenarios de [`requirements/expense-approval.feature`](./requirements/expense-approval.feature).

## Comandos disponibles

```bash
bun run typecheck
bun test
bun run start
```

Al comenzar, los tres comandos pueden no producir un resultado útil porque todavía no existe implementación. Deben funcionar al completar el reto.

## Entrega esperada

La solución debe incluir:

1. Un modelo de dominio que proteja las reglas y transiciones.
2. Los casos de uso `SubmitExpense`, `ApproveExpense` y `RejectExpense`.
3. Ports para persistencia, notificaciones, fecha e identidad.
4. Adapters en memoria y una traducción HTTP explícita.
5. Un composition root visible.
6. Tests de dominio, aplicación y controllers.
7. Una explicación breve sobre el fallo de notificación después de persistir.

## Restricciones

- TypeScript estricto y cero `any`.
- El dominio no depende de HTTP, frameworks, bases de datos ni SDKs.
- Valida la forma de los datos en los bordes y protege las reglas en el dominio.
- Modela explícitamente los resultados esperables.

No existe una única distribución correcta de carpetas. Se evaluará quién toma cada decisión y hacia dónde apuntan las dependencias.
