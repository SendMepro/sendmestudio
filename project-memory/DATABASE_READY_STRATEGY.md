# Database-Ready Strategy

## Fecha
2026-05-29 @ 23:24 UTC

## Fase
Phase 2.1 — Critical Findings Analysis

## Propósito
Diseñar una arquitectura future-safe donde los agentes **nunca accedan directamente a localStorage ni a la base de datos**, sino que hablen con **repositorios** que usen **adapters intercambiables**.

---

## Principio Arquitectónico

```
UI / Agentes
    │
    ▼
═══════════════════════════════════════
        Repositorios (interfaz)
═══════════════════════════════════════
    │               │               │
    ▼               ▼               ▼
InMemoryAdapter  LocalStorage    DatabaseAdapter
(hoy)            Adapter          (futuro 🔮)
                 (hoy)
```

**Regla de oro:** Los agentes NUNCA deben importar `localStorage`, `fetch`, o `prisma` directamente. Solo hablan con repositorios.

---

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AGENTES                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │HomeOrchestr. │  │HomeDataSource│  │HomeLearning  │  ...otros    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                       │
└─────────┼─────────────────┼─────────────────┼───────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      REPOSITORIOS                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ClientRepository  │  │AppointmentRepo   │  │IntelligenceRepo  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│  ┌────────┴─────────┐  ┌────────┴─────────┐  ┌────────┴─────────┐  │
│  │PlatformHealthRepo│  │ConversationRepo  │  │CampaignRepo      │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
└───────────┼─────────────────────┼─────────────────────┼─────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ADAPTERS (intercambiables)                     │
│                                                                     │
│  ┌────────────────────┐  ┌────────────────────┐  ┌───────────────┐  │
│  │ InMemoryAdapter    │  │ LocalStorageAdapter │  │DatabaseAdapt. │  │
│  │ (hoy — datos en   │  │ (hoy — persistencia │  │(futuro 🔮)    │  │
│  │  memoria volátil)  │  │  en navegador)      │  │               │  │
│  └────────────────────┘  └────────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FUENTES DE DATOS                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ data/*.json│  │localStorage│  │ API Routes │  │ PostgreSQL    │  │
│  │ (archivos) │  │(navegador) │  │ (Next.js)  │  │ (futuro 🔮)   │  │
│  └────────────┘  └────────────┘  └────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Interfaz de Adapter

```typescript
// Ubicación propuesta: src/adapters/types.ts

interface StorageAdapter<T = unknown> {
  // CRUD básico
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<{ key: string; value: T }[]>;
  
  // Consultas
  find(predicate: (item: T) => boolean): Promise<T[]>;
  count(predicate?: (item: T) => boolean): Promise<number>;
  
  // Agregaciones (para KPIs)
  sum(field: keyof T, predicate?: (item: T) => boolean): Promise<number>;
  avg(field: keyof T, predicate?: (item: T) => boolean): Promise<number>;
  
  // Mantenimiento
  clear(): Promise<void>;
  isAvailable(): boolean;
}
```

---

## Repositorios Propuestos

### 1. ClientRepository

**Propósito:** Gestionar perfiles de cliente, preferencias, historial técnico.

```typescript
// Ubicación propuesta: src/repositories/ClientRepository.ts

class ClientRepository {
  private adapter: StorageAdapter<ClientProfile>;

  constructor(adapter: StorageAdapter<ClientProfile>) {
    this.adapter = adapter;
  }

  async getProfile(clientId: string): Promise<ClientProfile | null>;
  async getPreferences(clientId: string): Promise<ClientPreferences | null>;
  async getHistory(clientId: string): Promise<ServiceHistory[]>;
  async updatePreferences(clientId: string, prefs: Partial<ClientPreferences>): Promise<void>;
  async addServiceRecord(clientId: string, record: ServiceRecord): Promise<void>;
  async getLTV(clientId: string): Promise<CustomerLTV | null>;
  async getAllClientIds(): Promise<string[]>;
}
```

**Adapter hoy:** `InMemoryAdapter` — los datos se cargan desde `data/customers/` al iniciar y se mantienen en memoria.
**Adapter futuro:** `DatabaseAdapter` — consultas SQL/NoSQL.
**Datos almacenados:** Perfiles de cliente, preferencias, historial técnico, LTV.

> 🔮 **Future database-ready:** ClientRepository con métodos de consulta por perfil, preferencias e historial.

---

### 2. AppointmentRepository

**Propósito:** Gestionar citas, estados, servicios realizados, y KPIs derivados.

```typescript
// Ubicación propuesta: src/repositories/AppointmentRepository.ts

class AppointmentRepository {
  private adapter: StorageAdapter<Appointment>;

  constructor(adapter: StorageAdapter<Appointment>) {
    this.adapter = adapter;
  }

  async getAll(): Promise<Appointment[]>;
  async getById(id: string): Promise<Appointment | null>;
  async getByDate(date: string): Promise<Appointment[]>;
  async getByClientId(clientId: string): Promise<Appointment[]>;
  async create(appointment: Omit<Appointment, 'id'>): Promise<Appointment>;
  async updateStatus(id: string, status: AppointmentStatus): Promise<void>;
  
  // Agregaciones para KPIs
  async getSalesToday(): Promise<number>;
  async getOccupancy(): Promise<number>;
  async getRevenuePotential(): Promise<number>;
  async getServiceFrequency(): Promise<ServiceFrequency[]>;
  async getStylistWorkload(stylistId: string): Promise<number>;
}
```

**Adapter hoy:** `InMemoryAdapter` — los datos se cargan desde `/api/appointments` + datos mock.
**Adapter futuro:** `DatabaseAdapter` — consultas SQL con agregaciones.
**Datos almacenados:** Citas, estados, servicios, estilistas.

> 🔮 **Future database-ready:** AppointmentRepository con métodos de agregación para KPIs.

---

### 3. IntelligenceRepository

**Propósito:** Gestionar eventos de aprendizaje que alimentan al sistema Intelligence.

```typescript
// Ubicación propuesta: src/repositories/IntelligenceRepository.ts

class IntelligenceRepository {
  private adapter: StorageAdapter<LearningEvent>;

  constructor(adapter: StorageAdapter<LearningEvent>) {
    this.adapter = adapter;
  }

  async pushEvent(event: LearningEvent): Promise<void>;
  async getEventsSince(timestamp: string): Promise<LearningEvent[]>;
  async getEventsByType(type: LearningEventType): Promise<LearningEvent[]>;
  async getEventsByClient(clientId: string): Promise<LearningEvent[]>;
  async getEventCount(type?: LearningEventType): Promise<number>;
  async flush(): Promise<void>;  // persistir eventos en cola
}
```

**Adapter hoy:** `InMemoryAdapter` con persistencia periódica a `localStorage`.
**Adapter futuro:** `DatabaseAdapter` — eventos persistidos con índices por tipo y cliente.
**Datos almacenados:** Eventos de aprendizaje (preferencias, comportamiento, citas, etc.).

> 🔮 **Future database-ready:** IntelligenceRepository con cola de eventos y consultas por tipo/cliente.

---

### 4. PlatformHealthRepository

**Propósito:** Gestionar salud de la plataforma (campañas, plantillas, riesgos).

```typescript
// Ubicación propuesta: src/repositories/PlatformHealthRepository.ts

class PlatformHealthRepository {
  private adapter: StorageAdapter<PlatformHealthData>;

  constructor(adapter: StorageAdapter<PlatformHealthData>) {
    this.adapter = adapter;
  }

  async getHealth(): Promise<PlatformHealthData>;
  async updateHealth(data: Partial<PlatformHealthData>): Promise<void>;
  async getHistory(): Promise<HealthHistoryEntry[]>;
  async addHistoryEntry(entry: HealthHistoryEntry): Promise<void>;
  async getRejectionRate(): Promise<number>;
  async getRiskSummary(): Promise<RiskSummary>;
}
```

**Adapter hoy:** `LocalStorageAdapter` — los datos ya están en localStorage.
**Adapter futuro:** `DatabaseAdapter` — consultas de tendencias históricas.
**Datos almacenados:** Score de salud, rechazos de plantillas, historial de tendencias.

> 🔮 **Future database-ready:** PlatformHealthRepository es el mejor candidato para migración temprana a DB, porque los datos de salud se benefician de persistencia centralizada.

---

### 5. ConversationRepository (para futura sección Messages)

**Propósito:** Gestionar conversaciones de WhatsApp, mensajes, intenciones.

```typescript
// Ubicación propuesta: src/repositories/ConversationRepository.ts

class ConversationRepository {
  private adapter: StorageAdapter<Conversation>;

  constructor(adapter: StorageAdapter<Conversation>) {
    this.adapter = adapter;
  }

  async getConversation(phoneNumber: string): Promise<Conversation | null>;
  async getMessages(conversationId: string): Promise<Message[]>;
  async addMessage(conversationId: string, message: Message): Promise<void>;
  async getUnreadCount(): Promise<number>;
  async markAsRead(conversationId: string): Promise<void>;
}
```

**Adapter hoy:** `InMemoryAdapter` — los datos se cargan desde la store de WhatsApp existente.
**Adapter futuro:** `DatabaseAdapter`.
**Datos almacenados:** Conversaciones, mensajes, estados de lectura.

---

### 6. CampaignRepository (para futura sección Campaigns)

**Propósito:** Gestionar campañas, plantillas, audiencias, estados de entrega.

```typescript
// Ubicación propuesta: src/repositories/CampaignRepository.ts

class CampaignRepository {
  private adapter: StorageAdapter<Campaign>;

  constructor(adapter: StorageAdapter<Campaign>) {
    this.adapter = adapter;
  }

  async getCampaign(id: string): Promise<Campaign | null>;
  async getAllCampaigns(): Promise<Campaign[]>;
  async createCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign>;
  async updateStatus(id: string, status: CampaignStatus): Promise<void>;
  async getTemplates(): Promise<Template[]>;
  async validateTemplate(templateId: string): Promise<TemplateValidation>;
}
```

**Adapter hoy:** `InMemoryAdapter` — los datos se cargan desde la store de campañas existente.
**Adapter futuro:** `DatabaseAdapter`.
**Datos almacenados:** Campañas, plantillas, audiencias, estados.

---

## Adapters

### InMemoryAdapter (implementación hoy)

```typescript
// Ubicación propuesta: src/adapters/InMemoryAdapter.ts

class InMemoryAdapter<T> implements StorageAdapter<T> {
  private store: Map<string, T> = new Map();

  async get(key: string): Promise<T | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(prefix?: string): Promise<{ key: string; value: T }[]> {
    const entries = Array.from(this.store.entries());
    if (prefix) {
      return entries
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, value]) => ({ key, value }));
    }
    return entries.map(([key, value]) => ({ key, value }));
  }

  async find(predicate: (item: T) => boolean): Promise<T[]> {
    return Array.from(this.store.values()).filter(predicate);
  }

  async count(predicate?: (item: T) => boolean): Promise<number> {
    if (!predicate) return this.store.size;
    return Array.from(this.store.values()).filter(predicate).length;
  }

  async sum(field: keyof T, predicate?: (item: T) => boolean): Promise<number> {
    const items = predicate ? Array.from(this.store.values()).filter(predicate) : Array.from(this.store.values());
    return items.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
  }

  async avg(field: keyof T, predicate?: (item: T) => boolean): Promise<number> {
    const items = predicate ? Array.from(this.store.values()).filter(predicate) : Array.from(this.store.values());
    if (items.length === 0) return 0;
    const total = items.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
    return total / items.length;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  isAvailable(): boolean {
    return true;
  }
}
```

**Ventajas:** Rápido, sin dependencias externas, ideal para desarrollo y pruebas.
**Desventajas:** Los datos se pierden al recargar la página (volátil).

### LocalStorageAdapter (implementación hoy)

```typescript
// Ubicación propuesta: src/adapters/LocalStorageAdapter.ts

class LocalStorageAdapter<T> implements StorageAdapter<T> {
  private prefix: string;

  constructor(prefix: string = 'salon:') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(this.getKey(key));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: T): Promise<void> {
    localStorage.setItem(this.getKey(key), JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.getKey(key));
  }

  async list(prefix?: string): Promise<{ key: string; value: T }[]> {
    const entries: { key: string; value: T }[] = [];
    const searchPrefix = prefix ? this.getKey(prefix) : this.prefix;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(searchPrefix)) {
        try {
          const value = JSON.parse(localStorage.getItem(key)!);
          entries.push({ key: key.replace(this.prefix, ''), value });
        } catch { /* skip corrupt entries */ }
      }
    }
    return entries;
  }

  async find(predicate: (item: T) => boolean): Promise<T[]> {
    const all = await this.list();
    return all.map(e => e.value).filter(predicate);
  }

  async count(predicate?: (item: T) => boolean): Promise<number> {
    if (!predicate) return localStorage.length;
    const items = await this.find(predicate);
    return items.length;
  }

  async sum(field: keyof T, predicate?: (item: T) => boolean): Promise<number> {
    const items = predicate ? await this.find(predicate) : (await this.list()).map(e => e.value);
    return items.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
  }

  async avg(field: keyof T, predicate?: (item: T) => boolean): Promise<number> {
    const items = predicate ? await this.find(predicate) : (await this.list()).map(e => e.value);
    if (items.length === 0) return 0;
    const total = items.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
    return total / items.length;
  }

  async clear(): Promise<void> {
    const keys = await this.list();
    for (const { key } of keys) {
      localStorage.removeItem(this.getKey(key));
    }
  }

  isAvailable(): boolean {
    try {
      localStorage.setItem('salon:test', 'test');
      localStorage.removeItem('salon:test');
      return true;
    } catch {
      return false;
    }
  }
}
```

**Ventajas:** Persistente entre recargas de página, sin servidor necesario.
**Desventajas:** Solo disponible en navegador, límite de 5-10MB, no compartido entre dispositivos.

### DatabaseAdapter (arquitectura futura)

```typescript
// Ubicación propuesta: src/adapters/DatabaseAdapter.ts
// 🔮 NO IMPLEMENTAR AHORA — SOLO ARQUITECTURA

