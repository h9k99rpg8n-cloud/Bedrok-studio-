# Bedrock Studio 3.1 Beta 1

Actualización de estabilidad y diagnóstico, preparada sobre la línea 3.0 Beta 4.1.

## Correcciones

- El diagnóstico de UUID duplicados ahora utiliza una acción específica para regenerar los UUID del Behavior Pack y Resource Pack, y guarda los cambios en el proyecto.
- La reparación de identificadores duplicados busca un sufijo libre y evita depender de un número aleatorio que podría repetirse.
- La validación detecta valores no finitos en iluminación y tiempo de destrucción; la reparación aplica valores de respaldo seguros.
- El diagnóstico ya no afirma que un paquete está «100% verificado y compatible» solo porque no encuentre incidencias en sus comprobaciones.

## Compatibilidad y seguridad

- Se conserva la estructura existente de proyectos y el almacenamiento local.
- La actualización se prepara en una rama independiente; la rama principal no se modifica.
- La ausencia de incidencias en el diagnóstico no sustituye las pruebas de importación y funcionamiento dentro de Minecraft Bedrock.

## Verificación pendiente

Ejecutar `bun run lint` y `bun run build` en el entorno del proyecto antes de integrar esta rama.
