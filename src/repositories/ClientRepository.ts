// src/repositories/ClientRepository.ts
// Purpose: Single source of truth for client profile data.
// Reads from data/customers/customers.json and merges with appointment data.
// Read-only foundation — no writes, no mutations.
// Phase C-2 — ClientRepository Foundation

import { AppointmentRepository, Appointment } from './AppointmentRepository';

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Raw customer record from data/customers/customers.json
 */
export interface StoredCustomer {
  id: string;
  phone: string;
  displayName: string;
  firstName: string;
  tags: string[];
  interests: string[];
  requestedServices: string[];
  lastVisit: string;
  lastConversationAt: string;
  preferredStylist: string | null;
  favoriteServices: string[];
  uploadedAssets: string[];
  campaignEligible: boolean;
  consentWhatsapp: boolean;
  notes: string;
  aiSummary: string;
  lifecycleStage: string;
}

/**
 * A client profile built from customers.json + appointment history.
 * Designed to support all W8-W14 dossier sections.
 */
export interface ClientProfile {
  /** Customer ID from customers.json (or null for mock-only clients) */
  customerId: string | null;
  /** Known client name (from appointment data) */
  name: string;
  /** Phone number, if available */
  phone: string;
  /** Tags from customer record (vip, warm-lead, balayage, etc.) */
  tags: string[];
  /** Interests/preferences declared by the client */
  interests: string[];
  /** Last known service visit date (ISO date string) */
  lastVisit: string;
  /** Lifecycle stage: new, active, at-risk, lapsed */
  lifecycleStage: string;
  /** AI summary from customer record */
  aiSummary: string;
  /** Whether the client has WhatsApp consent */
  consentWhatsapp: boolean;
  /** Appointment history from AppointmentRepository */
  appointmentHistory: Appointment[];
  /** Number of completed appointments */
  completedAppointments: number;
  /** Favorite services derived from appointment history + customer record */
  favoriteServices: string[];
  /** Preferred stylist name (from customer record or appointment history) */
  preferredStylist: string | null;
}

/**
 * Result type for client lookups.
 */
export interface ClientLookupResult {
  found: boolean;
  profile: ClientProfile | null;
  fromCustomerRecord: boolean;
}

// ─── Repository ──────────────────────────────────────────────────────────────

/**
 * Configuration for client data sources.
 * DI-based — callers inject the data sources.
 */
export interface ClientSourceConfig {
  /** Async function to fetch all customers from customers.json */
  fetchCustomers: () => Promise<StoredCustomer[]>;
  /** Async function to fetch an individual customer by ID or lookup key */
  fetchCustomerById: (id: string) => Promise<StoredCustomer | null>;
}

/**
 * ClientRepository — merged view of customers.json + AppointmentRepository.
 *
 * ## Purpose
 * Provides a unified client profile combining:
 * 1. Customer records from data/customers/customers.json (phone, tags, interests, consent)
 * 2. Appointment history from AppointmentRepository (services, stylists, frequency)
 *
 * ## Current state
 * Read-only foundation. Client name ↔ customer ID matching is fuzzy (by name substring).
 * In the future, a real clientId field in appointments will replace fuzzy matching.
 *
 * ## Data sources
 * - data/customers/customers.json (via injectable fetchCustomers)
 * - AppointmentRepository (via constructor injection)
 *
 * @see DATABASE_READY_STRATEGY.md — Repository Pattern
 * @see HOME_AGENT_WIDGET_OWNERSHIP.md — HomeAIInsightAgent
 */
export class ClientRepository {
  private config: ClientSourceConfig | null = null;
  private appointmentRepo: AppointmentRepository;

  constructor(appointmentRepo: AppointmentRepository) {
    this.appointmentRepo = appointmentRepo;
  }

  /**
   * Configure the repository with customer data sources.
   * Must be called before any get* methods that read customer records.
   */
  configure(config: ClientSourceConfig): void {
    this.config = config;
  }

  /**
   * Get all client profiles merged from customers.json + appointment history.
   * Returns clients that exist in customers.json AND/OR in appointments.
   */
  async getAllClients(): Promise<ClientProfile[]> {
    const appointments = await this.appointmentRepo.getAppointments();
    const customers = this.config ? await this.config.fetchCustomers() : [];

    // Build profiles from unique client names in appointments
    const clientNames = [...new Set(appointments.map((a) => a.client))];
    const profiles: ClientProfile[] = [];

    for (const name of clientNames) {
      const clientApps = appointments.filter((a) => a.client === name);
      const customer = customers.find((c) =>
        name.toLowerCase().includes(c.firstName.toLowerCase()) ||
        c.firstName.toLowerCase().includes(name.toLowerCase())
      );
      profiles.push(this.buildProfile(name, clientApps, customer ?? null));
    }

    // Add customers without appointments
    for (const c of customers) {
      if (!profiles.find((p) => p.customerId === c.id)) {
        profiles.push(this.buildProfile(c.firstName || c.displayName, [], c));
      }
    }

    return profiles;
  }

