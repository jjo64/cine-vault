/**
 * @file AdvancedStats.tsx
 * @description Panel de estadísticas avanzadas para miembros VIP/PRO con exportador de datos e indicador de bloqueo estético para miembros Free.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Download, Lock, Flame, Award, Globe, Hourglass, ArrowLeft } from "lucide-react";
import { getSubscriptionStatus, getAdvancedStats, exportStats } from "../services/subscriptionServices";
import type { AdvancedStats as StatsType, SubscriptionStatus } from "../services/subscriptionServices";
import styles from "./AdvancedStats.module.css";

export default function AdvancedStats() {
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  useEffect(() => {
    async function loadData() {
      try {
        const sub = await getSubscriptionStatus();
        setSubStatus(sub);

        if (sub.membership !== "free") {
          const statsData = await getAdvancedStats();
          setStats(statsData);
        }
      } catch (err: any) {
        console.error(err);
        setError("Error al cargar las estadísticas avanzadas.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportStats(exportFormat);
    } catch (err) {
      console.error(err);
      setError("No se pudo completar la exportación del archivo.");
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Analizando tu historial cinematográfico...</div>;
  }

  // Gated UI for Free members
  if (subStatus?.membership === "free") {
    return (
      <div className={styles.container}>
        <div className={styles.backRow}>
          <Link to="/profile" className={styles.backLink}>
            <ArrowLeft size={14} /> Volver al perfil
          </Link>
        </div>

        <div className={styles.upsellWrapper}>
          <div className={styles.lockBadge}>
            <Lock size={20} />
            <span>Estadísticas Avanzadas Bloqueadas</span>
          </div>

          <h1 className={styles.titleSerif}>Descubre tu ADN Cinéfilo</h1>
          <p className={styles.subtitle}>
            Obtén análisis minuciosos de tus géneros, directores favoritos, décadas predilectas, racha cinéfila y compara tus números contra la comunidad.
          </p>

          <Link to="/pricing" className={styles.premiumBtn}>
            Actualizar a VIP / PRO
          </Link>

          {/* Blurred mock preview of stats */}
          <div className={styles.mockPreview}>
            <div className={styles.blurOverlay}>
              <Lock size={32} color="var(--color-accent)" />
              <p>Disponible en planes premium</p>
            </div>
            <div className={styles.mockGrid}>
              <div className={styles.mockCard}>
                <h3>Top Géneros</h3>
                <div className={styles.mockBar}>Drama 65%</div>
                <div className={styles.mockBar}>Sci-Fi 42%</div>
                <div className={styles.mockBar}>Thriller 31%</div>
              </div>
              <div className={styles.mockCard}>
                <h3>Racha actual</h3>
                <div className={styles.mockStreak}>12 días</div>
              </div>
              <div className={styles.mockCard}>
                <h3>Directores más vistos</h3>
                <div className={styles.mockBar}>Nolan</div>
                <div className={styles.mockBar}>Tarkovsky</div>
                <div className={styles.mockBar}>Akerman</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backRow}>
        <Link to="/profile" className={styles.backLink}>
          <ArrowLeft size={14} /> Volver al perfil
        </Link>
      </div>

      <header className={styles.header}>
        <h1 className={styles.titleSerif}>Estadísticas Avanzadas</h1>
        <p className={styles.subtitle}>
          Un análisis completo de tus hábitos de visionado y curaduría en CineVault.
        </p>
      </header>

      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Overview Cards */}
      <section className={styles.overviewGrid}>
        <div className={styles.statCard}>
          <Flame className={styles.statIcon} size={24} />
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Racha Cinéfila</span>
            <span className={styles.statVal}>{stats?.racha_cinefila_dias} días</span>
            <span className={styles.statDesc}>Días seguidos registrando visionados</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <BarChart3 className={styles.statIcon} size={24} />
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Vistas</span>
            <span className={styles.statVal}>{stats?.total_watched}</span>
            <span className={styles.statDesc}>Películas y series en tu diario</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <Award className={styles.statIcon} size={24} />
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Comparativa Global</span>
            <span className={styles.statVal}>
              {stats?.comparativa_promedio.usuario} vs {stats?.comparativa_promedio.plataforma}
            </span>
            <span className={styles.statDesc}>Tus entradas vs el promedio general</span>
          </div>
        </div>
      </section>

      {/* Main Charts / Rankings */}
      <div className={styles.chartsGrid}>
        {/* TOP GENRES */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Géneros favoritos</h3>
          <div className={styles.rankingList}>
            {stats?.top_genres.map((g, i) => (
              <div key={g.name} className={styles.rankingItem}>
                <span className={styles.rankNum}>#{i + 1}</span>
                <span className={styles.rankLabel}>{g.name}</span>
                <span className={styles.rankCount}>{g.count} películas</span>
              </div>
            ))}
            {(!stats?.top_genres || stats.top_genres.length === 0) && (
              <p className={styles.emptyText}>Registra películas en tu diario para compilar datos.</p>
            )}
          </div>
        </div>

        {/* TOP DIRECTORS */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Directores predilectos</h3>
          <div className={styles.rankingList}>
            {stats?.top_directors.map((d, i) => (
              <div key={d.name} className={styles.rankingItem}>
                <span className={styles.rankNum}>#{i + 1}</span>
                <span className={styles.rankLabel}>{d.name}</span>
                <span className={styles.rankCount}>{d.count} obras</span>
              </div>
            ))}
            {(!stats?.top_directors || stats.top_directors.length === 0) && (
              <p className={styles.emptyText}>Registra películas en tu diario para compilar datos.</p>
            )}
          </div>
        </div>

        {/* DECADES */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Exploración por Décadas</h3>
          <div className={styles.rankingList}>
            {stats?.decades.map((dec) => (
              <div key={dec.name} className={styles.rankingItem}>
                <Hourglass size={14} className={styles.timeIcon} />
                <span className={styles.rankLabel}>Década {dec.name}</span>
                <span className={styles.rankCount}>{dec.count} películas</span>
              </div>
            ))}
            {(!stats?.decades || stats.decades.length === 0) && (
              <p className={styles.emptyText}>Registra películas en tu diario para compilar datos.</p>
            )}
          </div>
        </div>

        {/* COUNTRIES */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Geografía del visionado</h3>
          <div className={styles.rankingList}>
            {stats?.countries.map((c) => (
              <div key={c.name} className={styles.rankingItem}>
                <Globe size={14} className={styles.globeIcon} />
                <span className={styles.rankLabel}>{c.name}</span>
                <span className={styles.rankCount}>{c.count} obras</span>
              </div>
            ))}
            {(!stats?.countries || stats.countries.length === 0) && (
              <p className={styles.emptyText}>Registra películas en tu diario para compilar datos.</p>
            )}
          </div>
        </div>
      </div>

      {/* EXPORT DATA BLOCK */}
      <section className={styles.exportSection}>
        <div className={styles.exportHeader}>
          <h3 className={styles.exportTitle}>Copia de seguridad y exportación de datos</h3>
          <p className={styles.exportDesc}>
            Exporta tu historial y biblioteca completa a formato plano compatible con Excel o JSON.
          </p>
        </div>
        <div className={styles.exportActions}>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as "csv" | "json")}
            className={styles.formatSelect}
          >
            <option value="csv">CSV (Excel)</option>
            <option value="json">JSON</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className={styles.exportBtn}
          >
            <Download size={16} />
            {exportLoading ? "Exportando..." : "Descargar Archivo"}
          </button>
        </div>
      </section>
    </div>
  );
}
