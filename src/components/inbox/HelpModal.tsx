"use client";

import { Sparkles, X } from "lucide-react";
import styles from "../../app/inbox/inbox.module.css";

export type HelpModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.helpModalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.helpModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.helpModalHeader}>
          <h2 className={styles.helpModalTitle}>Guía de Asistencia Inteligente</h2>
          <button
            className={styles.helpModalClose}
            onClick={onClose}
            type="button"
          >
            <X size={16} strokeWidth={1.6} />
          </button>
        </div>

        <div className={styles.helpModalBody}>
          <section className={styles.helpSectionRow}>
            <div className={styles.helpSectionIcon}>
              <Sparkles size={14} strokeWidth={1.6} />
            </div>
            <div className={styles.helpSectionContent}>
              <h3 className={styles.helpSectionTitle}>Chips inteligentes</h3>
              <p className={styles.helpSectionText}>
                La IA detecta palabras clave dentro del chat, como Balayage, Color, Reserva, Precio, Foto u Horario.
              </p>
            </div>
          </section>

          <section className={styles.helpSectionRow}>
            <div className={styles.helpSectionIcon}>
              <Sparkles size={14} strokeWidth={1.6} />
            </div>
            <div className={styles.helpSectionContent}>
              <h3 className={styles.helpSectionTitle}>Chips dorados</h3>
              <p className={styles.helpSectionText}>
                Cuando una palabra aparece destacada en dorado, puedes hacer click para activar asistencia relacionada.
              </p>
            </div>
          </section>

          <section className={styles.helpSectionRow}>
            <div className={styles.helpSectionIcon}>
              <Sparkles size={14} strokeWidth={1.6} />
            </div>
            <div className={styles.helpSectionContent}>
              <h3 className={styles.helpSectionTitle}>Respuesta asistida</h3>
              <p className={styles.helpSectionText}>
                Cada chip puede añadir una parte útil al borrador del mensaje. Así puedes construir una respuesta profesional paso a paso.
              </p>
            </div>
          </section>

          <section className={styles.helpSectionRow}>
            <div className={styles.helpSectionIcon}>
              <Sparkles size={14} strokeWidth={1.6} />
            </div>
            <div className={styles.helpSectionContent}>
              <h3 className={styles.helpSectionTitle}>Horas disponibles</h3>
              <p className={styles.helpSectionText}>
                Si la IA detecta una hora, puede mostrar si está disponible. Al hacer click, abre la Reserva inteligente.
              </p>
            </div>
          </section>

          <section className={styles.helpSectionRow}>
            <div className={styles.helpSectionIcon}>
              <Sparkles size={14} strokeWidth={1.6} />
            </div>
            <div className={styles.helpSectionContent}>
              <h3 className={styles.helpSectionTitle}>Asistente Feed</h3>
              <p className={styles.helpSectionText}>
                El Asistente Feed ordena las sugerencias según lo último que detectó la IA. Las nuevas aparecen arriba y las anteriores bajan.
              </p>
            </div>
          </section>

          <section className={styles.helpSectionRow}>
            <div className={styles.helpSectionIcon}>
              <Sparkles size={14} strokeWidth={1.6} />
            </div>
            <div className={styles.helpSectionContent}>
              <h3 className={styles.helpSectionTitle}>Reserva inteligente</h3>
              <p className={styles.helpSectionText}>
                Desde el chat puedes abrir una reserva con servicio, horario y estilista sin salir de la conversación.
              </p>
            </div>
          </section>

          <section className={styles.helpSectionRow}>
            <div className={styles.helpSectionIcon}>
              <Sparkles size={14} strokeWidth={1.6} />
            </div>
            <div className={styles.helpSectionContent}>
              <h3 className={styles.helpSectionTitle}>Control humano</h3>
              <p className={styles.helpSectionText}>
                La IA no envía mensajes automáticamente. El usuario revisa, edita y decide cuándo enviar.
              </p>
            </div>
          </section>

          <section className={styles.helpSectionRow}>
            <div className={styles.helpSectionIcon}>
              <Sparkles size={14} strokeWidth={1.6} />
            </div>
            <div className={styles.helpSectionContent}>
              <h3 className={styles.helpSectionTitle}>Fotos del cliente</h3>
              <p className={styles.helpSectionText}>
                Si una clienta envía una foto, el salón puede decidir guardarla como referencia. No se guarda automáticamente.
              </p>
            </div>
          </section>

          <hr className={styles.helpDivider} />

          <section className={styles.helpSectionRow}>
            <div className={styles.helpSectionIcon}>
              <Sparkles size={14} strokeWidth={1.6} />
            </div>
            <div className={styles.helpSectionContent}>
              <h3 className={styles.helpSectionTitle}>¿Qué está haciendo la IA?</h3>
              <div className={styles.helpExampleLog}>
                <span className={styles.helpExampleLine}>
                  <span className={styles.helpExampleCheck}>✓</span> Leyendo conversación
                </span>
                <span className={styles.helpExampleLine}>
                  <span className={styles.helpExampleCheck}>✓</span> Detectó: Balayage
                </span>
                <span className={styles.helpExampleLine}>
                  <span className={styles.helpExampleCheck}>✓</span> Consultó Knowledge aprobado
                </span>
                <span className={styles.helpExampleLine}>
                  <span className={styles.helpExampleCheck}>✓</span> Sugirió respuesta
                </span>
                <span className={styles.helpExampleLine}>
                  <span className={styles.helpExampleCheck}>✓</span> Propuso reserva inteligente
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.helpModalFooter}>
          <button
            className={styles.helpModalAccept}
            onClick={onClose}
            type="button"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
