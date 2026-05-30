/**
 * @file membersServices.ts
 * @description Capa de servicios para la página /members.
 * Conecta con los endpoints de usuarios para obtener el directorio
 * de la comunidad y gestionar el grafo social de seguimiento.
 */

import { authorizedFetch, getStoredAccessToken } from "./authServices";

const API_URL = String(
  import.meta.env.VITE_API_URL || "https://cine-vault-ncuh.onrender.com",
)
  .trim()
  .replace(/\/+$/, "");

// ─── TYPES ───────────────────────────────────────────────────

/** Perfil público simplificado devuelto por GET /api/users */
export type MemberSummary = {
  id: number;
  username: string;
  email?: string;
  role: "admin" | "editor" | "member";
  avatar_url: string | null;
  bio?: string | null;
  _count?: {
    reviews: number;
    diary_entries: number;
    watchlist: number;
    user_lists?: number;
    follows_follows_follower_idTousers: number;
    follows_follows_following_idTousers: number;
  };
};

/** Perfil completo con contadores de actividad devuelto por GET /api/users/:id */
export type MemberProfile = {
  id: number;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  is_following?: boolean;
  _count: {
    reviews: number;
    diary_entries: number;
    watchlist: number;
    user_lists?: number;
    follows_follows_follower_idTousers: number; // followers count
    follows_follows_following_idTousers: number; // following count
  };
};

/** Entrada de usuario retornada por los endpoints de follower/following */
export type FollowEntry = {
  id: number;
  username: string;
  avatar_url: string | null;
};

// ─── HELPERS ─────────────────────────────────────────────────

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Error ${res.status}`);
  }
  return (await res.json()) as T;
}

async function authFetchJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await authorizedFetch(path, {
    method: "GET",
    ...init,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Error ${res.status}`);
  }
  if (res.status === 204) return {} as T;
  return (await res.json()) as T;
}

// ─── SERVICES ────────────────────────────────────────────────

/**
 * Obtiene el catálogo completo de usuarios registrados.
 * Requiere autenticación (middlewareAutenticacion en el backend).
 */
export const fetchAllMembers = async (): Promise<MemberSummary[]> => {
  const token = getStoredAccessToken();
  if (!token) {
    // Sin token intentamos de todas formas; el backend decidirá
    try {
      return await fetchJson<MemberSummary[]>("/api/users");
    } catch {
      return [];
    }
  }
  try {
    return await authFetchJson<MemberSummary[]>("/api/users");
  } catch {
    return [];
  }
};

/**
 * Obtiene el perfil completo de un usuario por ID.
 */
export const fetchMemberProfile = async (
  userId: number,
): Promise<MemberProfile | null> => {
  try {
    return await fetchJson<MemberProfile>(`/api/users/${userId}`);
  } catch {
    return null;
  }
};

/**
 * Busca usuarios por username o bio.
 */
export const searchMembers = async (
  q: string,
  limit = 30,
): Promise<MemberSummary[]> => {
  if (!q.trim()) return [];
  try {
    return await fetchJson<MemberSummary[]>(
      `/api/users/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    );
  } catch {
    return [];
  }
};

/**
 * Sigue a un usuario. Requiere autenticación.
 */
export const followMember = async (targetId: number): Promise<boolean> => {
  try {
    const res = await authorizedFetch(`/api/users/follow/${targetId}`, {
      method: "POST",
    });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Deja de seguir a un usuario. Requiere autenticación.
 */
export const unfollowMember = async (targetId: number): Promise<boolean> => {
  try {
    const res = await authorizedFetch(`/api/users/unfollow/${targetId}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Obtiene los seguidores de un usuario.
 */
export const fetchMemberFollowers = async (
  userId: number,
): Promise<FollowEntry[]> => {
  try {
    return await fetchJson<FollowEntry[]>(`/api/users/${userId}/followers`);
  } catch {
    return [];
  }
};

/**
 * Obtiene a quiénes sigue un usuario.
 */
export const fetchMemberFollowing = async (
  userId: number,
): Promise<FollowEntry[]> => {
  try {
    return await fetchJson<FollowEntry[]>(`/api/users/${userId}/following`);
  } catch {
    return [];
  }
};
