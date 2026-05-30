import { useMemo } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "../store/useSettingsStore";
import {
  checkUsernameAvailability,
  deleteAccountSettings,
  fetchAuthSessions,
  revokeAllAuthSessions,
  revokeAuthSession,
  updateAuthSettings,
  updateAvatarSettings,
  updateProfileSettings,
} from "../../../services/profileServices";
import {
  activateTwoFactor,
  clearStoredAccessToken,
  confirmTwoFactor,
  disableTwoFactor,
  getStoredAccessToken,
  regenerateRecoveryCodes,
} from "../../../services/authServices";
import { toBase64 } from "../utils";


export function useSettingsActions() {
  const navigate = useNavigate();
  const token = getStoredAccessToken();

  // State from store
  const profileForm = useSettingsStore((s) => s.profileForm);
  const initialProfile = useSettingsStore((s) => s.initialProfile);
  const avatarBase64 = useSettingsStore((s) => s.avatarBase64);
  const passwordForm = useSettingsStore((s) => s.passwordForm);
  const sessions = useSettingsStore((s) => s.sessions);
  const deleteStep = useSettingsStore((s) => s.deleteStep);
  const deleteInput = useSettingsStore((s) => s.deleteInput);
  const twoFactorCode = useSettingsStore((s) => s.twoFactorCode);
  const twoFactorDisableCode = useSettingsStore((s) => s.twoFactorDisableCode);
  const recoveryRegenerateCode = useSettingsStore((s) => s.recoveryRegenerateCode);

  // Setters from store
  const setSaving = useSettingsStore((s) => s.setSaving);
  const setError = useSettingsStore((s) => s.setError);
  const setSuccessMessage = useSettingsStore((s) => s.setSuccessMessage);
  const setInlineErrors = useSettingsStore((s) => s.setInlineErrors);
  const setProfileForm = useSettingsStore((s) => s.setProfileForm);
  const setInitialProfile = useSettingsStore((s) => s.setInitialProfile);
  const setAvatarPreview = useSettingsStore((s) => s.setAvatarPreview);
  const setAvatarBase64 = useSettingsStore((s) => s.setAvatarBase64);
  const setUsernameStatus = useSettingsStore((s) => s.setUsernameStatus);
  const setPasswordForm = useSettingsStore((s) => s.setPasswordForm);
  const setSessions = useSettingsStore((s) => s.setSessions);
  const setDeleteStep = useSettingsStore((s) => s.setDeleteStep);
  const setIsTwoFactorEnabled = useSettingsStore((s) => s.setIsTwoFactorEnabled);
  const setTwoFactorQr = useSettingsStore((s) => s.setTwoFactorQr);
  const setTwoFactorSecret = useSettingsStore((s) => s.setTwoFactorSecret);
  const setTwoFactorCode = useSettingsStore((s) => s.setTwoFactorCode);
  const setTwoFactorDisableCode = useSettingsStore((s) => s.setTwoFactorDisableCode);
  const setTwoFactorBusy = useSettingsStore((s) => s.setTwoFactorBusy);
  const setRecoveryCodes = useSettingsStore((s) => s.setRecoveryCodes);
  const setRecoveryCodesRemaining = useSettingsStore((s) => s.setRecoveryCodesRemaining);
  const setRecoveryRegenerateCode = useSettingsStore((s) => s.setRecoveryRegenerateCode);
  const setRecoveryBusy = useSettingsStore((s) => s.setRecoveryBusy);

  // Memoized values
  const hasUnsavedChanges = useMemo(() => {
    const profileDirty =
      profileForm.username !== initialProfile.username ||
      profileForm.email !== initialProfile.email ||
      profileForm.bio !== initialProfile.bio;
    return profileDirty || Boolean(avatarBase64);
  }, [profileForm, initialProfile, avatarBase64]);

  const validateProfile = () => {
    const errors: Record<string, string> = {};

    if (!profileForm.username.trim())
      errors.username = "El username es obligatorio";
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(profileForm.username.trim())) {
      errors.username = "3-30 caracteres, solo letras, números y _";
    }

    if (!profileForm.email.trim()) errors.email = "El email es obligatorio";
    if (
      profileForm.email.trim() &&
      !/^\S+@\S+\.\S+$/.test(profileForm.email.trim())
    ) {
      errors.email = "Formato de email inválido";
    }

    if (profileForm.bio.length > 280) errors.bio = "Máximo 280 caracteres";

    setInlineErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUsernameBlur = async () => {
    const candidate = profileForm.username.trim();
    if (
      !candidate ||
      candidate.toLowerCase() === initialProfile.username.toLowerCase()
    ) {
      setUsernameStatus("idle");
      return;
    }

    try {
      setUsernameStatus("checking");
      const result = await checkUsernameAvailability(candidate);
      setUsernameStatus(result.available ? "available" : "taken");
      setInlineErrors((prev) => ({
        ...prev,
        username: result.available ? "" : "Ese username ya está ocupado",
      }));
    } catch {
      setUsernameStatus("idle");
    }
  };

  const onAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await toBase64(file);
      setAvatarBase64(base64);
      setAvatarPreview(base64);
      setSuccessMessage(null);
    } catch (err) {
      setError((err as Error).message || "No se pudo procesar imagen");
    }
  };

  const saveProfile = async () => {
    if (!token) return;
    if (!validateProfile()) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (avatarBase64) {
        await updateAvatarSettings(token, avatarBase64);
      }

      await updateProfileSettings(token, {
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
        bio: profileForm.bio.trim(),
      });

      const nextInitial = {
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
        bio: profileForm.bio.trim(),
      };

      setInitialProfile(nextInitial);
      setProfileForm(nextInitial);
      setAvatarBase64(null);
      setSuccessMessage("Cambios guardados correctamente");
    } catch (err) {
      setError((err as Error).message || "No se pudo guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!token) return;

    if (
      !passwordForm.password_actual ||
      !passwordForm.password_nueva ||
      !passwordForm.password_confirmacion
    ) {
      setInlineErrors((prev) => ({
        ...prev,
        password: "Completa todos los campos de contraseña",
      }));
      return;
    }

    if (passwordForm.password_nueva !== passwordForm.password_confirmacion) {
      setInlineErrors((prev) => ({
        ...prev,
        password: "La confirmación no coincide",
      }));
      return;
    }

    try {
      await updateAuthSettings(token, passwordForm);
      setPasswordForm({
        password_actual: "",
        password_nueva: "",
        password_confirmacion: "",
      });
      setInlineErrors((prev) => ({ ...prev, password: "" }));
      setSuccessMessage("Contraseña actualizada");
    } catch (err) {
      setError((err as Error).message || "No se pudo cambiar contraseña");
    }
  };

  const removeSession = async (sessionId: string) => {
    if (!token) return;

    try {
      await revokeAuthSession(token, sessionId);
      setSessions(sessions.filter((session) => session.id !== sessionId));
    } catch (err) {
      setError((err as Error).message || "No se pudo revocar la sesión");
    }
  };

  const closeAllSessions = async () => {
    if (!token) return;

    try {
      await revokeAllAuthSessions(token);
      const refreshed = await fetchAuthSessions(token);
      setSessions(refreshed.sessions || []);
      setSuccessMessage("Se revocaron las sesiones activas");
    } catch (err) {
      setError((err as Error).message || "No se pudieron revocar las sesiones");
    }
  };

  const deleteAccount = async () => {
    if (!token) return;

    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }

    if (deleteInput !== "ELIMINAR") {
      setInlineErrors((prev) => ({
        ...prev,
        delete: "Escribe ELIMINAR para confirmar",
      }));
      return;
    }

    try {
      await deleteAccountSettings(token);
      clearStoredAccessToken();
      navigate("/");
    } catch (err) {
      setError((err as Error).message || "No se pudo eliminar la cuenta");
    }
  };

  const beginTwoFactorSetup = async () => {
    setTwoFactorBusy(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { qr, secreto } = await activateTwoFactor();
      setTwoFactorQr(qr);
      setTwoFactorSecret(secreto);
      setTwoFactorCode("");
      setInlineErrors((prev) => ({ ...prev, twofactor: "" }));
      setSuccessMessage("Escaneá el QR y confirmá con tu código 2FA");
    } catch (err) {
      setError(
        (err as Error).message || "No se pudo iniciar la configuración 2FA",
      );
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const confirmTwoFactorSetup = async () => {
    const code = twoFactorCode.trim();
    if (!code) {
      setInlineErrors((prev) => ({
        ...prev,
        twofactor: "Ingresá tu código 2FA de 6 dígitos",
      }));
      return;
    }

    setTwoFactorBusy(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = await confirmTwoFactor(code);
      setIsTwoFactorEnabled(true);
      setTwoFactorQr(null);
      setTwoFactorSecret(null);
      setTwoFactorCode("");
      setRecoveryCodes(
        Array.isArray(payload.recoveryCodes) ? payload.recoveryCodes : []
      );
      setRecoveryCodesRemaining(
        Array.isArray(payload.recoveryCodes)
          ? payload.recoveryCodes.length
          : null
      );
      setRecoveryRegenerateCode("");
      setInlineErrors((prev) => ({ ...prev, twofactor: "" }));
      setSuccessMessage(
        "2FA activado correctamente. Guardá tus recovery codes en un lugar seguro."
      );
    } catch (err) {
      setError((err as Error).message || "No se pudo confirmar 2FA");
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const disableTwoFactorSetup = async () => {
    const code = twoFactorDisableCode.trim();
    if (!code) {
      setInlineErrors((prev) => ({
        ...prev,
        twofactorDisable: "Ingresá el código actual para desactivar 2FA",
      }));
      return;
    }

    setTwoFactorBusy(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await disableTwoFactor(code);
      setIsTwoFactorEnabled(false);
      setTwoFactorDisableCode("");
      setRecoveryCodes([]);
      setRecoveryCodesRemaining(null);
      setRecoveryRegenerateCode("");
      setInlineErrors((prev) => ({ ...prev, twofactorDisable: "" }));
      setSuccessMessage("2FA desactivado correctamente");
    } catch (err) {
      setError((err as Error).message || "No se pudo desactivar 2FA");
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const regenerateRecoveryCodesAction = async () => {
    const code = recoveryRegenerateCode.trim();
    if (!code) {
      setInlineErrors((prev) => ({
        ...prev,
        recoveryRegenerate: "Ingresá tu código 2FA actual para regenerar",
      }));
      return;
    }

    setRecoveryBusy(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const codes = await regenerateRecoveryCodes(code);
      setRecoveryCodes(codes);
      setRecoveryCodesRemaining(codes.length);
      setRecoveryRegenerateCode("");
      setInlineErrors((prev) => ({ ...prev, recoveryRegenerate: "" }));
      setSuccessMessage(
        "Recovery codes regenerados. Los anteriores ya no sirven."
      );
    } catch (err) {
      setError(
        (err as Error).message || "No se pudieron regenerar los recovery codes"
      );
    } finally {
      setRecoveryBusy(false);
    }
  };

  return {
    hasUnsavedChanges,
    handleUsernameBlur,
    onAvatarChange,
    saveProfile,
    savePassword,
    removeSession,
    closeAllSessions,
    deleteAccount,
    beginTwoFactorSetup,
    confirmTwoFactorSetup,
    disableTwoFactorSetup,
    regenerateRecoveryCodesAction,
  };
}
