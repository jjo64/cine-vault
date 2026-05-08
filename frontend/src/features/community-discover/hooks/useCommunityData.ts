import { useEffect, useCallback } from "react";
import { getPublicLists, getMyLists } from "../../../services/listsServices";
import { getStoredAccessToken, getCurrentUser } from "../../../services/authServices";
import type { CommunityState } from "./useCommunityState";

export function useCommunityData(state: CommunityState) {
  const { setAllLists, setMyLists, setCurrentUser, setLoading, setError } = state;

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const [publicRes, mineRes, user] = await Promise.all([
        getPublicLists(1, 40),
        getStoredAccessToken() ? getMyLists() : Promise.resolve([]),
        getCurrentUser().catch(() => null),
      ]);
      
      setAllLists(publicRes.items);
      setMyLists(mineRes);
      setCurrentUser(user);
    } catch (err) {
      console.error("Error fetching lists", err);
      setError("Error al cargar las listas");
    } finally {
      setLoading(false);
    }
  }, [setAllLists, setMyLists, setCurrentUser, setLoading, setError]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  return { refresh: fetchLists };
}
