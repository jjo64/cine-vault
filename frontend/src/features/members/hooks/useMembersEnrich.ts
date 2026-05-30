import { useCallback, useRef } from "react";
import { fetchMemberProfile } from "../../../services/membersServices";
import { useMembersStore } from "../store/useMembersStore";
import { profileToMember } from "../utils";

export function useMembersEnrich() {
  const enrichQueue = useRef<Set<string>>(new Set());
  const membersMap = useMembersStore((s) => s.membersMap);
  const updateMember = useMembersStore((s) => s.updateMember);

  const enrichMember = useCallback(
    async (id: string) => {
      if (enrichQueue.current.has(id)) return;
      enrichQueue.current.add(id);

      const base = membersMap.get(id);
      if (!base) return;

      const profile = await fetchMemberProfile(Number(id));
      if (!profile) return;

      updateMember(id, profileToMember(profile, base));
    },
    [membersMap, updateMember],
  );

  return { enrichMember };
}
