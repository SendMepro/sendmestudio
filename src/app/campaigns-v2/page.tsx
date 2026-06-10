"use client";

import { useCallback, useRef, useState } from "react";
import AppShell from "../components/AppShell";
import styles from "./campaigns-v2.module.css";

/* ══════════════════════════════════════════════════════════
   Demo data
   ══════════════════════════════════════════════════════════ */

const DEMO_TITLE = "Ritual Balayage Lumiere";
const DEMO_SUBTITLE = "Campaña premium · Reactivación clientas balayage";
const DEMO_BODY = `Hola {{nombre}},

Este mes abrimos cupos limitados para nuestro Ritual Balayage Lumiere — iluminación suave con acabado glossy que dura hasta 8 semanas.

¿Te gustaría que revisemos horarios disponibles para esta semana?

Incluye:
- Diagnóstico capilar personalizado
- Balayage con técnica airtouch
- Brillo gloss sellador
- Peinado de salida`;

const AUDIENCE_SEGMENTS = [
  { label: "Balayage recurrente", contacts: 42, affinity: "85%" },
  { label: "Clientas premium", contacts: 28, affinity: "72%" },
  { label: "Nuevas captaciones", contacts: 18, affinity: "54%" },
  { label: "Reactivación 90d", contacts: 32, affinity: "63%" },
];

/* ── IA functions (local mock) ── */

function improveText(text: string): string {
  return text
    .replace(/cupos limitados/g, "exclusivos cupos limitados")
    .replace(/acabado glossy/g, "acabado glossy de alta gama")
    .replace(/¿Te gustaría/g, "¿Te encantaría");
}

function instagramVersion(): string {
  return `RITUAL BALAYAGE LUMIERE

Iluminación suave + acabado glossy que dura hasta 8 semanas.

- Diagnóstico capilar personalizado
- Técnica airtouch
- Brillo gloss sellador
- Peinado de salida

Cupos limitados — reserva tu cita hoy.

#Balayage #SalonBelleza #RitualLumiere #GlossyHair #CuidadoCapilar`;
}

function whatsappVersion(): string {
  return `Hola {{nombre}},

Te escribimos de Ritual Balayage Lumiere — tenemos cupos especiales esta semana para ti.

Te gustaría agendar?

Responde SÍ y te confirmamos horario.

Salon Belleza`;
}

function newIdeaText(): string {
  return `Nuevo mes, nuevo look

Sabias que el balayage airtouch se adapta a tu tono de piel?

Este mes en Ritual Balayage Lumiere:
- Diagnostico capilar gratis
- Tecnica personalizada
- Acabado glossy sin dano

Agenda tu diagnosis sin costo — solo 20 minutos.

Responde QUIERO y te damos horario`;
}

/* ── Types ── */

type CampaignStatus = "draft" | "prepared" | "ready" | "sent_demo";

interface PrepData {
  canal: string;
  fecha: string;
  hora: string;
  audienciaCargada: boolean;
  textoListo: boolean;
  templateAprobado: boolean;
  confirmacionHumana: boolean;
}

const DEFAULT_PREP: PrepData = {
  canal: "WhatsApp",
  fecha: "",
  hora: "",
  audienciaCargada: true,
  textoListo: true,
  templateAprobado: false,
  confirmacionHumana: false,
};

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Borrador",
  prepared: "Preparada",
  ready: "Lista para revision",
  sent_demo: "Demo enviada",
};

/* ══════════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════════ */

