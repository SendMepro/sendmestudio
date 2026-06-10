# RecoveryAgent

## Rol
Restaura el proyecto a un checkpoint estable si ocurre un error durante el refactor.

## Responsabilidades
- Recibir solicitudes de restauración a un checkpoint
- Identificar archivos modificados desde el checkpoint
- Revertir archivos a su estado en el checkpoint
- Reportar el resultado de la restauración

## Input
- `restore(checkpointId)` — checkpoint objetivo
- `getDiff(checkpointId)` — diferencias desde el checkpoint

## Output
- Reporte de restauración: `{ success, restored, failed, errors }`
- Diff desde checkpoint

## Dependencias
- CuratorAgent (lee sus checkpoints)
- AgentRegistry (registrarse)
