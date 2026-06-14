"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";

const isDev = process.env.NODE_ENV === "development";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isDev) {
        console.log("[login] Enviando POST /api/auth/login...");
        console.log("[login] Email:", email);
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (isDev) {
        console.log("[login] Status:", res.status);
        console.log("[login] Respuesta:", JSON.stringify(data, null, 2));
      }

      if (!res.ok) {
        const msg = data.error || "Error al iniciar sesión";
        setError(msg);
        if (isDev) {
          console.log("[login] Error:", msg);
        }
        return;
      }

      console.log("[login] ✅ Login exitoso, redirigiendo...");

      // Obtener sesión para determinar rol
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData.ok && sessionData.session?.isAuthenticated) {
          const { isSuperAdmin, tenantId } = sessionData.session;
          if (isSuperAdmin) {
            console.log("[login] Super Admin detectado → redirigiendo a /admin");
            router.push("/admin");
          } else if (tenantId) {
            console.log("[login] Usuario con tenant → redirigiendo a /");
            router.push("/");
          } else {
            console.log("[login] Usuario sin tenant → redirigiendo a /onboarding");
            router.push("/onboarding");
          }
        } else {
          router.push("/");
        }
      } catch {
        router.push("/");
      }
      router.refresh();
    } catch (err: any) {
      const netMsg = "Error de conexión. Intenta de nuevo.";
      setError(netMsg);
      if (isDev) {
        const detail = err?.message || String(err);
        console.error("[login] Network error:", detail);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      {/* Abstract decorative orbs */}
      <div className={styles.orbTop} />
      <div className={styles.orbBottom} />
      <div className={styles.orbCenter} />

      {/* Subtle dove silhouettes */}
      <div className={`${styles.dove} ${styles.dove1}`}>🕊</div>
      <div className={`${styles.dove} ${styles.dove2}`}>🕊</div>
      <div className={`${styles.dove} ${styles.dove3}`}>🕊</div>

      <div className={styles.glassCard}>
        {/* SendMe Studio — brand gradient animated matching sendmestudio.com */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 12 }}>
          <h1 className={styles.brandTitle}>
            SendMe Studio
          </h1>
          <span className={styles.brandTagline}>
            Business workspace
          </span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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
              placeholder="••••••••"
              required
              className={styles.input}
            />
          </div>

          {error ? <em className={styles.errorMessage}>{error}</em> : null}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <span className={styles.loadingText}>Iniciando sesión...</span>
            ) : (
              "Ingresar a SendMe Studio"
            )}
          </button>
        </form>

        <div className={styles.footerSection}>
          <p>¿No tienes una cuenta? <Link href="/register" className={styles.linkText}>Crear cuenta</Link></p>
          <p className={styles.footerNotice}>Acceso seguro para clientes registrados</p>
        </div>
      </div>
    </div>
  );
}
