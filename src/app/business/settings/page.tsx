// ================================================================
// /business/settings/page.tsx — Configuración unificada del Negocio
// Tabs: Branding | WhatsApp | IA | Servicios | Horarios | Políticas
// ================================================================

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import WhatsAppSetupWizard from "@/app/components/WhatsAppSetupWizard";
import AIVisualSettings from "@/app/components/AIVisualSettings";
import TemplateManager from "@/app/components/TemplateManager";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import {
  Check, Loader2, Upload, Eye, Smartphone, Bot, Scissors,
  Clock, Shield, Palette, Edit3, Layers, Link, X, Image, Download,
} from "lucide-react";

type Tab = "branding" | "whatsapp" | "ai" | "services" | "hours" | "policies" | "template";

// ── BrandingImageField Component ─────────────────────────────
// Reusable field for logo, banner, favicon with upload, preview,
// collapsible URL input, and persistent remove.
interface BrandingImageFieldProps {
  type: "logo" | "banner" | "favicon";
  label: string;
  hint: string;
  previewSize: number;
  url: string | null;
  uploading: boolean;
  showUrlInput: boolean;
  urlValue: string;
  onToggleUrl: () => void;
  onUrlChange: (value: string) => void;
  onApplyUrl: () => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
  primaryColor: string;
}

