# SALON OPERATION REQUIREIREQUIREMENTS

> Fuente: Operación real del salón de belleza.
> Fecha: 2026-06-03
> Propósito: Documentar flujos reales para reinterpretarlos correctamente en SendMe Studio.

---

## 1. Flujo real de captación por WhatsApp

### Cómo funciona hoy

1. Cliente escribe por WhatsApp.
2. Recepcionista pregunta: _"¿Qué horario te acomoda?"_
3. Cliente responde una hora aproximada.
4. Recepcionista valida disponibilidad mientras conversa.
5. Recepcionista pide:
   - nombre
   - teléfono
   - servicio
   - hora deseada
6. Recepcionista abre **AgendaPro** en el computador.
7. Selecciona hora disponible.
8. Ingresa datos del cliente.
9. Confirma la reserva.
10. **AgendaPro** notifica al estilista en la app AgendaPro Business.
11. El estilista solo se informa. No existe feedback tipo _"ok, recibido"_.
12. Al cliente le llega WhatsApp automático desde AgendaPro.
13. El cliente no necesariamente confirma en ese momento.

### Interpretación para SendMe Studio

SendMe Studio debe crear un **flujo de recepcionista IA/asistida** que pueda:

- detectar intención de agendar
- pedir datos faltantes
- sugerir horarios
- preparar una reserva
- dejar listo para confirmación humana o integración con AgendaPro
- registrar estado del cliente en WhatsApp

### Estados sugeridos del cliente en flujo de agendamiento

| Estado | Descripción |
|--------|-------------|
| `interesado` | Cliente manifestó intención de agendar |
| `datos_solicitados` | Se pidieron nombre, teléfono, servicio, hora |
| `horario_propuesto` | Se sugirió un horario disponible |
| `pendiente_confirmacion` | Cliente no ha confirmado aún |
| `agendado` | Cita creada en el sistema |
| `recordatorio_enviado` | Se envió recordatorio 1h antes |
| `confirmado` | Cliente confirmó asistencia |
| `asistio` | Cliente llegó a la cita |
| `no_asistio` | Cliente no se presentó |

---

## 2. Recordatorio una hora antes

### Operación actual

Una persona del salón, Betzi, escribe por WhatsApp una hora antes de la cita para recordar al cliente.

**Motivo:** Muchos clientes olvidan que tenían hora tomada.

### Interpretación para SendMe Studio

Crear **módulo de recordatorios**:

- enviar recordatorio automático o asistido **1 hora antes**
- mensaje por WhatsApp
- botón/acción de confirmación
- estado visible en CRM

**Ejemplo de mensaje:**

> Hola {{nombre}} ✨ Te recordamos tu hora de hoy a las {{hora}} para {{servicio}}. ¿Confirmas tu asistencia?

### Estados visuales del recordatorio

| Color | Significado | Estado |
|-------|-------------|--------|
| 🟡 Amarillo | Confirmó asistencia | `confirmado` |
| 🟣 Morado | Asistió | `asistio` |
| 🟠 Naranjo | No asistió | `no_asistio` |
| ⚪ Gris | Pendiente / sin respuesta | `pendiente` |

> Nota: Los colores actuales de AgendaPro están mal configurados según el salón, pero sirven como referencia operacional.

---

## 3. Flujo de agenda y sobrecupo

### Operación actual

AgendaPro permite:
- ver profesionales
- ver horas tomadas
- ver espacios libres
- seleccionar una hora
- **agendar sobre otra hora** si se necesita hacer sobrecupo

### Interpretación para SendMe Studio

El calendario futuro debe considerar:

- profesionales por columna
- bloques de hora
- citas tomadas
- espacios disponibles
- opción de **sobrecupo manual con advertencia**
- vista día como prioridad

**Regla:** No bloquear sobrecupo completamente. Debe existir permiso/confirmación manual.

---

## 4. Registro de pago por servicio

### Operación actual

En AgendaPro:
1. Se selecciona la cita
2. Se presiona **pagar**
3. El sistema muestra el total del servicio (preconfigurado)
4. La recepcionista ingresa método de pago:
   - efectivo
   - crédito
   - débito
   - transferencia
   - otros
5. No se paga directamente en la web — solo se **registra cómo pagó** el cliente

AgendaPro luego permite ver:
- ventas del mes
- cuánto fue en crédito
- cuánto fue en efectivo
- etc.

### Interpretación para SendMe Studio

Crear **módulo financiero básico** que registre:

| Campo | Descripción |
|-------|-------------|
| servicio | Servicio realizado |
| profesional | Quién atendió |
| monto | Total pagado |
| método de pago | efectivo, crédito, débito, transferencia, otro |
| fecha | Fecha del pago |
| cliente | Cliente que pagó |
| observación | Nota opcional |

**KPIs del módulo financiero:**

- total vendido hoy
- total vendido mes
- ventas por método de pago
- ventas por profesional
- ticket promedio
- servicios más vendidos

---

## 5. Venta de productos a clientes

### Problema real

