// ================================================================
// /knowledge/page.tsx — Knowledge Base UI mejorada
// Categorías: services, stylists, faqs, hours, policies, documents
// Búsqueda global + upload de documentos
// ================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/app/components/AppShell";
import {
  Search,
  Plus,
  Upload,
  FileText,
  Scissors,
  User as UserIcon,
  HelpCircle,
  Clock,
  Shield,
  BookOpen,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Download,
  Globe,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  { id: "services", label: "Servicios", icon: Scissors },
  { id: "stylists", label: "Estilistas", icon: UserIcon },
  { id: "faqs", label: "FAQs", icon: HelpCircle },
  { id: "hours", label: "Horarios", icon: Clock },
  { id: "policies", label: "Políticas", icon: Shield },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "other", label: "Otros", icon: BookOpen },
];

export default function KnowledgeBasePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const url = activeCategory
        ? `/api/knowledge?section=${activeCategory}`
        : "/api/knowledge";
      const res = await fetch(url);
      const json = await res.json();
      if (json.ok) setItems(json.items);
    } catch (err) {
      console.error("Error fetching knowledge:", err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults(null);
      fetchItems();
    }
  }, [activeCategory, fetchItems, searchQuery]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/knowledge/search?q=${encodeURIComponent(searchQuery)}`);
        const json = await res.json();
        if (json.ok) setSearchResults(json.results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este item de conocimiento?")) return;
    try {
      const res = await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) fetchItems();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: editForm }),
      });
      const json = await res.json();
      if (json.ok) {
        setEditingItem(null);
        fetchItems();
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("section", activeCategory || "documents");
    formData.append("tags", CATEGORIES.find((c) => c.id === activeCategory)?.label || "documento");

    try {
      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.ok) {
        setUploadStatus(`✓ "${file.name}" subido correctamente`);
        fetchItems();
      } else {
        setUploadStatus(`✗ Error: ${json.error}`);
      }
    } catch (err: any) {
      setUploadStatus(`✗ Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Render results
  const displayItems = searchResults || items;

  return (
    <AppShell>
      <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Knowledge Base</h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              Gestiona servicios, estilistas, FAQ y documentos para el agente IA
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <label className="btn-glass" style={{ padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <Upload size={14} /> Subir documento
              <input type="file" hidden accept=".pdf,.docx,.doc,.txt" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Search */}
        <div className="search-bar" style={{ marginBottom: 20, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Buscar en toda la knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 40px",
              borderRadius: 12,
              border: "1px solid var(--glass-border)",
              background: "var(--surface-glass-strong)",
              fontSize: 14,
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          {searching && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-tertiary)" }}>Buscando...</span>}
        </div>

        {/* Upload status */}
        {uploadStatus && (
          <div style={{ padding: "8px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, background: uploadStatus.startsWith("✓") ? "rgba(39,174,96,0.1)" : "rgba(231,76,60,0.1)", border: `1px solid ${uploadStatus.startsWith("✓") ? "#27ae60" : "#e74c3c"}33` }}>
            {uploadStatus}
            <button onClick={() => setUploadStatus(null)} style={{ marginLeft: 12, background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
              <X size={12} />
            </button>
          </div>
        )}

        {/* Category tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveCategory(null)}
            className="btn-glass"
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              border: activeCategory === null ? "2px solid var(--tenant-primary)" : "1px solid var(--glass-border)",
              background: activeCategory === null ? "var(--tenant-primary-lighter)" : "var(--surface-glass-strong)",
              cursor: "pointer",
            }}
          >
            Todas ({searchResults ? "" : items.length})
          </button>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? null : cat.id)}
                className="btn-glass"
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  border: isActive ? "2px solid var(--tenant-primary)" : "1px solid var(--glass-border)",
                  background: isActive ? "var(--tenant-primary-lighter)" : "var(--surface-glass-strong)",
                  cursor: "pointer",
                }}
              >
                <Icon size={12} /> {cat.label}
              </button>
            );
          })}
        </div>

        {/* Items list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}>
            Cargando...
          </div>
        ) : displayItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}>
            <BookOpen size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            <p>No hay contenido en esta categoría.</p>
            {!searchQuery && <p style={{ fontSize: 13 }}>Agrega servicios, FAQs o sube documentos desde las otras secciones.</p>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {displayItems.map((item: any) => {
              const isSearchResult = item.type && item.type !== "knowledge";
              const id = item.id || item.key || item.name;
              const data = item.data || {};
              const isExpanded = expandedItems.has(id);
              const isEditing = editingItem === id;

              return (
                <div key={id} className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                  {/* Header */}
                  <div
                    onClick={() => toggleExpand(id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderBottom: isExpanded ? "1px solid var(--glass-border)" : "none",
                    }}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <ItemIcon item={item} data={data} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{item.key || item.name || data.fileName || data.title || id}</div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", display: "flex", gap: 8, alignItems: "center" }}>
                        <span className="badge">{item.section || item.type || "knowledge"}</span>
                        {data.tags?.length > 0 && data.tags.slice(0, 3).map((tag: string) => <span key={tag} style={{ fontSize: 11, padding: "1px 6px", borderRadius: 10, background: "rgba(124,92,255,0.1)" }}>{tag}</span>)}
                        {data.fileSize && <span>{(data.fileSize / 1024).toFixed(0)} KB</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingItem(isEditing ? null : id); setEditForm(data); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "var(--text-tertiary)" }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "#e74c3c" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ padding: 16 }}>
                      {isEditing ? (
                        <div>
                          <textarea
                            value={JSON.stringify(editForm, null, 2)}
                            onChange={(e) => {
                              try {
                                setEditForm(JSON.parse(e.target.value));
                              } catch {}
                            }}
                            style={{
                              width: "100%",
                              minHeight: 150,
                              padding: 12,
                              borderRadius: 8,
                              border: "1px solid var(--glass-border)",
                              background: "var(--surface-glass-strong)",
                              fontSize: 13,
                              fontFamily: "monospace",
                              color: "var(--text-primary)",
                              outline: "none",
                            }}
                          />
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button onClick={() => handleSave(id)} className="btn-primary" style={{ padding: "6px 16px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                              <Save size={14} /> Guardar
                            </button>
                            <button onClick={() => setEditingItem(null)} className="btn-glass" style={{ padding: "6px 16px", borderRadius: 8, fontSize: 13 }}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <ContentPreview item={item} data={data} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .badge {
          display: inline-block;
          padding: 1px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
          background: var(--tenant-primary-lighter);
          color: var(--tenant-primary);
        }
      `}</style>
    </AppShell>
  );
}

function ItemIcon({ item, data }: { item: any; data: any }) {
  if (item.type === "service" || item.type === "stylist") {
    const Icon = item.type === "service" ? Scissors : UserIcon;
    return <Icon size={16} style={{ flexShrink: 0, color: "var(--tenant-primary)" }} />;
  }
  if (data.isDocument) return <FileText size={16} style={{ flexShrink: 0, color: "#e67e22" }} />;
  if (item.section === "faqs") return <HelpCircle size={16} style={{ flexShrink: 0, color: "#3498db" }} />;
  if (item.section === "hours") return <Clock size={16} style={{ flexShrink: 0, color: "#9b59b6" }} />;
  if (item.section === "policies") return <Shield size={16} style={{ flexShrink: 0, color: "#e74c3c" }} />;
  return <BookOpen size={16} style={{ flexShrink: 0, color: "var(--text-tertiary)" }} />;
}

function ContentPreview({ item, data }: { item: any; data: any }) {
  // Service type
  if (item.type === "service") {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div><strong>Nombre:</strong> {item.name}</div>
        <div><strong>Descripción:</strong> {item.description}</div>
        {item.price && <div><strong>Precio:</strong> ${item.price.toLocaleString("es-CL")}</div>}
        {item.duration && <div><strong>Duración:</strong> {item.duration} min</div>}
        {item.category && <div><strong>Categoría:</strong> {item.category}</div>}
      </div>
    );
  }

  // Stylist type
  if (item.type === "stylist") {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div><strong>Nombre:</strong> {item.name}</div>
        {item.role && <div><strong>Rol:</strong> {item.role}</div>}
        {item.specialties?.length > 0 && (
          <div><strong>Especialidades:</strong> {item.specialties.join(", ")}</div>
        )}
        {item.bio && <div><strong>Bio:</strong> {item.bio}</div>}
      </div>
    );
  }

  // Document
  if (data.isDocument || data.fileName) {
    return (
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <FileText size={16} />
          <span><strong>{data.fileName}</strong></span>
        </div>
        {data.url && (
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="btn-glass" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, fontSize: 13, textDecoration: "none" }}>
            <Download size={14} /> Descargar
          </a>
        )}
        {data.content && (
          <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: "var(--surface-glass-strong)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, maxHeight: 200, overflow: "auto", whiteSpace: "pre-wrap" }}>
            {data.content}
          </div>
        )}
        {data.tags?.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
            {data.tags.map((tag: string) => (
              <span key={tag} style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, background: "var(--tenant-primary-lighter)", color: "var(--tenant-primary)" }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Generic content
  return (
    <div style={{ maxHeight: 300, overflow: "auto" }}>
      <pre style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
