/**
 * @file Pricing.tsx
 * @description Página de precios y comparación de membresías (Free, VIP, PRO) con pasarela Stripe.
 */

import { useState, useEffect } from "react";
import { Check, ShieldAlert, CreditCard, Sparkles } from "lucide-react";
import { createCheckoutSession, getSubscriptionStatus, createPortalSession } from "../services/subscriptionServices";
import type { SubscriptionStatus } from "../services/subscriptionServices";
import { getStoredAccessToken } from "../services/authServices";
import styles from "./Pricing.module.css";

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const isLoggedIn = !!getStoredAccessToken();

  useEffect(() => {
    if (isLoggedIn) {
      getSubscriptionStatus()
        .then(setSubStatus)
        .catch(console.error);
    }
  }, [isLoggedIn]);

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

  const handleSelectPlan = async (plan: "vip" | "pro") => {
    if (!isLoggedIn) {
      window.dispatchEvent(
        new CustomEvent("open-auth-modal", { detail: { mode: "login" } })
      );
      return;
    }

    setLoadingPlan(plan);
    setError(null);

    try {
      const { url } = await createCheckoutSession(plan);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No se pudo obtener la sesión de pago.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Ocurrió un error al iniciar la pasarela de pagos.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPrice = (baseMonthly: number) => {
    if (billingPeriod === "yearly") {
      const discounted = Math.round(baseMonthly * 0.8 * 100) / 100;
      return {
        amount: discounted,
        subtext: "facturado anualmente",
      };
    }
    return {
      amount: baseMonthly,
      subtext: "al mes",
    };
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Planes CineVault</span>
        <h1 className={styles.title}>Eleva tu experiencia cinematográfica</h1>
        <p className={styles.subtitle}>
          Colecciona películas, personaliza tu perfil con pósters alternativos y desbloquea estadísticas de visionado avanzadas.
        </p>

        <div className={styles.billingToggle}>
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`${styles.toggleBtn} ${billingPeriod === "monthly" ? styles.toggleActive : ""}`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={`${styles.toggleBtn} ${billingPeriod === "yearly" ? styles.toggleActive : ""}`}
          >
            Anual <span className={styles.discountBadge}>Ahorra 20%</span>
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.errorBox}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {subStatus && subStatus.membership !== "free" && (
        <div className={styles.activeSubscriptionBanner}>
          <div className={styles.activeSubText}>
            <Sparkles size={16} style={{ display: "inline", marginRight: 8, verticalAlign: "middle", color: "var(--color-accent)" }} />
            Tienes una suscripción activa al plan <strong>{subStatus.membership.toUpperCase()}</strong> ({subStatus.status === "active" ? "activa" : "cancelada"}).
          </div>
          <button
            onClick={handleOpenPortal}
            disabled={portalLoading}
            className={styles.portalBtn}
          >
            <CreditCard size={14} />
            {portalLoading ? "Abriendo..." : "Gestionar Facturación / Cancelar"}
          </button>
        </div>
      )}

      <div className={styles.cardsGrid}>
        {/* FREE PLAN */}
        <div className={styles.planCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.planName}>Free</h2>
            <p className={styles.planDesc}>La base para todo cinéfilo amateur.</p>
          </div>
          <div className={styles.priceContainer}>
            <span className={styles.currency}>€</span>
            <span className={styles.price}>0</span>
            <span className={styles.period}>/ siempre</span>
          </div>
          <ul className={styles.featuresList}>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Registra tu diario de visionado</span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Crea hasta 5 listas públicas</span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Críticas rápidas y estándar</span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Recomendaciones automáticas</span>
            </li>
          </ul>
          <button className={`${styles.actionBtn} ${styles.freeBtn}`} disabled>
            {(!subStatus || subStatus.membership === "free") ? "Plan actual" : "Plan Gratuito"}
          </button>
        </div>

        {/* VIP PLAN */}
        <div className={`${styles.planCard} ${styles.featuredCard}`}>
          <div className={styles.popularBadge}>Recomendado</div>
          <div className={styles.cardHeader}>
            <h2 className={styles.planName}>VIP</h2>
            <p className={styles.planDesc}>Lleva tu diario y estética de perfil al siguiente nivel.</p>
          </div>
          <div className={styles.priceContainer}>
            <span className={styles.currency}>€</span>
            <span className={styles.price}>{getPrice(6.99).amount}</span>
            <span className={styles.period}>/ {getPrice(6.99).subtext}</span>
          </div>
          <ul className={styles.featuresList}>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span><strong>Mitad</strong> de pósters alternativos</span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Sube hasta <strong>2 videos</strong> a tu Vault</span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Fija hasta <strong>2 clips</strong> en tu perfil</span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Desbloquea críticas en <strong>modo Crítico</strong></span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Puntos de recomendación <strong>x1.25</strong></span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Acceso temprano a arcos editoriales</span>
            </li>
          </ul>
          <button
            onClick={() => handleSelectPlan("vip")}
            disabled={loadingPlan !== null || subStatus?.membership === "vip" || subStatus?.membership === "pro"}
            className={`${styles.actionBtn} ${styles.vipBtn} ${
              subStatus?.membership === "vip" ? styles.currentPlanBtn : ""
            } ${subStatus?.membership === "pro" ? styles.freeBtn : ""}`}
          >
            {loadingPlan === "vip"
              ? "Cargando..."
              : subStatus?.membership === "vip"
              ? "Plan Actual"
              : subStatus?.membership === "pro"
              ? "VIP"
              : "Adquirir VIP"}
          </button>
        </div>

        {/* PRO PLAN */}
        <div className={styles.planCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.planName}>PRO</h2>
            <p className={styles.planDesc}>Para curadores y analistas de cine de tiempo completo.</p>
          </div>
          <div className={styles.priceContainer}>
            <span className={styles.currency}>€</span>
            <span className={styles.price}>{getPrice(14.99).amount}</span>
            <span className={styles.period}>/ {getPrice(14.99).subtext}</span>
          </div>
          <ul className={styles.featuresList}>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span><strong>Todos</strong> los pósters alternativos</span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Sube hasta <strong>4 videos</strong> a tu Vault</span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Fija hasta <strong>4 clips</strong> en tu perfil</span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Puntos de recomendación <strong>x1.75</strong></span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Estadísticas de visualización avanzadas</span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Exportar librería a CSV/JSON</span>
            </li>
            <li>
              <Check className={styles.checkIcon} size={16} />
              <span>Insignia dorada en perfil público</span>
            </li>
          </ul>
          <button
            onClick={() => handleSelectPlan("pro")}
            disabled={loadingPlan !== null || subStatus?.membership === "pro"}
            className={`${styles.actionBtn} ${styles.proBtn} ${
              subStatus?.membership === "pro" ? styles.currentPlanBtn : ""
            } ${subStatus?.membership === "vip" ? styles.upgradeBtn : ""}`}
          >
            {loadingPlan === "pro"
              ? "Cargando..."
              : subStatus?.membership === "pro"
              ? "Plan Actual"
              : subStatus?.membership === "vip"
              ? "Subir a PRO"
              : "Adquirir PRO"}
          </button>
        </div>
      </div>

      {/* COMPARISON TABLE */}
      <section className={styles.tableSection}>
        <h2 className={styles.tableTitle}>Comparación de características</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thFeature}>Beneficio</th>
                <th>Free</th>
                <th>VIP</th>
                <th>PRO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.tdFeature}>Pósters alternativos</td>
                <td>Ninguno</td>
                <td>Mitad (5 opciones)</td>
                <td>Todos (10 opciones)</td>
              </tr>
              <tr>
                <td className={styles.tdFeature}>Videos en el Vault</td>
                <td>0</td>
                <td>Hasta 2</td>
                <td>Hasta 4</td>
              </tr>
              <tr>
                <td className={styles.tdFeature}>Clips fijados en perfil</td>
                <td>0</td>
                <td>Hasta 2</td>
                <td>Hasta 4</td>
              </tr>
              <tr>
                <td className={styles.tdFeature}>Críticas en modo Crítico</td>
                <td>No disponible</td>
                <td>Disponible</td>
                <td>Disponible</td>
              </tr>
              <tr>
                <td className={styles.tdFeature}>Multiplicador de puntos</td>
                <td>x1.00</td>
                <td>x1.25</td>
                <td>x1.75</td>
              </tr>
              <tr>
                <td className={styles.tdFeature}>Estadísticas avanzadas</td>
                <td>No disponible</td>
                <td>No disponible</td>
                <td>Disponible</td>
              </tr>
              <tr>
                <td className={styles.tdFeature}>Exportación de datos</td>
                <td>No disponible</td>
                <td>No disponible</td>
                <td>Disponible (CSV/JSON)</td>
              </tr>
              <tr>
                <td className={styles.tdFeature}>Soporte premium</td>
                <td>Estándar</td>
                <td>Prioritario</td>
                <td>Prioritario 24/7</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
