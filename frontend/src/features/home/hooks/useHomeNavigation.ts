import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { ZoneId } from "../types";

export const useHomeNavigation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial zone from URL or default to "entrada"
  const getInitialZone = (): ZoneId => {
    const p = searchParams.get("zone");
    if (p === "entrada" || p === "sala" || p === "vitrina") return p as ZoneId;
    return "entrada";
  };

  const [activeZone, setActiveZoneState] = useState<ZoneId>(getInitialZone());

  const setActiveZone = (zone: ZoneId) => {
    setActiveZoneState(zone);
    setSearchParams(
      (prev) => {
        if (zone === "entrada") {
          prev.delete("zone");
        } else {
          prev.set("zone", zone);
        }
        return prev;
      },
      { replace: true }
    );
    window.scrollTo(0, 0);
  };

  // Sync state if URL changes externally (e.g. back button)
  useEffect(() => {
    const p = searchParams.get("zone") as ZoneId;
    const effective = (p === "entrada" || p === "sala" || p === "vitrina") ? p : "entrada";
    if (effective !== activeZone) {
      setActiveZoneState(effective);
    }
  }, [searchParams, activeZone]);

  return { activeZone, setActiveZone };
};
