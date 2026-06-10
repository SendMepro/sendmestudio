// ================================================================
// admin/verticals/page.tsx — Super Admin: Gestión de Vertical Templates
// CRUD completo de plantillas + seed + aplicar a tenants
// ================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  RefreshCw,
  Check,
  X,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  Shield,
  Search,
  AlertTriangle,
  Copy,
  Save,
  ArrowLeft,
} from "lucide-react";
import AdminSessionBadge from "@/app/components/AdminSessionBadge";

interface VerticalTemplate {
  id: string;
  slug: string;
  name: string;
  version: string;
  vertical: string;
  isActive: boolean;
  description: string;
  config: any;
  createdAt: string;
  updatedAt: string;
}

interface Tenant {
  id: string;
  businessName: string;
  slug: string;
  businessType: string;
  templateId: string | null;
  templateVersion: string | null;
}

const VERTICAL_LABELS: Record<string, string> = {
  salon: "💇 Salón Belleza",
  barber: "✂️ Barbería",
  spa: "🧖 SPA & Bienestar",
  estetica: "✨ Centro Estética",
  clinica: "🏥 Clínica Estética",
};

const VERTICAL_COLORS: Record<string, string> = {
  salon: "#7c5cff",
  barber: "#1a1a2e",
  spa: "#059669",
  estetica: "#be185d",
  clinica: "#2563eb",
};

