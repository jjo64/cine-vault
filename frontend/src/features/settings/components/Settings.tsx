import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSettingsStore } from "../store/useSettingsStore";
import { useSettingsData } from "../hooks/useSettingsData";
import { useSettingsActions } from "../hooks/useSettingsActions";
import { sectionTabs } from "../constants";
import { GrainOverlay } from "../../../components/profile-v2/primitives";
import PerfilSection from "./PerfilSection/PerfilSection";
import SeguridadSection from "./SeguridadSection/SeguridadSection";
import CuentaSection from "./CuentaSection/CuentaSection";
import LeaveModal from "./LeaveModal/LeaveModal";
import styles from "./Settings.module.css";

export function Settings() {
  const navigate = useNavigate();

  // Reset store on mount / clean up on unmount
  const resetStore = useSettingsStore((s) => s.resetStore);
  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [resetStore]);

  // Load initial settings data from services
  useSettingsData();

  // Store states
  const loading = useSettingsStore((s) => s.loading);
  const saving = useSettingsStore((s) => s.saving);
  const activeSection = useSettingsStore((s) => s.activeSection);
  const error = useSettingsStore((s) => s.error);
  const successMessage = useSettingsStore((s) => s.successMessage);

  // Store setters
  const setActiveSection = useSettingsStore((s) => s.setActiveSection);
  const setShowLeaveModal = useSettingsStore((s) => s.setShowLeaveModal);

  // Hook actions
  const { hasUnsavedChanges, saveProfile } = useSettingsActions();

  // Navigation handlers
  const handleTryLeave = () => {
    if (!hasUnsavedChanges) {
      navigate(-1);
      return;
    }
    setShowLeaveModal(true);
  };

  // Intercept browser reload / navigation
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasUnsavedChanges]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <GrainOverlay />
        Cargando ajustes...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GrainOverlay />

      <main className={styles.main}>
        <div className={styles.backRow} onClick={handleTryLeave}>
          <button className={styles.backBtn}>
            <ArrowLeft size={14} /> Volver
          </button>
        </div>

        <h1 className={styles.pageTitle}>Editar perfil</h1>

        <div className={styles.tabs}>
          {sectionTabs.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`${styles.tabBtn} ${
                activeSection === section.key ? styles.tabBtnActive : ""
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}
        {successMessage && (
          <div className={styles.successMsg}>{successMessage}</div>
        )}

        {activeSection === "perfil" && <PerfilSection />}
        {activeSection === "seguridad" && <SeguridadSection />}
        {activeSection === "cuenta" && <CuentaSection />}
      </main>

      <div className={styles.bottomBar}>
        <button
          onClick={saveProfile}
          disabled={saving || !hasUnsavedChanges}
          className={`${styles.saveBtn} ${
            hasUnsavedChanges ? styles.saveBtnActive : ""
          }`}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      <LeaveModal />
    </div>
  );
}

export default Settings;
