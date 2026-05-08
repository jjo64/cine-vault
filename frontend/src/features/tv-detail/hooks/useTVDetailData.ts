import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTVDetail } from "../../../services/tvDetailServices";
import { slugify } from "../utils";
import { useTVDetailStore } from "../store/useTVDetailStore";

function parseSlugId(slugOrId: string): string {
  return slugOrId.split("-")[0];
}

export function useTVDetailData(slugOrId: string | undefined) {
  const navigate = useNavigate();
  const numericId = useMemo(
    () => (slugOrId ? parseSlugId(slugOrId) : ""),
    [slugOrId],
  );

  const { setDetail, setLoading, setError } = useTVDetailStore();

  useEffect(() => {
    if (!numericId) return;
    let alive = true;
    setLoading(true);
    fetchTVDetail(numericId)
      .then((data) => {
        if (!alive) return;
        setDetail(data);
        if (slugOrId && !/[a-z]/.test(slugOrId) && data.name) {
          navigate(`/tv/${slugify(data.id, data.name)}`, { replace: true });
        }
      })
      .catch((err) => {
        if (alive) setError((err as Error).message || "Error");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [numericId, navigate, setDetail, setLoading, setError, slugOrId]);

  return { numericId };
}
