"use client";

import { Lock, Sparkles } from "lucide-react";
import styles from "../brain-admin.module.css";

interface LoginScreenProps {
  isCheckingAuth: boolean;
  isAuthenticated: boolean;
  password: string;
  loginError: string;
  localDevKeyHint: string;
  onPasswordChange: (value: string) => void;
  onLogin: () => void;
}

export function LoginScreen({
  isCheckingAuth,
  isAuthenticated,
  password,
  loginError,
  localDevKeyHint,
  onPasswordChange,
  onLogin,
}: LoginScreenProps) {
  if (isCheckingAuth) {
    return (
      <section className={styles.loginCard}>
        <Sparkles size={22} strokeWidth={1.7} />
        <p>Validando acceso admin...</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className={styles.loginCard}>
        <div className={styles.loginIcon}>
          <Lock size={24} strokeWidth={1.8} />
        </div>
        <span>Premium AI Feature</span>
        <h1>Sistema de Aprendizaje del Negocio</h1>
        <p>
          Acceso admin para gestionar el aprendizaje inteligente del salón.
        </p>
        <input
          onChange={(event) => onPasswordChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onLogin();
            }
          }}
          placeholder="Clave admin"
          type="password"
          value={password}
        />
        {localDevKeyHint ? (
          <small className={styles.localKeyHint}>Clave local de prueba: {localDevKeyHint}</small>
        ) : null}
        {loginError ? <em>{loginError}</em> : null}
        <button onClick={onLogin} type="button">
          Entrar
        </button>
      </section>
    );
  }

  return null;
}