function BrandingImageField({
  type,
  label,
  hint,
  previewSize,
  url,
  uploading,
  showUrlInput,
  urlValue,
  onToggleUrl,
  onUrlChange,
  onApplyUrl,
  onUpload,
  onRemove,
  primaryColor,
}: BrandingImageFieldProps) {
  const isBanner = type === "banner";
  const acceptMap: Record<string, string> = {
    logo: "image/png,image/jpeg,image/webp,image/svg+xml",
    banner: "image/png,image/jpeg,image/webp",
    favicon: "image/png,image/x-icon,image/svg+xml",
  };
  const labelMap: Record<string, string> = {
    logo: "Subir logo",
    banner: "Subir banner",
    favicon: "Subir favicon",
  };

  return (
    <div>
      <label className="field-label">{label}</label>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>{hint}</div>

      {/* Preview + Upload Controls */}
      {isBanner ? (
        <div
          style={{
            height: 100,
            borderRadius: 12,
            background: url
              ? `url(${url}) center/cover`
              : "var(--surface-glass-strong)",
            border: "2px dashed var(--glass-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          {!url && <Upload size={24} style={{ color: "var(--text-tertiary)" }} />}
        </div>
      ) : (
        <div
          style={{
            width: previewSize,
            height: previewSize,
            borderRadius: type === "favicon" ? 6 : 12,
            background: "var(--surface-glass-strong)",
            border: "2px dashed var(--glass-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
            marginBottom: 8,
          }}
        >
          {url ? (
            <img src={url} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Upload size={type === "favicon" ? 14 : 20} style={{ color: "var(--text-tertiary)" }} />
          )}
        </div>
      )}

      {/* Buttons row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {/* Upload button */}
        <label className="upload-btn" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {uploading ? (
            <><Loader2 size={14} className="spin" /> Subiendo...</>
          ) : (
            <><Upload size={14} /> {labelMap[type]}</>
          )}
          <input
            type="file"
            accept={acceptMap[type]}
            style={{ display: "none" }}
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = "";
            }}
          />
        </label>

        {/* Paste URL toggle (collapsible secondary option) */}
        <button
          type="button"
          onClick={onToggleUrl}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid var(--glass-border)",
            background: showUrlInput ? "var(--tenant-primary-lighter)" : "var(--surface-glass)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-secondary)",
            transition: "all 0.15s",
          }}
        >
          <Link size={12} />
          {showUrlInput ? "Ocultar URL" : "Pegar URL"}
        </button>

        {/* Remove button */}
        {url && (
          <button
            type="button"
            onClick={onRemove}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              background: "rgba(231,76,60,0.12)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: "#e74c3c",
              transition: "all 0.15s",
            }}
          >
            <X size={12} />
            Eliminar
          </button>
        )}
      </div>

      {/* Collapsible URL input */}
      {showUrlInput && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: "8px 12px",
            borderRadius: 10,
            background: "var(--surface-glass-strong)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <Image size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input
            type="url"
            className="field-input"
            value={urlValue}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://ejemplo.com/imagen.png"
            style={{ flex: 1, fontSize: 13, padding: "6px 10px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApplyUrl();
            }}
          />
          <button
            type="button"
            onClick={onApplyUrl}
            disabled={!urlValue.trim()}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              background: primaryColor,
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: urlValue.trim() ? "pointer" : "not-allowed",
              opacity: urlValue.trim() ? 1 : 0.5,
              whiteSpace: "nowrap",
            }}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `rgba(124,92,255,${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const colorPresets = [
  { name: "Violeta", primary: "#7c5cff", secondary: "#1a1a2e" },
  { name: "Rosa", primary: "#e91e63", secondary: "#1a1a2e" },
  { name: "Azul", primary: "#2196f3", secondary: "#0d47a1" },
  { name: "Verde", primary: "#4caf50", secondary: "#1b5e20" },
  { name: "Naranja", primary: "#ff9800", secondary: "#4a2800" },
  { name: "Rojo", primary: "#f44336", secondary: "#b71c1c" },
  { name: "Teal", primary: "#009688", secondary: "#004d40" },
  { name: "Oro", primary: "#c9a84c", secondary: "#1a1a2e" },
];

const tabMeta: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "branding", label: "Branding", icon: <Palette size={16} /> },
  { id: "whatsapp", label: "WhatsApp", icon: <Smartphone size={16} /> },
  { id: "ai", label: "IA", icon: <Bot size={16} /> },
  { id: "template", label: "Template", icon: <Layers size={16} /> },
  { id: "services", label: "Servicios", icon: <Scissors size={16} /> },
  { id: "hours", label: "Horarios", icon: <Clock size={16} /> },
  { id: "policies", label: "Políticas", icon: <Shield size={16} /> },
];

export default function BusinessSettingsPage() {
  return (
    <Suspense fallback={null}>
      <BusinessSettingsContent />
    </Suspense>
  );
}

function BusinessSettingsContent() {
  const { branding, tenant, loading, businessSettings } = useTenantBranding();
  const searchParams = useSearchParams();

  // ── Active tab (from URL or default) ──
  const tabFromUrl = searchParams.get("tab") as Tab | null;
  const validTabs: Tab[] = ["branding", "whatsapp", "ai", "services", "hours", "policies", "template"];
  const [activeTab, setActiveTab] = useState<Tab>("branding");

  // Sync URL tab → state on mount and when URL changes
  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // ── Branding state ──
  const [businessName, setBusinessName] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#7c5cff");
  const [secondaryColor, setSecondaryColor] = useState("#1a1a2e");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // Collapsible URL inputs for branding images (secondary option)
  const [showUrlInput, setShowUrlInput] = useState<"logo" | "banner" | "favicon" | null>(null);
  const [urlInputValues, setUrlInputValues] = useState({ logo: "", banner: "", favicon: "" });

  // ── WhatsApp state ──
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("");
  const [whatsappBusinessPhone, setWhatsappBusinessPhone] = useState("");
  const [whatsappWaBusinessId, setWhatsappWaBusinessId] = useState("");
  const [whatsappAccessToken, setWhatsappAccessToken] = useState("");
  const [whatsappWebhookSecret, setWhatsappWebhookSecret] = useState("");
  const [whatsappIsActive, setWhatsappIsActive] = useState(true);
  const [whatsappLoaded, setWhatsappLoaded] = useState(false);

  // ── AI state ──
  const [aiAutoReply, setAiAutoReply] = useState(true);
  const [aiMode, setAiMode] = useState("automatic");
  const [aiRules, setAiRules] = useState("");
  const [aiSupportFeedRules, setAiSupportFeedRules] = useState("");
  const [aiBookingRules, setAiBookingRules] = useState("");
  const [aiAvailabilityRules, setAiAvailabilityRules] = useState("");
  const [aiMonthlyBudget, setAiMonthlyBudget] = useState("");
  const [aiLoaded, setAiLoaded] = useState(false);

  // ── Services state ──
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);

  // ── Hours state ──
  const [businessHours, setBusinessHours] = useState<Record<string, any>>({});
  const [hoursLoaded, setHoursLoaded] = useState(false);

  // ── Policies state ──
  const [latePolicy, setLatePolicy] = useState("");
  const [minimumBufferMinutes, setMinimumBufferMinutes] = useState(15);
  const [lunchBreak, setLunchBreak] = useState("");
  const [lastAcceptedTime, setLastAcceptedTime] = useState("");
  const [policiesLoaded, setPoliciesLoaded] = useState(false);

  // ── Global save state ──
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Template state ──
  const [templateInfo, setTemplateInfo] = useState<{
    templateId: string | null;
    templateVersion: string | null;
    templateName?: string;
  } | null>(null);

  // ── Load branding from useTenantBranding ──
  useEffect(() => {
    if (!branding) return;
    setBusinessName(branding.businessName || "");
    setTagline(branding.tagline || "");
    setPrimaryColor(branding.primaryColor || "#7c5cff");
    setSecondaryColor(branding.secondaryColor || "#1a1a2e");
    setLogoUrl(branding.logoUrl);
    setBannerUrl(branding.bannerUrl);
    setFaviconUrl(branding.faviconUrl);
  }, [branding]);

  // ── Load template info ──
  useEffect(() => {
    if (!tenant?.id) return;
    fetch(`/api/business-settings/templates`)
      .then((r) => r.json())
      .then((data) => {
        if (data.current) {
          setTemplateInfo(data.current);
        }
      })
      .catch(() => {
        // Tenant may not have a template applied yet — that's fine
        setTemplateInfo({ templateId: null, templateVersion: null });
      });
  }, [tenant?.id]);

  // ── Load WhatsApp settings ──
  useEffect(() => {
    if (whatsappLoaded || !tenant?.id) return;
    fetch("/api/business-settings/whatsapp")
      .then((r) => r.json())
      .then((data) => {
        if (data.whatsapp) {
          setWhatsappPhoneNumberId(data.whatsapp.phoneNumberId || "");
          setWhatsappBusinessPhone(data.whatsapp.businessPhone || "");
          setWhatsappWaBusinessId(data.whatsapp.waBusinessId || "");
          setWhatsappAccessToken(data.whatsapp.accessToken || "");
          setWhatsappWebhookSecret(data.whatsapp.webhookSecret || "");
          setWhatsappIsActive(data.whatsapp.isActive ?? true);
        }
        setWhatsappLoaded(true);
      })
      .catch(() => setWhatsappLoaded(true));
  }, [tenant?.id, whatsappLoaded]);

  // ── Load AI settings ──
  useEffect(() => {
    if (aiLoaded || !tenant?.id) return;
    fetch("/api/business-settings/ai")
      .then((r) => r.json())
      .then((data) => {
        if (data.aiSettings) {
          setAiAutoReply(data.aiSettings.autoReplyEnabled ?? true);
          setAiMode(data.aiSettings.aiMode || "automatic");
          setAiRules(JSON.stringify(data.aiSettings.aiRules || [], null, 2));
          setAiSupportFeedRules(JSON.stringify(data.aiSettings.supportFeedRules || [], null, 2));
          setAiBookingRules(JSON.stringify(data.aiSettings.bookingRules || [], null, 2));
          setAiAvailabilityRules(JSON.stringify(data.aiSettings.availabilityRules || [], null, 2));
          setAiMonthlyBudget(data.aiSettings.monthlyAiBudget?.toString() || "");
        }
        setAiLoaded(true);
      })
      .catch(() => setAiLoaded(true));
  }, [tenant?.id, aiLoaded]);

  // ── Load services/hours/policies from businessSettings ──
  useEffect(() => {
    if (!businessSettings) return;
    if (!servicesLoaded) {
      setServicesList(Array.isArray(businessSettings.services) ? businessSettings.services : []);
      setServicesLoaded(true);
    }
    if (!hoursLoaded) {
      setBusinessHours(
        typeof businessSettings.businessHours === "object" && businessSettings.businessHours
          ? businessSettings.businessHours
          : {},
      );
      setHoursLoaded(true);
    }
    if (!policiesLoaded) {
      setLatePolicy(businessSettings.latePolicy || "");
      setMinimumBufferMinutes(businessSettings.minimumBufferMinutes ?? 15);
      setLunchBreak(businessSettings.lunchBreak || "");
      setLastAcceptedTime(businessSettings.lastAcceptedTime || "");
      setPoliciesLoaded(true);
    }
  }, [businessSettings, servicesLoaded, hoursLoaded, policiesLoaded]);

  // ── Upload handler ──
  const handleUpload = useCallback(async (file: File, type: "logo" | "banner" | "favicon") => {
    const setUploading = type === "logo" ? setUploadingLogo : type === "banner" ? setUploadingBanner : setUploadingFavicon;
    const setUrl = type === "logo" ? setLogoUrl : type === "banner" ? setBannerUrl : setFaviconUrl;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      const res = await fetch("/api/business-settings/upload", { method: "POST", body: formData });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error al subir archivo"); }
      const data = await res.json();
      setUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, []);

  // ── Apply URL from secondary input ──
  const handleApplyUrl = useCallback((type: "logo" | "banner" | "favicon") => {
    const url = urlInputValues[type]?.trim();
    if (!url) return;
    const setUrl = type === "logo" ? setLogoUrl : type === "banner" ? setBannerUrl : setFaviconUrl;
    setUrl(url);
    setShowUrlInput(null);
    setUrlInputValues((prev) => ({ ...prev, [type]: "" }));
  }, [urlInputValues]);

  // ── Remove branding image (persists to backend) ──
  const handleRemoveBrandingImage = useCallback(async (type: "logo" | "banner" | "favicon") => {
    const setUrl = type === "logo" ? setLogoUrl : type === "banner" ? setBannerUrl : setFaviconUrl;
    setUrl(null);
    // Persist null to backend
    try {
      const res = await fetch("/api/business-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [`${type}Url`]: null }),
      });
      if (!res.ok) {
        const d = await res.json();
        console.error("Error removing branding image:", d.error);
      }
    } catch (err: any) {
      console.error("Error removing branding image:", err.message);
    }
  }, []);

  // ── Save: dispatches to the correct API based on active tab ──
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      let res: Response;

      if (activeTab === "branding") {
        res = await fetch("/api/business-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName, tagline, primaryColor, secondaryColor, logoUrl, bannerUrl, faviconUrl,
          }),
        });
      } else if (activeTab === "whatsapp") {
        const body: any = {
          phoneNumberId: whatsappPhoneNumberId,
          businessPhone: whatsappBusinessPhone,
          waBusinessId: whatsappWaBusinessId,
          accessToken: whatsappAccessToken,
          webhookSecret: whatsappWebhookSecret,
          isActive: whatsappIsActive,
        };
        // Only send non-empty strings
        if (!body.phoneNumberId) delete body.phoneNumberId;
        if (!body.accessToken) delete body.accessToken;
        if (!body.webhookSecret) delete body.webhookSecret;
        res = await fetch("/api/business-settings/whatsapp", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else if (activeTab === "ai") {
        const rules = safeParseJson(aiRules);
        const supportFeedRules = safeParseJson(aiSupportFeedRules);
        const bookingRules = safeParseJson(aiBookingRules);
        const availabilityRules = safeParseJson(aiAvailabilityRules);
        const body: any = {
          autoReplyEnabled: aiAutoReply,
          aiMode,
        };
        if (rules !== undefined) body.aiRules = rules;
        if (supportFeedRules !== undefined) body.supportFeedRules = supportFeedRules;
        if (bookingRules !== undefined) body.bookingRules = bookingRules;
        if (availabilityRules !== undefined) body.availabilityRules = availabilityRules;
        if (aiMonthlyBudget) body.monthlyAiBudget = parseFloat(aiMonthlyBudget);
        res = await fetch("/api/business-settings/ai", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        // services, hours, policies → all go to /api/business-settings PATCH
        const body: any = {};
        if (activeTab === "services") {
          body.services = servicesList;
        } else if (activeTab === "hours") {
          body.businessHours = businessHours;
        } else if (activeTab === "policies") {
          body.latePolicy = latePolicy;
          body.minimumBufferMinutes = minimumBufferMinutes;
          body.lunchBreak = lunchBreak;
          body.lastAcceptedTime = lastAcceptedTime;
        }
        res = await fetch("/api/business-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [
    activeTab,
    // branding
    businessName, tagline, primaryColor, secondaryColor, logoUrl, bannerUrl, faviconUrl,
    // whatsapp
    whatsappPhoneNumberId, whatsappBusinessPhone, whatsappWaBusinessId,
    whatsappAccessToken, whatsappWebhookSecret, whatsappIsActive,
    // ai
    aiAutoReply, aiMode, aiRules, aiSupportFeedRules, aiBookingRules, aiAvailabilityRules, aiMonthlyBudget,
    // services
    servicesList,
    // hours
    businessHours,
    // policies
    latePolicy, minimumBufferMinutes, lunchBreak, lastAcceptedTime,
  ]);

  // ── Helpers ──
  function safeParseJson(str: string): any[] | undefined {
    if (!str.trim()) return [];
    try { const p = JSON.parse(str); return Array.isArray(p) ? p : []; }
    catch { return undefined; }
  }

  // ── Day name helper ──
  const dayNames: Record<string, string> = {
    monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
    thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
  };
  const dayKeys = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

  // ══════════════════════════════════════════════════
  // BRANDING TAB
  // ══════════════════════════════════════════════════
  function renderBrandingTab() {
    return (
      <>
        <div style={{ padding: "24px", borderBottom: "1px solid var(--border-glass)" }}>
          <h1 className="panel-title">Configuración del Negocio</h1>
          <div className="card-kicker" style={{ marginTop: "12px" }}>
            Personaliza la apariencia de tu plataforma
          </div>
        </div>

        <div className="internal-scroll" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Branding Preview */}
          <div
            style={{
              borderRadius: 16, overflow: "hidden", border: "1px solid var(--glass-border)",
              cursor: "pointer", transition: "all 0.2s",
            }}
            onClick={() => setShowPreview(!showPreview)}
          >
            <div style={{
              height: 80, background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              display: "flex", alignItems: "center", padding: "0 24px", gap: 16,
            }}>
              {logoUrl && <img src={logoUrl} alt="Logo" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />}
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>{businessName || "Tu Negocio"}</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{tagline || "AI Business Workspace"}</div>
              </div>
            </div>
            <div style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: 8, color: "var(--text-tertiary)", fontSize: 13 }}>
              <Eye size={14} />
              {showPreview ? "Ocultar preview" : "Ver preview completa"}
            </div>
            {showPreview && (
              <div style={{ padding: "0 24px 24px" }}>
                <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--glass-border)" }}>
                  <div style={{ height: 120, background: `url(${bannerUrl || "/img/banner-default.jpg"}) center/cover`, display: "flex", alignItems: "flex-end", padding: 16 }}>
                    {logoUrl && <img src={logoUrl} alt="Logo" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)" }} />}
                  </div>
                  <div style={{ padding: 16, display: "flex", gap: 8 }}>
                    <button style={{ background: primaryColor, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13 }}>Botón Primario</button>
                    <button style={{ background: "transparent", color: primaryColor, border: `1px solid ${primaryColor}`, borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13 }}>Botón Outline</button>
                    <span style={{ background: hexToRgba(primaryColor, 0.1), color: primaryColor, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>Badge</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Name & Tagline */}
          <div>
            <label className="field-label">Nombre del Negocio</label>
            <input type="text" className="field-input" value={businessName}
              onChange={(e) => setBusinessName(e.target.value)} placeholder="Ej: Nombre de tu negocio" />
          </div>
          <div>
            <label className="field-label">Tagline / Subtítulo</label>
            <input type="text" className="field-input" value={tagline}
              onChange={(e) => setTagline(e.target.value)} placeholder="Ej: Salon & Beauty Business" />
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>Se muestra debajo del nombre en el sidebar y dashboard</div>
          </div>

          {/* Logo Upload */}
          <BrandingImageField
            type="logo"
            label="Logo"
            hint="PNG, JPG, WebP o SVG · Máx 5MB · Recomendado 1:1"
            previewSize={64}
            url={logoUrl}
            uploading={uploadingLogo}
            showUrlInput={showUrlInput === "logo"}
            urlValue={urlInputValues.logo}
            onToggleUrl={() => setShowUrlInput(showUrlInput === "logo" ? null : "logo")}
            onUrlChange={(v) => setUrlInputValues((prev) => ({ ...prev, logo: v }))}
            onApplyUrl={() => handleApplyUrl("logo")}
            onUpload={(f) => handleUpload(f, "logo")}
            onRemove={() => handleRemoveBrandingImage("logo")}
            primaryColor={primaryColor}
          />

          {/* Banner Upload */}
          <BrandingImageField
            type="banner"
            label="Banner Principal"
            hint="PNG, JPG o WebP · Máx 5MB · Recomendado horizontal (1200×400px)"
            previewSize={100}
            url={bannerUrl}
            uploading={uploadingBanner}
            showUrlInput={showUrlInput === "banner"}
            urlValue={urlInputValues.banner}
            onToggleUrl={() => setShowUrlInput(showUrlInput === "banner" ? null : "banner")}
            onUrlChange={(v) => setUrlInputValues((prev) => ({ ...prev, banner: v }))}
            onApplyUrl={() => handleApplyUrl("banner")}
            onUpload={(f) => handleUpload(f, "banner")}
            onRemove={() => handleRemoveBrandingImage("banner")}
            primaryColor={primaryColor}
          />

          {/* Favicon Upload */}
          <BrandingImageField
            type="favicon"
            label="Favicon (Icono de pestaña)"
            hint="PNG, ICO o SVG · Máx 5MB · Recomendado 1:1 (32×32px)"
            previewSize={32}
            url={faviconUrl}
            uploading={uploadingFavicon}
            showUrlInput={showUrlInput === "favicon"}
            urlValue={urlInputValues.favicon}
            onToggleUrl={() => setShowUrlInput(showUrlInput === "favicon" ? null : "favicon")}
            onUrlChange={(v) => setUrlInputValues((prev) => ({ ...prev, favicon: v }))}
            onApplyUrl={() => handleApplyUrl("favicon")}
            onUpload={(f) => handleUpload(f, "favicon")}
            onRemove={() => handleRemoveBrandingImage("favicon")}
            primaryColor={primaryColor}
          />

          {/* Primary Color */}
          <div>
            <label className="field-label">Color Principal</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ width: 40, height: 40, borderRadius: 8, border: "none", cursor: "pointer", padding: 0 }} />
              <input type="text" className="field-input" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ width: 120, fontFamily: "monospace" }} />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="field-label">Color Secundario</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)}
                style={{ width: 40, height: 40, borderRadius: 8, border: "none", cursor: "pointer", padding: 0 }} />
              <input type="text" className="field-input" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)}
                style={{ width: 120, fontFamily: "monospace" }} />
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="field-label">Paletas rápidas</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {colorPresets.map((preset) => (
                <button key={preset.name} type="button" onClick={() => { setPrimaryColor(preset.primary); setSecondaryColor(preset.secondary); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--glass-border)", background: "var(--surface-glass)", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: preset.primary, display: "inline-block" }} />
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: preset.secondary, display: "inline-block" }} />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {renderErrorAndSave()}
        </div>
      </>
    );
  }

  // ══════════════════════════════════════════════════
  // WHATSAPP TAB — Wizard visual paso a paso
  // ══════════════════════════════════════════════════
  const [showWizard, setShowWizard] = useState(false);

  function renderWhatsappTab() {
    const hasConfig = !!(whatsappPhoneNumberId || whatsappAccessToken);
    const initialWizardValues = {
      phoneNumberId: whatsappPhoneNumberId,
      businessPhone: whatsappBusinessPhone,
      waBusinessId: whatsappWaBusinessId,
      accessToken: whatsappAccessToken,
      webhookSecret: whatsappWebhookSecret,
      isActive: whatsappIsActive,
    };

    const handleWizardSave = async (data: Record<string, any>) => {
      // Sync wizard values back to parent state before calling handleSave
      if (data.businessPhone !== undefined) setWhatsappBusinessPhone(data.businessPhone);
      if (data.phoneNumberId !== undefined) setWhatsappPhoneNumberId(data.phoneNumberId);
      if (data.waBusinessId !== undefined) setWhatsappWaBusinessId(data.waBusinessId);
      if (data.accessToken !== undefined) setWhatsappAccessToken(data.accessToken);
      if (data.webhookSecret !== undefined) setWhatsappWebhookSecret(data.webhookSecret);
      if (data.isActive !== undefined) setWhatsappIsActive(data.isActive);
      // Trigger save via the parent's handleSave mechanism
      setActiveTab("whatsapp");
      setSaved(false);
      setError(null);
      try {
        const res = await fetch("/api/business-settings/whatsapp", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Error al guardar");
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err: any) {
        setError(err.message);
      }
    };

    return (
      <>
        <div style={{ padding: "24px", borderBottom: "1px solid var(--border-glass)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 className="panel-title">WhatsApp Business</h1>
              <div className="card-kicker" style={{ marginTop: "12px" }}>
                Conecta tu número de WhatsApp para chatear con clientes
              </div>
            </div>
            {hasConfig && (
              <button
                onClick={() => setShowWizard(!showWizard)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: showWizard ? "2px solid var(--tenant-primary)" : "1px solid var(--glass-border)",
                  background: showWizard ? "var(--tenant-primary-lighter)" : "var(--surface-glass)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                <Edit3 size={14} />
                {showWizard ? "Ver resumen" : "Editar configuración"}
              </button>
            )}
          </div>
        </div>

        <div className="internal-scroll" style={{ padding: 0 }}>
          {showWizard || !hasConfig ? (
            <WhatsAppSetupWizard
              initialValues={initialWizardValues}
              primaryColor={primaryColor}
              onSave={handleWizardSave}
              saving={saving}
              saved={saved}
              error={error}
              hasExistingConfig={hasConfig}
            />
          ) : (
            /* ── Resumen visual cuando ya hay configuración ── */
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 16,
                borderRadius: 12,
                background: "rgba(39,174,96,0.06)",
                border: "1px solid rgba(39,174,96,0.12)",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "rgba(39,174,96,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Smartphone size={20} color="#27ae60" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                    WhatsApp conectado
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {whatsappBusinessPhone ? `Número: +${whatsappBusinessPhone}` : "Número no configurado"}
                    {whatsappIsActive ? " · Activo" : " · Inactivo"}
                  </div>
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}>
                <SummaryChip label="Phone Number ID" value={whatsappPhoneNumberId || "—"} />
                <SummaryChip label="WABA ID" value={whatsappWaBusinessId || "—"} />
                <SummaryChip label="Token" value={whatsappAccessToken ? `••••${whatsappAccessToken.slice(-6)}` : "—"} />
                <SummaryChip label="Webhook" value={whatsappWebhookSecret ? `••••${whatsappWebhookSecret.slice(-4)}` : "—"} />
              </div>

              {renderErrorAndSave()}
            </div>
          )}
        </div>
      </>
    );
  }

  // ── Mini resumen visual para el modo "no wizard" ──
  function SummaryChip({ label, value }: { label: string; value: string }) {
    return (
      <div style={{
        padding: "10px 14px",
        borderRadius: 10,
        background: "var(--surface-glass-strong)",
        border: "1px solid var(--glass-border)",
      }}>
        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: value.startsWith("••••") ? "monospace" : "inherit" }}>
          {value}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════
  // AI TAB — Configuración visual
  // ══════════════════════════════════════════════════
  function renderAiTab() {
    const handleAiSave = async (data: Record<string, any>) => {
      setSaved(false);
      setError(null);
      try {
        const res = await fetch("/api/business-settings/ai", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Error al guardar");
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err: any) {
        setError(err.message);
      }
    };

    return (
      <>
        <AIVisualSettings
          autoReplyEnabled={aiAutoReply}
          aiMode={aiMode}
          aiRulesRaw={aiRules}
          monthlyBudget={aiMonthlyBudget}
          primaryColor={primaryColor}
          onSave={handleAiSave}
          saving={saving}
          saved={saved}
          error={error}
        />

        {/* ── Memory Backup Export ── */}
        <div
          style={{
            marginTop: 24,
            padding: 20,
            borderRadius: 16,
            background: "var(--surface-glass-strong)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Download size={18} style={{ color: "var(--tenant-primary)" }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
              Respaldo del conocimiento
            </h3>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
            Descarga un respaldo JSON con la configuración, reglas y conocimiento del negocio.
            Útil para seguridad, migraciones o integraciones futuras.
          </p>
          <a
            href="/api/business-settings/memory/export"
            download
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              background: "var(--tenant-primary)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Download size={16} />
            Descargar respaldo
          </a>
        </div>
      </>
    );
  }

  // ══════════════════════════════════════════════════
  // TEMPLATE TAB — Gestor visual de templates
  // ══════════════════════════════════════════════════
  function renderTemplateTab() {
    const handleTemplateSave = async (data: any) => {
      setSaved(false);
      setError(null);
      try {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err: any) {
        setError(err.message);
      }
    };

    return (
      <TemplateManager
        primaryColor={primaryColor}
        onSave={handleTemplateSave}
        saving={saving}
        saved={saved}
      />
    );
  }

  // ══════════════════════════════════════════════════
  // SERVICES TAB
  // ══════════════════════════════════════════════════
  function renderServicesTab() {
    const addService = () => {
      setServicesList([...servicesList, { name: "", duration: 30, price: 0, description: "" }]);
    };
    const updateService = (idx: number, field: string, value: any) => {
      const updated = [...servicesList];
      updated[idx] = { ...updated[idx], [field]: value };
      setServicesList(updated);
    };
    const removeService = (idx: number) => {
      setServicesList(servicesList.filter((_, i) => i !== idx));
    };

    return (
      <>
        <div style={{ padding: "24px", borderBottom: "1px solid var(--border-glass)" }}>
          <h1 className="panel-title">Servicios</h1>
          <div className="card-kicker" style={{ marginTop: "12px" }}>
            Define los servicios que ofrece tu negocio
          </div>
        </div>
        <div className="internal-scroll" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {servicesList.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
              No hay servicios registrados. Agrega el primero.
            </div>
          )}
          {servicesList.map((svc, idx) => (
            <div key={idx} style={{ padding: 16, borderRadius: 12, border: "1px solid var(--glass-border)", background: "var(--surface-glass)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", gap: 12, marginBottom: 8 }}>
                <input type="text" className="field-input" value={svc.name}
                  onChange={(e) => updateService(idx, "name", e.target.value)}
                  placeholder="Nombre del servicio" />
                <input type="number" className="field-input" value={svc.duration}
                  onChange={(e) => updateService(idx, "duration", parseInt(e.target.value) || 30)}
                  placeholder="Minutos" min="5" step="5" />
                <input type="number" className="field-input" value={svc.price}
                  onChange={(e) => updateService(idx, "price", parseFloat(e.target.value) || 0)}
                  placeholder="Precio" min="0" step="0.01" />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="text" className="field-input" value={svc.description || ""}
                  onChange={(e) => updateService(idx, "description", e.target.value)}
                  placeholder="Descripción (opcional)" style={{ flex: 1 }} />
                <button onClick={() => removeService(idx)}
                  style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
                  Quitar
                </button>
              </div>
            </div>
          ))}
          <button onClick={addService}
            style={{ padding: "10px", borderRadius: 10, border: "2px dashed var(--glass-border)", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
            + Agregar servicio
          </button>
          {renderErrorAndSave()}
        </div>
      </>
    );
  }

  // ══════════════════════════════════════════════════
  // HOURS TAB
  // ══════════════════════════════════════════════════
  function renderHoursTab() {
    const updateDay = (day: string, field: string, value: any) => {
      const curr = businessHours[day] || { isOpen: true, open: "09:00", close: "18:00" };
      setBusinessHours({ ...businessHours, [day]: { ...curr, [field]: value } });
    };
    const getDay = (day: string) => businessHours[day] || { isOpen: true, open: "09:00", close: "18:00" };

    return (
      <>
        <div style={{ padding: "24px", borderBottom: "1px solid var(--border-glass)" }}>
          <h1 className="panel-title">Horarios</h1>
          <div className="card-kicker" style={{ marginTop: "12px" }}>
            Define el horario de atención de tu negocio
          </div>
        </div>
        <div className="internal-scroll" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {dayKeys.map((day) => {
            const dayData = getDay(day);
            return (
              <div key={day} style={{ display: "grid", gridTemplateColumns: "120px 80px 1fr 1fr", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--glass-border)", background: "var(--surface-glass)" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{dayNames[day]}</span>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={dayData.isOpen !== false}
                    onChange={(e) => updateDay(day, "isOpen", e.target.checked)} />
                  Abierto
                </label>
                {dayData.isOpen !== false ? (
                  <>
                    <input type="time" className="field-input" value={dayData.open || "09:00"}
                      onChange={(e) => updateDay(day, "open", e.target.value)}
                      style={{ fontSize: 13 }} />
                    <input type="time" className="field-input" value={dayData.close || "18:00"}
                      onChange={(e) => updateDay(day, "close", e.target.value)}
                      style={{ fontSize: 13 }} />
                  </>
                ) : (
                  <span style={{ gridColumn: "3/5", color: "var(--text-tertiary)", fontSize: 13 }}>Cerrado</span>
                )}
              </div>
            );
          })}
          {renderErrorAndSave()}
        </div>
      </>
    );
  }

  // ══════════════════════════════════════════════════
  // POLICIES TAB
  // ══════════════════════════════════════════════════
  function renderPoliciesTab() {
    return (
      <>
        <div style={{ padding: "24px", borderBottom: "1px solid var(--border-glass)" }}>
          <h1 className="panel-title">Políticas</h1>
          <div className="card-kicker" style={{ marginTop: "12px" }}>
            Configura las reglas operativas de tu negocio
          </div>
        </div>
        <div className="internal-scroll" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label className="field-label">Política de tardanza</label>
            <textarea className="field-input" value={latePolicy}
              onChange={(e) => setLatePolicy(e.target.value)}
              style={{ minHeight: 80, resize: "vertical" }}
              placeholder="Ej: Se permite una tolerancia de 15 minutos. Pasado ese tiempo, la cita se cancela." />
          </div>
          <div>
            <label className="field-label">Tiempo mínimo entre citas (minutos)</label>
            <input type="number" className="field-input" value={minimumBufferMinutes}
              onChange={(e) => setMinimumBufferMinutes(parseInt(e.target.value) || 15)}
              min="0" step="5" />
          </div>
          <div>
            <label className="field-label">Hora de almuerzo / descanso</label>
            <input type="text" className="field-input" value={lunchBreak}
              onChange={(e) => setLunchBreak(e.target.value)}
              placeholder="Ej: 13:00-14:00" />
          </div>
          <div>
            <label className="field-label">Última hora aceptada para citas</label>
            <input type="text" className="field-input" value={lastAcceptedTime}
              onChange={(e) => setLastAcceptedTime(e.target.value)}
              placeholder="Ej: 17:00" />
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
              La hora límite para aceptar una cita nueva
            </div>
          </div>
          {renderErrorAndSave()}
        </div>
      </>
    );
  }

  // ══════════════════════════════════════════════════
  // SHARED: Error + Save
  // ══════════════════════════════════════════════════
  function renderErrorAndSave() {
    return (
      <>
        {error && (
          <div style={{ padding: 12, borderRadius: 8, background: "rgba(231,76,60,0.1)", color: "#e74c3c", fontSize: 14 }}>
            {error}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 8, borderTop: "1px solid var(--glass-border)" }}>
          <button
            className="primary-btn"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: primaryColor,
              border: "none",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          {saved && (
            <span style={{ color: "#27ae60", fontSize: 14, fontWeight: 500 }}>
              Cambios guardados ✓
            </span>
          )}
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <Loader2 size={24} className="spin" />
          <span style={{ marginLeft: 12, color: "var(--text-secondary)" }}>Cargando configuración...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="settings-grid">
        {/* ── Sidebar - Tab Navigation ── */}
        <div className="panel-fixed">
          <div style={{ padding: 20, borderBottom: "1px solid var(--border-glass)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Configuración</h2>
            {templateInfo?.templateId && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(124,92,255,0.06)",
                  border: "1px solid rgba(124,92,255,0.10)",
                  fontSize: 12,
                  color: "#64748b",
                  lineHeight: 1.4,
                  cursor: "pointer",
                }}
                onClick={() => {
                  const diffUrl = `/admin/verticals/apply-preview?tenantId=${tenant?.id}`;
                  window.open(diffUrl, "_blank");
                }}
                title="Ver cambios disponibles del template"
              >
                <div style={{ fontWeight: 600, color: "#7c5cff", marginBottom: 2 }}>
                  📋 Template: {templateInfo.templateName || "Aplicado"}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ padding: "1px 6px", borderRadius: 4, background: "rgba(124,92,255,0.10)", fontSize: 10, fontWeight: 600, color: "#7c5cff" }}>
                    {templateInfo.templateVersion}
                  </span>
                  <span>Ver cambios disponibles →</span>
                </div>
              </div>
            )}
          </div>
          <div className="internal-scroll" style={{ padding: "8px" }}>
            {tabMeta.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: activeTab === tab.id ? "var(--surface-glass-strong)" : "transparent",
                  color: activeTab === tab.id ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "left",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="list-col glass-card" style={{ display: "flex", flexDirection: "column", padding: 0 }}>
          {activeTab === "branding" && renderBrandingTab()}
          {activeTab === "whatsapp" && renderWhatsappTab()}
          {activeTab === "ai" && renderAiTab()}
          {activeTab === "template" && renderTemplateTab()}
          {activeTab === "services" && renderServicesTab()}
          {activeTab === "hours" && renderHoursTab()}
          {activeTab === "policies" && renderPoliciesTab()}
        </div>
      </div>
    </AppShell>
  );
}
