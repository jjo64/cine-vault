import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { ZoneId } from "../types";

export const useHomeNavigation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const zoneParam = searchParams.get("zone") as ZoneId;
  const [activeZone, setActiveZone] = useState<ZoneId>(
    zoneParam && ["entrada", "sala", "vitrina"].includes(zoneParam)
      ? zoneParam
      : "entrada",
  );

  useEffect(() => {
    if (zoneParam && zoneParam !== activeZone) {
      setActiveZone(zoneParam);
    }
  }, [zoneParam, activeZone]);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        if (activeZone === "entrada") {
          prev.delete("zone");
        } else {
          prev.set("zone", activeZone);
        }
        return prev;
      },
      { replace: true },
    );
  }, [activeZone, setSearchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeZone]);

  return { activeZone, setActiveZone };
};
