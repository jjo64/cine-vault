import { Trash2 } from "lucide-react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useSettingsActions } from "../../hooks/useSettingsActions";
import { FieldError } from "../shared/FieldError";
import styles from "./CuentaSection.module.css";

export function CuentaSection() {
  const deleteStep = useSettingsStore((s) => s.deleteStep);
  const deleteInput = useSettingsStore((s) => s.deleteInput);
  const inlineErrors = useSettingsStore((s) => s.inlineErrors);
  const setDeleteInput = useSettingsStore((s) => s.setDeleteInput);

  const { deleteAccount } = useSettingsActions();

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Eliminar cuenta</h2>
      <p className={styles.paragraph}>
        Esta acción es irreversible. Se eliminarán tus datos de CineVault.
      </p>

      {deleteStep > 0 && (
        <div>
          <div className={styles.confirmLabel}>
            Escribe ELIMINAR para confirmar
          </div>
          <input
            value={deleteInput}
            onChange={(event) => setDeleteInput(event.target.value)}
            className={styles.textInput}
          />
          <FieldError>{inlineErrors.delete}</FieldError>
        </div>
      )}

      <button onClick={deleteAccount} className={styles.deleteBtn}>
        <Trash2 size={14} />{" "}
        {deleteStep === 0 ? "Iniciar eliminación" : "Confirmar eliminación"}
      </button>
    </section>
  );
}
export default CuentaSection;
