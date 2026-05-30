import { useSettingsStore } from "../../store/useSettingsStore";
import { useSettingsActions } from "../../hooks/useSettingsActions";
import { FieldError } from "../shared/FieldError";
import styles from "./SeguridadSection.module.css";

export function SeguridadSection() {
  const isTwoFactorEnabled = useSettingsStore((s) => s.isTwoFactorEnabled);
  const twoFactorQr = useSettingsStore((s) => s.twoFactorQr);
  const twoFactorSecret = useSettingsStore((s) => s.twoFactorSecret);
  const twoFactorCode = useSettingsStore((s) => s.twoFactorCode);
  const twoFactorDisableCode = useSettingsStore((s) => s.twoFactorDisableCode);
  const twoFactorBusy = useSettingsStore((s) => s.twoFactorBusy);
  const recoveryCodes = useSettingsStore((s) => s.recoveryCodes);
  const recoveryCodesRemaining = useSettingsStore((s) => s.recoveryCodesRemaining);
  const recoveryRegenerateCode = useSettingsStore((s) => s.recoveryRegenerateCode);
  const recoveryBusy = useSettingsStore((s) => s.recoveryBusy);
  const passwordForm = useSettingsStore((s) => s.passwordForm);
  const sessions = useSettingsStore((s) => s.sessions);
  const inlineErrors = useSettingsStore((s) => s.inlineErrors);

  const setTwoFactorCode = useSettingsStore((s) => s.setTwoFactorCode);
  const setTwoFactorDisableCode = useSettingsStore((s) => s.setTwoFactorDisableCode);
  const setRecoveryRegenerateCode = useSettingsStore((s) => s.setRecoveryRegenerateCode);
  const setPasswordForm = useSettingsStore((s) => s.setPasswordForm);

  const {
    beginTwoFactorSetup,
    confirmTwoFactorSetup,
    disableTwoFactorSetup,
    regenerateRecoveryCodesAction,
    savePassword,
    closeAllSessions,
    removeSession,
  } = useSettingsActions();

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Autenticación en 2 pasos</h2>

      <div
        className={`${styles.twoFactorStateBox} ${
          isTwoFactorEnabled ? styles.stateEnabled : styles.stateDisabled
        }`}
      >
        <div className={styles.twoFactorStateText}>
          Estado 2FA: {isTwoFactorEnabled ? "Activo" : "Inactivo"}
        </div>

        {!isTwoFactorEnabled ? (
          <button
            onClick={beginTwoFactorSetup}
            disabled={twoFactorBusy}
            className={styles.activate2faBtn}
          >
            {twoFactorBusy ? "Preparando..." : "Activar 2FA"}
          </button>
        ) : (
          <div className={styles.actionsRow}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Código para desactivar"
              value={twoFactorDisableCode}
              onChange={(event) =>
                setTwoFactorDisableCode(event.target.value.replace(/\D/g, ""))
              }
              className={styles.inputMini}
            />
            <button
              onClick={disableTwoFactorSetup}
              disabled={twoFactorBusy}
              className={styles.deactivate2faBtn}
            >
              {twoFactorBusy ? "Procesando..." : "Desactivar 2FA"}
            </button>
          </div>
        )}
      </div>
      <FieldError>{inlineErrors.twofactorDisable}</FieldError>

      {twoFactorQr && !isTwoFactorEnabled && (
        <div className={styles.qrContainer}>
          <div className={styles.qrTitle}>
            Escaneá este QR en tu app autenticadora
          </div>

          <div className={styles.qrBox}>
            <img
              src={twoFactorQr}
              alt="QR 2FA"
              className={styles.qrImg}
            />
          </div>

          <div>
            <div className={styles.qrTitle} style={{ marginBottom: 4 }}>
              Clave manual
            </div>
            <div className={styles.secretKeyBox}>{twoFactorSecret}</div>
          </div>

          <div className={styles.actionsRow}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Código de 6 dígitos"
              value={twoFactorCode}
              onChange={(event) =>
                setTwoFactorCode(event.target.value.replace(/\D/g, ""))
              }
              className={styles.inputMini}
            />
            <button
              onClick={confirmTwoFactorSetup}
              disabled={twoFactorBusy}
              className={styles.activate2faBtn}
            >
              {twoFactorBusy ? "Confirmando..." : "Confirmar activación"}
            </button>
          </div>
          <FieldError>{inlineErrors.twofactor}</FieldError>
        </div>
      )}

      {isTwoFactorEnabled && (
        <div className={styles.qrContainer}>
          <h3 className={styles.subTitle}>Recovery codes</h3>
          <p className={styles.paragraph}>
            Usalos si perdés acceso a tu app autenticadora. Cada código funciona
            una sola vez.
          </p>
          <div className={styles.recoveryRemaining}>
            Códigos restantes: {recoveryCodesRemaining ?? "..."}
          </div>

          {recoveryCodes.length > 0 && (
            <div className={styles.recoveryCodeList}>
              {recoveryCodes.map((code) => (
                <code key={code} className={styles.recoveryCode}>
                  {code}
                </code>
              ))}
            </div>
          )}

          <div className={styles.actionsRow}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Código 2FA actual"
              value={recoveryRegenerateCode}
              onChange={(event) =>
                setRecoveryRegenerateCode(event.target.value.replace(/\D/g, ""))
              }
              className={styles.inputMini}
            />
            <button
              onClick={regenerateRecoveryCodesAction}
              disabled={recoveryBusy}
              className={styles.activate2faBtn}
            >
              {recoveryBusy ? "Regenerando..." : "Regenerar recovery codes"}
            </button>
          </div>
          <FieldError>{inlineErrors.recoveryRegenerate}</FieldError>
        </div>
      )}

      <h2 className={styles.title}>Contraseña</h2>

      <input
        type="password"
        placeholder="Contraseña actual"
        value={passwordForm.password_actual}
        onChange={(event) =>
          setPasswordForm({ password_actual: event.target.value })
        }
        className={styles.passwordInput}
      />
      <input
        type="password"
        placeholder="Nueva contraseña"
        value={passwordForm.password_nueva}
        onChange={(event) =>
          setPasswordForm({ password_nueva: event.target.value })
        }
        className={styles.passwordInput}
      />
      <input
        type="password"
        placeholder="Confirmación"
        value={passwordForm.password_confirmacion}
        onChange={(event) =>
          setPasswordForm({ password_confirmacion: event.target.value })
        }
        className={styles.passwordInput}
      />
      <FieldError>{inlineErrors.password}</FieldError>

      <button onClick={savePassword} className={styles.submitBtn}>
        Cambiar contraseña
      </button>

      <h2 className={styles.title} style={{ margin: "8px 0 0" }}>
        Sesiones activas
      </h2>

      <button onClick={closeAllSessions} className={styles.closeAllBtn}>
        Cerrar sesión en todos los dispositivos
      </button>

      <div className={styles.sessionsList}>
        {sessions.map((session) => (
          <div key={session.id} className={styles.sessionItem}>
            <div>
              <div className={styles.sessionTitle}>
                {session.user_agent || "Navegador desconocido"}
              </div>
              <div className={styles.sessionMeta}>
                IP {session.ip_address || "-"} ·{" "}
                {new Date(session.created_at).toLocaleString("es-ES")}
              </div>
            </div>
            <button
              onClick={() => removeSession(session.id)}
              className={styles.sessionRemoveBtn}
            >
              Eliminar
            </button>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className={styles.emptyMsg}>No hay sesiones activas.</div>
        )}
      </div>
    </section>
  );
}
export default SeguridadSection;
