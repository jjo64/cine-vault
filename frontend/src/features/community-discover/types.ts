import type { UserListSummary } from "../../services/listsServices";
import type { AuthUser } from "../../services/authServices";

export type TabId = "all" | "official" | "friends" | "mine";
export type SortId = "popular" | "recent" | "alphabetical";

export interface CommunityState {
  allLists: UserListSummary[];
  myLists: UserListSummary[];
  currentUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  activeTab: TabId;
  activeSort: SortId;
  searchQuery: string;
}

export type { UserListSummary, AuthUser };
