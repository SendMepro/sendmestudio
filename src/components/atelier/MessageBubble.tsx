"use client";

interface Props {
  from: "client" | "studio";
  children: React.ReactNode;
  time: string;
}

export default function MessageBubble({ from, children, time }: Props) {
  const isStudio = from === "studio";

  const bubbleStyle: React.CSSProperties = isStudio
    ? {
        alignSelf: "flex-end",
        maxWidth: "72%",
        padding: "0.9rem 1.25rem",
        background: "linear-gradient(135deg, #7C3AED, #A855F7)",
        color: "white",
        borderRadius: "22px 22px 4px 22px",
        boxShadow: "0 8px 24px rgba(124,58,237,0.15)",
        lineHeight: 1.55,
        fontSize: "0.92rem",
      }
    : {
        alignSelf: "flex-start",
        maxWidth: "72%",
        padding: "0.9rem 1.25rem",
        background: "white",
        color: "#2D2D2D",
        borderRadius: "22px 22px 22px 4px",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        lineHeight: 1.55,
        fontSize: "0.92rem",
      };

  const timeStyle: React.CSSProperties = {
    fontSize: "0.62rem",
    marginTop: "8px",
    letterSpacing: "0.8px",
    color: isStudio ? "rgba(255,255,255,0.7)" : "#A8A4A0",
  };

  return (
    <div style={bubbleStyle}>
      {children}
      <div style={timeStyle}>
        {time} · {isStudio ? "STUDIO" : "CLIENTA"}
      </div>
    </div>
  );
}
