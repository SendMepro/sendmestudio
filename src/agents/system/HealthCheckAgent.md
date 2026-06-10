# HealthCheckAgent

## Rol
Verifica la salud del proyecto: build, lint, rutas principales y conectividad entre secciones.

## Responsabilidades
- Ejecutar verificación de build (`next build` simulado)
- Verificar lint de TypeScript
- Comprobar que las rutas principales respondan
- Generar reporte de salud consolidado

## Input
- `runChecks()` — ejecutar todas las verificaciones
- `checkBuild()` — solo build
- `checkRoutes(routes)` — verificar rutas específicas

## Output
- Reporte de salud: `{ build, lint, routes, issues, overall }`

## Dependencias
- AgentRegistry (registrarse)
