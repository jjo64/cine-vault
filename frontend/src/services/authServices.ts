export async function getCurrentUser() {
  const token = localStorage.getItem("token")
  if (!token) throw new Error("No token")

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error("Usuario no autorizado")

  return await res.json()
}