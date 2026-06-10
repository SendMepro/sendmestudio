// src/repositories/AppointmentRepository.ts
// Purpose: Single source of truth for appointment data.
// Read-only foundation — no writes, no mutations.
// Phase C-0 — Appointment Repository Foundation

/**
 * An appointment item as rendered in the Appointment Flow list (W4).
 * Matches the shape produced by the liveAppointments merge in page.tsx.
 */
export interface Appointment {
  id: string;
  time: string;
  client: string;
  service: string;
  status: string;
  tone: string;
  stylist: string;
  stylistName?: string;
  stylistImage: string;
  stage: string;
  priorityLabel: string;
  ltv: string;
  repurchase: string;
  recommendation: string;
  impact: string;
  isMock: boolean;
  dossierSections: { label: string; value: string }[];
  clientIntelligence?: {
    emotionalProfile: {
      decisionStyle: string;
      responseStyle: string;
      idealTone: string;
      anxietyLevel: string;
      priceSensitivity: string;
      visualValidation: string;
    };
    materialIntelligence: {
      avgCost: string;
      brands: string[];
      colorations: string;
      sessionTime: string;
      margin: string;
    };
    lifetimeValue: {
      ltv: string;
      avgTicket: string;
      annualVisits: string;
      repurchase: string;
    };
    aiAlerts: string[];
    aiRecommendations: string[];
    technicalHistory: {
      tonesUsed: string;
      recentServices: string;
      observations: string;
      preferences: string;
    };
  };
}

/**
 * Raw stored appointment from GET /api/appointments.
 * Maps to the StoredAppointment type in page.tsx.
 */
export interface StoredAppointment {
  id: string;
  customerName?: string;
  clientName?: string;
  service: string;
  stylist?: string;
  specialist?: string;
  time: string;
  status?: string;
}

/**
 * Configuration for appointment data sources.
 * Determines how the repository fetches or provides appointment data.
 */
export interface AppointmentSourceConfig {
  mockAppointments: Appointment[];
  fetchApiAppointments: () => Promise<StoredAppointment[]>;
  formatClientName: (name: string) => string;
  getStylistFullName: (name: string) => string;
  stylistPhotoFor: (name: string) => string;
}

/**
 * Repository for appointment data.
 *
 * ## Purpose
 * Decouples the Appointment Flow (W4) from inline mock data and direct API calls.
 * Returns the same merged shape currently produced by liveAppointments in page.tsx.
 *
 * ## Current state
 * Read-only foundation — wraps the same data sources (inline mock + API fetch)
 * that page.tsx currently uses. No UI or behavior changes.
 *
 * ## Data sources
 * 1. Inline mock appointments (hardcoded in page.tsx)
 * 2. GET /api/appointments (real data from data/appointments.json)
 *
 * ## Future state
 * - HomeMetricsAgent reads from AppointmentRepository for real KPI calculations
 * - HomeAIInsightAgent reads from AppointmentRepository for dossier content
 * - AppointmentRepository becomes writable (create/update operations)
 *
 * @see DATABASE_READY_STRATEGY.md — Repository Pattern
 * @see HOME_MIGRATION_ORDER.md — Phase C, W4
 */
export class AppointmentRepository {
  private config: AppointmentSourceConfig | null = null;

  /**
   * Configure the repository with data sources.
   * Must be called before any get* methods.
   */
  configure(config: AppointmentSourceConfig): void {
    this.config = config;
  }

  /**
   * Get all appointments (mock + real merged).
   * Returns the same shape as liveAppointments in page.tsx.
   * Mock appointments always come first, followed by real API appointments.
   */
  async getAppointments(): Promise<Appointment[]> {
    if (!this.config) {
      return [];
    }

    const { mockAppointments, fetchApiAppointments, formatClientName, getStylistFullName, stylistPhotoFor } = this.config;

    let bookedAppointments: StoredAppointment[] = [];
    try {
      bookedAppointments = await fetchApiAppointments();
    } catch {
      // API unavailable — return only mock appointments
    }

    const realAppointments: Appointment[] = bookedAppointments.map((item) => {
      const rawClientName = item.customerName ?? item.clientName ?? 'Cliente WhatsApp';
      const clientName = formatClientName(rawClientName);
      const stylistName = getStylistFullName(item.stylist ?? item.specialist ?? 'SendMe Studio');

      return {
        id: item.id,
        time: item.time,
        client: clientName,
        service: item.service,
        status: item.status === 'confirmed' ? 'Confirmada' : item.status ?? 'Pendiente',
        tone: 'next',
        stylist: stylistName,
        stylistImage: stylistPhotoFor(stylistName),
        stage: 'Reserva desde Inbox',
        priorityLabel: 'Reserva conversacional',
        ltv: 'Nuevo',
        repurchase: '0%',
        recommendation: 'Confirmar asistencia y preparar ficha de diagnostico.',
        impact: 'Booking',
        isMock: false,
        dossierSections: [
          { label: 'Origen', value: 'Inbox WhatsApp' },
          { label: 'IA recomienda', value: 'Enviar recordatorio suave antes de la visita.' },
        ],
      };
    });

    const mockItems: Appointment[] = mockAppointments.map((item) => {
      const clientName = formatClientName(item.client);
      const stylistName = getStylistFullName(item.stylistName ?? '');
      return {
        ...item,
        client: clientName,
        stylist: stylistName,
        stylistImage: stylistPhotoFor(stylistName),
        isMock: true,
      };
    });

    return [...mockItems, ...realAppointments];
  }

  /**
   * Get a single appointment by ID.
   * Searches across all appointments (mock + real).
   */
  async getAppointmentById(id: string): Promise<Appointment | null> {
    const all = await this.getAppointments();
    return all.find((item) => item.id === id) ?? null;
  }

  /**
   * Get completed/finished appointments.
   * Filters by status indicating completion.
   */
  async getCompletedAppointments(): Promise<Appointment[]> {
    const all = await this.getAppointments();
    return all.filter(
      (item) =>
        item.status.toLowerCase().includes('complet') ||
        item.status.toLowerCase().includes('termin') ||
        item.tone === 'done'
    );
  }

  /**
   * Get appointments for a specific client by name or ID.
   */
  async getAppointmentsByClient(clientNameOrId: string): Promise<Appointment[]> {
    const all = await this.getAppointments();
    const search = clientNameOrId.toLowerCase();
    return all.filter(
      (item) =>
        item.id.toLowerCase() === search ||
        item.client.toLowerCase().includes(search)
    );
  }

  /**
   * Get appointments for a specific stylist by name.
   */
  async getAppointmentsByStylist(stylistName: string): Promise<Appointment[]> {
    const all = await this.getAppointments();
    const search = stylistName.toLowerCase();
    return all.filter((item) => item.stylist.toLowerCase().includes(search));
  }

  /**
   * Get upcoming (future) appointments.
   * Filters by tone = 'next' or status indicating pending/upcoming.
   */
  async getUpcomingAppointments(): Promise<Appointment[]> {
    const all = await this.getAppointments();
    return all.filter(
      (item) =>
        item.tone === 'next' ||
        item.status.toLowerCase().includes('pendiente') ||
        item.status.toLowerCase().includes('siguiente') ||
        item.status.toLowerCase().includes('confirm')
    );
  }
}

// Singleton for app-wide use — configure once at app bootstrap
export const appointmentRepository = new AppointmentRepository();
