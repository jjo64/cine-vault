/**
 * @file Cancel.tsx
 * @description Página de cancelación o retorno de Stripe, incentivando al usuario a volver en el futuro o celebrando que continúa.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeartCrack, ChevronRight, Sparkles, CheckCircle, Heart } from "lucide-react";
import { getSubscriptionStatus } from "../services/subscriptionServices";
import type { SubscriptionStatus } from "../services/subscriptionServices";
import styles from "./Cancel.module.css";

export default function CancelPage() {
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const data = await getSubscriptionStatus();
        setSubStatus(data);
      } catch (err) {
        console.error("Error checking subscription status on cancel page:", err);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Verificando tu estado de suscripción...</div>
      </div>
    );
  }

  const isCancelled = !subStatus || subStatus.status === "cancelled" || subStatus.membership === "free";

  return (
    <div className={styles.container}>
      {isCancelled ? (
        <main className={styles.cancelCard}>
          <div className={styles.glow} />
          
          <div className={styles.iconWrapper}>
            <HeartCrack size={36} />
          </div>

          <div className={styles.eyebrow}>CineVault Premium</div>
          <h1 className={styles.title}>Te extrañaremos en el club</h1>
          
          <p className={styles.desc}>
            Tu suscripción ha sido cancelada o modificada. Esperamos que hayas disfrutado de tu tiempo con nosotros y que vuelvas pronto para seguir compartiendo tu pasión cinéfila.
          </p>

          <section className={styles.perksReminder}>
            <h2 className={styles.reminderTitle}>Recuerda los beneficios que tenías:</h2>
            <ul className={styles.reminderList}>
              <li>
                <Sparkles size={14} style={{ color: "var(--color-accent)" }} />
                Pósters alternativos premium para personalizar tu firma.
              </li>
              <li>
                <Sparkles size={14} style={{ color: "var(--color-accent)" }} />
                Subida ilimitada y fijado de videos/clips en tu Bóveda.
              </li>
              <li>
                <Sparkles size={14} style={{ color: "var(--color-accent)" }} />
                Panel de estadísticas avanzadas y exportación de tu diario.
              </li>
              <li>
                <Sparkles size={14} style={{ color: "var(--color-accent)" }} />
                Críticas detalladas escritas en modo Crítico.
              </li>
            </ul>
          </section>

          <div className={styles.actions}>
            <Link to="/" className={styles.primaryBtn}>
              Volver al inicio
            </Link>
            <Link to="/pricing" className={styles.secondaryBtn}>
              Ver planes de nuevo <ChevronRight size={14} style={{ display: "inline", marginLeft: 4, verticalAlign: "middle" }} />
            </Link>
          </div>
        </main>
      ) : (
        <main className={styles.cancelCard}>
          <div className={styles.glow} />
          
          <div className={styles.iconWrapper} style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}>
            <Heart size={36} fill="var(--color-accent)" />
          </div>

          <div className={styles.eyebrow}>CineVault Premium</div>
          <h1 className={styles.title}>¡Qué bueno que sigues con nosotros!</h1>
          
          <p className={styles.desc}>
            Tu suscripción <strong>{subStatus.membership.toUpperCase()}</strong> continúa activa y seguirás disfrutando de todos tus privilegios premium y de análisis.
          </p>

          <section className={styles.perksReminder}>
            <h2 className={styles.reminderTitle}>Tus beneficios activos:</h2>
            <ul className={styles.reminderList}>
              <li>
                <CheckCircle size={14} style={{ color: "var(--color-accent)" }} />
                Todos los pósters alternativos premium desbloqueados.
              </li>
              <li>
                <CheckCircle size={14} style={{ color: "var(--color-accent)" }} />
                Subida de videos y clips fijados en tu Bóveda.
              </li>
              <li>
                <CheckCircle size={14} style={{ color: "var(--color-accent)" }} />
                Acceso completo al panel de estadísticas avanzadas.
              </li>
              <li>
                <CheckCircle size={14} style={{ color: "var(--color-accent)" }} />
                Redacción de críticas en modo Crítico.
              </li>
            </ul>
          </section>

          <div className={styles.actions}>
            <Link to="/" className={styles.primaryBtn}>
              Volver al inicio
            </Link>
            <Link to="/settings" className={styles.secondaryBtn}>
              Ir a Ajustes <ChevronRight size={14} style={{ display: "inline", marginLeft: 4, verticalAlign: "middle" }} />
            </Link>
          </div>
        </main>
      )}
    </div>
  );
}
