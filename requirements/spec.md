# Reto — Sistema de aprobación de gastos

## Contexto

Una empresa quiere digitalizar el proceso mediante el cual sus empleados presentan gastos profesionales para su aprobación. La aplicación debe presentar solicitudes, aplicar reglas automáticas, permitir decisiones manuales, registrar cada resolución y notificar al empleado.

## Reglas de negocio

Cada solicitud contiene un identificador, empleado, descripción, categoría, importe en euros, fecha de presentación y estado.

Categorías admitidas: `travel`, `meals`, `equipment`, `training` y `personal`.

1. El importe debe ser mayor que cero y la descripción no puede estar vacía.
2. Los gastos `personal` se rechazan automáticamente.
3. Los gastos de hasta 100 euros se aprueban automáticamente, salvo categoría prohibida.
4. Los gastos superiores a 100 euros y de hasta 1.000 euros requieren rol `manager`.
5. Los gastos superiores a 1.000 euros requieren rol `finance`.
6. Nadie puede resolver su propia solicitud.
7. Solo el rol requerido puede aprobar o rechazar.
8. Una solicitud resuelta no puede volver a resolverse.
9. Toda decisión registra actor, fecha, resultado y motivo en rechazos manuales.
10. Cuando una solicitud queda resuelta, el empleado debe recibir una notificación.

Los importes se expresan en céntimos de euro.

## Casos de uso obligatorios

- `SubmitExpense`: crea la solicitud y aplica la política automática.
- `ApproveExpense`: aprueba una solicitud pendiente si actor y rol son válidos.
- `RejectExpense`: rechaza una solicitud pendiente y exige un motivo.

## Escenarios de aceptación

- Un gasto de comidas de 45 euros queda aprobado automáticamente.
- Un gasto de formación de 600 euros queda pendiente de `manager`.
- Un equipo de 1.500 euros queda pendiente de `finance`.
- Un gasto personal de 20 euros queda rechazado automáticamente.
- Un `manager` no puede resolver una solicitud que requiere `finance`.
- El empleado no puede resolver su propia solicitud.
- Una solicitud aprobada o rechazada conserva su decisión original.
- Un rechazo manual sin motivo no modifica la solicitud.

## Restricciones técnicas

- TypeScript con `strict: true` y cero `any`.
- Bun o Node.js.
- El dominio no depende de HTTP, frameworks, bases de datos ni SDKs.
- Los casos de uso reciben contratos propios de aplicación.
- Persistencia, notificaciones, fecha e identidad se representan mediante ports.
- Debe existir persistencia y notificaciones en memoria.
- Los resultados esperables se modelan explícitamente.
- La composición de implementaciones es visible.
- Deben probarse dominio, casos de uso y traducción HTTP.

## Reflexión de producción

La entrega debe explicar qué ocurriría si la solicitud se guarda correctamente pero falla el envío de la notificación. No es obligatorio implementar una transactional outbox.

## Fuera de alcance

Interfaz gráfica, autenticación real, subida de recibos, otras monedas, base de datos real, emails reales y aprobaciones multinivel.

## Evaluación

| Área | Peso |
| --- | ---: |
| Reglas de negocio | 30 % |
| Modelo de dominio | 20 % |
| Casos de uso, ports y dependencias | 20 % |
| Adapters y composición | 10 % |
| Tests | 15 % |
| Uso razonado y verificación de IA | 5 % |
