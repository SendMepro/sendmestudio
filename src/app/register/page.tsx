"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../login/login.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessType, setBusinessType] = useState("salon");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const VERTICAL_OPTIONS = [
    { id: "salon", label: "💇 Salón de Belleza", desc: "Cortes, color, peinados, manicure" },
    { id: "barber", label: "✂️ Barbería", desc: "Cortes caballero, barba, afeitado" },
    { id: "spa", label: "🧖 SPA & Bienestar", desc: "Masajes, faciales, hidroterapia" },
    { id: "estetica", label: "✨ Centro de Estética", desc: "Depilación láser, aparatología" },
    { id: "clinica", label: "🏥 Clínica Estética", desc: "Medicina estética, inyectables" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, businessName, ownerName, businessType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear cuenta");
        return;
      }

      setSuccess("Cuenta creada exitosamente. Redirigiendo...");
      setTimeout(() => {
        router.push("/onboarding");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.loginContainer}
      style={{
        backgroundImage:
          'linear-gradient(rgba(252, 250, 248, 0.8), rgba(252, 250, 248, 0.8)), url("https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1600")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className={styles.glassCard}
        style={{
          background: "white",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.05)",
        }}
      >
        <div className={styles.brandSection}>
          <div className={styles.logoCircle}>✨</div>
          <h1 className={styles.brandTitle}>Crear cuenta</h1>
          <p className={styles.brandSubtitle}>Registra tu negocio en SendMe Studio</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Tipo de Negocio</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {VERTICAL_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: businessType === opt.id ? "2px solid #7c5cff" : "1px solid rgba(124,92,255,0.08)",
                    background: businessType === opt.id ? "rgba(124,92,255,0.04)" : "#fafafa",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="businessType"
                    value={opt.id}
                    checked={businessType === opt.id}
                    onChange={(e) => setBusinessType(e.target.value)}
                    style={{ accentColor: "#7c5cff" }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre del Negocio</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ej: Salón Belleza Spa"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Tu Nombre</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Ej: María González"
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@salon.com"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              required
              minLength={6}
              className={styles.input}
            />
          </div>

          {error ? <em className={styles.errorMessage}>{error}</em> : null}
          {success ? <em className={styles.successMessage}>{success}</em> : null}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <div className={styles.footerSection}>
          <p>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className={styles.linkText}>
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
