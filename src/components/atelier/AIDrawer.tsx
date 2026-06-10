"use client";

interface Suggestion {
  text: string;
}

interface MediaPlaceholder {
  type: "image" | "video";
  src: string;
  label: string;
}

interface Props {
  suggestions: string[];
  onSelect: (text: string) => void;
  onClose: () => void;
}

const mediaPlaceholders: MediaPlaceholder[] = [
  { 
    type: "image", 
    src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=200&q=80", 
    label: "Antes & Después — Balayage" 
  },
  { 
    type: "video", 
    src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80", 
    label: "Proceso Balayage Premium" 
  },
  { 
    type: "video", 
    src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80", 
    label: "Rituales Olaplex" 
  },
];

export default function LiquidGlassAIDrawer({ suggestions, onSelect, onClose }: Props) {
  const drawerStyle: React.CSSProperties = {
    padding: "1.5rem",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "white",
    overflowY: "auto",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1.8px",
    color: "var(--accent-gold)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
    position: "relative",
    zIndex: 1,
  };

  return (
    <div style={drawerStyle}>
      <div style={labelStyle}>
        <span>◈ BEAUTY CONCIERGE EXPERT</span>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-ghost)", fontSize: "0.75rem", padding: "2px" }}
        >
          ✕
        </button>
      </div>

      {/* AI Reply Suggestions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "0.85rem", position: "relative", zIndex: 1 }}>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "0.6rem 0.9rem",
              borderRadius: "14px",
              border: "1px solid rgba(0,0,0,0.05)",
              background: "white",
              fontSize: "0.78rem",
              cursor: "pointer",
              color: "var(--text-main)",
              textAlign: "left",
              lineHeight: 1.4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ position: "relative", zIndex: 1 }}>{s}</div>
          </button>
        ))}
      </div>

      {/* Media Suggestions */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--text-ghost)", marginBottom: "0.75rem" }}>
          Multimedia Sugerida
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {mediaPlaceholders.map((media, i) => (
            <div
              key={i}
              style={{
                width: "100%",
                boxSizing: "border-box",
                height: "80px",
                borderRadius: "16px",
                border: "1px solid rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                padding: "0 1rem",
                gap: "12px",
                cursor: "pointer",
                background: "white",
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
                {/* Thumbnail */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={media.src}
                    alt={media.label}
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "12px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  {media.type === "video" && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,0.35)",
                      borderRadius: "12px",
                    }}>
                      <span style={{ fontSize: "0.65rem", color: "white" }}>▶</span>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {media.label}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-ghost)" }}>
                    {media.type === "video" ? "Video tutorial" : "Imagen de referencia"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "auto", position: "relative", zIndex: 1 }}>
        <button
          style={{
            padding: "0.8rem 1rem",
            borderRadius: "14px",
            border: "none",
            background: "var(--text-main)",
            color: "white",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.3px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          Agendar Cita
        </button>
        <button
          style={{
            padding: "0.8rem 1rem",
            borderRadius: "14px",
            border: "1px solid rgba(0,0,0,0.05)",
            background: "white",
            color: "var(--text-main)",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sugerir Tag / Nota
        </button>
      </div>
    </div>
  );
}
