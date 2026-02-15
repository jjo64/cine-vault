interface HomeLoggedProps {
    username: string;
}

const HomeLogged: React.FC<HomeLoggedProps> = ({ username }) => {
  return (
    <div style={{ margin: "2rem" }}>
      <h1>Welcome back, {username} 🎉</h1>
      <p>Aquí está tu feed personalizado de películas y amigos</p>
      {/* Más secciones: listas, recomendaciones, stats... */}
    </div>
  )
}

export default HomeLogged