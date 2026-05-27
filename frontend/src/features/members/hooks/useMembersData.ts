import { useEffect } from "react";
import { fetchAllMembers } from "../../../services/membersServices";
import type { MemberSummary } from "../../../services/membersServices";
import { useMembersStore } from "../store/useMembersStore";
import { summaryToMember } from "../utils";

export function useMembersData() {
  const initializeMembers = useMembersStore((s) => s.initializeMembers);
  const setLoading = useMembersStore((s) => s.setLoading);
  const setError = useMembersStore((s) => s.setError);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const summaries = await fetchAllMembers();
        if (!active) return;

        const members = summaries.map((s: MemberSummary) => summaryToMember(s));
        initializeMembers(members);
      } catch {
        if (active) {
          setError("No se pudo cargar la lista de miembros.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [initializeMembers, setLoading, setError]);
}
