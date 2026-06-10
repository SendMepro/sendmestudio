// ================================================================
// components/WhatsAppSetupWizard.tsx — Wizard visual paso a paso
// para configurar WhatsApp Business API sin conocimientos técnicos.
// Flujo: 1. Número WhatsApp → 2. Datos Meta → 3. Token → 4. Probar
// ================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Smartphone, Check, Loader2, ChevronRight, ChevronLeft,
  AlertCircle, Shield, ExternalLink, HelpCircle, X, RefreshCw,
} from "lucide-react";

// ── Props ──
interface WhatsAppSetupWizardProps {
  /** Valores iniciales cargados desde la API */
  initialValues: {
    phoneNumberId: string;
    businessPhone: string;
    waBusinessId: string;
    accessToken: string;
    webhookSecret: string;
    isActive: boolean;
  };
  /** Color primario del tenant para los acentos visuales */
  primaryColor: string;
  /** Callback al completar: recibe los datos a guardar */
  onSave: (data: Record<string, any>) => Promise<void>;
  /** Estado de guardado */
  saving: boolean;
  saved: boolean;
  error: string | null;
  /** Indica si es primera configuración o ya hay datos */
  hasExistingConfig: boolean;
}

// ── Steps ──
const STEPS = [
  { id: "phone", label: "Tu número WhatsApp", icon: Smartphone },
  { id: "meta", label: "Cuenta de Meta", icon: Shield },
  { id: "token", label: "Token de acceso", icon: Shield },
  { id: "verify", label: "Verificar y activar", icon: Check },
];

