import { useEffect, useCallback } from "react";
import { useForYouStore } from "../store/useForYouStore";
import { getCurrentUser } from "../../../services/authServices";
import {
  fetchForYouFeed,
  fetchTonightMovie,
  fetchActivityFeed,
  fetchOnboardingStatus,
} from "../../../services/socialServices";
import { fetchMovieDetail } from "../../../services/movieDetailServices";
import { fetchUserProfile, fetchWatchlist } from "../../../services/profileServices";

export function useForYouData() {
  const {
    setUser,
    setTonightMovie,
    setForYouFeed,
    setActivityFeed,
    setProfile,
    setWatchlist,
    setShowOnboarding,
    setLoading,
    setError,
  } = useForYouStore();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser().catch(() => null);
      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Check onboarding
      const onb = await fetchOnboardingStatus().catch(() => ({ needs_onboarding: false }));
      setShowOnboarding(onb.needs_onboarding);

      if (onb.needs_onboarding) {
        setLoading(false);
        return;
      }

      // 2. Parallel fetch
      const [tonightRes, forYouRes, activityRes, profileRes, watchlistRes] = await Promise.all([
        fetchTonightMovie().catch(() => null),
        fetchForYouFeed().catch(() => ({ items: [] })),
        fetchActivityFeed("friends").catch(() => ({ items: [] })),
        fetchUserProfile(user.id).catch(() => null),
        fetchWatchlist(user.id, undefined, true).catch(() => []),
      ]);

      setForYouFeed(forYouRes.items || []);
      setActivityFeed(activityRes.items || []);
      setProfile(profileRes);
      setWatchlist(watchlistRes);

      if (tonightRes?.media?.id) {
        const detail = await fetchMovieDetail(tonightRes.media.id.toString()).catch(() => null);
        setTonightMovie(detail);
      }
    } catch (err) {
      console.error("Error loading For You data", err);
      setError("No pudimos cargar tu recomendación diaria.");
    } finally {
      setLoading(false);
    }
  }, [setUser, setTonightMovie, setForYouFeed, setActivityFeed, setProfile, setWatchlist, setShowOnboarding, setLoading, setError]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return { refresh: loadAll };
}
