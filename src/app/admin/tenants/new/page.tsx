// ================================================================
// admin/tenants/new/page.tsx — Super Admin: Crear nuevo tenant
// Con branding visual completo + plan + licencia
// ================================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Copy, Check, Shield, LogOut,
  Upload, Loader2, Link as LinkIcon, X, Image as ImageIcon,
} from "lucide-react";
import AdminSessionBadge from "@/app/components/AdminSessionBadge";

interface Plan {
  id: string;
  name: string;
  monthlyPriceClp: number;
}

interface CreateResult {
  tenant: {
    id: string;
    businessName: string;
    slug: string;
    licenseStatus: string;
    licenseExpiresAt: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    timezone: string;
    language: string;
  };
  user: {
    email: string;
    name: string;
  };
  temporalPassword: string;
  subscription: {
    plan: { name: string };
    status: string;
  };
}

const COLOR_PRESETS = [
  { label: "Morado (default)", primary: "#7c5cff", secondary: "#1a1a2e" },
  { label: "Rosa Elegante", primary: "#e91e9e", secondary: "#2d1b36" },
  { label: "Azul Profesional", primary: "#2563eb", secondary: "#0f172a" },
  { label: "Verde Natural", primary: "#059669", secondary: "#064e3b" },
  { label: "Terracota", primary: "#d97706", secondary: "#422006" },
  { label: "Borgoña", primary: "#be185d", secondary: "#2d1b2e" },
];

