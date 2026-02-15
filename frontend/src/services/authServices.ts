export async function getCurrentUser() {
  const token = localStorage.getItem("token")
  if (!token) throw new Error("No token")

  const res = await fetch("http://localhost:4000/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error("Usuario no autorizado")

  return await res.json()
}