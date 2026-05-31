import { authorizedFetch } from "./authServices";


export const followPerson = async (
  token: string | null,
  tmdbId: number,
  name: string,
  profilePath?: string | null,
) => {
  if (!token) throw new Error("No token");
  const response = await authorizedFetch("/api/persons/follow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tmdb_id: tmdbId, name, profile_path: profilePath }),
  });
  if (!response.ok) throw new Error("Error following person");
  return await response.json();
};

export const unfollowPerson = async (token: string | null, tmdbId: number) => {
  if (!token) throw new Error("No token");
  const response = await authorizedFetch(`/api/persons/follow/${tmdbId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error unfollowing person");
  return await response.json();
};

export const checkFollowingStatus = async (
  token: string | null,
  tmdbId: number,
) => {
  if (!token) return { following: false };
  const response = await authorizedFetch(`/api/persons/check/${tmdbId}`, {
    method: "GET",
  });
  if (!response.ok) return { following: false };
  return await response.json();
};