// ── Component ──
export default function WhatsAppSetupWizard({
  initialValues,
  primaryColor,
  onSave,
  saving,
  saved,
  error: externalError,
  hasExistingConfig,
}: WhatsAppSetupWizardProps) {
  const [step, setStep] = useState(0);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Form state
  const [businessPhone, setBusinessPhone] = useState(initialValues.businessPhone);
  const [phoneNumberId, setPhoneNumberId] = useState(initialValues.phoneNumberId);
  const [waBusinessId, setWaBusinessId] = useState(initialValues.waBusinessId);
  const [accessToken, setAccessToken] = useState(initialValues.accessToken);
  const [webhookSecret, setWebhookSecret] = useState(initialValues.webhookSecret);
  const [isActive, setIsActive] = useState(initialValues.isActive);

  // Sync initial values when they change
  useEffect(() => {
    setBusinessPhone(initialValues.businessPhone);
    setPhoneNumberId(initialValues.phoneNumberId);
    setWaBusinessId(initialValues.waBusinessId);
    setAccessToken(initialValues.accessToken);
    setWebhookSecret(initialValues.webhookSecret);
    setIsActive(initialValues.isActive);
  }, [initialValues]);

  // ── Helpers ──
  const error = externalError || localError;

  const setError = (msg: string | null) => setLocalError(msg);

  const canProceed = () => {
    switch (step) {
      case 0: return businessPhone.trim().length >= 8;
      case 1: return phoneNumberId.trim().length > 0 && waBusinessId.trim().length > 0;
      case 2: return accessToken.trim().length > 10 && webhookSecret.trim().length > 0;
      case 3: return true;
      default: return false;
    }
  };

  // ── Test connection ──
  const testConnection = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);
    try {
      const res = await fetch("/api/business-settings/whatsapp");
      const data = await res.json();
      if (data.ok && data.whatsapp) {
        const w = data.whatsapp;
        const hasAllFields = w.phoneNumberId && w.businessPhone && w.waBusinessId && w.accessToken;
        setTestResult({
          ok: hasAllFields,
          message: hasAllFields
            ? "✅ Conexión configurada correctamente. Los datos se guardaron en el sistema."
            : "⚠️ Configuración incompleta. Faltan algunos campos obligatorios.",
        });
      } else {
        setTestResult({ ok: false, message: "❌ No se pudo verificar la conexión. Revisa los datos ingresados." });
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: `❌ Error de conexión: ${err.message}` });
    } finally {
      setTesting(false);
    }
  }, []);

  // ── Save handler ──
  const handleSave = async () => {
    setError(null);
    const data: Record<string, any> = {};
    if (businessPhone) data.businessPhone = businessPhone;
    if (phoneNumberId) data.phoneNumberId = phoneNumberId;
    if (waBusinessId) data.waBusinessId = waBusinessId;
    if (accessToken) data.accessToken = accessToken;
    if (webhookSecret) data.webhookSecret = webhookSecret;
    data.isActive = isActive;
    await onSave(data);
  };

  // ── Step content ──
  const renderStep = () => {
    switch (step) {
      case 0: return renderPhoneStep();
      case 1: return renderMetaStep();
      case 2: return renderTokenStep();
      case 3: return renderVerifyStep();
      default: return null;
    }
  };

  // ── Step 0: Número WhatsApp ──
  function renderPhoneStep() {
    return (
      <div style={stepContentStyle}>
        <div style={stepIconContainerStyle}>
          <div style={{ ...stepIconStyle, background: `${primaryColor}15` }}>
            <Smartphone size={28} color={primaryColor} />
          </div>
        </div>
        <h3 style={stepTitleStyle}>¿Cuál es tu número de WhatsApp?</h3>
        <p style={stepDescStyle}>
          Ingresa el número de teléfono que usará tu negocio en WhatsApp. 
          Debe incluir código de país, sin espacios ni guiones.
        </p>

        <div style={fieldGroupStyle}>
          <label style={fieldLabelStyle}>Número de WhatsApp Business</label>
          <input
            type="tel"
            className="field-input"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Ej: 56912345678"
            style={{ fontSize: 16, padding: "14px 16px" }}
          />
          <div style={fieldHintStyle}>
            <HelpCircle size={12} />
            Debe ser el número real donde recibirás mensajes de clientes. 
            Ejemplo: 56912345678 (Chile) o 521234567890 (México).
          </div>
        </div>

        {hasExistingConfig && (
          <div style={infoBoxStyle}>
            <RefreshCw size={14} />
            <span>Ya tienes una configuración guardada. Puedes actualizar el número si cambió.</span>
          </div>
        )}
      </div>
    );
  }

  // ── Step 1: Datos Meta ──
  function renderMetaStep() {
    return (
      <div style={stepContentStyle}>
        <div style={stepIconContainerStyle}>
          <div style={{ ...stepIconStyle, background: `${primaryColor}15` }}>
            <Shield size={28} color={primaryColor} />
          </div>
        </div>
        <h3 style={stepTitleStyle}>Datos de tu cuenta de Meta</h3>
        <p style={stepDescStyle}>
          Estos datos los encuentras en el <strong>Meta Business Suite</strong> de tu cuenta de Facebook.
        </p>

        <div style={metaGuideStyle}>
          <strong>¿Cómo obtener estos datos?</strong>
          <ol style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
            <li>Ve a <strong>business.facebook.com</strong></li>
            <li>Entra a <strong>Configuración de negocio</strong> → <strong>Cuentas de WhatsApp</strong></li>
            <li>Selecciona tu número y copia el <strong>ID de la cuenta de WhatsApp</strong></li>
            <li>El <strong>ID del número de teléfono</strong> está en los detalles del número</li>
          </ol>
        </div>

        <div style={fieldGroupStyle}>
          <label style={fieldLabelStyle}>ID del Número de Teléfono (Phone Number ID)</label>
          <input
            type="text"
            className="field-input"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="Ej: 123456789012345"
          />
          <div style={fieldHintStyle}>
            Es un número largo (15+ dígitos). Lo ves en Meta Business Suite &gt; WhatsApp &gt; Números de teléfono.
          </div>
        </div>

        <div style={fieldGroupStyle}>
          <label style={fieldLabelStyle}>ID de Cuenta WhatsApp Business (WABA ID)</label>
          <input
            type="text"
            className="field-input"
            value={waBusinessId}
            onChange={(e) => setWaBusinessId(e.target.value)}
            placeholder="Ej: 123456789012345"
          />
          <div style={fieldHintStyle}>
            Es el ID de toda tu cuenta de WhatsApp Business. También está en Meta Business Suite.
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Token de acceso ──
  function renderTokenStep() {
    return (
      <div style={stepContentStyle}>
        <div style={stepIconContainerStyle}>
          <div style={{ ...stepIconStyle, background: `${primaryColor}15` }}>
            <Shield size={28} color={primaryColor} />
          </div>
        </div>
        <h3 style={stepTitleStyle}>Token de acceso y clave de seguridad</h3>
        <p style={stepDescStyle}>
          Estos dos valores le permiten a SendMe Studio conectarse de forma segura con WhatsApp.
        </p>

        <div style={metaGuideStyle}>
          <strong>¿Cómo obtener el Token?</strong>
          <ol style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
            <li>En Meta Business Suite, ve a <strong>Cuentas de WhatsApp</strong></li>
            <li>Haz clic en <strong>Administrar</strong> junto a tu número</li>
            <li>En la sección <strong>Token de acceso</strong>, genera un nuevo token</li>
            <li>Copia el token completo (empieza con <strong>EAAP...</strong>)</li>
          </ol>
        </div>

        <div style={warningBoxStyle}>
          <AlertCircle size={14} />
          <span>Este token es como una contraseña. No lo compartas con nadie. SendMe Studio lo guarda encriptado.</span>
        </div>

        <div style={fieldGroupStyle}>
          <label style={fieldLabelStyle}>Token de acceso</label>
          <input
            type="password"
            className="field-input"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Pega aquí el token (empieza con EAAP...)"
            style={{ fontFamily: "monospace", fontSize: 13 }}
          />
        </div>

        <div style={fieldGroupStyle}>
          <label style={fieldLabelStyle}>Clave del webhook (Verify Token)</label>
          <input
            type="password"
            className="field-input"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder="Crea una clave secreta (ej: miNegocio2024)"
          />
          <div style={fieldHintStyle}>
            <HelpCircle size={12} />
            Puedes inventar esta clave. Debe ser la misma que configures en el webhook de Meta.
            Ejemplo: <strong>SendMeStudio2025</strong>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Verificar ──
  function renderVerifyStep() {
    const isComplete = businessPhone && phoneNumberId && waBusinessId && accessToken && webhookSecret;
    return (
      <div style={stepContentStyle}>
        <div style={stepIconContainerStyle}>
          <div style={{ ...stepIconStyle, background: `${primaryColor}15` }}>
            <Check size={28} color={primaryColor} />
          </div>
        </div>
        <h3 style={stepTitleStyle}>Verificar y activar</h3>
        <p style={stepDescStyle}>
          Revisa que todos los datos sean correctos antes de guardar.
        </p>

        {/* Resumen de datos */}
        <div style={summaryContainerStyle}>
          <SummaryRow label="WhatsApp Business" value={businessPhone} icon={<Smartphone size={14} />} />
          <SummaryRow label="Phone Number ID" value={phoneNumberId} icon={<Shield size={14} />} />
          <SummaryRow label="WABA ID" value={waBusinessId} icon={<Shield size={14} />} />
          <SummaryRow label="Token" value={accessToken ? `••••${accessToken.slice(-6)}` : "—"} icon={<Shield size={14} />} />
          <SummaryRow label="Webhook Secret" value={webhookSecret ? `••••${webhookSecret.slice(-4)}` : "—"} icon={<Shield size={14} />} />
        </div>

        {isComplete && (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              onClick={testConnection}
              disabled={testing}
              style={{
                ...testBtnStyle,
                background: testing ? "#94a3b8" : "#2563eb",
              }}
            >
              {testing ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
              {testing ? "Verificando..." : "Probar conexión"}
            </button>
          </div>
        )}

        {testResult && (
          <div style={{
            ...resultBoxStyle,
            background: testResult.ok ? "rgba(39,174,96,0.08)" : "rgba(231,76,60,0.08)",
            borderColor: testResult.ok ? "#27ae60" : "#e74c3c",
          }}>
            {testResult.message}
          </div>
        )}

        {/* Activar toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <input
            type="checkbox"
            id="wa-active-final"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
          <label htmlFor="wa-active-final" style={{ cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
            Activar WhatsApp ahora
          </label>
        </div>

        {!isComplete && (
          <div style={warningBoxStyle}>
            <AlertCircle size={14} />
            <span>Faltan datos en pasos anteriores. Vuelve a revisar.</span>
          </div>
        )}

        {saved && (
          <div style={{ padding: 12, borderRadius: 8, background: "rgba(39,174,96,0.1)", color: "#27ae60", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
            ✅ Configuración guardada exitosamente
          </div>
        )}
      </div>
    );
  }

  // ── Render ──
  return (
    <div style={wizardContainerStyle}>
      {/* Progress bar */}
      <div style={progressContainerStyle}>
        {STEPS.map((s, idx) => (
          <div key={s.id} style={progressStepStyle}>
            <div
              style={{
                ...stepDotStyle,
                background: idx <= step ? primaryColor : "var(--glass-border)",
                color: idx <= step ? "#fff" : "var(--text-tertiary)",
              }}
            >
              {idx < step ? <Check size={12} /> : idx + 1}
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: idx === step ? 600 : 400,
              color: idx <= step ? "var(--text-primary)" : "var(--text-tertiary)",
              textAlign: "center",
            }}>
              {s.label}
            </span>
            {idx < STEPS.length - 1 && (
              <div style={{
                ...progressLineStyle,
                background: idx < step ? primaryColor : "var(--glass-border)",
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div style={stepContainerStyle}>
        {renderStep()}
      </div>

      {/* Error */}
      {error && (
        <div style={errorBoxStyle}>
          <AlertCircle size={14} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <div style={navContainerStyle}>
        {step > 0 ? (
          <button
            onClick={() => setStep(step - 1)}
            style={secondaryBtnStyle}
          >
            <ChevronLeft size={14} /> Anterior
          </button>
        ) : <div />}

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            style={{
              ...primaryBtnStyle,
              background: canProceed() ? primaryColor : "#94a3b8",
              opacity: canProceed() ? 1 : 0.5,
            }}
          >
            Siguiente <ChevronRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || !canProceed()}
            style={{
              ...primaryBtnStyle,
              background: saving ? "#94a3b8" : primaryColor,
            }}
          >
            {saving ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: SummaryRow ──
function SummaryRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div style={summaryRowStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 13 }}>
        {icon}
        {label}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: value.startsWith("••••") ? "monospace" : "inherit" }}>
        {value || "—"}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════

const wizardContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  padding: 24,
};

const progressContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 0,
  padding: "0 10px",
};

const progressStepStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flex: 1,
  maxWidth: 160,
};

const stepDotStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
  transition: "all 0.3s",
};

const progressLineStyle: React.CSSProperties = {
  flex: 1,
  height: 2,
  margin: "0 4px",
  borderRadius: 1,
  transition: "all 0.3s",
};

const stepContainerStyle: React.CSSProperties = {
  minHeight: 320,
};

const stepContentStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const stepIconContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 8,
};

const stepIconStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const stepTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "var(--text-primary)",
  margin: 0,
  textAlign: "center",
};

const stepDescStyle: React.CSSProperties = {
  fontSize: 14,
  color: "var(--text-secondary)",
  margin: 0,
  textAlign: "center",
  lineHeight: 1.5,
};

const fieldGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-primary)",
};

const fieldHintStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-tertiary)",
  display: "flex",
  alignItems: "flex-start",
  gap: 4,
  lineHeight: 1.4,
};

const metaGuideStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 12,
  background: "var(--surface-glass-strong)",
  border: "1px solid var(--glass-border)",
  fontSize: 13,
  color: "var(--text-secondary)",
  lineHeight: 1.6,
};

const warningBoxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 10,
  background: "rgba(245,158,11,0.08)",
  border: "1px solid rgba(245,158,11,0.15)",
  fontSize: 13,
  color: "#92400e",
  lineHeight: 1.4,
};

const infoBoxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 10,
  background: "rgba(37,99,235,0.06)",
  border: "1px solid rgba(37,99,235,0.10)",
  fontSize: 13,
  color: "#1e40af",
  lineHeight: 1.4,
};

const errorBoxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 10,
  background: "rgba(231,76,60,0.08)",
  color: "#c0392b",
  fontSize: 13,
};

const summaryContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: 14,
  borderRadius: 12,
  background: "var(--surface-glass-strong)",
  border: "1px solid var(--glass-border)",
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 0",
  borderBottom: "1px solid var(--glass-border)",
};

const navContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 8,
  borderTop: "1px solid var(--glass-border)",
};

const primaryBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 24px",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s",
};

const secondaryBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "10px 18px",
  background: "transparent",
  color: "var(--text-secondary)",
  border: "1px solid var(--glass-border)",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

const testBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 18px",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const resultBoxStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid",
  fontSize: 13,
  lineHeight: 1.4,
  marginTop: 8,
};