class DatabaseAdapter<T> implements StorageAdapter<T> {
  // Cuando exista base de datos:
  // - Inyectar cliente de DB (Prisma, Supabase, MongoDB, etc.)
  // - Mapear métodos del adapter a consultas SQL/NoSQL
  // - Las consultas find/findInPage se convierten en WHERE clauses
  // - Las agregaciones sum/avg se convierten en SQL aggregate functions
  
  // Ejemplo conceptual:
  // async find(predicate) { 
  //   // Convertir predicate a WHERE clause
  //   return db.collection(this.collection).find(convertPredicate(predicate)).toArray();
  // }
}
```

**Ventajas:** Datos centralizados, consultas avanzadas, persistente, multi-dispositivo.
**Desventajas:** Requiere infraestructura de servidor, más complejidad.

---

## Cómo Usar los Repositorios (ejemplo)

```typescript
// 🔮 NO IMPLEMENTAR AHORA — SOLO ARQUITECTURA

// En src/repositories/index.ts
import { AppointmentRepository } from './AppointmentRepository';
import { ClientRepository } from './ClientRepository';
import { InMemoryAdapter } from '../adapters/InMemoryAdapter';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';

// Crear adapters
const memoryAdapter = new InMemoryAdapter();
const localStorageAdapter = new LocalStorageAdapter('salon:');

