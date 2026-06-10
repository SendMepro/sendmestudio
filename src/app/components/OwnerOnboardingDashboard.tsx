// ================================================================
// components/OwnerOnboardingDashboard.tsx — Dashboard post-registro
// Guía visual con checklist de onboarding para el dueño del negocio.
// Muestra el template aplicado, tareas pendientes y próximos pasos.
// ================================================================

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check, Loader2, Smartphone, Bot, Palette, Scissors,
  Clock, Shield, Layers, ArrowRight, Sparkles, ChevronRight,
  MessageSquare, BookOpen,
} from "lucide-react";

interface OnboardingData {
  template: {
    name: string;
    vertical: string;
    version: string;
  } | null;
  tasks: {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    done: boolean;
  }[];
  businessName: string;
}

const VERTICAL_EMOJIS: Record<string, string> = {
  salon: "💇",
  barber: "✂️",
  spa: "🧖",
  estetica: "✨",
  clinica: "🏥",
};

export default function OwnerOnboardingDashboard() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Cargar info del negocio + template actual
      const [settingsRes, templatesRes] = await Promise.all([
        fetch("/api/business-settings"),
        fetch("/api/business-settings/templates"),
      ]);

      const settings = await settingsRes.json();
      const templates = await templatesRes.json();

      const tenant = settings.tenant;
      const bs = settings.businessSettings || {};
      const current = templates.current;

      // Determinar tareas completadas
      const hasWhatsApp = !!(bs.whatsappPhone || bs.phoneNumberId);
      const hasServices = Array.isArray(bs.services) && bs.services.length > 0;
      const hasHours = bs.businessHours && Object.keys(bs.businessHours).length > 0;
      const hasBranding = !!(tenant?.logoUrl || tenant?.primaryColor !== "#7c5cff");
      const hasTemplate = !!current?.templateId;
      const hasAiConfig = !!settings.aiSettings;

      setData({
        template: current?.templateName
          ? { name: current.templateName, vertical: tenant?.businessType || "salon", version: current.templateVersion || "v1" }
          : null,
        businessName: tenant?.businessName || "Tu Negocio",
        tasks: [
          { id: "template", label: "Template aplicado", href: "/business/settings?tab=template", icon: <Layers size={14} />, done: hasTemplate },
          { id: "branding", label: "Personalizar colores y logo", href: "/business/settings?tab=branding", icon: <Palette size={14} />, done: hasBranding },
          { id: "whatsapp", label: "Conectar WhatsApp", href: "/business/settings?tab=whatsapp", icon: <Smartphone size={14} />, done: hasWhatsApp },
          { id: "services", label: "Configurar servicios", href: "/business/settings?tab=services", icon: <Scissors size={14} />, done: hasServices },
          { id: "hours", label: "Definir horarios", href: "/business/settings?tab=hours", icon: <Clock size={14} />, done: hasHours },
          { id: "ai", label: "Configurar asistente IA", href: "/business/settings?tab=ai", icon: <Bot size={14} />, done: hasAiConfig },
        ],
      });
    } catch {
      setData({
        template: null,
        businessName: "Tu Negocio",
        tasks: [],
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="onboarding-loading" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Loader2 size={24} className="spin" />
        <span style={{ marginLeft: 12, color: "var(--text-secondary)" }}>Preparando tu negocio...</span>
      </div>
    );
  }

  if (!data || data.tasks.length === 0) {
    return (
      <div className="onboarding-empty" style={{ textAlign: "center", padding: 60, color: "var(--text-tertiary)" }}>
        <Sparkles size={32} style={{ marginBottom: 12 }} />
        <p>Bienvenido a SendMe Studio</p>
        <Link href="/business/settings" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
          Ir a configuración →
        </Link>
      </div>
    );
  }

  const doneCount = data.tasks.filter((t) => t.done).length;
  const totalCount = data.tasks.length;
  const progressPct = Math.round((doneCount / totalCount) * 100);
  const verticalEmoji = data.template ? VERTICAL_EMOJIS[data.template.vertical] || "🏪" : "🏪";

  return (
    <div className="onboarding-dashboard" style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
      {/* ── Hero Section ── */}
      <div style={{
        padding: 24,
        borderRadius: 16,
        background: "linear-gradient(135deg, rgba(124,92,255,0.06), rgba(124,92,255,0.02))",
        border: "1px solid rgba(124,92,255,0.10)",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>{verticalEmoji}</span>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              ¡Bienvenido, {data.businessName}!
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              Tu negocio está listo. Completa estos pasos para activar tu plataforma.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
            <span>{doneCount} de {totalCount} pasos completados</span>
            <span>{progressPct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "var(--surface-glass-strong)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #7c5cff, #9b7dff)", width: `${progressPct}%`, transition: "width 0.5s ease" }} />
          </div>
        </div>
      </div>

      {/* ── Template Info ── */}
      {data.template && (
        <div style={{
          padding: 16,
          borderRadius: 12,
          background: "var(--surface-glass-strong)",
          border: "1px solid var(--glass-border)",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(39,174,96,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Check size={18} color="#27ae60" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              Template <strong>{data.template.name}</strong> aplicado
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Versión {data.template.version} — Puedes cambiarlo en Configuración &gt; Template
            </div>
          </div>
          <Link href="/business/settings?tab=template" style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 12, fontWeight: 600, color: "#7c5cff",
            textDecoration: "none", flexShrink: 0,
          }}>
            Ver <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* ── Task List ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" }}>
          Pasos recomendados
        </h2>
        {data.tasks.map((task) => (
          <Link
            key={task.id}
            href={task.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid var(--glass-border)",
              background: "var(--surface-glass)",
              textDecoration: "none",
              transition: "all 0.15s",
              opacity: task.done ? 0.7 : 1,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: task.done ? "rgba(39,174,96,0.1)" : "var(--surface-glass-strong)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              color: task.done ? "#27ae60" : "var(--text-tertiary)",
            }}>
              {task.done ? <Check size={14} /> : task.icon}
            </div>
            <span style={{
              flex: 1,
              fontSize: 13,
              fontWeight: task.done ? 400 : 600,
              color: task.done ? "var(--text-tertiary)" : "var(--text-primary)",
              textDecoration: task.done ? "line-through" : "none",
            }}>
              {task.label}
            </span>
            {!task.done && <ArrowRight size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />}
          </Link>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 12px" }}>
          Acciones rápidas
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Link href="/inbox" style={quickActionStyle}>
            <MessageSquare size={16} />
            <span>Ir a Mensajes</span>
          </Link>
          <Link href="/business/settings/knowledge" style={quickActionStyle}>
            <BookOpen size={16} />
            <span>Knowledge Base</span>
          </Link>
          <Link href="/business/settings" style={quickActionStyle}>
            <Palette size={16} />
            <span>Configuración</span>
          </Link>
          <Link href="/business" style={quickActionStyle}>
            <Sparkles size={16} />
            <span>Centro de Negocio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

const quickActionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid var(--glass-border)",
  background: "var(--surface-glass)",
  textDecoration: "none",
  color: "var(--text-primary)",
  fontSize: 13,
  fontWeight: 500,
  transition: "all 0.15s",
};