El salón **no sabe**:
- qué productos se vendieron
- quién los vendió
- a qué cliente
- qué comisión corresponde al profesional

### Regla de negocio

Cada profesional gana **7%** del valor del producto vendido.

### Interpretación para SendMe Studio

Crear **módulo de venta de productos**:

| Campo | Descripción |
|-------|-------------|
| producto | Nombre del producto |
| código / SKU | Identificador único |
| precio venta público | Precio al cliente final |
| stock actual | Cantidad disponible |
| profesional que vendió | Quién realizó la venta |
| cliente | A quién se vendió |
| cantidad | Unidades vendidas |
| método de pago | efectivo, crédito, débito, transferencia |
| comisión automática | 7% calculado automáticamente |
| descuento automático de inventario | Stock se reduce al vender |

**KPIs del módulo de venta de productos:**

- productos vendidos hoy
- productos vendidos mes
- comisión por profesional
- stock bajo (productos por debajo de mínimo)
- productos más vendidos
- ventas por profesional
- margen (si se agrega costo)

---

## 6. Venta/entrega de insumos a estilistas

### Problema real

Existe otra rama: **venta o entrega de productos/insumos a estilistas**.

No saben cuánto se le ha pasado a cada estilista.

**Importante:** Se entrega producto completo, no por gramos.

### Interpretación para SendMe Studio

Crear **módulo de insumos para profesionales**:

| Campo | Descripción |
|-------|-------------|
| producto/insumo | Nombre del insumo |
| código / SKU | Identificador único |
| profesional | A quién se entrega |
| cantidad entregada | Unidades entregadas |
| precio interno o costo | Precio al profesional |
| fecha | Fecha de entrega |
| observación | Nota opcional |
| descuento de stock | Stock se reduce al entregar |

### Diferenciación crítica

| Tipo | Comisión 7% | Afecta ventas | Afecta stock |
|------|:-----------:|:-------------:|:------------:|
| **A) Venta a cliente** | ✅ Sí | ✅ Sí | ✅ Sí |
| **B) Entrega/venta a estilista** | ❌ No | ❌ No | ✅ Sí |

**B)** Se registra como **consumo interno** o **cargo al profesional**.

---

## 7. Inventario

### Estructura de cada producto

| Campo | Descripción |
|-------|-------------|
| código / SKU | Identificador único |
| nombre | Nombre del producto |
| categoría | Ej: cuidado capilar, maquillaje, etc. |
| stock actual | Cantidad disponible |
| stock mínimo | Alerta cuando se alcanza este nivel |
| precio venta cliente | Precio público |
| precio interno estilista | Precio para el profesional |
| costo | Precio de compra (opcional) |
| activo / inactivo | Si está disponible para venta |

### Tipos de movimiento de inventario

| Movimiento | Descripción |
|------------|-------------|
| `entrada` | Llegada de stock nuevo |
| `venta_cliente` | Venta a cliente final |
| `entrega_estilista` | Entrega/venta a estilista |
| `ajuste_manual` | Corrección de inventario |
| `devolucion` | Producto devuelto |
| `merma` | Producto dañado o perdido |

---

## 8. Módulos nuevos sugeridos (Roadmap)

| # | Módulo | Descripción breve |
|---|--------|-------------------|
| 1 | **Receptionist AI / Agenda Assistant** | Flujo IA para captar y agendar clientes por WhatsApp |
| 2 | **Appointment Reminder System** | Recordatorio automático 1h antes con confirmación |
| 3 | **Attendance Tracking** | Seguimiento de asistencia con estados visuales |
| 4 | **Payment Register** | Registro de pagos por servicio |
| 5 | **Product Sales** | Venta de productos a clientes con comisión 7% |
| 6 | **Professional Commissions** | Cálculo y reporte de comisiones |
| 7 | **Inventory** | Gestión de stock, movimientos y alertas |
| 8 | **Stylist Supplies** | Entrega/venta de insumos a estilistas |
| 9 | **Monthly Finance Summary** | Resumen financiero mensual |

---

## 9. Prioridad recomendada

```
Fase 1: Documentar flujo y crear modelos/types  ← ESTAMOS AQUÍ
Fase 2: Crear módulo de inventario simple
Fase 3: Crear venta de productos con comisión 7%
Fase 4: Crear recordatorio de citas 1 hora antes
Fase 5: Crear integración agenda / recepcionista IA
```

---

## 10. Principio arquitectónico

> **AgendaPro** = agenda operativa actual (citas, horarios, notificaciones básicas).
> **SendMe Studio** = capa inteligente: CRM + ventas + WhatsApp + memoria + campañas + IA.

SendMe Studio debe **complementar y superar las brechas reales**:

- seguimiento de clientes post-cita
- recordatorios inteligentes con confirmación
- campañas de marketing automatizadas
- venta de productos con comisión
- inventario con alertas
- inteligencia comercial (qué funciona, qué no)

No reemplazar AgendaPro — **añadir valor donde AgendaPro no llega**.
