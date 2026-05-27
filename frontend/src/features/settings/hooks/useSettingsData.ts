import { useEffect } from "react";
import { useSettingsStore } from "../store/useSettingsStore";
import {
  getCurrentUser,
  getRecoveryCodesStatus,
  getStoredAccessToken,
  authorizedFetch,
} from "../../../services/authServices";
import { fetchAuthSessions } from "../../../services/profileServices";


export function useSettingsData() {
  const token = getStoredAccessToken();
  const setLoading = useSettingsStore((s) => s.setLoading);
  const setError = useSettingsStore((s) => s.setError);
  const setProfileForm = useSettingsStore((s) => s.setProfileForm);
  const setInitialProfile = useSettingsStore((s) => s.setInitialProfile);
  const setAvatarPreview = useSettingsStore((s) => s.setAvatarPreview);
  const setIsTwoFactorEnabled = useSettingsStore((s) => s.setIsTwoFactorEnabled);
  const setSessions = useSettingsStore((s) => s.setSessions);
  const setRecoveryCodesRemaining = useSettingsStore((s) => s.setRecoveryCodesRemaining);

  useEffect(() => {
    let alive = true;

    const loadRecoveryStatus = async () => {
      try {
        const status = await getRecoveryCodesStatus();
        if (!alive) return;
        setRecoveryCodesRemaining(status.remaining);
      } catch {
        if (!alive) return;
        setRecoveryCodesRemaining(0);
      }
    };

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const current = await getCurrentUser();
        const usersRes = await authorizedFetch("/api/users", { method: "GET" });

        if (!usersRes.ok) throw new Error("No se pudo cargar el perfil");
        const users = (await usersRes.json()) as Array<{
          id: number;
          username: string;
          email?: string;
          bio?: string;
          avatar_url?: string | null;
        }>;
        const me = users.find((item) => item.id === current.id);

        if (!alive) return;

        const nextProfile = {
          username: me?.username || current.username || "",
          email: me?.email || "",
          bio: me?.bio || "",
        };

        setProfileForm(nextProfile);
        setInitialProfile(nextProfile);
        setAvatarPreview(me?.avatar_url || current.avatar_url || null);
        const twoFactorEnabled = Boolean(current.two_factor_enabled);
        setIsTwoFactorEnabled(twoFactorEnabled);

        const sessionsRes = await fetchAuthSessions(token);
        if (!alive) return;
        setSessions(
          Array.isArray(sessionsRes.sessions) ? sessionsRes.sessions : [],
        );

        if (twoFactorEnabled) {
          await loadRecoveryStatus();
        }
      } catch (err) {
        if (!alive) return;
        setError((err as Error).message || "No se pudo cargar ajustes");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [
    token,
    setLoading,
    setError,
    setProfileForm,
    setInitialProfile,
    setAvatarPreview,
    setIsTwoFactorEnabled,
    setSessions,
    setRecoveryCodesRemaining,
  ]);
}
