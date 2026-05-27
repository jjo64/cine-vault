import type { MemberSummary, MemberProfile } from "../../services/membersServices";
import type { Member } from "./types";
import { ROLE_GLOW } from "./constants";

export function fmtCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function summaryToMember(s: MemberSummary): Member {
  const role = (s.role as Member["role"]) ?? "member";
  return {
    id: String(s.id),
    name: s.username,
    handle: `@${s.username}`,
    avatar: s.avatar_url ?? "",
    role,
    bio: "",
    filmsLogged: 0,
    followers: 0,
    following: 0,
    listsCreated: 0,
    glowRgb: ROLE_GLOW[role] ?? ROLE_GLOW.member,
  };
}

export function profileToMember(p: MemberProfile, base: Member): Member {
  return {
    ...base,
    bio: p.bio ?? "",
    filmsLogged: p._count?.diary_entries ?? 0,
    followers: p._count?.follows_follows_following_idTousers ?? 0,
    following: p._count?.follows_follows_follower_idTousers ?? 0,
    listsCreated: 0,
  };
}
