/**
 * @file Success.tsx
 * @description Página de éxito al adquirir una membresía (VIP/PRO) con explicaciones de qué se puede hacer.
 */

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Sparkles, BarChart3, Video, Paintbrush, FileText, ArrowRight } from "lucide-react";
import { getSubscriptionStatus, syncCheckoutSession } from "../services/subscriptionServices";
import type { SubscriptionStatus } from "../services/subscriptionServices";
import { getStoredAccessToken } from "../services/authServices";
import styles from "./Success.module.css";

export default function SuccessPage() {
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const isLoggedIn = !!getStoredAccessToken();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    async function activateAndLoad() {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (sessionId) {
          // Intentar sincronizar primero de forma inmediata con el backend
          await syncCheckoutSession(sessionId).catch(console.error);
        }
        // Cargar los entitlements y status actualizados
        const status = await getSubscriptionStatus();
        setSubStatus(status);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    activateAndLoad();
  }, [isLoggedIn, sessionId]);

  const planName = subStatus?.membership?.toUpperCase() || "PREMIUM";

  return (
    <div className={styles.container}>
      <main className={styles.successCard}>
        <div className={styles.glow} />
        
        <div className={styles.iconWrapper}>
          <CheckCircle2 size={40} />
        </div>

        <div className={styles.eyebrow}>¡Bienvenido al club!</div>
        <h1 className={styles.title}>
          Suscripción Activada con Éxito
        </h1>
        <p className={styles.subtitle}>
          {loading 
            ? "Estamos preparando tu nueva firma y privilegios..." 
            : `Ahora eres miembro ${planName} de CineVault. Es hora de personalizar y analizar tu pasión cinéfila.`}
        </p>

        <section className={styles.exploreSection}>
          <h2 className={styles.exploreTitle}>¿Qué podés hacer ahora?</h2>
          
          <div className={styles.grid}>
            {/* Poster alternative perk */}
            <Link to="/settings" className={styles.gridCard}>
              <Paintbrush className={styles.cardIcon} size={20} />
              <div className={styles.cardContent}>
                <span className={styles.cardTitle}>Cambiar pósters alternativos</span>
                <span className={styles.cardDesc}>
                  Elige un póster premium para tu firma de películas desde tus ajustes de perfil.
                </span>
              </div>
            </Link>

            {/* Media uploading perk */}
            <Link to="/profile" className={styles.gridCard}>
              <Video className={styles.cardIcon} size={20} />
              <div className={styles.cardContent}>
                <span className={styles.cardTitle}>Subir videos y clips</span>
                <span className={styles.cardDesc}>
                  Enriquece tu Bóveda personal agregando videos o clips fijados en tu perfil social.
                </span>
              </div>
            </Link>

            {/* Advanced Stats */}
            {planName === "PRO" ? (
              <Link to="/stats" className={styles.gridCard}>
                <BarChart3 className={styles.cardIcon} size={20} />
                <div className={styles.cardContent}>
                  <span className={styles.cardTitle}>Estadísticas avanzadas</span>
                  <span className={styles.cardDesc}>
                    Visualiza directores recurrentes, géneros predilectos, mapas geográficos y exporta tus datos.
                  </span>
                </div>
              </Link>
            ) : (
              <Link to="/pricing" className={styles.gridCard}>
                <Sparkles className={styles.cardIcon} size={20} />
                <div className={styles.cardContent}>
                  <span className={styles.cardTitle}>Multiplicador de puntos</span>
                  <span className={styles.cardDesc}>
                    Gana un 25% más de puntos al completar recomendaciones y desbloquea el modo Crítico en reseñas.
                  </span>
                </div>
              </Link>
            )}

            {/* Critical Mode Reviews */}
            <Link to="/feed" className={styles.gridCard}>
              <FileText className={styles.cardIcon} size={20} />
              <div className={styles.cardContent}>
                <span className={styles.cardTitle}>Escribir críticas en modo Crítico</span>
                <span className={styles.cardDesc}>
                  Crea reseñas críticas detalladas que destaquen sobre la opinión general de la comunidad.
                </span>
              </div>
            </Link>
          </div>
        </section>

        <div className={styles.actions}>
          <Link to="/profile" className={styles.primaryBtn}>
            Ir a mi perfil
          </Link>
          <Link to="/feed" className={styles.secondaryBtn}>
            Comenzar a explorar <ArrowRight size={14} style={{ display: "inline", marginLeft: 6, verticalAlign: "middle" }} />
          </Link>
        </div>
      </main>
    </div>
  );
}