  /**
   * Get a single client profile by appointment ID.
   * Looks up the appointment, finds the client, merges with customer record.
   */
  async getClientByAppointment(appointmentId: string): Promise<ClientLookupResult> {
    try {
      const appointment = await this.appointmentRepo.getAppointmentById(appointmentId);
      if (!appointment) {
        return { found: false, profile: null, fromCustomerRecord: false };
      }

      const clientApps = await this.appointmentRepo.getAppointmentsByClient(appointment.client);
      const customers = this.config ? await this.config.fetchCustomers() : [];
      const customer = customers.find((c) =>
        appointment.client.toLowerCase().includes(c.firstName.toLowerCase()) ||
        c.firstName.toLowerCase().includes(appointment.client.toLowerCase())
      );

      const profile = this.buildProfile(appointment.client, clientApps, customer ?? null);
      return { found: true, profile, fromCustomerRecord: !!customer };
    } catch {
      return { found: false, profile: null, fromCustomerRecord: false };
    }
  }

  /**
   * Get a client profile by customer ID from customers.json.
   */
  async getClientById(customerId: string): Promise<ClientLookupResult> {
    try {
      if (!this.config) {
        return { found: false, profile: null, fromCustomerRecord: false };
      }
      const customer = await this.config.fetchCustomerById(customerId);
      if (!customer) {
        return { found: false, profile: null, fromCustomerRecord: false };
      }

      const all = await this.appointmentRepo.getAppointments();
      const clientApps = all.filter((a) =>
        a.client.toLowerCase().includes(customer.firstName.toLowerCase())
      );

      const profile = this.buildProfile(customer.firstName || customer.displayName, clientApps, customer);
      return { found: true, profile, fromCustomerRecord: true };
    } catch {
      return { found: false, profile: null, fromCustomerRecord: false };
    }
  }

  /**
   * Search clients by name (fuzzy, case-insensitive).
   */
  async searchClients(query: string): Promise<ClientProfile[]> {
    const q = query.toLowerCase();
    const all = await this.getAllClients();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.interests.some((i) => i.toLowerCase().includes(q))
    );
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  /**
   * Build a ClientProfile from appointment data + optional customer record.
   */
  private buildProfile(
    name: string,
    clientApps: Appointment[],
    customer: StoredCustomer | null
  ): ClientProfile {
    const completed = clientApps.filter(
      (a) =>
        a.status.toLowerCase().includes('complet') ||
        a.status.toLowerCase().includes('termin') ||
        a.tone === 'done'
    );

    // Derive favorite services from appointment history
    const serviceCounts = new Map<string, number>();
    for (const a of clientApps) {
      serviceCounts.set(a.service, (serviceCounts.get(a.service) ?? 0) + 1);
    }
    const favoriteServices = Array.from(serviceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([svc]) => svc);

    // Preferred stylist from appointments or customer record
    const stylistCounts = new Map<string, number>();
    for (const a of clientApps) {
      if (a.stylist) {
        stylistCounts.set(a.stylist, (stylistCounts.get(a.stylist) ?? 0) + 1);
      }
    }
    const preferredStylist = customer?.preferredStylist
      ? customer.preferredStylist
      : Array.from(stylistCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      customerId: customer?.id ?? null,
      name,
      phone: customer?.phone ?? '',
      tags: customer?.tags ?? [],
      interests: customer?.interests ?? [],
      lastVisit: customer?.lastVisit ?? '',
      lifecycleStage: customer?.lifecycleStage ?? 'unknown',
      aiSummary: customer?.aiSummary ?? '',
      consentWhatsapp: customer?.consentWhatsapp ?? false,
      appointmentHistory: clientApps,
      completedAppointments: completed.length,
      favoriteServices: [...new Set([...(customer?.favoriteServices ?? []), ...favoriteServices])],
      preferredStylist,
    };
  }
}

// Singleton — created via factory to receive appointmentRepo later
// Usage: configure(appointmentRepo, config) before calling get* methods
export let clientRepository: ClientRepository | null = null;

export function createClientRepository(appointmentRepo: AppointmentRepository): ClientRepository {
  const repo = new ClientRepository(appointmentRepo);
  clientRepository = repo;
  return repo;
}
