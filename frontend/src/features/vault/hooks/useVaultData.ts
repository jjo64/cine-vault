import { useEffect } from "react";
import { useVaultStore } from "../store/useVaultStore";
import { getStoredAccessToken, getCurrentUser } from "../../../services/authServices";
import {
  fetchUserProfileByUsername,
  fetchVaultSocial,
  fetchDiary,
  fetchReviews,
} from "../../../services/profileServices";
import {
  fromSocialToVault,
  fromReviewsToVault,
  fromDiaryToVault,
  toVaultUser,
} from "../utils";
import { VAULT_USER, ENTRIES } from "../constants";

export function useVaultData(username: string | undefined) {
  const setVaultData = useVaultStore((s) => s.setVaultData);
  const setLoading = useVaultStore((s) => s.setLoading);
  const setLoadError = useVaultStore((s) => s.setLoadError);
  const setOwner = useVaultStore((s) => s.setOwner);
  const resetStore = useVaultStore((s) => s.resetStore);
  const refreshTrigger = useVaultStore((s) => s.refreshTrigger);

  useEffect(() => {
    let active = true;

    // Resetear el store al cambiar de username para evitar mostrar estado viejo
    resetStore();

    const run = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const token = getStoredAccessToken();
        const profile = username
          ? await fetchUserProfileByUsername(username, token)
          : null;
        const viewer = await getCurrentUser().catch(() => null);

        if (!active) return;

        const owner = Boolean(
          viewer &&
          profile &&
          viewer.username.toLowerCase() === profile.username.toLowerCase(),
        );
        setOwner(owner);

        if (!profile) {
          setVaultData(VAULT_USER, ENTRIES);
          return;
        }

        const socialRes = await fetchVaultSocial(profile.id, token, owner);

        if (!active) return;

        let mapped = Array.isArray(socialRes.items)
          ? fromSocialToVault(socialRes.items)
          : [];

        if (!mapped.length) {
          const [diaryRes, reviewsRes] = await Promise.all([
            fetchDiary(profile.id, token, owner),
            fetchReviews(profile.id, token, owner),
          ]);

          if (!active) return;

          const diaryEntries = Array.isArray(diaryRes.diary)
            ? diaryRes.diary
            : [];
          const reviewEntries = Array.isArray(reviewsRes) ? reviewsRes : [];
          mapped = [
            ...fromReviewsToVault(reviewEntries),
            ...fromDiaryToVault(diaryEntries),
          ];
        }

        mapped = mapped.sort((a, b) => b.id - a.id);

        if (!active) return;

        setVaultData(toVaultUser(profile, mapped.length), mapped);
      } catch {
        if (!active) return;
        setLoadError("No se pudo cargar el vault para este usuario.");
        setVaultData(VAULT_USER, ENTRIES);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [username, setVaultData, setLoading, setLoadError, setOwner, resetStore, refreshTrigger]);
}
