// import TextType from './TextType';
import { useEffect, useState } from 'react';
import Landing from '../components/Landing';
import HomeLogged from '../components/HomeLogged';
import { getCurrentUser } from '../services/authServices';

interface User {
    username: string;
}

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    let authEpoch = 0

    async function fetchUser(epoch: number) {
      try {
        const currentUser = await getCurrentUser()
        if (!alive || epoch !== authEpoch) return
        setUser(currentUser)
      } catch {
        if (!alive || epoch !== authEpoch) return
        setUser(null)
      } finally {
        if (!alive || epoch !== authEpoch) return
        setLoading(false)
      }
    }

    const onAuthChange = (event: Event) => {
      const authEvent = event as CustomEvent<{ authenticated?: boolean }>
      if (authEvent.detail?.authenticated === false) {
        authEpoch += 1
        setUser(null)
        setLoading(false)
        return
      }

      authEpoch += 1
      const currentEpoch = authEpoch
      setLoading(true)
      fetchUser(currentEpoch)
    }

    window.addEventListener('auth-state-changed', onAuthChange)
    authEpoch += 1
    fetchUser(authEpoch)

    return () => {
      alive = false
      window.removeEventListener('auth-state-changed', onAuthChange)
    }
  }, [])

  if (loading) return <p>Cargando...</p>

  return user ? <HomeLogged username={user.username} /> : <Landing />

}
export default Home;