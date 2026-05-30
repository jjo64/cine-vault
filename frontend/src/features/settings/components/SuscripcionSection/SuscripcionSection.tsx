/**
 * @file SuscripcionSection.tsx
 * @description Componente para ver el estado de la suscripción, beneficios y acceder al portal de facturación de Stripe.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, CreditCard, Calendar, CheckCircle } from "lucide-react";
import { getSubscriptionStatus, createPortalSession, reactivateSubscription } from "../../../../services/subscriptionServices";
import type { SubscriptionStatus } from "../../../../services/subscriptionServices";
import { notify } from "../../../../lib/notify";
import styles from "./SuscripcionSection.module.css";

export default function SuscripcionSection() {
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const data = await getSubscriptionStatus();
        setSubStatus(data);
      } catch (err: any) {
        console.error(err);
        setError("No se pudo cargar la información de tu membresía.");
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, []);

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const { url } = await createPortalSession();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No se pudo obtener el enlace del portal de facturación.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al abrir el portal de facturación.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleReactivate = async () => {
    setReactivateLoading(true);
    setError(null);
    try {
      await reactivateSubscription();
      notify.success("¡Suscripción reactivada con éxito! Tus beneficios continuarán renovándose.");
      const data = await getSubscriptionStatus();
      setSubStatus(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al reactivar la suscripción.");
      notify.error("No se pudo reactivar la suscripción.");
    } finally {
      setReactivateLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando información de suscripción...</div>;
  }

  const isPremium = subStatus && subStatus.membership !== "free";

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Tu Plan y Membresía</h2>
      <p className={styles.subtitle}>Gestiona tus pagos, suscripciones activas y visualiza tus beneficios de Bóveda.</p>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <div className={styles.planCard}>
        <div className={styles.planBadge}>
          <Sparkles className={styles.sparkleIcon} size={18} />
          <span>Plan actual: {subStatus?.membership.toUpperCase()}</span>
        </div>

        <div className={styles.planMain}>
          <div className={styles.planInfo}>
            {isPremium ? (
              <>
                <div className={styles.statusRow}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Suscripción <strong>{subStatus?.status === "active" ? "Activa" : "Cancelada"}</strong></span>
                </div>
                {subStatus?.end_date && (
                  <div className={styles.dateRow}>
                    <Calendar size={16} />
                    <span>
                      {subStatus?.status === "active" ? "Siguiente renovación:" : "Expira el:"}{" "}
                      <strong>{new Date(subStatus.end_date).toLocaleDateString()}</strong>
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className={styles.freeText}>
                Estás utilizando la versión base gratuita de CineVault. Actualiza para desbloquear todas las opciones estéticas y de análisis.
              </p>
            )}
          </div>

          <div className={styles.planActions}>
            {isPremium ? (
              <>
                {subStatus?.status === "cancelled" && (
                  <button
                    onClick={handleReactivate}
                    disabled={reactivateLoading}
                    className={styles.reactivateBtn}
                  >
                    <Sparkles size={16} />
                    {reactivateLoading ? "Reactivando..." : "Volver a activar"}
                  </button>
                )}
                <button
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                  className={styles.portalBtn}
                >
                  <CreditCard size={16} />
                  {portalLoading ? "Abriendo..." : "Gestionar Facturación"}
                </button>
              </>
            ) : (
              <Link to="/pricing" className={styles.pricingBtn}>
                Ver Planes Premium
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className={styles.benefitsSection}>
        <h3 className={styles.benefitsTitle}>Entitlements y Límites Activos</h3>
        <div className={styles.benefitsGrid}>
          <div className={styles.benefitItem}>
            <span className={styles.benefitLabel}>Videos en Vault</span>
            <span className={styles.benefitValue}>
              {subStatus?.entitlements.max_videos === 0 ? "No disponible" : `Hasta ${subStatus?.entitlements.max_videos}`}
            </span>
          </div>
          <div className={styles.benefitItem}>
            <span className={styles.benefitLabel}>Clips fijados en perfil</span>
            <span className={styles.benefitValue}>
              {subStatus?.entitlements.max_pinned_clips === 0 ? "No disponible" : `Hasta ${subStatus?.entitlements.max_pinned_clips}`}
            </span>
          </div>
          <div className={styles.benefitItem}>
            <span className={styles.benefitLabel}>Pósters alternativos</span>
            <span className={styles.benefitValue}>
              {subStatus?.entitlements.poster_alt_level === "none" && "Ninguno"}
              {subStatus?.entitlements.poster_alt_level === "half" && "Mitad (5 opciones)"}
              {subStatus?.entitlements.poster_alt_level === "all" && "Todos (10 opciones)"}
            </span>
          </div>
          <div className={styles.benefitItem}>
            <span className={styles.benefitLabel}>Críticas en modo Crítico</span>
            <span className={styles.benefitValue}>
              {subStatus?.entitlements.reviews_critical ? "Habilitado" : "Deshabilitado"}
            </span>
          </div>
          <div className={styles.benefitItem}>
            <span className={styles.benefitLabel}>Multiplicador de puntos</span>
            <span className={styles.benefitValue}>x{subStatus?.entitlements.points_multiplier.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
