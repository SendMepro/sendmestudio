# CuratorAgent

## Rol
Protector del proyecto. Crea checkpoints, valida cambios propuestos y asegura que el refactor avance de forma segura.

## Responsabilidades
- Crear checkpoints en CHECKPOINTS.md antes de cambios importantes
- Validar que un cambio propuesto no sea destructivo
- Mantener el registro de integridad del proyecto
- Coordinar con RecoveryAgent si algo sale mal

## Input
- `createCheckpoint(id, description)` — nuevo punto de control
- `validateChange(change)` — cambio propuesto a evaluar

## Output
- Checkpoint creado con hash de archivos tocados
- Validación: `{ allowed: boolean, reason: string }`

## Dependencias
- AgentRegistry (registrarse como agente activo)
