"use client";

import { useEffect, useState } from "react";

export default function ViewportDebugger() {
  const [issues, setIssues] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const reportOverflowIssues = () => {
      const elements = document.querySelectorAll("*");
      const foundIssues: any[] = [];

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > window.innerHeight + 2) {
          foundIssues.push({
            element: el,
            className: el.className,
            bottom: Math.round(rect.bottom),
            viewport: window.innerHeight,
          });
        }
      });
      setIssues(foundIssues);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "d") {
        setIsVisible((v) => !v);
        reportOverflowIssues();
      }
    };

    window.addEventListener("keydown", handleKey);
    const interval = setInterval(reportOverflowIssues, 2000);

    return () => {
      window.removeEventListener("keydown", handleKey);
      clearInterval(interval);
    };
  }, []);

  if (!isVisible || issues.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: 9999,
      background: "rgba(0,0,0,0.85)",
      color: "#ff4d4d",
      padding: "15px",
      borderRadius: "12px",
      fontSize: "12px",
      fontFamily: "monospace",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      maxHeight: "300px",
      overflowY: "auto",
      border: "1px solid rgba(255,77,77,0.3)"
    }}>
      <div style={{ fontWeight: "bold", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
        <span>⚠️ OVERFLOW DETECTED</span>
        <button onClick={() => setIsVisible(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>✕</button>
      </div>
      {issues.map((issue, i) => (
        <div key={i} style={{ marginBottom: "4px", paddingBottom: "4px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ color: "#aaa" }}>{issue.className || "no-class"}</div>
          <div>Bottom: {issue.bottom}px (Viewport: {issue.viewport}px)</div>
        </div>
      ))}
    </div>
  );
}
