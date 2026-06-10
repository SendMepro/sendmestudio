# project-memory / ERRORS.md

## Errores Encontrados

### Fase 0 - Inspección

#### 1. Error al crear directorio con espacios en Windows
- **Archivo**: N/A (problema de entorno)
- **Error**: `El nombre de archivo, el nombre de directorio o la sintaxis de la etiqueta del volumen no son correctos.`
- **Causa**: El directorio del proyecto contiene espacios (`SENDME STUDIO`) y el shell cmd.exe de Windows no maneja correctamente las rutas con espacios desde JCode.
- **Solución temporal**: Usar el nombre corto 8.3 (`SENDME~1`) o usar el tool `write` para crear archivos directamente.
- **Estado**: Workaround aplicado.

#### 2. Node MCP REPL sin permisos de escritura
- **Archivo**: N/A (problema de sandbox MCP)
- **Error**: `EPERM: operation not permitted, mkdir`
- **Causa**: El Node REPL del MCP server ejecuta en un contexto sandbox sin permisos de escritura al sistema de archivos.
- **Solución temporal**: Usar el tool `bash` con cmd.exe y nombres cortos, o el tool `write` para archivos.
- **Estado**: Workaround aplicado.

## Errores Conocidos del Proyecto (pre-existentes)

| ID | Error | Archivo | Estado |
|----|-------|---------|--------|
| BUG-001 | Duplicado visual de mensajes enviados en Inbox (optimistic UI) | `inbox/page.tsx` | ⚠️ Pendiente |
| BUG-002 | Outbound media CRM → WhatsApp puede fallar | `whatsapp/sender.ts` | ⚠️ Pendiente |
| BUG-003 | Botón enviar sin bloqueo de doble click | `inbox/page.tsx` | ⚠️ Pendiente |
| BUG-004 | Campaign History sin KPIs reales | `campaigns/page.tsx` | ⚠️ Pendiente |