// ── Template Card ──
function TemplateCard({
  template,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  template: VerticalTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = VERTICAL_COLORS[template.vertical] || "#7c5cff";

  return (
    <div
      style={{
        ...styles.card,
        borderLeft: `3px solid ${color}`,
        opacity: template.isActive ? 1 : 0.5,
      }}
    >
      <div style={styles.cardHeader}>
        <div style={styles.cardHeaderLeft}>
          <div style={{ ...styles.verticalBadge, background: `${color}12`, color }}>
            {template.vertical}
          </div>
          <div>
            <div style={styles.cardTitle}>{template.name}</div>
            <div style={styles.cardSubtitle}>
              <code>{template.slug}</code>
              <span style={styles.versionBadge}>{template.version}</span>
            </div>
          </div>
        </div>
        <div style={styles.cardActions}>
          <button onClick={onEdit} style={styles.iconBtn} title="Editar">
            <Edit3 size={14} strokeWidth={1.5} />
          </button>
          <button onClick={onToggleActive} style={styles.iconBtn} title={template.isActive ? "Desactivar" : "Activar"}>
            {template.isActive ? <X size={14} strokeWidth={1.5} /> : <Check size={14} strokeWidth={1.5} />}
          </button>
          <button onClick={onDelete} style={{ ...styles.iconBtn, color: "#e74c3c" }} title="Eliminar">
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            style={styles.iconBtn}
            title={expanded ? "Contraer" : "Expandir"}
          >
            {expanded ? <ChevronUp size={14} strokeWidth={1.5} /> : <ChevronDown size={14} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <div style={styles.cardDesc}>{template.description}</div>

      {expanded && (
        <div style={styles.cardConfig}>
          <div style={styles.configTitle}>Configuración del Template</div>
          <pre style={styles.configPre}>
            {JSON.stringify(template.config, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──
export default function AdminVerticalsPage() {
  const [templates, setTemplates] = useState<VerticalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [verticalFilter, setVerticalFilter] = useState("");

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VerticalTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    version: "v1",
    vertical: "salon",
    description: "",
    config: "{}",
  });

  const loadTemplates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (verticalFilter) params.set("vertical", verticalFilter);
      const res = await fetch(`/api/admin/verticals?${params}`);
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [verticalFilter]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSeed = async () => {
    try {
      await fetch("/api/admin/verticals/seed", { method: "POST" });
      loadTemplates();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openNewForm = () => {
    setEditing(null);
    setForm({
      slug: "",
      name: "",
      version: "v1",
      vertical: "salon",
      description: "",
      config: "{}",
    });
    setShowForm(true);
  };

  const openEditForm = (tpl: VerticalTemplate) => {
    setEditing(tpl);
    setForm({
      slug: tpl.slug,
      name: tpl.name,
      version: tpl.version,
      vertical: tpl.vertical,
      description: tpl.description,
      config: JSON.stringify(tpl.config, null, 2),
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let config: any;
      try {
        config = JSON.parse(form.config);
      } catch {
        setError("Config inválida. Debe ser JSON válido.");
        setSaving(false);
        return;
      }

      if (editing) {
        const res = await fetch(`/api/admin/verticals/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            version: form.version,
            vertical: form.vertical,
            description: form.description,
            config,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al actualizar");
          return;
        }
      } else {
        const res = await fetch("/api/admin/verticals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al crear");
          return;
        }
      }

      setShowForm(false);
      loadTemplates();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este template permanentemente?")) return;
    try {
      await fetch(`/api/admin/verticals/${id}`, { method: "DELETE" });
      loadTemplates();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (tpl: VerticalTemplate) => {
    try {
      await fetch(`/api/admin/verticals/${tpl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tpl.isActive }),
      });
      loadTemplates();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = filtered.reduce(
    (acc, t) => {
      const v = t.vertical;
      if (!acc[v]) acc[v] = [];
      acc[v].push(t);
      return acc;
    },
    {} as Record<string, VerticalTemplate[]>,
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Vertical Templates</h1>
            <p style={styles.subtitle}>
              Plantillas SaaS por vertical. Crea, edita y aplica configuraciones predefinidas a los tenants.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <AdminSessionBadge />
          </div>
        </div>

        {/* Filters + Actions */}
        <div style={styles.toolbar}>
          <div style={styles.searchBar}>
            <Search size={16} strokeWidth={1.5} color="#94a3b8" />
            <input
              style={styles.searchInput}
              placeholder="Buscar templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            style={styles.filterSelect}
            value={verticalFilter}
            onChange={(e) => setVerticalFilter(e.target.value)}
          >
            <option value="">Todas las verticales</option>
            {Object.entries(VERTICAL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <button onClick={handleSeed} style={styles.secondaryBtn}>
            <RefreshCw size={14} strokeWidth={1.5} />
            Seed Built-in
          </button>

          <button onClick={openNewForm} style={styles.primaryBtn}>
            <Plus size={16} strokeWidth={2} />
            Nuevo Template
          </button>
        </div>

        {/* Error */}
        {error ? (
          <div style={styles.error}>
            <AlertTriangle size={14} strokeWidth={1.5} />
            {error}
            <button onClick={() => setError("")} style={styles.errorClose}>×</button>
          </div>
        ) : null}

        {/* Templates by Vertical */}
        {loading ? (
          <div style={styles.loading}>Cargando templates...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <Layers size={48} style={{ color: "#cbd5e1", marginBottom: 12 }} />
            <p>
              {search || verticalFilter
                ? "Sin resultados con esos filtros"
                : "No hay templates. Carga los built-in o crea uno nuevo."}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([vertical, items]) => (
            <div key={vertical} style={styles.group}>
              <div style={styles.groupTitle}>
                <span
                  style={{
                    ...styles.groupBadge,
                    background: `${VERTICAL_COLORS[vertical] || "#7c5cff"}12`,
                    color: VERTICAL_COLORS[vertical] || "#7c5cff",
                  }}
                >
                  {VERTICAL_LABELS[vertical] || vertical}
                </span>
                <span style={styles.groupCount}>{items.length} template{items.length !== 1 ? "s" : ""}</span>
              </div>

              {items.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  onEdit={() => openEditForm(tpl)}
                  onDelete={() => handleDelete(tpl.id)}
                  onToggleActive={() => handleToggleActive(tpl)}
                />
              ))}
            </div>
          ))
        )}

        {/* Form Modal */}
        {showForm && (
          <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  {editing ? "Editar Template" : "Nuevo Template"}
                </h2>
                <button onClick={() => setShowForm(false)} style={styles.modalClose}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} style={styles.modalForm}>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Slug *</label>
                    <input
                      style={styles.formInput}
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="salon-premium-v2"
                      disabled={!!editing}
                      required
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Nombre *</label>
                    <input
                      style={styles.formInput}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Salón Premium"
                      required
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Versión</label>
                    <input
                      style={styles.formInput}
                      value={form.version}
                      onChange={(e) => setForm({ ...form, version: e.target.value })}
                      placeholder="v1"
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Vertical *</label>
                    <select
                      style={styles.formInput}
                      value={form.vertical}
                      onChange={(e) => setForm({ ...form, vertical: e.target.value })}
                      required
                    >
                      <option value="salon">Salón de Belleza</option>
                      <option value="barber">Barbería</option>
                      <option value="spa">SPA & Bienestar</option>
                      <option value="estetica">Centro de Estética</option>
                      <option value="clinica">Clínica Estética</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>Descripción</label>
                  <textarea
                    style={{ ...styles.formInput, minHeight: 60, resize: "vertical" }}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe el template y su propósito..."
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    Config (JSON)
                    <span style={styles.fieldHint}> — branding, businessSettings, businessHours, services, stylists, ai, knowledge, policies</span>
                  </label>
                  <textarea
                    style={{
                      ...styles.formInput,
                      minHeight: 300,
                      resize: "vertical",
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontSize: 12,
                    }}
                    value={form.config}
                    onChange={(e) => setForm({ ...form, config: e.target.value })}
                    placeholder='{"branding": {...}, "services": [...], ...}'
                  />
                </div>

                {error && (
                  <div style={styles.formError}>
                    <AlertTriangle size={12} strokeWidth={1.5} />
                    {error}
                  </div>
                )}

                <div style={styles.formActions}>
                  <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>
                    Cancelar
                  </button>
                  <button type="submit" style={styles.saveBtn} disabled={saving}>
                    <Save size={14} strokeWidth={2} />
                    {saving ? "Guardando..." : editing ? "Actualizar" : "Crear Template"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ──
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "#f8f6ff",
    fontFamily: "'Inter', sans-serif",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "48px 32px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 16,
  },
  title: { fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },

  toolbar: {
    display: "flex",
    gap: 10,
    marginBottom: 24,
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    background: "#fff",
    border: "1px solid rgba(124,58,237,0.06)",
    borderRadius: 12,
    flex: 1,
    minWidth: 200,
  },
  searchInput: {
    border: "none",
    outline: "none",
    flex: 1,
    fontSize: 13,
    background: "transparent",
    color: "#0f172a",
  },
  filterSelect: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(124,58,237,0.1)",
    fontSize: 13,
    background: "#fff",
    color: "#0f172a",
    outline: "none",
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    background: "linear-gradient(135deg, #7c5cff, #9b7dff)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    background: "rgba(255,255,255,0.8)",
    color: "#475569",
    border: "1px solid rgba(124,58,237,0.08)",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  error: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(231,76,60,0.08)",
    color: "#e74c3c",
    padding: "12px 16px",
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 16,
  },
  errorClose: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    color: "#e74c3c",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
  },
  loading: { textAlign: "center", color: "#94a3b8", padding: 60, fontSize: 14 },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    padding: 60,
    fontSize: 14,
    background: "#fff",
    borderRadius: 16,
  },

  // Groups
  group: { marginBottom: 32 },
  groupTitle: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  groupBadge: {
    padding: "4px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
  },
  groupCount: {
    fontSize: 12,
    color: "#94a3b8",
  },

  // Card
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "18px 20px",
    marginBottom: 10,
    border: "1px solid rgba(124,58,237,0.04)",
    transition: "all 0.15s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardHeaderLeft: { display: "flex", alignItems: "center", gap: 12 },
  verticalBadge: {
    padding: "3px 10px",
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  cardTitle: { fontWeight: 600, fontSize: 14, color: "#0f172a" },
  cardSubtitle: { display: "flex", alignItems: "center", gap: 8, marginTop: 3 },
  versionBadge: {
    padding: "2px 8px",
    borderRadius: 6,
    background: "rgba(124,92,255,0.08)",
    color: "#7c5cff",
    fontSize: 10,
    fontWeight: 600,
  },
  cardDesc: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.4,
  },
  cardActions: { display: "flex", gap: 6 },
  iconBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: "rgba(124,58,237,0.06)",
    color: "#64748b",
    transition: "all 0.15s",
  },
  cardConfig: { marginTop: 12 },
  configTitle: { fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase" },
  configPre: {
    background: "#f8f6ff",
    borderRadius: 10,
    padding: 14,
    fontSize: 11,
    lineHeight: 1.5,
    overflowX: "auto" as const,
    maxHeight: 400,
    overflowY: "auto" as const,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    color: "#475569",
  },

  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.40)",
    backdropFilter: "blur(4px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    background: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 720,
    maxHeight: "90vh",
    overflow: "auto",
    padding: "28px 32px",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 },
  modalClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    padding: 4,
  },
  modalForm: { display: "flex", flexDirection: "column", gap: 16 },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  formField: { display: "flex", flexDirection: "column", gap: 6 },
  formLabel: { fontSize: 13, fontWeight: 600, color: "#475569" },
  fieldHint: { fontSize: 11, fontWeight: 400, color: "#94a3b8" },
  formInput: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(124,58,237,0.1)",
    fontSize: 13,
    outline: "none",
    background: "#fafafa",
    color: "#0f172a",
    fontFamily: "'Inter', sans-serif",
  },
  formError: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(231,76,60,0.08)",
    color: "#e74c3c",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 12,
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: 12,
    border: "1px solid rgba(124,58,237,0.1)",
    background: "#fff",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  saveBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 24px",
    background: "linear-gradient(135deg, #7c5cff, #9b7dff)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};
