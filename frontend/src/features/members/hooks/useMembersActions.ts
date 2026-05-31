import { useCallback } from "react";
import { followMember, unfollowMember } from "../../../services/membersServices";
import { getStoredAccessToken } from "../../../services/authServices";
import { useMembersStore } from "../store/useMembersStore";
import { notify } from "../../../lib/notify";

export function useMembersActions() {
  const followedIds = useMembersStore((s) => s.followedIds);
  const toggleFollowOptimistic = useMembersStore((s) => s.toggleFollowOptimistic);

  const toggleFollow = useCallback(
    async (id: string) => {
      const token = getStoredAccessToken();
      if (!token) {
        notify.unauthorized();
        window.dispatchEvent(new CustomEvent("open-auth-modal"));
        return;
      }

      const wasFollowed = followedIds.has(id);

      // Optimistic update
      toggleFollowOptimistic(id);

      const ok = wasFollowed
        ? await unfollowMember(Number(id))
        : await followMember(Number(id));

      if (!ok) {
        // Rollback on failure
        toggleFollowOptimistic(id);
      }
    },
    [followedIds, toggleFollowOptimistic],
  );

  return { toggleFollow };
}
