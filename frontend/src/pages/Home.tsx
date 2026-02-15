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
    async function fetchUser() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  if (loading) return <p>Cargando...</p>

  return user ? <HomeLogged username={user.username} /> : <Landing />

}
export default Home;