// Crear repositorios con adapters
export const appointmentRepo = new AppointmentRepository(memoryAdapter);
export const clientRepo = new ClientRepository(memoryAdapter);
export const platformHealthRepo = new PlatformHealthRepository(localStorageAdapter);

// Los agentes importan los repositorios, no los adapters:
// import { appointmentRepo } from '../repositories';
// const appointments = await appointmentRepo.getAll();
```

**Para migrar a base de datos en el futuro:**
```typescript
// Solo cambiar esta línea:
// const dbAdapter = new DatabaseAdapter({ connection: '...' });
// export const appointmentRepo = new AppointmentRepository(dbAdapter);

// El resto del código NO cambia.
```

---

## Resumen de Repositorios

| Repositorio | Adapter Hoy | Adapter Futuro 🔮 | Prioridad DB | Datos |
|-------------|------------|-------------------|:------------:|-------|
| ClientRepository | InMemoryAdapter (+ `data/customers/`) | DatabaseAdapter | Alta | Perfiles, preferencias, historial |
| AppointmentRepository | InMemoryAdapter (+ API) | DatabaseAdapter | Alta | Citas, estados, servicios |
| IntelligenceRepository | InMemoryAdapter (+ localStorage) | DatabaseAdapter | Media | Eventos de aprendizaje |
| PlatformHealthRepository | LocalStorageAdapter | DatabaseAdapter | **Más alta** | Salud de campañas |
| ConversationRepository | InMemoryAdapter (+ store WhatsApp) | DatabaseAdapter | Alta | Conversaciones, mensajes |
| CampaignRepository | InMemoryAdapter (+ store campañas) | DatabaseAdapter | Media | Campañas, plantillas |

---

## Reglas para Agentes

1. **NUNCA** importar `localStorage`, `fetch`, o `prisma` directamente
2. **SIEMPRE** inyectar repositorios en el constructor o recibirlos como dependencia
3. **NUNCA** almacenar datos raw — siempre pasar por el repositorio
4. **USAR** tipos compartidos para todas las interfaces de datos
5. **NO** asumir que el adapter es `InMemoryAdapter` o `DatabaseAdapter` — el agente no debe saberlo

---

## Migración Futura a Base de Datos (checklist)

Cuando llegue el momento de agregar base de datos:

- [ ] Implementar `DatabaseAdapter` que implemente `StorageAdapter<T>`
- [ ] Configurar conexión a DB (variables de entorno, pooling, etc.)
- [ ] Cambiar la instanciación de repositorios en `src/repositories/index.ts`
- [ ] Ejecutar migraciones de esquema (si SQL)
- [ ] Migrar datos existentes de localStorage/JSON a DB
- [ ] Mantener `InMemoryAdapter` y `LocalStorageAdapter` como fallback para desarrollo
- [ ] Pruebas: verificar que todos los agentes funcionan con el nuevo adapter sin cambios

**Tiempo estimado de migración:** 2-3 días (dependiendo de la complejidad de la DB elegida)
**Cambios en agentes:** CERO — los repositorios mantienen la misma interfaz.