export default function NewTenantPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: "",
    businessName: "",
    businessType: "salon",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    logoUrl: "",
    bannerUrl: "",
    faviconUrl: "",
    primaryColor: "#7c5cff",
    secondaryColor: "#1a1a2e",
    timezone: "America/Santiago",
    language: "es",
    planId: "",
    licenseExpiresAt: "",
  });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreateResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [sessionCheck, setSessionCheck] = useState<{
    checked: boolean;
    isSuperAdmin: boolean;
  }>({ checked: false, isSuperAdmin: false });

  // Upload states
  const [uploading, setUploading] = useState<"logo" | "banner" | "favicon" | null>(null);
  const [showUrlInput, setShowUrlInput] = useState<"logo" | "banner" | "favicon" | null>(null);
  const [urlInputValue, setUrlInputValue] = useState("");

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((data) => {
        const list = data.plans || [];
        if (list.length > 0) {
          setPlans(list);
          setForm((f) => ({ ...f, planId: list[0].id }));
        } else {
          // Fallback local si endpoint devuelve vacío
          const fallback = [
            { id: "basic", name: "Basic", monthlyPriceClp: 29000 },
            { id: "pro", name: "Pro", monthlyPriceClp: 59000 },
            { id: "premium", name: "Premium", monthlyPriceClp: 99000 },
          ];
          setPlans(fallback);
          setForm((f) => ({ ...f, planId: fallback[0].id }));
        }
      })
      .catch((err) => {
        console.error("Error loading plans:", err);
        // Fallback local en caso de error de red
        const fallback = [
          { id: "basic", name: "Basic", monthlyPriceClp: 29000 },
          { id: "pro", name: "Pro", monthlyPriceClp: 59000 },
          { id: "premium", name: "Premium", monthlyPriceClp: 99000 },
        ];
        setPlans(fallback);
        setForm((f) => ({ ...f, planId: fallback[0].id }));
      });
  }, []);

  // Check session on mount
  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((data) => {
        setSessionCheck({
          checked: true,
          isSuperAdmin: data.session?.isSuperAdmin === true,
        });
      })
      .catch(() => {
        setSessionCheck({ checked: true, isSuperAdmin: false });
      });
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "businessName") {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setForm((prev) => ({ ...prev, slug: autoSlug }));
    }
  };

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setForm((prev) => ({ ...prev, primaryColor: preset.primary, secondaryColor: preset.secondary }));
  };

  const defaultExpiry = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  };

  // ── Upload branding image (admin endpoint) ──
  const handleUploadBranding = async (file: File, type: "logo" | "banner" | "favicon") => {
    setUploading(type);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const res = await fetch("/api/admin/tenants/upload-branding", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al subir");
      }
      const data = await res.json();
      setForm((prev) => ({ ...prev, [`${type}Url`]: data.url }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(null);
    }
  };

  // ── Apply URL from secondary input ──
  const handleApplyUrl = (type: "logo" | "banner" | "favicon") => {
    const url = urlInputValue.trim();
    if (!url) return;
    setForm((prev) => ({ ...prev, [`${type}Url`]: url }));
    setShowUrlInput(null);
    setUrlInputValue("");
  };

  // ── Remove branding image ──
  const handleRemoveBranding = (type: "logo" | "banner" | "favicon") => {
    setForm((prev) => ({ ...prev, [`${type}Url`]: "" }));
  };

  const trialExpiry = () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const isTrial = form.planId === "trial";
      const payload = {
        ...form,
        licenseExpiresAt: isTrial ? trialExpiry() : (form.licenseExpiresAt || defaultExpiry()),
        logoUrl: form.logoUrl || undefined,
        bannerUrl: form.bannerUrl || undefined,
        faviconUrl: form.faviconUrl || undefined,
      };

      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear tenant");
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPassword = () => {
    if (result?.temporalPassword) {
      navigator.clipboard.writeText(result.temporalPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const inputStyle = (field: string) => ({
    ...styles.input,
    ...(field === "primaryColor" || field === "secondaryColor"
      ? { padding: "4px 14px", height: 42 }
      : {}),
  });

  // ── Show result summary ──
  if (result) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <div style={styles.resultCard}>
            <div style={styles.resultIcon}>🎉</div>
            <h1 style={styles.resultTitle}>Cliente creado exitosamente</h1>
            <p style={styles.resultSubtitle}>
              {result.tenant.businessName} ha sido registrado en SendMe Studio.
            </p>

            {/* Preview */}
            <div
              style={{
                ...styles.brandPreview,
                borderTop: `3px solid ${result.tenant.primaryColor}`,
              }}
            >
              {result.tenant.logoUrl && (
                <img src={result.tenant.logoUrl} alt="logo" style={styles.previewLogo} />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{result.tenant.businessName}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Color: {result.tenant.primaryColor} · Zona: {result.tenant.timezone}
                </div>
              </div>
            </div>

            <div style={styles.resultDetails}>
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Negocio</span>
                <span style={styles.resultValue}>{result.tenant.businessName}</span>
              </div>
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Slug</span>
                <span style={styles.resultValue}><code>{result.tenant.slug}</code></span>
              </div>
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Plan</span>
                <span style={styles.resultValue}>{result.subscription.plan.name}</span>
              </div>
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Licencia</span>
                <span style={styles.resultValue}>{result.tenant.licenseStatus}</span>
              </div>
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Vence</span>
                <span style={styles.resultValue}>
                  {new Date(result.tenant.licenseExpiresAt).toLocaleDateString("es-CL")}
                </span>
              </div>
              <div style={{ ...styles.resultRow, borderTop: "1px solid rgba(124,58,237,0.08)", paddingTop: 16, marginTop: 8 }}>
                <span style={styles.resultLabel}>Email</span>
                <span style={styles.resultValue}>{result.user.email}</span>
              </div>
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Contraseña</span>
                <span style={styles.resultValue}>
                  <code style={styles.passwordCode}>{result.temporalPassword}</code>
                  <button onClick={handleCopyPassword} style={styles.copyBtn} title="Copiar contraseña">
                    {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.5} />}
                  </button>
                </span>
              </div>
            </div>

            <div style={styles.resultWarning}>
              ⚠️ Esta contraseña se muestra solo una vez. El usuario deberá cambiarla al iniciar sesión.
            </div>

            <div style={styles.resultActions}>
              <Link href={`/admin/tenants/${result.tenant.id}`} style={styles.resultBtnPrimary}>
                Ir al detalle del cliente
              </Link>
              <button onClick={() => router.push("/admin/tenants")} style={styles.resultBtnSecondary}>
                Volver a clientes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──
  const isBlocked = sessionCheck.checked && !sessionCheck.isSuperAdmin;

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Admin Session Badge */}
        <div style={{ marginBottom: 20 }}>
          <AdminSessionBadge />
        </div>

        {sessionCheck.checked && !sessionCheck.isSuperAdmin ? (
          /* ── Acceso denegado ── */
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Shield size={48} style={{ color: "#e74c3c", marginBottom: 16, opacity: 0.6 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
              Acceso denegado
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 auto 24px", maxWidth: 400 }}>
              Solo Super Admin puede crear nuevos clientes.
              Estás logueado como usuario normal.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link href="/admin/tenants" style={{ ...styles.resultBtnSecondary, textDecoration: "none" }}>
                <ArrowLeft size={14} /> Volver a clientes
              </Link>
              <button
                onClick={async () => {
                  await fetch("/api/logout", { method: "POST" });
                  window.location.href = "/login";
                }}
                style={{ ...styles.resultBtnPrimary, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <LogOut size={14} /> Cerrar sesión
              </button>
            </div>
          </div>
        ) : (
          <>
        <h1 style={styles.title}>Nuevo Cliente</h1>
        <p style={styles.subtitle}>Registrar un nuevo negocio con usuario owner, branding, plan y licencia.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error ? <div style={styles.error}>{error}</div> : null}

          {/* Section 1: Business Info */}
          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Información del Negocio</h3>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>Nombre del negocio *</label>
                <input style={styles.input} value={form.businessName} onChange={(e) => handleChange("businessName", e.target.value)} placeholder="Ej: Bella Beauty Studio" required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>URL del cliente / Slug *</label>
                <input
                  style={{ ...styles.input, textTransform: "lowercase" as const }}
                  value={form.slug}
                  onChange={(e) => handleChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/\s+/g, ""))}
                  placeholder="maite-guerra"
                  required
                  pattern="[a-z0-9-]+"
                  title="Solo letras minúsculas, números y guiones"
                />
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ opacity: 0.7 }}>Preview:</span>
                  <code style={{ background: "rgba(124,92,255,0.06)", padding: "1px 6px", borderRadius: 4, fontSize: 11, color: "#7c5cff" }}>
                    {window.location.origin}/{form.slug || "tu-slug"}
                  </code>
                </div>
                <span style={styles.fieldHint}>Solo minúsculas, números y guiones. Sin espacios. Sin duplicados.</span>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Tipo de negocio</label>
                <select style={styles.input} value={form.businessType} onChange={(e) => handleChange("businessType", e.target.value)}>
                  <option value="salon">Salón de Belleza</option>
                  <option value="barber">Barbería</option>
                  <option value="spa">Spa</option>
                  <option value="clinic">Clínica Estética</option>
                  <option value="wellness">Wellness Center</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Zona Horaria</label>
                <select style={styles.input} value={form.timezone} onChange={(e) => handleChange("timezone", e.target.value)}>
                  <option value="America/Santiago">Chile (GMT-3/-4)</option>
                  <option value="America/Argentina/Buenos_Aires">Argentina (GMT-3)</option>
                  <option value="America/Mexico_City">México (GMT-6)</option>
                  <option value="America/Bogota">Colombia (GMT-5)</option>
                  <option value="America/Lima">Perú (GMT-5)</option>
                  <option value="America/Madrid">España (GMT+1/+2)</option>
                  <option value="America/New_York">USA Eastern (GMT-5/-4)</option>
                  <option value="America/Los_Angeles">USA Pacific (GMT-8/-7)</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Idioma</label>
                <select style={styles.input} value={form.language} onChange={(e) => handleChange("language", e.target.value)}>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Owner */}
          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Datos del Dueño</h3>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>Nombre del dueño</label>
                <input style={styles.input} value={form.ownerName} onChange={(e) => handleChange("ownerName", e.target.value)} placeholder="Ej: María García" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email del dueño *</label>
                <input style={styles.input} type="email" value={form.ownerEmail} onChange={(e) => handleChange("ownerEmail", e.target.value)} placeholder="maria@ejemplo.cl" required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Teléfono del dueño</label>
                <input style={styles.input} value={form.ownerPhone} onChange={(e) => handleChange("ownerPhone", e.target.value)} placeholder="+56912345678" />
              </div>
            </div>
          </div>

          {/* Section 3: Branding Visual */}
          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Identidad Visual del Negocio</h3>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "-8px 0 14px" }}>
              Estos valores se cargarán en el dashboard del cliente para que sienta que la plataforma es de su negocio.
            </p>
            <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#92400e", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, lineHeight: 1.2 }}>💡</span>
              <span>Usa imágenes livianas para que el dashboard cargue rápido. Puedes subir archivos desde tu PC o pegar una URL.</span>
            </div>
            <div style={styles.grid}>

              {/* Logo Upload */}
              <div style={styles.field}>
                <label style={styles.label}>Logo</label>
                <span style={styles.fieldHint}>512×512 px · PNG/WebP · Máx 1MB · 1:1 recomendado</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: "#f0ecff", border: "2px dashed rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {form.logoUrl ? <img src={form.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImageIcon size={16} style={{ color: "#94a3b8" }} />}
                  </div>
                  <label style={{ ...styles.uploadBtn, cursor: "pointer" }}>
                    {uploading === "logo" ? <><Loader2 size={14} className="spin" /> Subiendo</> : <><Upload size={14} /> Examinar</>}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: "none" }} disabled={uploading === "logo"}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadBranding(f, "logo"); e.target.value = ""; }} />
                  </label>
                  <button type="button" onClick={() => { setShowUrlInput(showUrlInput === "logo" ? null : "logo"); setUrlInputValue(""); }} style={{ ...styles.textBtn, ...(showUrlInput === "logo" ? { background: "rgba(124,92,255,0.08)", color: "#7c5cff" } : {}) }}>
                    <LinkIcon size={12} /> URL
                  </button>
                  {form.logoUrl && <button type="button" onClick={() => handleRemoveBranding("logo")} style={{ ...styles.textBtn, color: "#e74c3c" }}><X size={12} /></button>}
                </div>
                {showUrlInput === "logo" && (
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <input style={{ ...styles.input, flex: 1, fontSize: 13, padding: "8px 10px" }} type="url" value={urlInputValue}
                      onChange={(e) => setUrlInputValue(e.target.value)} placeholder="https://ejemplo.com/logo.png"
                      onKeyDown={(e) => { if (e.key === "Enter") handleApplyUrl("logo"); }} />
                    <button type="button" onClick={() => handleApplyUrl("logo")} disabled={!urlInputValue.trim()} style={{ ...styles.smallBtn, opacity: urlInputValue.trim() ? 1 : 0.5 }}>OK</button>
                  </div>
                )}
              </div>

              {/* Banner Upload */}
              <div style={styles.field}>
                <label style={styles.label}>Banner</label>
                <span style={styles.fieldHint}>1600×500 px · WebP/JPG · Máx 2MB · Horizontal</span>
                <div style={{ height: 60, borderRadius: 8, background: form.bannerUrl ? `url(${form.bannerUrl}) center/cover` : "#f0ecff", border: "2px dashed rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4, marginBottom: 4, overflow: "hidden" }}>
                  {!form.bannerUrl && <ImageIcon size={18} style={{ color: "#94a3b8" }} />}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <label style={{ ...styles.uploadBtn, cursor: "pointer", fontSize: 12, padding: "6px 12px" }}>
                    {uploading === "banner" ? <><Loader2 size={12} className="spin" /> Subiendo</> : <><Upload size={12} /> Examinar</>}
                    <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} disabled={uploading === "banner"}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadBranding(f, "banner"); e.target.value = ""; }} />
                  </label>
                  <button type="button" onClick={() => { setShowUrlInput(showUrlInput === "banner" ? null : "banner"); setUrlInputValue(""); }} style={{ ...styles.textBtn, ...(showUrlInput === "banner" ? { background: "rgba(124,92,255,0.08)", color: "#7c5cff" } : {}) }}>
                    <LinkIcon size={12} /> URL
                  </button>
                  {form.bannerUrl && <button type="button" onClick={() => handleRemoveBranding("banner")} style={{ ...styles.textBtn, color: "#e74c3c" }}><X size={12} /></button>}
                </div>
                {showUrlInput === "banner" && (
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <input style={{ ...styles.input, flex: 1, fontSize: 13, padding: "8px 10px" }} type="url" value={urlInputValue}
                      onChange={(e) => setUrlInputValue(e.target.value)} placeholder="https://ejemplo.com/banner.png"
                      onKeyDown={(e) => { if (e.key === "Enter") handleApplyUrl("banner"); }} />
                    <button type="button" onClick={() => handleApplyUrl("banner")} disabled={!urlInputValue.trim()} style={{ ...styles.smallBtn, opacity: urlInputValue.trim() ? 1 : 0.5 }}>OK</button>
                  </div>
                )}
              </div>

              {/* Favicon Upload */}
              <div style={styles.field}>
                <label style={styles.label}>Favicon / Ícono</label>
                <span style={styles.fieldHint}>256×256 px · PNG/WebP · Máx 512KB · 1:1 recomendado</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: "#f0ecff", border: "2px dashed rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {form.faviconUrl ? <img src={form.faviconUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImageIcon size={12} style={{ color: "#94a3b8" }} />}
                  </div>
                  <label style={{ ...styles.uploadBtn, cursor: "pointer", fontSize: 12, padding: "6px 12px" }}>
                    {uploading === "favicon" ? <><Loader2 size={12} className="spin" /> Subiendo</> : <><Upload size={12} /> Examinar</>}
                    <input type="file" accept="image/png,image/x-icon,image/svg+xml" style={{ display: "none" }} disabled={uploading === "favicon"}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadBranding(f, "favicon"); e.target.value = ""; }} />
                  </label>
                  <button type="button" onClick={() => { setShowUrlInput(showUrlInput === "favicon" ? null : "favicon"); setUrlInputValue(""); }} style={{ ...styles.textBtn, ...(showUrlInput === "favicon" ? { background: "rgba(124,92,255,0.08)", color: "#7c5cff" } : {}) }}>
                    <LinkIcon size={12} /> URL
                  </button>
                  {form.faviconUrl && <button type="button" onClick={() => handleRemoveBranding("favicon")} style={{ ...styles.textBtn, color: "#e74c3c" }}><X size={12} /></button>}
                </div>
                {showUrlInput === "favicon" && (
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <input style={{ ...styles.input, flex: 1, fontSize: 13, padding: "8px 10px" }} type="url" value={urlInputValue}
                      onChange={(e) => setUrlInputValue(e.target.value)} placeholder="https://ejemplo.com/favicon.ico"
                      onKeyDown={(e) => { if (e.key === "Enter") handleApplyUrl("favicon"); }} />
                    <button type="button" onClick={() => handleApplyUrl("favicon")} disabled={!urlInputValue.trim()} style={{ ...styles.smallBtn, opacity: urlInputValue.trim() ? 1 : 0.5 }}>OK</button>
                  </div>
                )}
              </div>

            </div>

            {/* Color presets */}
            <div style={{ marginTop: 14 }}>
              <label style={styles.label}>Colores de marca</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyColorPreset(p)}
                    style={{
                      ...styles.colorChip,
                      border: form.primaryColor === p.primary ? "2px solid #7c5cff" : "1px solid rgba(124,58,237,0.1)",
                    }}
                    title={p.label}
                  >
                    <span style={{ ...styles.colorDot, background: p.primary }} />
                    <span style={{ ...styles.colorDot, background: p.secondary }} />
                    <span style={{ fontSize: 10, color: "#64748b" }}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ ...styles.grid, marginTop: 12 }}>
              <div style={styles.field}>
                <label style={styles.label}>Color Primario</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    style={{ width: 42, height: 42, borderRadius: 8, border: "1px solid rgba(124,58,237,0.1)", cursor: "pointer", padding: 0 }}
                  />
                  <input
                    style={{ ...styles.input, flex: 1 }}
                    value={form.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    placeholder="#7c5cff"
                  />
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Color Secundario</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) => handleChange("secondaryColor", e.target.value)}
                    style={{ width: 42, height: 42, borderRadius: 8, border: "1px solid rgba(124,58,237,0.1)", cursor: "pointer", padding: 0 }}
                  />
                  <input
                    style={{ ...styles.input, flex: 1 }}
                    value={form.secondaryColor}
                    onChange={(e) => handleChange("secondaryColor", e.target.value)}
                    placeholder="#1a1a2e"
                  />
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div style={{ ...styles.previewBox, borderTop: `3px solid ${form.primaryColor}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: form.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 700 }}>
                  {form.businessName.charAt(0) || "?"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{form.businessName || "Nombre del negocio"}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Vista previa del dashboard</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <span style={{ ...styles.previewBadge, background: `${form.primaryColor}15`, color: form.primaryColor }}>Botón primario</span>
                <span style={{ ...styles.previewBadge, background: `${form.secondaryColor}15`, color: form.secondaryColor }}>Botón secundario</span>
              </div>
            </div>
          </div>

          {/* Section 4: Plan & License */}
          <div style={{ ...styles.formSection, borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
            <h3 style={styles.formSectionTitle}>Plan y Licencia</h3>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>Plan *</label>
                <select style={styles.input} value={form.planId} onChange={(e) => handleChange("planId", e.target.value)} required>
                  {plans.length === 0 && <option value="">Cargando planes...</option>}
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id === "trial" ? "Trial 5 días" : `${p.name} — $${p.monthlyPriceClp.toLocaleString("es-CL")}/mes`}
                    </option>
                  ))}
                  {/* Always add Trial option */}
                  {!plans.some((p) => p.id === "trial") && <option value="trial">Trial 5 días</option>}
                </select>
                {form.planId === "trial" && (
                  <div style={{ fontSize: 11, color: "#F59E0B", marginTop: 4, background: "rgba(245,158,11,0.06)", padding: "6px 10px", borderRadius: 6 }}>
                    ⏳ Licencia vencerá automáticamente en 5 días. Sin costo.
                  </div>
                )}
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Fecha de vencimiento</label>
                <input style={styles.input} type="date" value={form.licenseExpiresAt} onChange={(e) => handleChange("licenseExpiresAt", e.target.value)} />
                <span style={styles.fieldHint}>Por defecto: 1 año desde hoy</span>
              </div>
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={saving}>
            <Save size={16} strokeWidth={2} />
            {saving ? "Creando cliente..." : "Crear Cliente"}
          </button>
        </form>
          </>
          )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { minHeight: "100vh", background: "#f8f6ff", fontFamily: "'Inter', sans-serif" },
  container: { maxWidth: 800, margin: "0 auto", padding: "48px 32px" },
  backLink: { display: "inline-flex", alignItems: "center", gap: 6, color: "#7c5cff", fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 32 },
  form: { background: "#fff", borderRadius: 16, padding: "32px", border: "1px solid rgba(124,58,237,0.04)" },
  formSection: { marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid rgba(124,58,237,0.06)" },
  formSectionTitle: { fontSize: 15, fontWeight: 600, color: "#0f172a", margin: "0 0 16px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#475569" },
  input: { padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(124,58,237,0.1)", fontSize: 14, outline: "none", background: "#fafafa", color: "#0f172a" },
  fieldHint: { fontSize: 11, color: "#94a3b8" },
  uploadBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "linear-gradient(135deg, #7c5cff, #9b7dff)", color: "#fff", fontSize: 13, fontWeight: 600, borderRadius: 10, border: "none" },
  textBtn: { display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "rgba(124,58,237,0.04)", color: "#475569", fontSize: 12, fontWeight: 500, borderRadius: 8, border: "1px solid rgba(124,58,237,0.08)", cursor: "pointer" },
  smallBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 14px", background: "linear-gradient(135deg, #7c5cff, #9b7dff)", color: "#fff", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer" },
  error: { background: "rgba(231,76,60,0.08)", color: "#e74c3c", padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 20 },
  submitBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: "linear-gradient(135deg, #7c5cff, #9b7dff)", color: "#fff", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: "pointer" },

  // Color presets
  colorChip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, background: "#fafafa", cursor: "pointer" },
  colorDot: { width: 16, height: 16, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.06)" },

  // Preview
  previewBox: { marginTop: 14, padding: "14px 16px", background: "#f8f6ff", borderRadius: 12, border: "1px solid rgba(124,58,237,0.06)" },
  previewBadge: { display: "inline-block", padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600 },

  // Result
  resultCard: { background: "#fff", borderRadius: 20, padding: "48px 40px", border: "1px solid rgba(124,58,237,0.06)", textAlign: "center" as const, maxWidth: 560, margin: "0 auto" },
  resultIcon: { fontSize: 48, marginBottom: 16 },
  resultTitle: { fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" },
  resultSubtitle: { fontSize: 14, color: "#64748b", margin: "0 0 28px" },
  brandPreview: { display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "#f8f6ff", borderRadius: 12, marginBottom: 20, textAlign: "left" as const },
  previewLogo: { width: 44, height: 44, borderRadius: 10, objectFit: "cover" as const },
  resultDetails: { textAlign: "left" as const, background: "#f8f6ff", borderRadius: 14, padding: "20px 24px", marginBottom: 20 },
  resultRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", gap: 16 },
  resultLabel: { fontSize: 13, fontWeight: 600, color: "#64748b" },
  resultValue: { fontSize: 13, fontWeight: 500, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 },
  passwordCode: { fontSize: 13, fontWeight: 700, color: "#7c5cff", background: "rgba(124,92,255,0.08)", padding: "4px 10px", borderRadius: 6, letterSpacing: "0.5px" },
  copyBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "none", background: "rgba(124,92,255,0.10)", color: "#7c5cff", cursor: "pointer" },
  resultWarning: { fontSize: 12, color: "#F59E0B", background: "rgba(245,158,11,0.08)", padding: "10px 14px", borderRadius: 10, marginBottom: 24 },
  resultActions: { display: "flex", gap: 12, justifyContent: "center" },
  resultBtnPrimary: { display: "inline-flex", alignItems: "center", padding: "12px 24px", background: "linear-gradient(135deg, #7c5cff, #9b7dff)", color: "#fff", borderRadius: 14, fontSize: 14, fontWeight: 600, textDecoration: "none" },
  resultBtnSecondary: { display: "inline-flex", alignItems: "center", padding: "12px 24px", background: "rgba(124,58,237,0.06)", color: "#7c5cff", borderRadius: 14, fontSize: 14, fontWeight: 600, border: "1px solid rgba(124,58,237,0.10)", cursor: "pointer" },
};
