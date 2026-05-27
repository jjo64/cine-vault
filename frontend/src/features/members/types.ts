export interface Member {
  id: string;
  name: string; // === username
  handle: string; // @username
  avatar: string;
  role: "admin" | "editor" | "member";
  bio: string;
  filmsLogged: number;
  followers: number;
  following: number;
  listsCreated: number;
  glowRgb: string;
}

export interface MembersStore {
  membersMap: Map<string, Member>;
  followedIds: Set<string>;
  loading: boolean;
  error: string | null;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeMembers: (members: Member[]) => void;
  updateMember: (id: string, member: Member) => void;
  setFollowedIds: (followedIds: Set<string>) => void;
  toggleFollowOptimistic: (id: string) => void;
}

