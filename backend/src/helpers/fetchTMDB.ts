// Helper para centralizar las peticiones a TMDB
export const fetchTMDB = async (endpoint: string, params: Record<string, any> = {}) => {
  const urlParams = new URLSearchParams({
    language: 'es-ES',
    ...params
  });
  const url = `https://api.themoviedb.org/3/${endpoint}?${urlParams.toString()}`;
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.API_KEY_TMDB}`
    }
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`TMDB error! Status: ${response.status}`);
  }
  return response.json();
};