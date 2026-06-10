"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { CalendarDays } from "lucide-react";

type StoredAppointment = {
  id: string;
  customerName?: string;
  clientName?: string;
  service: string;
  stylist?: string;
  specialist?: string;
  date?: string;
  time: string;
  status?: string;
};

export default function AgendaPage() {
  const [bookedAppointments, setBookedAppointments] = useState<StoredAppointment[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const loadAppointments = async () => {
      try {
        const response = await fetch("/api/appointments");
        const data = (await response.json()) as StoredAppointment[];

        if (!isCancelled && Array.isArray(data)) {
          setBookedAppointments(data);
        }
      } catch {
        // Keep static agenda when local JSON is unavailable.
      }
    };

    void loadAppointments();

    return () => {
      isCancelled = true;
    };
  }, []);

  const agenda = [
    ...bookedAppointments.map((item) => ({
      time: item.time,
      client: item.customerName ?? item.clientName ?? "Cliente WhatsApp",
      service: item.service,
      state: item.status === "confirmed" ? "Confirmada" : item.status ?? "Pendiente",
    })),
  ];

  return (
    <AppShell>
    <div className="app-workspace-grid">
      <main
        className="glass-card"
        style={{
          gridColumn: "1 / -1",
          minHeight: "calc(100dvh - 28px)",
          overflow: "hidden",
          padding: "34px",
        }}
      >
        <div className="card-kicker" style={{ marginBottom: "8px" }}>
          Agenda
        </div>
        <h1 className="panel-title" style={{ fontSize: "28px", marginBottom: "24px" }}>
          Agenda del día
        </h1>

		<div className="internal-scroll" style={{ display: "grid", gap: "12px", paddingRight: "8px" }}>
          {agenda.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                padding: "80px 24px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <CalendarDays size={28} strokeWidth={1.2} style={{ opacity: 0.3 }} />
              <span style={{ fontSize: "16px", fontWeight: 500, color: "rgba(20,18,28,0.45)" }}>
                Sin reservas programadas
              </span>
              <span style={{ fontSize: "13px", opacity: 0.6, maxWidth: 320, lineHeight: 1.5 }}>
                Las próximas reservas aparecerán aquí cuando clientes agenden desde WhatsApp o se registren manualmente.
              </span>
            </div>
          ) : (
            agenda.map((item) => (
              <article
                key={`${item.time}-${item.client}`}
                className="level-support"
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: "18px",
                  padding: "18px 20px",
                }}
              >
                <strong style={{ color: "var(--primary)", fontSize: "14px" }}>{item.time}</strong>
                <div>
                  <div className="card-title">{item.client}</div>
                  <div className="body" style={{ marginTop: "4px" }}>
                    {item.service}
                  </div>
                </div>
                <span className="card-kicker">{item.state}</span>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
    </AppShell>
  );
}
