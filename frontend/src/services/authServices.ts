export type AuthUser = {
  id: number
  username: string
  avatar_url?: string | null
}

export async function getCurrentUser(): Promise<AuthUser> {
  const token = localStorage.getItem("token")
  if (!token) throw new Error("No token")

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    // Si el token expiró o es inválido, lo removemos para frenar nuevos 401.
    if (res.status === 401) {
      localStorage.removeItem("token")
    }
    throw new Error("Usuario no autorizado")
  }

  return await res.json()
}

export async function logoutCurrentUser() {
  const token = localStorage.getItem("token")

  try {
    await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    })
  } finally {
    localStorage.removeItem("token")
  }
}