export default function CampaignsV2Page() {
  const [body, setBody] = useState(DEMO_BODY);
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>("draft");
  const [prep, setPrep] = useState<PrepData>(DEFAULT_PREP);

  /* Modals */
  const [showSendModal, setShowSendModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showIaDropdown, setShowIaDropdown] = useState(false);

  /* Schedule form */
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  /* Clipboard */
  const [copied, setCopied] = useState(false);

  /* Toast */
  const [toast, setToast] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const isReady = body.trim().length > 50 && campaignStatus === "prepared";

  /* ── Copy ── */
  const handleCopy = useCallback(async () => {
    if (!body) return;
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      showToast("Copiado al portapapeles");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* fallback */
    }
  }, [body, showToast]);

  /* ── Send modal actions ── */
  const handleConfirmSend = () => {
    setCampaignStatus("sent_demo");
    setShowSendModal(false);
    showToast("Demo enviada (simulacion)");
  };

  /* ── Schedule actions ── */
  const handleConfirmSchedule = () => {
    setPrep((p) => ({
      ...p,
      fecha: scheduleDate,
      hora: scheduleTime,
    }));
    setCampaignStatus("prepared");
    setShowScheduleModal(false);
    showToast("Campana agendada exitosamente");
  };

  /* ── IA action wrapper ── */
  const handleIaAction = useCallback(
    (label: string, fn: () => void) => {
      fn();
      setShowIaDropdown(false);
      showToast(label);
    },
    [showToast]
  );

  return (
    <AppShell>
      <div className={styles.campaignsV2Wrap}>
        <div className={styles.pageLayout}>
          {/* ═══ LEFT COLUMN ═══ */}
          <div className={styles.leftCol}>
            <div className={styles.sidePanel}>
              <div className={styles.sideHeader}>
                <div className={styles.sideLogo}>CM</div>
                <span className={styles.sideTitle}>Campañas</span>
                <button
                  className={styles.sideAddBtn}
                  type="button"
                  title="Proximamente"
                  disabled
                >
                  +
                </button>
              </div>

              {/* Campaign card */}
              <div className={styles.campaignCardWrap}>
                <div className={styles.campaignCard} data-selected="true">
                  <div className={styles.campaignCardTop}>
                    <span className={styles.campaignCardName}>
                      {DEMO_TITLE}
                    </span>
                    <span className={styles.campaignCardBadge}>Demo</span>
                    <span
                      className={styles.campaignCardStatus}
                      data-status={campaignStatus}
                    >
                      {STATUS_LABELS[campaignStatus]}
                    </span>
                  </div>
                  <div className={styles.campaignCardMeta}>
                    <span>Personalizada</span>
                    <span>·</span>
                    <span>120 clientes</span>
                  </div>
                  <div className={styles.campaignCardDesc}>
                    Campana premium para reactivar clientas interesadas en
                    balayage.
                  </div>
                  <div className={styles.campaignCardSchedule}>
                    {campaignStatus === "prepared" ||
                    campaignStatus === "ready"
                      ? `Programada para ${prep.canal}`
                      : "Sin programar"}
                  </div>
                </div>
              </div>

              {/* Import */}
              <div className={styles.importArea} title="Proximamente">
                <div className={styles.importIconWrap}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <span className={styles.importLabel}>
                  Importar audiencia CSV
                </span>
                <span className={styles.importSub}>Proximamente</span>
              </div>

              {/* KPI strip */}
              <div className={styles.kpiStrip}>
                <div className={styles.kpiCell} data-accent="true">
                  <span className={styles.kpiVal}>
                    {campaignStatus === "sent_demo" ? "1" : "0"}
                  </span>
                  <span className={styles.kpiLabel}>Envios</span>
                </div>
                <div className={styles.kpiCell}>
                  <span className={styles.kpiVal}>
                    {campaignStatus !== "draft" ? prep.canal : "—"}
                  </span>
                  <span className={styles.kpiLabel}>Canal</span>
                </div>
                <div className={styles.kpiCell} data-accent="true">
                  <span className={styles.kpiVal}>
                    {STATUS_LABELS[campaignStatus].split(" ")[0]}
                  </span>
                  <span className={styles.kpiLabel}>Estado</span>
                </div>
                <div className={styles.kpiCell}>
                  <span className={styles.kpiVal}>$0</span>
                  <span className={styles.kpiLabel}>Ingresos</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ CENTER COLUMN ═══ */}
          <div className={styles.centerCol}>
            <div className={styles.editorPanel}>
              {/* Banner */}
              <div className={styles.bannerSection}>
                <div
                  className={styles.bannerCover}
                  style={{
                    backgroundImage:
                      "url(https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=85)",
                  }}
                />
                <div className={styles.bannerOverlay} />
                <div className={styles.bannerContent}>
                  <span className={styles.bannerStatus}>
                    {STATUS_LABELS[campaignStatus]}
                  </span>
                  <span className={styles.bannerBadge}>Demo editable</span>
                  <input
                    className={styles.bannerTitle}
                    value={DEMO_TITLE}
                    readOnly
                  />
                  <p className={styles.bannerSubtitle}>{DEMO_SUBTITLE}</p>
                  <div className={styles.bannerActions}>
                    <button
                      className={styles.primaryBtn}
                      type="button"
                      onClick={() => setShowSendModal(true)}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      Enviar campana
                    </button>
                    <button
                      className={styles.secondaryBtn}
                      type="button"
                      onClick={() => setShowScheduleModal(true)}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Agendar
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor */}
              <div className={styles.editorArea}>
                <div className={styles.textareaSurface}>
                  <textarea
                    ref={textareaRef}
                    className={styles.editorTextarea}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Escribe tu mensaje aqui..."
                  />
                </div>
              </div>

              {/* Toolbar */}
              <div className={styles.toolbar}>
                {/* Left: IA + Tone + Templates */}
                <div className={styles.toolbarGroup}>
                  <div className={styles.iaToolGroup}>
                    {/* IA dropdown trigger */}
                    <div style={{ position: "relative" }}>
                      <button
                        className={styles.toolBtn}
                        data-active={showIaDropdown ? "true" : undefined}
                        type="button"
                        onClick={() => setShowIaDropdown((v) => !v)}
                        title="Herramientas IA"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                        </svg>
                        IA
                      </button>
                      {showIaDropdown && (
                        <div className={styles.iaDropdown}>
                          <button
                            type="button"
                            onClick={() =>
                              handleIaAction("Texto mejorado", () =>
                                setBody(improveText(body))
                              )
                            }
                          >
                            Mejorar texto
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleIaAction("Version Instagram", () =>
                                setBody(instagramVersion())
                              )
                            }
                          >
                            Version Instagram
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleIaAction("Version WhatsApp", () =>
                                setBody(whatsappVersion())
                              )
                            }
                          >
                            Version WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleIaAction("Nueva idea generada", () =>
                                setBody(newIdeaText())
                              )
                            }
                          >
                            Nueva idea
                          </button>
                        </div>
                      )}
                    </div>

                    <span className={styles.toolBtn}>Tono lujo</span>

                    <button
                      className={styles.toolBtn}
                      type="button"
                      onClick={() => {
                        setBody(instagramVersion());
                        showToast("Formato Instagram aplicado");
                      }}
                      title="Formato Instagram"
                    >
                      Instagram
                    </button>
                    <button
                      className={styles.toolBtn}
                      type="button"
                      onClick={() => {
                        setBody(whatsappVersion());
                        showToast("Formato WhatsApp aplicado");
                      }}
                      title="Formato WhatsApp"
                    >
                      WhatsApp
                    </button>
                    <button
                      className={styles.toolBtn}
                      type="button"
                      onClick={() => {
                        setBody(newIdeaText());
                        showToast("Nueva idea generada");
                      }}
                      title="Generar nueva idea"
                    >
                      Nueva idea
                    </button>

                    <div className={styles.divider} style={{ margin: "0 4px" }} />
                  </div>
                </div>

                {/* Right: Copy */}
                <div className={styles.toolbarGroup}>
                  <button
                    className={styles.toolBtn}
                    type="button"
                    onClick={handleCopy}
                    title="Copiar al portapapeles"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        ry="2"
                      />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div className={styles.rightCol}>
            {/* Estado */}
            <div className={styles.summaryModule}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleHeaderLeft}>
                  <span className={styles.moduleLabel}>Estado</span>
                  <strong className={styles.moduleValue}>
                    {STATUS_LABELS[campaignStatus]}
                  </strong>
                </div>
                <em className={styles.moduleMeta}>{campaignStatus}</em>
              </div>
              <div className={styles.moduleBody}>
                {campaignStatus === "draft" &&
                  "Texto en edicion. Usa 'Agendar' para programar el envio."}
                {campaignStatus === "prepared" &&
                  !isReady &&
                  "Preparada. Revisa el texto y la audiencia."}
                {isReady &&
                  "Lista para revision — presiona 'Enviar campana'."}
                {campaignStatus === "sent_demo" &&
                  "Demo enviada (simulacion). Los datos no son reales."}
              </div>
            </div>

            {/* Audience */}
            <div className={styles.summaryModule}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleHeaderLeft}>
                  <span className={styles.moduleLabel}>Audiencia</span>
                  <strong className={styles.moduleValue}>
                    {AUDIENCE_SEGMENTS.reduce((s, seg) => s + seg.contacts, 0)}{" "}
                    contactos
                  </strong>
                </div>
                <em className={styles.moduleMeta}>demo</em>
              </div>
              <div className={styles.moduleBody}>
                120 contactos · 4 segmentos
                <br />
                Top: Balayage recurrente (85% afinidad)
              </div>
            </div>

            {/* Meta Template */}
            <div className={styles.summaryModule}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleHeaderLeft}>
                  <span className={styles.moduleLabel}>Meta Template</span>
                  <strong className={styles.moduleValue}>
                    {prep.templateAprobado ? "Aprobado" : "Pendiente"}
                  </strong>
                </div>
                <em className={styles.moduleMeta}>demo</em>
              </div>
              <div className={styles.moduleBody}>
                {prep.templateAprobado
                  ? "Template aprobado para envio."
                  : "Requiere aprobacion antes de enviar."}
              </div>
            </div>

            {/* Checklist */}
            <div className={styles.summaryModule}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleHeaderLeft}>
                  <span className={styles.moduleLabel}>Checklist</span>
                  <strong className={styles.moduleValue}>
                    {campaignStatus !== "draft" ? "En progreso" : "Pendiente"}
                  </strong>
                </div>
                <em className={styles.moduleMeta}>
                  {campaignStatus !== "draft" ? "3/4" : "0/4"}
                </em>
              </div>
              <div className={styles.moduleBody}>
                <div className={styles.checklistLine}>
                  {prep.audienciaCargada ? "✓" : "○"} Audiencia cargada
                </div>
                <div className={styles.checklistLine}>
                  {prep.textoListo ? "✓" : "○"} Texto listo
                </div>
                <div className={styles.checklistLine}>
                  {prep.templateAprobado ? "✓" : "○"} Template aprobado
                </div>
                <div className={styles.checklistLine}>
                  {prep.confirmacionHumana ? "✓" : "○"} Confirmacion humana
                </div>
              </div>
            </div>

            {/* Resultado demo */}
            <div className={styles.summaryModule}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleHeaderLeft}>
                  <span className={styles.moduleLabel}>Resultado</span>
                  <strong className={styles.moduleValue}>Demo</strong>
                </div>
                <em className={styles.moduleMeta}>
                  {campaignStatus === "sent_demo" ? "1 envio" : "0"}
                </em>
              </div>
              {campaignStatus === "sent_demo" ? (
                <div className={styles.kpiCompactGrid}>
                  <div className={styles.kpiCompactCell} data-accent="true">
                    <span className={styles.kpiCompactValue}>1</span>
                    <span className={styles.kpiCompactLabel}>Enviada</span>
                  </div>
                  <div className={styles.kpiCompactCell}>
                    <span className={styles.kpiCompactValue}>0</span>
                    <span className={styles.kpiCompactLabel}>Lecturas</span>
                  </div>
                  <div className={styles.kpiCompactCell} data-accent="true">
                    <span className={styles.kpiCompactValue}>0</span>
                    <span className={styles.kpiCompactLabel}>Reservas</span>
                  </div>
                  <div className={styles.kpiCompactCell}>
                    <span className={styles.kpiCompactValue}>$0</span>
                    <span className={styles.kpiCompactLabel}>Ingresos</span>
                  </div>
                </div>
              ) : (
                <div className={styles.moduleBody}>
                  Datos simulados apareceran tras "Enviar campana".
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODAL — Confirmar envio ═══ */}
      {showSendModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowSendModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Enviar campana</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowSendModal(false)}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-primary, rgba(20,18,28,.92))",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Esto es una simulacion. No se enviara a clientes reales.
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary, rgba(70,64,84,.68))",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Canal: <strong>{prep.canal}</strong>
                <br />
                Audiencia: <strong>120 contactos</strong>
                <br />
                Estado actual: <strong>{STATUS_LABELS[campaignStatus]}</strong>
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.modalBtnSecondary}
                onClick={() => setShowSendModal(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={styles.modalBtnDanger}
                onClick={handleConfirmSend}
                type="button"
              >
                Enviar demo (simular)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL — Agendar ═══ */}
      {showScheduleModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Agendar campana</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowScheduleModal(false)}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalLabel}>Canal</div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-primary, rgba(20,18,28,.92))",
                  margin: 0,
                }}
              >
                {prep.canal}
              </p>

              <div className={styles.scheduleRow}>
                <div className={styles.scheduleField}>
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                <div className={styles.scheduleField}>
                  <label>Hora</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>

              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-muted, rgba(90,84,105,.42))",
                  margin: 0,
                }}
              >
                Esto es una simulacion. No se programara un envio real.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.modalBtnSecondary}
                onClick={() => setShowScheduleModal(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={styles.modalBtnPrimary}
                onClick={handleConfirmSchedule}
                type="button"
              >
                Guardar programacion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={styles.toastFeedback}>{toast}</div>}
    </AppShell>
  );
}
