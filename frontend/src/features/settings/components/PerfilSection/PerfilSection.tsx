import { Upload } from "lucide-react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useSettingsActions } from "../../hooks/useSettingsActions";
import { FieldError } from "../shared/FieldError";
import styles from "./PerfilSection.module.css";

export function PerfilSection() {
  const profileForm = useSettingsStore((s) => s.profileForm);
  const avatarPreview = useSettingsStore((s) => s.avatarPreview);
  const usernameStatus = useSettingsStore((s) => s.usernameStatus);
  const inlineErrors = useSettingsStore((s) => s.inlineErrors);
  const setProfileForm = useSettingsStore((s) => s.setProfileForm);

  const { handleUsernameBlur, onAvatarChange } = useSettingsActions();

  return (
    <section className={styles.section}>
      <div className={styles.avatarRow}>
        <div className={styles.avatarFrame}>
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="avatar"
              className={styles.avatarImg}
            />
          ) : null}
        </div>

        <label className={styles.uploadLabel}>
          <Upload size={14} /> Cambiar avatar
          <input
            type="file"
            accept="image/*"
            onChange={onAvatarChange}
          />
        </label>
      </div>

      <div>
        <div className={styles.label}>Username</div>
        <input
          value={profileForm.username}
          onChange={(event) =>
            setProfileForm({ username: event.target.value })
          }
          onBlur={handleUsernameBlur}
          className={styles.textInput}
        />
        <FieldError>{inlineErrors.username}</FieldError>
        {usernameStatus !== "idle" && (
          <div
            className={
              usernameStatus === "available"
                ? styles.availableMsg
                : styles.checkingMsg
            }
          >
            {usernameStatus === "checking" && "Verificando disponibilidad..."}
            {usernameStatus === "available" && "Username disponible"}
            {usernameStatus === "taken" && "Username no disponible"}
          </div>
        )}
      </div>

      <div>
        <div className={styles.label}>Email</div>
        <input
          value={profileForm.email}
          onChange={(event) =>
            setProfileForm({ email: event.target.value })
          }
          className={styles.textInput}
        />
        <FieldError>{inlineErrors.email}</FieldError>
      </div>

      <div>
        <div className={styles.label}>Bio</div>
        <textarea
          value={profileForm.bio}
          maxLength={280}
          onChange={(event) =>
            setProfileForm({ bio: event.target.value })
          }
          className={styles.textarea}
        />
        <div className={styles.bioFooter}>
          <FieldError>{inlineErrors.bio}</FieldError>
          <div className={styles.bioCount}>
            {profileForm.bio.length}/280
          </div>
        </div>
      </div>
    </section>
  );
}
export default PerfilSection;
