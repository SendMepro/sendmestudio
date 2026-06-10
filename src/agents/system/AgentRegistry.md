# AgentRegistry

## Rol
Registro central de todos los agentes del sistema. Mantiene un catálogo vivo de agentes, sus responsabilidades, inputs y outputs.

## Responsabilidades
- Registrar agentes nuevos en el sistema
- Responder consultas sobre agentes existentes
- Mantener un inventario actualizado (nombre, fase, estado, dependencias)
- Exponer metadatos: `{ name, phase, status, dependencies, inputs, outputs }`

## Input
- `registerAgent(agentDef)` — definición de un nuevo agente
- `getAgent(name)` — consultar un agente
- `listAgents(phase?)` — listar por fase opcional

## Output
- Confirmación de registro
- Ficha de agente consultado
- Lista de agentes filtrable

## Dependencias
- Ninguno (es el primer agente del sistema)
