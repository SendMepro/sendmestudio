"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles, Upload, Users } from "lucide-react";
import AppShell from "../components/AppShell";
import ContactDetailDrawer from "./ContactDetailDrawer";
import type { CustomerProfile } from "./ContactDetailDrawer";
import { getCustomerAvatar } from "../lib/getCustomerAvatar";
import styles from "./contacts.module.css";

const filters = [
  { id: "all", label: "Todos" },
  { id: "vip", label: "VIP" },
  { id: "balayage", label: "Balayage" },
  { id: "inactive", label: "Inactivas" },
  { id: "warm", label: "Leads cálidos" },
] as const;

function isImported(customer: CustomerProfile) {
  return customer.lifecycleStage === "imported" || customer.aiSummary?.toLowerCase().includes("imported");
}

function isInactive(customer: CustomerProfile) {
  if (!customer.lastVisit) {
    return true;
  }

  const olderThan60 = new Date();
  olderThan60.setDate(olderThan60.getDate() - 60);
  return new Date(customer.lastVisit) < olderThan60;
}

function hasService(customer: CustomerProfile, service: string) {
  return customer.requestedServices.some((item) => item.toLowerCase().includes(service));
}

export default function ContactsPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const response = await fetch("/api/customers");
        const data = await response.json();
        setCustomers(Array.isArray(data.customers) ? data.customers : []);
      } catch {
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadContacts();
  }, []);

  const stats = useMemo(() => {
    return {
      vip: customers.filter((customer) => customer.tags.includes("vip")).length,
      balayage: customers.filter((customer) => hasService(customer, "balayage") || customer.tags.includes("balayage-interest")).length,
      inactive: customers.filter(isInactive).length,
      warm: customers.filter((customer) =>
        customer.tags.includes("lead-hot") ||
        customer.tags.includes("warm") ||
        customer.requestedServices.length > 0
      ).length,
    };
  }, [customers]);

  const visibleContacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return customers.filter((customer) => {
      const searchable = [
        customer.firstName,
        customer.displayName,
        customer.phone,
        customer.tags.join(" "),
        customer.requestedServices.join(" "),
      ].join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "vip" && customer.tags.includes("vip")) ||
        (activeFilter === "balayage" && (hasService(customer, "balayage") || customer.tags.includes("balayage-interest"))) ||
        (activeFilter === "inactive" && isInactive(customer)) ||
        (activeFilter === "warm" && (customer.tags.includes("lead-hot") || customer.tags.includes("warm") || customer.requestedServices.length > 0));

      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, customers, query]);

  return (
    <AppShell>
      <main className={styles.contactsPage}>
        <section className={styles.heroPanel}>
          <div>
            <div className={styles.kicker}>Audiencia CRM</div>
            <h1>Gestor de contactos</h1>
            <p>Vista ligera de audiencia CRM para contactos importados por CSV/XLSX y segmentación de campañas.</p>
          </div>
          <div className={styles.totalCard}>
            <Users size={18} strokeWidth={1.7} />
            <span>Total contactos</span>
            <strong>{customers.length.toLocaleString()}</strong>
          </div>
        </section>

        <section className={styles.statsGrid}>
          <div><span>VIP</span><strong>{stats.vip}</strong></div>
          <div><span>Balayage</span><strong>{stats.balayage}</strong></div>
          <div><span>Inactivas</span><strong>{stats.inactive}</strong></div>
          <div><span>Leads cálidos</span><strong>{stats.warm}</strong></div>
        </section>

        <section className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} strokeWidth={1.8} />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, teléfono, tag o servicio"
              value={query}
            />
          </label>
          <div className={styles.filters}>
            {filters.map((filter) => (
              <button
                key={filter.id}
                data-active={activeFilter === filter.id ? "true" : "false"}
                onClick={() => setActiveFilter(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.contactsPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Audiencia importada</span>
              <strong>{visibleContacts.length.toLocaleString()} visibles</strong>
            </div>
            <em>Importado desde CSV/XLSX</em>
          </div>

          <div className={styles.contactsList}>
            {isLoading ? (
              <div className={styles.emptyState}>Cargando contactos...</div>
            ) : visibleContacts.length === 0 ? (
              <div className={styles.emptyState}>No hay contactos para esta vista.</div>
            ) : (
              visibleContacts.map((customer) => (
                <article
                  key={customer.id}
                  className={styles.contactCard}
                  onClick={() => setSelectedCustomer(customer)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.avatar}>
                    {(() => {
                      const av = getCustomerAvatar(customer);
                      return av.type === "image" ? (
                        <img src={av.src} alt={customer.firstName || ""} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                      ) : (
                        av.initials
                      );
                    })()}
                  </div>
                  <div className={styles.identity}>
                    <div className={styles.nameRow}>
                      <strong>{customer.firstName || customer.displayName || "Contacto sin nombre"}</strong>
                      {isImported(customer) ? (
                        <span className={styles.importedBadge}>
                          <Upload size={11} strokeWidth={1.8} />
                          Importado
                        </span>
                      ) : null}
                    </div>
                    <span>{customer.phone}</span>
                    <div className={styles.tagRow}>
                      {(customer.tags.length > 0 ? customer.tags : ["no-tags"]).slice(0, 4).map((tag) => (
                        <em key={tag}>{tag}</em>
                      ))}
                    </div>
                  </div>
                  <div className={styles.detailCell}>
                    <span>Servicio solicitado</span>
                    <strong>{customer.requestedServices[0] || "Sin definir"}</strong>
                  </div>
                  <div className={styles.detailCell}>
                    <span>Última visita</span>
                    <strong>{customer.lastVisit || "Sin visita"}</strong>
                  </div>
                  <div className={styles.consentCell} data-consent={customer.campaignEligible ? "true" : "false"}>
                    <Sparkles size={13} strokeWidth={1.8} />
                    {customer.campaignEligible ? "Consentimiento WhatsApp" : "Sin consentimiento"}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
      <ContactDetailDrawer customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
    </AppShell>
  );
}
