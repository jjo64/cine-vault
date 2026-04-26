/**
 * @file seed.ts
 * @description CineVault v2 — Premium Database Seeder
 * Simula tráfico real con patrones temporales ponderados, contenido curado
 * y perfiles de gusto realistas para validar el motor de recomendaciones.
 *
 * Estrategia de protección:
 *  - Los registros de usuarios IDs 1-11 nunca se borran (perfil de usuario).
 *  - SÍ se limpia y regenera su actividad (vault, diario, listas, taste profiles)
 *    para garantizar datos limpios y consistentes.
 *  - Los IDs 1 (josue) y 2 (natalia) se fuerzan a rol "admin" + plan "pro".
 *  - Al final, enhanceProtectedUsers() añade datos curados extra para Josue (ID 1).
 */

import {
  users_role,
  users_membership,
  subscriptions_plan,
  subscriptions_status,
  subscriptions_provider,
  payments_provider,
  payments_payment_status,
  notifications_type,
  news_category,
  ReviewModo,
  ReviewMediaType,
  session_type,
  vault_social_entry_type,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";

// ══════════════════════════════════════════════════════════════════════════════
//  CONFIGURACIÓN GLOBAL
// ══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  SEED: 42,
  SEED_USERS: 150, // usuarios generados (no protegidos)
  PROTECTED_USER_IDS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  ADMIN_IDS: [1, 2],
  // Actividad por usuario generado
  VAULT_PER_USER: 35,
  WATCHLIST_PER_USER: 15,
  DIARY_PER_USER: 25,
  FAVORITES_PER_USER: 4,
  FOLLOWS_PER_USER: 25,
  REVIEWS_PER_USER: 8,
  COMMENTS_PER_REVIEW: 2,
  LISTS_PER_USER: 4,
  EXPLICIT_INTERACTIONS_PER_USER: 20,
  VAULT_SOCIAL_PER_USER: 6,
  NOTIFICATIONS_PER_USER: 20,
  NEWS_ITEMS: 50,
  HASHED_PASSWORD: "",
};

// ══════════════════════════════════════════════════════════════════════════════
//  POOL DE TMDB IDs — ~110 películas curadas
// ══════════════════════════════════════════════════════════════════════════════

const ALL_MOVIE_TMDB_IDS: number[] = [
  // ── Pool original ──
  858024, 157336, 244786, 46738, 965150, 553, 249397, 258216, 24, 16869, 550,
  641, 598, 406, 496243, 103663, 38, 11324, 680, 807, 68718, 1018, 389, 37165,
  426, 793, 8072, 34647, 979, 27205, 674, 299534, 558, 2649, 105,
  // ── Clásicos esenciales ──
  238, // The Godfather
  278, // The Shawshank Redemption
  240, // The Godfather Part II
  424, // Schindler's List
  637, // American Beauty
  129, // Spirited Away
  539, // Psycho
  11216, // Cinema Paradiso
  274, // The Silence of the Lambs
  769, // Goodfellas
  857, // Chinatown
  98, // Apocalypse Now
  // ── Kubrick Arco ──
  62, // 2001: A Space Odyssey
  694, // The Shining
  185, // A Clockwork Orange
  15387, // Barry Lyndon
  // ── Korean New Wave Arco ──
  441130, // Memories of Murder
  670, // Oldboy
  353081, // The Handmaiden
  539537, // Burning
  22970, // Mother
  // ── Wong Kar-wai Arco ──
  11104, // Chungking Express
  18491, // In the Mood for Love
  11788, // Happy Together
  11141, // 2046
  18580, // Fallen Angels
  // ── Nolan Arco ──
  77338, // Memento
  1124, // The Prestige
  374720, // Dunkirk
  // ── Tarkovsky Arco ──
  2033, // Solaris (1972)
  5013, // Stalker
  10529, // Andrei Rublev
  9847, // The Mirror
  11318, // Ivan's Childhood
  // ── Neorrealismo Italiano ──
  15807, // Bicycle Thieves
  11897, // La Strada
  13738, // Umberto D
  // ── Psych Horror Arco ──
  4151, // Vertigo
  8079, // Blue Velvet
  // ── Nouvelle Vague Arco ──
  619, // Breathless (À bout de souffle)
  2958, // Jules and Jim
  289, // Shoot the Piano Player
  3933, // Cleo from 5 to 7
  1428, // Band of Outsiders
  // ── Adicionales para variedad ──
  372058, // Parasite (original ID)
  19, // Metropolis (1927)
  762, // Birth of a Nation (historical)
  9286, // M (Fritz Lang)
  6552, // The Seventh Seal
  18638, // Wild Strawberries (Bergman)
].filter((id, idx, arr) => arr.indexOf(id) === idx);

// ══════════════════════════════════════════════════════════════════════════════
//  8 ARCOS EDITORIALES OFICIALES CURADOS
// ══════════════════════════════════════════════════════════════════════════════

const CURATED_ARCOS = [
  {
    slug: "iniciacion-kubrick",
    title: "Iniciación a Stanley Kubrick",
    description:
      "Un recorrido esencial por la filmografía obsesiva de uno de los directores más influyentes del siglo XX. El orden importa: de lo más accesible a lo más exigente. Cada film es una obsesión diferente, pero el rigor formal es siempre el mismo.",
    poster_url:
      "https://image.tmdb.org/t/p/w500/sOHqdY1RnSn6kcfAHKu28jvTebE.jpg",
    level: "PRINCIPIANTE",
    badge: "Explorador Kubrick",
    tmdb_ids: [694, 185, 37165, 62, 15387],
    notes: [
      "La imagen del terror clásico. Aquí empieza todo. Kubrick transforma un hotel en una mente.",
      "El futuro distópico más elegante jamás filmado. McDowell en estado perfecto.",
      "Cine bélico reinterpretado como trauma colectivo. El desfile final es irrepetible.",
      "El monolito y el silencio. Cine de ideas puras. El film más ambicioso de la historia.",
      "El Kubrick más incomprendido. El primer encuentro con su austeridad máxima y su ironía oculta.",
    ],
  },
  {
    slug: "nueva-ola-coreana",
    title: "La Nueva Ola Coreana",
    description:
      "Del género al arte. El cine surcoreano que cambió la conversación global: intensidad narrativa, subversión de géneros y una Palma de Oro que confirmó lo que ya era evidente. Corea domina el siglo XXI.",
    poster_url:
      "https://image.tmdb.org/t/p/w500/7yNq16MEnk4bW0sD26c2gGgl71k.jpg",
    level: "INTERMEDIO",
    badge: "Maestro Coreano",
    tmdb_ids: [441130, 670, 353081, 496243, 539537, 22970],
    notes: [
      "El caso sin resolver como metáfora de una nación sin respuestas. El inicio del new wave.",
      "Venganza poética llevada al límite de lo soportable. Park Chan-wook en estado puro.",
      "Erotismo, poder y control. Uno de los films más calculados de la historia reciente.",
      "La obra maestra que confirmó Corea para el resto del mundo. Palma de Oro 2019.",
      "El fuego que arde lentamente. A la distancia, amenazante. Basada en Carver.",
      "Amor y desesperación en Seúl. El tono más humano y devastador del arco.",
    ],
  },
  {
    slug: "universo-wong-kar-wai",
    title: "El Universo de Wong Kar-wai",
    description:
      "Tiempo como materia, amor como pérdida. La filmografía de WKW es un ejercicio de estilo y melancolía que no tiene igual en la historia del cine. Hong Kong como escenario de lo efímero.",
    poster_url:
      "https://image.tmdb.org/t/p/w500/5gGfSf5nRQlbzF2SHBrpuiZM5yO.jpg",
    level: "AVANZADO",
    badge: "Cinéfilo de Hong Kong",
    tmdb_ids: [11104, 18491, 11788, 11141, 18580],
    notes: [
      "Hong Kong como laberinto de identidades. El debut del estilo WKW. Desordenada y fascinante.",
      "La película más bella sobre el amor no consumado. Cada plano es un cuadro.",
      "Amor homosexual en Argentina. WKW más emocional que nunca. Maggie Cheung desgarrada.",
      "El tiempo como herida abierta. La secuela que medita sobre lo que pudo haber sido.",
      "Los marginados de Hong Kong. Fría y eléctrica. El lado oscuro del universo WKW.",
    ],
  },
  {
    slug: "arquitectura-nolan",
    title: "La Arquitectura de Christopher Nolan",
    description:
      "Tiempo, identidad y espectáculo intelectual. Nolan redefine el blockbuster demostrando que la complejidad narrativa y el entretenimiento puro no son opuestos, sino complementos perfectos.",
    poster_url:
      "https://image.tmdb.org/t/p/w500/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg",
    level: "INTERMEDIO",
    badge: "Arquitecto del Tiempo",
    tmdb_ids: [77338, 1124, 27205, 157336, 374720],
    notes: [
      "La memoria como construcción falsa. El thriller más elegante de los 2000. Narrado al revés.",
      "Identidad, magia y obsesión. El film más underrated de Nolan. Alfred Borden vs. Robert Angier.",
      "El laberinto definitivo. Estética y narrativa como un reloj suizo perfecto. Di Caprio en su cima.",
      "Amor, tiempo y física cuántica. La más ambiciosa de todas. Hans Zimmer como co-director.",
      "La guerra sin héroes. Solo supervivencia. Nolan en su mode más minimalista y efectivo.",
    ],
  },
  {
    slug: "tarkovsky-tiempo-materia",
    title: "Tarkovsky: El Tiempo como Materia",
    description:
      "Cine de meditación pura. Andrei Tarkovsky construyó un universo espiritual donde el tempo fílmico se convierte en experiencia casi religiosa. El cine más lento y más necesario.",
    poster_url:
      "https://image.tmdb.org/t/p/w500/1L0HWbcb3bQbdwCUdaJcLTCEm7v.jpg",
    level: "AVANZADO",
    badge: "Maestro de la Contemplación",
    tmdb_ids: [11318, 10529, 2033, 5013, 9847],
    notes: [
      "El primer Tarkovsky. La infancia como paraíso perdido. Blanco y negro poético.",
      "Historia, fe y arte. La película más larga y más necesaria del director.",
      "Soledad, pérdida y memoria en un planeta extraño. La soledad como el verdadero alien.",
      "La zona como metáfora total. El viaje hacia adentro. El más filosófico de todos.",
      "Los recuerdos como imágenes fragmentadas. El film más personal de Tarkovsky.",
    ],
  },
  {
    slug: "neorrealismo-italiano",
    title: "El Neorrealismo Italiano",
    description:
      "De las ruinas de la Segunda Guerra Mundial nació el cine más honesto del siglo XX. Italia reinventó el lenguaje cinematográfico mostrando la realidad sin filtros, con actores no profesionales y exteriores reales.",
    poster_url:
      "https://image.tmdb.org/t/p/w500/3GrRgt6CiLIUXOPreT1BruAMiEm.jpg",
    level: "PRINCIPIANTE",
    badge: "Neorrealista",
    tmdb_ids: [15807, 11897, 13738, 496243],
    notes: [
      "La bicicleta como dignidad. El film perfecto sobre la pobreza y el amor entre padre e hijo.",
      "Gelsomina y Zampanò. El humanismo más dolido de Fellini. Giulietta Masina inmortal.",
      "La vejez y el abandono del estado. Devastadora, silenciosa y necesaria.",
      "El eco contemporáneo del neorrealismo. Parasite como cierre perfecto que une épocas.",
    ],
  },
  {
    slug: "terror-psicologico-maestros",
    title: "Terror Psicológico: Maestros del Miedo Interior",
    description:
      "El verdadero terror no está en lo que se ve. Estos films construyen el horror desde adentro: identidad fracturada, paranoia como norma y lo inexplicable como única certeza. El miedo más sofisticado.",
    poster_url:
      "https://image.tmdb.org/t/p/w500/vXbU4zW25Yit9Fm1VnB5sS7IfH5.jpg",
    level: "INTERMEDIO",
    badge: "Maestro del Horror Interior",
    tmdb_ids: [539, 694, 1018, 8079, 4151],
    notes: [
      "El modelo. Todo el terror psicológico moderno sale de aquí. Bernard Herrmann eterno.",
      "Kubrick convierte el miedo doméstico en cine de terror máximo. El laberinto de la mente.",
      "Lynch y la pesadilla americana. Identidad como ilusión. Hollywood como infierno propio.",
      "El sueño americano como infierno particular de uno. Lynch en su apogeo absoluto.",
      "Hitchcock y la obsesión por remodelar al otro. El misterio de quiénes somos realmente.",
    ],
  },
  {
    slug: "nouvelle-vague-esencial",
    title: "Nouvelle Vague: La Revolución Francesa",
    description:
      "En los años 60, críticos de Cahiers du Cinéma salieron a las calles con cámaras ligeras y cambiaron el cine para siempre. Aquí está su testamento definitivo: amor al cine americano desde Europa.",
    poster_url:
      "https://image.tmdb.org/t/p/w500/rqsgKfBBwCBEKVBKBMlmsDfMsbQ.jpg",
    level: "PRINCIPIANTE",
    badge: "Crítico de Cahiers",
    tmdb_ids: [619, 2958, 289, 3933, 1428],
    notes: [
      "Godard y el amor herético al cine americano. El jump cut que lo cambió todo.",
      "El triángulo amoroso más libre del cine moderno. Truffaut en su apogeo lírico.",
      "Truffaut antes de Jules et Jim. Cruda, honesta y llena de jazz nocturno.",
      "Varda y el tiempo real. Una revolución feminista silenciosa antes de su tiempo.",
      "Godard jugando con la forma cinematográfica. El cine como juego intelectual y protesta.",
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
//  5 PERSONAS DE GUSTO — distribuidas entre los usuarios
//  Los keys de affinity_vector coinciden con los genre names de TMDB en inglés.
// ══════════════════════════════════════════════════════════════════════════════

const TASTE_PERSONAS = [
  {
    name: "Cinéfilo Clásico",
    probability: 0.18,
    affinity_vector: {
      Drama: 1.9,
      Crime: 1.7,
      History: 1.5,
      Thriller: 1.3,
      Mystery: 1.2,
      War: 1.1,
      Romance: 0.9,
      Comedy: 0.7,
      "Science Fiction": 0.5,
      Action: 0.3,
      Horror: 0.4,
    },
    vetoed_entities: {
      genres: ["12", "28"], // Adventure, Action (TMDB genre IDs)
      directors: ["Michael Bay", "Zack Snyder"],
    },
    weather_history: {
      rainy: ["Drama", "Thriller", "Crime", "History"],
      sunny: ["Comedy", "Romance"],
      night: ["Mystery", "Thriller", "Crime"],
    },
  },
  {
    name: "Fan Sci-Fi & Blockbuster",
    probability: 0.2,
    affinity_vector: {
      "Science Fiction": 2.3,
      Action: 1.6,
      Adventure: 1.5,
      Thriller: 1.2,
      Fantasy: 1.0,
      Animation: 0.8,
      Drama: 0.6,
      Horror: 0.7,
      Comedy: 0.9,
    },
    vetoed_entities: {
      genres: ["10749", "99"], // Romance, Documentary
      directors: [],
    },
    weather_history: {
      rainy: ["Science Fiction", "Thriller"],
      sunny: ["Action", "Adventure", "Animation"],
      night: ["Science Fiction", "Horror"],
    },
  },
  {
    name: "Amante del Cine de Arte",
    probability: 0.14,
    affinity_vector: {
      Drama: 2.1,
      History: 1.9,
      Mystery: 1.7,
      Romance: 1.3,
      War: 1.1,
      Documentary: 1.0,
      Crime: 0.9,
      Thriller: 0.8,
      Action: 0.1,
      Comedy: 0.3,
      Animation: 0.2,
    },
    vetoed_entities: {
      genres: ["28", "12", "35"], // Action, Adventure, Comedy
      directors: ["Michael Bay", "Roland Emmerich"],
    },
    weather_history: {
      rainy: ["Drama", "History", "Mystery", "Documentary"],
      sunny: ["Romance", "History"],
      night: ["Mystery", "Thriller", "Drama"],
    },
  },
  {
    name: "Fanático del Horror",
    probability: 0.14,
    affinity_vector: {
      Horror: 2.6,
      Thriller: 2.1,
      Mystery: 1.8,
      Crime: 1.4,
      "Science Fiction": 1.0,
      Drama: 0.8,
      Action: 0.6,
      Comedy: 0.2,
      Romance: 0.1,
    },
    vetoed_entities: {
      genres: ["10751", "10749", "16"], // Family, Romance, Animation
      directors: [],
    },
    weather_history: {
      rainy: ["Horror", "Thriller", "Mystery"],
      sunny: ["Thriller", "Crime", "Mystery"],
      night: ["Horror", "Mystery", "Thriller"],
    },
  },
  {
    name: "Espectador Generalista",
    probability: 0.34,
    affinity_vector: {
      Action: 1.4,
      Comedy: 1.3,
      Drama: 1.2,
      Adventure: 1.2,
      "Science Fiction": 1.0,
      Thriller: 1.0,
      Romance: 0.9,
      Animation: 0.9,
      Crime: 0.8,
      Horror: 0.6,
    },
    vetoed_entities: {
      genres: ["99"], // Documentary
      directors: [],
    },
    weather_history: {
      rainy: ["Drama", "Thriller", "Comedy"],
      sunny: ["Comedy", "Action", "Adventure"],
      night: ["Thriller", "Horror", "Science Fiction"],
    },
  },
];

// ══════════════════════════════════════════════════════════════════════════════
//  15 TEMAS DE LISTAS CURADAS
// ══════════════════════════════════════════════════════════════════════════════

const CURATED_LIST_THEMES = [
  {
    name: "Noches de Nolan",
    description:
      "La arquitectura temporal de un visionario. Maratón para entender cómo el tiempo puede ser personaje principal.",
    tags: ["Christopher Nolan", "Thriller", "Arquitectura"],
    glow_color: "80,100,180",
    tmdb_ids: [77338, 1124, 27205, 157336, 374720],
  },
  {
    name: "Para llorar un domingo",
    description:
      "Películas que parten el alma con honestidad. Melancolía justificada, sin manipulación barata.",
    tags: ["Drama", "Melancolía", "Domingo"],
    glow_color: "150,80,100",
    tmdb_ids: [278, 424, 496243, 11216, 637, 98],
  },
  {
    name: "Sci-Fi que te rompe la cabeza",
    description:
      "Ciencia ficción que te deja sin respuestas pero con mejores preguntas. El universo como laberinto.",
    tags: ["Sci-Fi", "Filosofía", "Mente"],
    glow_color: "60,180,140",
    tmdb_ids: [62, 27205, 157336, 2033, 550],
  },
  {
    name: "Cine Coreano Esencial",
    description:
      "Los seis films que explican por qué el cine coreano domina el siglo XXI.",
    tags: ["Corea del Sur", "Drama", "Contemporáneo"],
    glow_color: "220,160,60",
    tmdb_ids: [441130, 670, 353081, 496243, 539537, 22970],
  },
  {
    name: "Hitchcock: El Maestro del Suspense",
    description:
      "La genealogía del suspense. Hitchcock inventó los movimientos que todos copian.",
    tags: ["Alfred Hitchcock", "Thriller", "Clásico"],
    glow_color: "100,60,150",
    tmdb_ids: [539, 4151, 694, 8079],
  },
  {
    name: "Maratón de Viernes",
    description:
      "Films para disfrutar en grupo, con comida, sin compromisos el día siguiente.",
    tags: ["Entretenimiento", "Grupo", "Viernes"],
    glow_color: "60,150,100",
    tmdb_ids: [550, 680, 769, 238, 807, 68718],
  },
  {
    name: "Cine Minimalista",
    description:
      "Menos es más. Films que lo dicen todo callando. El silencio como lenguaje cinematográfico.",
    tags: ["Minimalismo", "Contemplatif", "Arte"],
    glow_color: "120,120,100",
    tmdb_ids: [2033, 5013, 9847, 3933, 289],
  },
  {
    name: "Villanos Memorables",
    description:
      "Las grandes actuaciones que te hacen odiar y admirar a partes iguales durante semanas.",
    tags: ["Villanos", "Acting", "Personajes"],
    glow_color: "200,60,60",
    tmdb_ids: [274, 238, 240, 680, 807],
  },
  {
    name: "Dupla Godard–Truffaut",
    description:
      "Las dos caras de la Nouvelle Vague y su relación complicada con la herencia americana.",
    tags: ["Nouvelle Vague", "Francia", "Amistad"],
    glow_color: "80,140,200",
    tmdb_ids: [619, 2958, 289, 3933, 1428],
  },
  {
    name: "El Tiempo como Protagonista",
    description:
      "Films donde el tiempo no es fondo sino esencia narrativa. Cada corte como una cicatriz.",
    tags: ["Tiempo", "Estructura", "Narrativa"],
    glow_color: "160,120,80",
    tmdb_ids: [77338, 11141, 2033, 27205, 18491],
  },
  {
    name: "Crimen Organizado",
    description:
      "La fascinación por el mundo criminal desde adentro. Los maestros absolutos del género.",
    tags: ["Crime", "Gangsters", "Poder"],
    glow_color: "100,100,60",
    tmdb_ids: [238, 240, 769, 680, 857],
  },
  {
    name: "Hong Kong es cine",
    description:
      "Wong Kar-wai y los maestros de Hong Kong. La ciudad como personaje y memoria.",
    tags: ["Hong Kong", "Asia", "Melancolía"],
    glow_color: "200,120,40",
    tmdb_ids: [11104, 18491, 11788, 11141, 18580],
  },
  {
    name: "Animación que no es para niños",
    description:
      "Miyazaki y los maestros de la animación adulta. Puro cine, sin importar el medio.",
    tags: ["Animación", "Miyazaki", "Arte"],
    glow_color: "80,180,200",
    tmdb_ids: [129, 16869, 24],
  },
  {
    name: "El Canon Occidental Esencial",
    description:
      "Las películas que definen lo que llamamos 'gran cine'. El punto de partida obligatorio.",
    tags: ["Canon", "Esencial", "Historia del Cine"],
    glow_color: "212,175,122",
    tmdb_ids: [238, 278, 280, 424, 637, 807, 98, 769],
  },
  {
    name: "Tarkovsky y sus hijos",
    description:
      "El maestro y los directores que llevan su ADN espiritual y contemplativo.",
    tags: ["Tarkovsky", "Cine de Arte", "Espiritual"],
    glow_color: "140,80,160",
    tmdb_ids: [2033, 5013, 10529, 9847, 11318],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
//  TEMPLATES DE CONTENIDO
// ══════════════════════════════════════════════════════════════════════════════

const REVIEW_TEMPLATES: Record<string, string[]> = {
  RAPIDO: [
    "Imagen tras imagen que se quedan grabadas. No necesitas más razones.",
    "Pocas películas generan esta incomodidad tan productiva.",
    "5 estrellas sin dudar. Magistral en todos los sentidos.",
    "Imperfecta y por eso más honesta que la mayoría.",
    "No es para todos, pero para quienes la entienden es un regalo.",
    "Más preguntas que respuestas. Exactamente lo que necesitaba.",
    "El tipo de cine que te cambia el día después de verlo.",
    "Una dirección que hace que cada plano valga más que mil palabras.",
  ],
  ESTANDAR: [
    "Hay películas que te recuerdan por qué el cine importa. Esta es una de ellas. La dirección de fotografía es impecable, cada plano parece pensado durante semanas antes del rodaje.\n\nLa interpretación principal sostiene todo el peso dramático con una naturalidad que rara vez se ve en producciones de este presupuesto.",
    "El guión trabaja en múltiples capas simultáneamente. Lo que parece una historia de superficie es en realidad una crítica velada a estructuras de poder contemporáneas que el espectador construye solo.\n\nLa banda sonora sabe cuándo callar, que es el primer requisito de cualquier gran compositor de cine.",
    "Actuar de esta manera requiere un nivel de entrega que pocos pueden mantener durante dos horas sin perder la credibilidad. La transformación del personaje es genuinamente creíble de principio a fin.\n\nEl director confía en el espectador, que es el gesto más raro y más valioso del cine contemporáneo.",
    "Un primer acto que parece lento hasta que te das cuenta de que cada detalle que ignoraste importa en el tercero. La paciencia se recompensa aquí de manera extraordinaria.",
  ],
  CRITICO: [
    "Ante todo, hay que hablar del uso del encuadre: cada secuencia está calibrada para producir una tensión específica, no solo visual sino narrativa. Lo que el director logra con la profundidad de campo en los tres primeros actos construye una expectativa que el desenlace subvierte de manera calculada pero no gratuita.\n\nLa banda sonora merece análisis separado: lejos de subrayar lo obvio, funciona como contrapunto que enriquece y a veces contradice lo que vemos en pantalla.\n\nSi hay una objeción válida, es que el ritmo del segundo acto concede demasiado a una audiencia que quizás no necesitaba esa concesión. El film habría ganado con diez minutos menos de explicitación.",
    "Lo primero que hay que decir es que estamos ante un caso raro de cine que sabe exactamente lo que quiere ser. No hay tentativa ni compromiso: cada elección formal es una declaración de principios. Los planos secuencia no son exhibicionismo, son construcción de tensión sostenida.\n\nLa actuación principal es el tipo de trabajo que envejece bien: en la primera visión parece contenido; en la segunda, comprendes que cada microsegundo estaba calculado al milímetro. Eso es rarísimo.\n\nEl único punto donde el film traiciona su propia lógica es el desenlace, que concede más a la catarsis emocional de lo que su planteamiento prometía. Pero incluso ese 'error' es inteligente.",
  ],
};

const VAULT_SOCIAL_TEMPLATES: Record<vault_social_entry_type, string[]> = {
  reflexion: [
    "Hay películas que no entiendes la primera vez que las ves. Esta es una de ellas. Segunda visión y todo cobra otro sentido: los detalles que ignoré, los silencios que no supe leer.",
    "El plano final lleva días en mi cabeza. No sé si es brillante o simplemente inexplicable, pero no puedo dejarlo ir. Quizás sean lo mismo.",
    "Cine que exige participación activa del espectador. No te deja sentarte y consumir pasivamente; te obliga a pensar junto a él, a construir mientras ves.",
    "La primera vez que la vi era demasiado joven para entenderla. La segunda vez era exactamente la edad correcta. El cine espera.",
    "Revisión después de tres años: completamente distinta. Yo cambié o ella cambió. Probablemente los dos.",
  ],
  critica: [
    "Técnicamente impecable, pero me pregunto si la frialdad formal no aplasta lo que debería ser emoción genuina. A veces el rigor estético es una forma de distancia, no de arte.",
    "El problema no es la ambición, sino que la película no confía en que el espectador la acompañe. Demasiadas explicaciones. Demasiadas señales que apuntan a lo mismo.",
    "Un tercer acto que traiciona lo construido en los dos primeros. Y aun así, esos dos primeros actos valen el precio de entrada y el tiempo.",
  ],
  recomendacion: [
    "Si te gustó Tarkovsky, esta es el siguiente paso lógico. Misma sensación de tiempo dilatado, universo completamente diferente.",
    "Perfecta para una noche de lluvia con la mente despejada. No te decepciona, pero necesita silencio a su alrededor.",
    "La que más recomiendo a alguien que quiere entender el cine de autor sin empezar por lo más exigente. La puerta de entrada perfecta.",
    "Empiézala sin leer nada sobre ella. Cuanto menos sepas, mejor. Confía en eso.",
  ],
  edit: [
    "Actualizo mi valoración: fui injusto la primera vez. El contexto importa más de lo que pensé.",
    "Revisé mis notas de la primera visión y me sorprendo de lo que ignoré. El cine te da lo que traes.",
  ],
};

const DIARY_MOODS = [
  "cinéfilo",
  "nostálgico",
  "crítico",
  "sorprendido",
  "contemplativo",
  "emocionado",
  "desafiado",
  "inspirado",
  "inquieto",
  "maravillado",
];

const DIARY_STAGES = [
  "primera vez",
  "revisión",
  "estudio",
  "placer culpable",
  "recomendación pendiente",
  "maratón",
  "sesión temática",
];

const NEWS_ITEMS_DATA = [
  {
    title: "Cannes 2026: los favoritos para la Palma de Oro que nadie discute",
    category: "premios" as news_category,
    content:
      "La selección oficial de Cannes 2026 promete una edición histórica con cineastas de tres continentes compitiendo por la codiciada Palma. El director más esperado llega con una propuesta que los críticos adelantados califican de 'ruptura total' con su filmografía anterior.",
  },
  {
    title:
      "El cine coreano arrasa en los premios internacionales: análisis de una década de dominio",
    category: "premios" as news_category,
    content:
      "Desde Parasite hasta las nominaciones de este año, el cine surcoreano ha cambiado para siempre la conversación en Hollywood y en los festivales europeos. Un análisis de cómo Park Chan-wook, Bong Joon-ho y Lee Chang-dong construyeron un movimiento que el mundo no supo ver venir.",
  },
  {
    title:
      "Christopher Nolan desvela los primeros detalles de su próximo proyecto",
    category: "estrenos" as news_category,
    content:
      "En una entrevista en el BFI, el director de Inception habla por primera vez del proyecto que lleva tres años desarrollando en secreto. El film, ambientado en dos períodos históricos simultáneos, promete ser su trabajo más ambicioso desde Dunkirk.",
  },
  {
    title:
      "Denis Villeneuve confirma su próximo film: 'más íntimo y más extraño que Dune'",
    category: "estrenos" as news_category,
    content:
      "Villeneuve abandona la épica espacial para un proyecto radicalmente diferente. Una historia de tres personas en tres países conectadas por un objeto que no debería existir. La fotografía la firmará de nuevo Roger Deakins.",
  },
  {
    title:
      "Netflix anuncia la mayor inversión en cine de autor de su historia: 380 millones para directores independientes",
    category: "streaming" as news_category,
    content:
      "La plataforma cambia de estrategia tras el éxito crítico de sus producciones de arte y ensayo. El programa seleccionará 12 directores por año en todo el mundo con libertad creativa total y mínima interferencia editorial.",
  },
  {
    title:
      "Martin Scorsese sobre el streaming: 'El problema no es el formato, sino el ritmo de consumo'",
    category: "directores" as news_category,
    content:
      "En una conferencia en el Lincoln Center, el director de Goodfellas reflexiona sobre cómo la forma en que vemos cine está cambiando nuestra relación con él. No está en contra de Netflix; está a favor del silencio y la oscuridad de una sala.",
  },
  {
    title:
      "Restauración 8K de '2001: Odisea del Espacio' llegará a salas europeas en otoño",
    category: "estrenos" as news_category,
    content:
      "La Kubrick Estate ha supervisado durante tres años la restauración más completa jamás realizada de la obra maestra de 1968. La proyección en 70mm y la versión 8K se estrenarán simultáneamente en 47 ciudades europeas.",
  },
  {
    title:
      "Pedro Costa gana el León de Oro en Venecia con una película de cuatro horas",
    category: "premios" as news_category,
    content:
      "El director portugués regresa al palmarés internacional con una obra que los críticos comparan con Satantango de Béla Tarr. La duración extrema no ha impedido una ovación de más de doce minutos en el Palazzo del Cinema.",
  },
  {
    title:
      "Wim Wenders sobre el cine en la era de la IA: 'La mirada humana es irremplazable'",
    category: "directores" as news_category,
    content:
      "El autor de Paris, Texas reflexiona en una entrevista sobre el papel de la inteligencia artificial en la creación cinematográfica. Para Wenders, el cine siempre ha sido sobre dejar entrar el azar, y la IA no sabe cómo hacer eso.",
  },
  {
    title: "Las 10 mejores películas de los últimos cinco años según CineVault",
    category: "estrenos" as news_category,
    content:
      "La redacción de CineVault ha elaborado una lista consensuada de los diez films más significativos estrenados entre 2020 y 2025. La lista incluye sorpresas, ausencias polémicas y el regreso de directores que no deberían haber tardado tanto.",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
//  HELPERS TEMPORALES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Genera una fecha con sesgo fuerte hacia los últimos 30 días (78%)
 * y pico de fin de semana (viernes/sábado/domingo).
 */
function recentBiasedDate(maxDaysBack = 365): Date {
  const isRecent = Math.random() < 0.78;
  const daysBack = isRecent
    ? Math.floor(Math.random() * 30)
    : 30 + Math.floor(Math.random() * (maxDaysBack - 30));

  const date = new Date();
  date.setDate(date.getDate() - daysBack);

  // 40% de probabilidad de empujar hacia fin de semana si es día laborable
  const dow = date.getDay();
  if (Math.random() < 0.4 && dow >= 1 && dow <= 4) {
    date.setDate(date.getDate() + (5 - dow)); // mover a viernes
  }

  // Hora aleatoria (mayoría tarde-noche para ver películas)
  date.setHours(faker.number.int({ min: 17, max: 23 }));
  return date;
}

/** Selecciona n elementos únicos aleatorios de un array */
function pickUnique<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

/** Asigna una persona de gusto basada en probabilidad acumulada */
function assignPersona(idx: number) {
  faker.seed(CONFIG.SEED + idx);
  const roll = Math.random();
  let acc = 0;
  for (const p of TASTE_PERSONAS) {
    acc += p.probability;
    if (roll < acc) return p;
  }
  return TASTE_PERSONAS[TASTE_PERSONAS.length - 1];
}

// ══════════════════════════════════════════════════════════════════════════════
//  LIMPIEZA
// ══════════════════════════════════════════════════════════════════════════════

async function cleanDatabase() {
  console.log("🗑️  Limpiando datos de seed anteriores...");

  // Usuarios a eliminar por completo (no protegidos)
  const seedUsers = await prisma.users.findMany({
    where: { id: { notIn: CONFIG.PROTECTED_USER_IDS } },
    select: { id: true },
  });
  const seedUserIds = seedUsers.map((u) => u.id);

  if (seedUserIds.length > 0) {
    // Eliminar en cascada (orden correcto por FK)
    await prisma.user_activity.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.vault_social_entries.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.notifications.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.review_likes.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.review_comments.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.reports.deleteMany({
      where: { reporter_id: { in: seedUserIds } },
    });
    await prisma.reviews.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.diary_entries.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.diary_sessions.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.favorites.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.vault.deleteMany({ where: { user_id: { in: seedUserIds } } });
    await prisma.watchlist.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.follows.deleteMany({
      where: { follower_id: { in: seedUserIds } },
    });
    await prisma.follows.deleteMany({
      where: { following_id: { in: seedUserIds } },
    });
    await prisma.payments.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.subscriptions.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.auth_tokens.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.sessions.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.explicit_interactions.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.user_taste_profiles.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.user_list_items.deleteMany({
      where: { movie_list: { user_id: { in: seedUserIds } } },
    });
    await prisma.user_lists.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.user_badges.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.user_followed_persons.deleteMany({
      where: { user_id: { in: seedUserIds } },
    });
    await prisma.users.deleteMany({ where: { id: { in: seedUserIds } } });
  }

  // Limpiar actividad de usuarios protegidos (se regenerará limpia)
  const pid = CONFIG.PROTECTED_USER_IDS;
  await prisma.vault_social_entries.deleteMany({ where: { user_id: { in: pid } } });
  await prisma.diary_sessions.deleteMany({ where: { user_id: { in: pid } } });
  await prisma.diary_entries.deleteMany({ where: { user_id: { in: pid } } });
  await prisma.vault.deleteMany({ where: { user_id: { in: pid } } });
  await prisma.watchlist.deleteMany({ where: { user_id: { in: pid } } });
  await prisma.favorites.deleteMany({ where: { user_id: { in: pid } } });
  await prisma.review_likes.deleteMany({ where: { user_id: { in: pid } } });
  await prisma.review_comments.deleteMany({ where: { user_id: { in: pid } } });
  await prisma.reviews.deleteMany({ where: { user_id: { in: pid } } });
  await prisma.follows.deleteMany({ where: { follower_id: { in: pid } } });
  await prisma.explicit_interactions.deleteMany({ where: { user_id: { in: pid } } });
  await prisma.user_taste_profiles.deleteMany({ where: { user_id: { in: pid } } });
  await prisma.user_list_items.deleteMany({ where: { movie_list: { user_id: { in: pid } } } });
  await prisma.user_lists.deleteMany({ where: { user_id: { in: pid } } });
  await prisma.user_badges.deleteMany({ where: { user_id: { in: pid } } });
  await prisma.notifications.deleteMany({ where: { user_id: { in: pid } } });

  // Limpiar tablas globales
  await prisma.user_arco_progress.deleteMany();
  await prisma.arco_movies.deleteMany();
  await prisma.arcos.deleteMany();
  await prisma.badges.deleteMany();
  await prisma.news.deleteMany();

  console.log(
    `✅ Limpieza completa. ${seedUserIds.length} usuarios seed eliminados.`
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PELÍCULAS
// ══════════════════════════════════════════════════════════════════════════════

async function seedMovies() {
  console.log(`🎬 Sincronizando ${ALL_MOVIE_TMDB_IDS.length} películas...`);

  // Asegurar que todos los IDs de arcos están en el pool
  const arcosIds = CURATED_ARCOS.flatMap((a) => a.tmdb_ids);
  const allIds = [...new Set([...ALL_MOVIE_TMDB_IDS, ...arcosIds])];

  await prisma.movies_ref.createMany({
    data: allIds.map((tmdb_id) => ({ tmdb_id, media_type: "movie" as const })),
    skipDuplicates: true,
  });

  // Añadir algunas series TV populares
  await prisma.movies_ref.createMany({
    data: [
      { tmdb_id: 1396, media_type: "tv" as const }, // Breaking Bad
      { tmdb_id: 1399, media_type: "tv" as const }, // Game of Thrones
      { tmdb_id: 66732, media_type: "tv" as const }, // Stranger Things
      { tmdb_id: 60574, media_type: "tv" as const }, // Peaky Blinders
    ],
    skipDuplicates: true,
  });

  return await prisma.movies_ref.findMany({
    where: { media_type: "movie" },
    select: { id: true, tmdb_id: true },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  USUARIOS SEED
// ══════════════════════════════════════════════════════════════════════════════

async function seedUsers() {
  console.log(`👤 Creando ${CONFIG.SEED_USERS} usuarios seed...`);

  const memberships: users_membership[] = [
    "free",
    "free",
    "free",
    "free",
    "vip",
    "pro",
  ];

  const usersData = Array.from({ length: CONFIG.SEED_USERS }, (_, i) => ({
    username: `cineuser_${(i + 200).toString().padStart(3, "0")}`,
    email: `user${i + 200}@cinevault.dev`,
    password: CONFIG.HASHED_PASSWORD,
    avatar_url: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
    bio: faker.helpers.arrayElement([
      `"${faker.helpers.arrayElement([
        "El cine es la verdad a 24 fotogramas por segundo",
        "Un fotograma puede valer más que mil palabras",
        "El cine salva vidas",
        "Vivir es ver películas",
        "La oscuridad de la sala es el primer ingrediente",
      ])}"`,
      `${faker.number.int({ min: 80, max: 900 })} películas vistas. Contando.`,
      `Cinéfilo desde los ${faker.number.int({ min: 8, max: 16 })}. Sin remedio.`,
      null,
      null,
    ]),
    role: "user" as users_role,
    membership: faker.helpers.arrayElement(memberships),
    is_verified: faker.datatype.boolean({ probability: 0.82 }),
    is_public: true,
    two_factor_enabled: faker.datatype.boolean({ probability: 0.08 }),
    failed_attempts: 0,
    created_at: faker.date.past({ years: 2 }),
    updated_at: faker.date.recent({ days: 14 }),
  }));

  await prisma.users.createMany({ data: usersData, skipDuplicates: true });

  // Forzar roles de usuarios protegidos
  await prisma.users.updateMany({
    where: { id: { in: CONFIG.ADMIN_IDS } },
    data: { role: "admin" as users_role, membership: "pro", is_public: true, is_verified: true },
  });
  await prisma.users.updateMany({
    where: {
      id: {
        in: CONFIG.PROTECTED_USER_IDS.filter(
          (id) => !CONFIG.ADMIN_IDS.includes(id)
        ),
      },
    },
    data: { role: "editor" as users_role, membership: "pro", is_public: true, is_verified: true },
  });

  return await prisma.users.findMany({ select: { id: true, membership: true } });
}

// ══════════════════════════════════════════════════════════════════════════════
//  FOLLOWS — red social
// ══════════════════════════════════════════════════════════════════════════════

async function seedFollows(allUsers: { id: number }[]) {
  console.log("🔗 Creando red social de seguimientos...");
  const pairs = new Set<string>();
  const data: { follower_id: number; following_id: number }[] = [];

  const protectedUsers = allUsers.filter((u) =>
    CONFIG.PROTECTED_USER_IDS.includes(u.id)
  );
  const regularUsers = allUsers.filter(
    (u) => !CONFIG.PROTECTED_USER_IDS.includes(u.id)
  );

  for (const user of allUsers) {
    // Tendencia a seguir a usuarios protegidos (son los "famosos")
    const protectedTargets = pickUnique(
      protectedUsers.filter((u) => u.id !== user.id),
      Math.min(4, protectedUsers.length)
    );
    const regularTargets = pickUnique(
      regularUsers.filter((u) => u.id !== user.id),
      CONFIG.FOLLOWS_PER_USER - protectedTargets.length
    );

    for (const target of [...protectedTargets, ...regularTargets]) {
      const key = `${user.id}-${target.id}`;
      if (!pairs.has(key)) {
        pairs.add(key);
        data.push({ follower_id: user.id, following_id: target.id });
      }
    }
  }

  const BATCH = 1000;
  for (let i = 0; i < data.length; i += BATCH) {
    await prisma.follows.createMany({
      data: data.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }
  console.log(`  → ${data.length} follows creados.`);
}

// ══════════════════════════════════════════════════════════════════════════════
//  SESIONES DE DIARIO + ACTIVIDAD PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

async function seedDiarySessionsAndActivity(
  allUsers: { id: number }[],
  movies: { id: number; tmdb_id: number }[]
) {
  console.log(
    "📓 Creando sesiones de diario, vault, watchlist y favoritos..."
  );

  const SESSION_TYPES: session_type[] = [
    "single",
    "single",
    "double",
    "single",
    "triple",
    "marathon",
  ];
  const BATCH = 500;

  // 1. Crear sesiones de diario en batch
  const sessionInserts: {
    user_id: number;
    date: Date;
    type: session_type;
    has_order: boolean;
    mood: string | null;
    stage: string | null;
    note: string | null;
  }[] = [];

  for (const user of allUsers) {
    const numSessions = faker.number.int({ min: 12, max: 24 });
    for (let s = 0; s < numSessions; s++) {
      const sessionDate = recentBiasedDate(90);
      sessionDate.setHours(0, 0, 0, 0); // DATE field requiere solo fecha
      sessionInserts.push({
        user_id: user.id,
        date: sessionDate,
        type: faker.helpers.arrayElement(SESSION_TYPES),
        has_order: faker.datatype.boolean({ probability: 0.3 }),
        mood: faker.helpers.arrayElement([...DIARY_MOODS, null, null]),
        stage: faker.helpers.arrayElement([...DIARY_STAGES, null, null, null]),
        note: faker.datatype.boolean({ probability: 0.25 })
          ? faker.lorem.sentence()
          : null,
      });
    }
  }

  for (let i = 0; i < sessionInserts.length; i += BATCH) {
    await prisma.diary_sessions.createMany({ data: sessionInserts.slice(i, i + BATCH) });
  }

  const allSessions = await prisma.diary_sessions.findMany({
    select: { id: true, user_id: true, date: true },
  });

  // 2. Crear entradas de diario, vault, watchlist, favoritos
  const diaryEntries: {
    user_id: number;
    movie_id: number;
    watched_date: Date;
    session_id: number | null;
  }[] = [];
  const vaultData: { user_id: number; movie_id: number; added_at: Date }[] = [];
  const watchlistData: { user_id: number; movie_id: number }[] = [];
  const favoritesData: { user_id: number; movie_id: number; rank_position: number }[] = [];

  const diarySeenMap = new Map<number, Set<number>>();
  const vaultSeenMap = new Map<number, Set<number>>();

  for (const user of allUsers) {
    diarySeenMap.set(user.id, new Set());
    vaultSeenMap.set(user.id, new Set());

    const userSessions = allSessions.filter((s) => s.user_id === user.id);
    const moviePool = pickUnique(movies, CONFIG.VAULT_PER_USER + CONFIG.WATCHLIST_PER_USER + CONFIG.DIARY_PER_USER);

    // — Vault —
    const vaultMovies = moviePool.slice(0, CONFIG.VAULT_PER_USER);
    for (const m of vaultMovies) {
      if (!vaultSeenMap.get(user.id)!.has(m.id)) {
        vaultSeenMap.get(user.id)!.add(m.id);
        vaultData.push({ user_id: user.id, movie_id: m.id, added_at: recentBiasedDate(180) });
      }
    }

    // — Diary (asociadas a sesiones) —
    let diaryCount = 0;
    for (const session of userSessions) {
      if (diaryCount >= CONFIG.DIARY_PER_USER) break;
      const available = vaultMovies.filter((m) => !diarySeenMap.get(user.id)!.has(m.id));
      const toAdd = pickUnique(available, faker.number.int({ min: 1, max: 2 }));
      for (const m of toAdd) {
        if (diaryCount >= CONFIG.DIARY_PER_USER) break;
        diarySeenMap.get(user.id)!.add(m.id);
        const watched = new Date(session.date);
        watched.setHours(faker.number.int({ min: 19, max: 23 }));
        diaryEntries.push({
          user_id: user.id,
          movie_id: m.id,
          watched_date: watched,
          session_id: session.id,
        });
        diaryCount++;
      }
    }

    // — Watchlist —
    const wlMovies = moviePool.slice(CONFIG.VAULT_PER_USER, CONFIG.VAULT_PER_USER + CONFIG.WATCHLIST_PER_USER);
    for (const m of wlMovies) {
      if (!vaultSeenMap.get(user.id)!.has(m.id)) {
        watchlistData.push({ user_id: user.id, movie_id: m.id });
      }
    }

    // — Favorites —
    const favMovies = pickUnique(vaultMovies, CONFIG.FAVORITES_PER_USER);
    favMovies.forEach((m, i) =>
      favoritesData.push({ user_id: user.id, movie_id: m.id, rank_position: i + 1 })
    );
  }

  for (let i = 0; i < diaryEntries.length; i += BATCH) {
    await prisma.diary_entries.createMany({ data: diaryEntries.slice(i, i + BATCH) });
  }
  for (let i = 0; i < vaultData.length; i += BATCH) {
    await prisma.vault.createMany({ data: vaultData.slice(i, i + BATCH), skipDuplicates: true });
  }
  for (let i = 0; i < watchlistData.length; i += BATCH) {
    await prisma.watchlist.createMany({ data: watchlistData.slice(i, i + BATCH), skipDuplicates: true });
  }
  for (let i = 0; i < favoritesData.length; i += BATCH) {
    await prisma.favorites.createMany({ data: favoritesData.slice(i, i + BATCH), skipDuplicates: true });
  }

  console.log(
    `  → ${sessionInserts.length} sesiones | ${diaryEntries.length} diary | ${vaultData.length} vault | ${watchlistData.length} watchlist`
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  REVIEWS + COMENTARIOS + LIKES
// ══════════════════════════════════════════════════════════════════════════════

async function seedReviews(
  allUsers: { id: number }[],
  movies: { id: number }[]
) {
  console.log("📝 Creando reseñas, comentarios y likes...");
  const MODES: ReviewModo[] = [
    "RAPIDO",
    "RAPIDO",
    "RAPIDO",
    "ESTANDAR",
    "ESTANDAR",
    "CRITICO",
  ];
  const BATCH = 500;

  const reviewLikesSet = new Set<string>();
  const reviewLikes: { user_id: number; review_id: number }[] = [];
  const reviewComments: {
    review_id: number;
    user_id: number;
    content: string;
    created_at: Date;
  }[] = [];

  for (const user of allUsers) {
    const reviewMovies = pickUnique(movies, CONFIG.REVIEWS_PER_USER);

    for (const movie of reviewMovies) {
      const mode = faker.helpers.arrayElement(MODES);
      const templates = REVIEW_TEMPLATES[mode];

      let review;
      if (Math.random() > 0.4) {
        review = await prisma.reviews.create({
          data: {
            user_id: user.id,
            movie_id: movie.id,
            content: "Excelente película, recomendada 100% para amantes del cine.",
            rating: 4.5,
            mode: "RAPIDO",
            media_type: "movie",
            created_at: recentBiasedDate(60),
          },
        }).catch(() => null);
      }

      if (review) {

      // Likes
      const likers = pickUnique(
        allUsers.filter((u) => u.id !== user.id),
        faker.number.int({ min: 0, max: 20 })
      );
      for (const liker of likers) {
        const key = `${liker.id}-${review.id}`;
        if (!reviewLikesSet.has(key)) {
          reviewLikesSet.add(key);
          reviewLikes.push({ user_id: liker.id, review_id: review.id });
        }
      }

      // Comentarios
      const commenters = pickUnique(allUsers, CONFIG.COMMENTS_PER_REVIEW);
      for (const c of commenters) {
        reviewComments.push({
          review_id: review.id,
          user_id: c.id,
          content: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
          created_at: recentBiasedDate(60),
        });
        }
      }
    }
  }

  for (let i = 0; i < reviewLikes.length; i += BATCH) {
    await prisma.review_likes.createMany({
      data: reviewLikes.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }
  for (let i = 0; i < reviewComments.length; i += BATCH) {
    await prisma.review_comments.createMany({
      data: reviewComments.slice(i, i + BATCH),
    });
  }

  // Actualizar contadores de likes
  const likeCounts = await prisma.review_likes.groupBy({
    by: ["review_id"],
    _count: { review_id: true },
  });
  for (const { review_id, _count } of likeCounts) {
    await prisma.reviews.update({
      where: { id: review_id },
      data: { likes: _count.review_id },
    });
  }

  console.log(
    `  → ${reviewLikes.length} likes | ${reviewComments.length} comentarios`
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TASTE PROFILES — 5 personas distribuidas
// ══════════════════════════════════════════════════════════════════════════════

async function seedTasteProfiles(allUsers: { id: number }[]) {
  console.log("🧠 Creando perfiles de gusto con vectores de afinidad...");
  const BATCH = 300;

  const tasteData = allUsers.map((user, i) => {
    const persona = assignPersona(i);

    // Pequeña variación individual (±0.3) para que no sean clones
    const vector: Record<string, number> = {};
    for (const [genre, score] of Object.entries(persona.affinity_vector)) {
      vector[genre] = Math.max(
        0,
        parseFloat(
          (score + faker.number.float({ min: -0.3, max: 0.3, fractionDigits: 1 })).toFixed(1)
        )
      );
    }

    return {
      user_id: user.id,
      affinity_vector: JSON.stringify(vector),
      vetoed_entities: JSON.stringify(persona.vetoed_entities),
      weather_history: JSON.stringify(persona.weather_history),
    };
  });

  for (let i = 0; i < tasteData.length; i += BATCH) {
    await prisma.user_taste_profiles.createMany({
      data: tasteData.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }

  console.log(`  → ${tasteData.length} taste profiles creados.`);
}

// ══════════════════════════════════════════════════════════════════════════════
//  INTERACCIONES EXPLÍCITAS — 10 por usuario (onboarding + tonight)
// ══════════════════════════════════════════════════════════════════════════════

async function seedExplicitInteractions(
  allUsers: { id: number }[],
  movies: { id: number; tmdb_id: number }[]
) {
  console.log(
    "🎭 Creando interacciones explícitas (onboarding + tonight)..."
  );
  const BATCH = 1000;

  const ONBOARDING = ["like_onboarding", "like_onboarding", "like_onboarding", "skip_onboarding"];
  const TONIGHT = ["tonight_accept", "tonight_accept", "tonight_accept", "tonight_reject"];

  const data: {
    user_id: number;
    movie_id: number | null;
    interaction_type: string;
    metadata: string;
    created_at: Date;
  }[] = [];

  for (const user of allUsers) {
    const userMovies = pickUnique(movies, CONFIG.EXPLICIT_INTERACTIONS_PER_USER);

    for (let i = 0; i < CONFIG.EXPLICIT_INTERACTIONS_PER_USER; i++) {
      const isTonight = i >= 6; // últimas 4 son tonight
      const movie = userMovies[i];

      data.push({
        user_id: user.id,
        movie_id: movie?.id ?? null,
        interaction_type: isTonight
          ? faker.helpers.arrayElement(TONIGHT)
          : faker.helpers.arrayElement(ONBOARDING),
        metadata: JSON.stringify({
          source: isTonight ? "tonight_widget" : "onboarding_tinder",
          step: i + 1,
          local_hour: faker.number.int({ min: 17, max: 23 }),
          tmdb_id: movie?.tmdb_id ?? null,
        }),
        created_at: recentBiasedDate(21),
      });
    }
  }

  for (let i = 0; i < data.length; i += BATCH) {
    await prisma.explicit_interactions.createMany({ data: data.slice(i, i + BATCH) });
  }
  console.log(`  → ${data.length} interacciones explícitas creadas.`);
}

// ══════════════════════════════════════════════════════════════════════════════
//  LISTAS CURADAS — 15 temas distribuidos entre usuarios
// ══════════════════════════════════════════════════════════════════════════════

async function seedCuratedLists(
  allUsers: { id: number }[],
  movies: { id: number; tmdb_id: number }[]
) {
  console.log("📑 Creando listas curadas temáticas...");

  for (const user of allUsers) {
    const numLists = faker.number.int({ min: 1, max: CONFIG.LISTS_PER_USER + 1 });
    const selectedThemes = pickUnique(CURATED_LIST_THEMES, numLists);

    for (const theme of selectedThemes) {
      const themeMovies = movies.filter((m) => theme.tmdb_ids.includes(m.tmdb_id));
      const extras = pickUnique(
        movies.filter((m) => !themeMovies.find((t) => t.id === m.id)),
        Math.max(0, 5 - themeMovies.length)
      );
      const listMovies = [...themeMovies, ...extras].slice(0, 12);

      if (listMovies.length < 2) continue;

      const createdAt = recentBiasedDate(180);

      const list = await prisma.user_lists.create({
        data: {
          user_id: user.id,
          name: theme.name,
          description: theme.description,
          is_public: true,
          is_official: false,
          tags: theme.tags,
          glow_color: theme.glow_color,
          created_at: createdAt,
          updated_at: createdAt,
        },
      });

      await prisma.user_list_items.createMany({
        data: listMovies.map((m) => ({
          list_id: list.id,
          movie_id: m.id,
          added_at: createdAt,
        })),
        skipDuplicates: true,
      });
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  8 ARCOS OFICIALES
// ══════════════════════════════════════════════════════════════════════════════

async function seedArcos(
  allUsers: { id: number }[],
  movies: { id: number; tmdb_id: number }[]
) {
  console.log("🌈 Creando 8 Arcos Editoriales Oficiales...");
  const adminId = 1;

  for (const arcoData of CURATED_ARCOS) {
    const arcoMovieRefs = arcoData.tmdb_ids
      .map((tmdbId, idx) => {
        const ref = movies.find((m) => m.tmdb_id === tmdbId);
        return ref
          ? { ref, idx, note: arcoData.notes[idx] ?? null }
          : null;
      })
      .filter(Boolean) as { ref: { id: number }; idx: number; note: string | null }[];

    if (arcoMovieRefs.length < 2) {
      console.warn(`  ⚠️  "${arcoData.title}" tiene <2 películas en DB, omitiendo.`);
      continue;
    }

    const arco = await prisma.arcos.create({
      data: {
        created_by_user_id: adminId,
        reviewed_by_user_id: adminId,
        slug: arcoData.slug,
        title: arcoData.title,
        description: arcoData.description,
        poster_url: arcoData.poster_url,
        level: arcoData.level,
        moderation_status: "approved",
        cinevault_badge: arcoData.badge,
        is_official: true,
        reviewed_at: faker.date.past({ years: 1 }),
        created_at: faker.date.past({ years: 1 }),
      },
    });

    await prisma.arco_movies.createMany({
      data: arcoMovieRefs.map((item) => ({
        arco_id: arco.id,
        movie_id: item.ref.id,
        order_index: item.idx + 1,
        note: item.note,
        is_optional: item.idx === arcoMovieRefs.length - 1,
      })),
      skipDuplicates: true,
    });

    // Simular progreso realista (efecto dropout)
    const progressUsers = pickUnique(allUsers, faker.number.int({ min: 18, max: 35 }));
    for (const pUser of progressUsers) {
      const completionProbs = arcoMovieRefs.map((_, idx) =>
        Math.max(0.1, 1 - idx * 0.14)
      );
      for (let i = 0; i < arcoMovieRefs.length; i++) {
        if (Math.random() < completionProbs[i]) {
          await prisma.user_arco_progress
            .create({
              data: {
                user_id: pUser.id,
                arco_id: arco.id,
                movie_id: arcoMovieRefs[i].ref.id,
                completed_at: recentBiasedDate(90),
              },
            })
            .catch(() => {}); // ignorar duplicados
        } else {
          break; // dropout
        }
      }
    }

    console.log(`  ✓ "${arcoData.title}" — ${arcoMovieRefs.length} películas, ${progressUsers.length} usuarios con progreso`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  VAULT SOCIAL ENTRIES — reflexiones, críticas, recomendaciones
// ══════════════════════════════════════════════════════════════════════════════

async function seedVaultSocialEntries(
  allUsers: { id: number }[],
  movies: { id: number; tmdb_id: number }[]
) {
  console.log("✍️  Creando entradas sociales del Vault...");
  const ENTRY_TYPES: vault_social_entry_type[] = [
    "reflexion",
    "reflexion",
    "critica",
    "recomendacion",
    "edit",
  ];
  const TITLES = [
    "Por qué esta película cambió algo en mí",
    "Segunda visión: completamente distinta",
    "El plano que no puedo sacudir de la cabeza",
    "Lo que nadie dice sobre este film",
    "Por qué la recomiendo sin dudar",
    "El final que más me ha afectado este año",
    "Revisitando un clásico personal",
    "La secuencia que lo define todo",
    "Tres razones para no perdérsela",
    "Notas de una segunda lectura",
  ];

  for (const user of allUsers) {
    const numEntries = faker.number.int({ min: 1, max: CONFIG.VAULT_SOCIAL_PER_USER });
    const entryMovies = pickUnique(movies, numEntries);

    for (const movie of entryMovies) {
      const type = faker.helpers.arrayElement(ENTRY_TYPES);
      const templates = VAULT_SOCIAL_TEMPLATES[type];
      const createdAt = recentBiasedDate(45);

      await prisma.vault_social_entries.create({
        data: {
          user_id: user.id,
          movie_id: movie.id,
          entry_type: type,
          title: faker.helpers.arrayElement(TITLES),
          content: faker.helpers.arrayElement(templates),
          is_public: true,
          likes_count: faker.number.int({ min: 0, max: 60 }),
          comments_count: faker.number.int({ min: 0, max: 15 }),
          created_at: createdAt,
          updated_at: createdAt,
        },
      });
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  INSIGNIAS
// ══════════════════════════════════════════════════════════════════════════════

async function seedBadges(allUsers: { id: number }[]) {
  console.log("🏅 Creando insignias del sistema...");

  const badgesData = [
    {
      name: "Cinéfilo Novato",
      description: "Registraste tus primeras 5 películas en el Diario",
      icon_url: "/badges/novato.svg",
      criteria: "DIARY_COUNT:5",
    },
    {
      name: "Crítico de Hierro",
      description: "Escribiste 10 reseñas en modo Crítico",
      icon_url: "/badges/critico.svg",
      criteria: "CRITICAL_REVIEWS:10",
    },
    {
      name: "Coleccionista",
      description: "Tienes 50 películas en tu Vault",
      icon_url: "/badges/coleccionista.svg",
      criteria: "VAULT_COUNT:50",
    },
    {
      name: "Social Cinéfilo",
      description: "Sigues a 10 miembros de la comunidad",
      icon_url: "/badges/social.svg",
      criteria: "FOLLOWS_COUNT:10",
    },
    {
      name: "Maestro de Arcos",
      description: "Completaste tu primer Arco Editorial",
      icon_url: "/badges/arcos.svg",
      criteria: "ARCO_COMPLETED:1",
    },
    {
      name: "Curador",
      description: "Creaste 3 listas públicas con al menos 5 films cada una",
      icon_url: "/badges/curador.svg",
      criteria: "LISTS_PUBLIC:3",
    },
    {
      name: "Madrugador",
      description: "Registraste 5 películas después de las 22:00",
      icon_url: "/badges/noche.svg",
      criteria: "LATE_NIGHT:5",
    },
    {
      name: "Explorer de Series",
      description: "Añadiste 3 series de TV a tu Vault",
      icon_url: "/badges/series.svg",
      criteria: "TV_COUNT:3",
    },
  ];

  await prisma.badges.createMany({ data: badgesData, skipDuplicates: true });
  const allBadges = await prisma.badges.findMany();

  const userBadgeData: { user_id: number; badge_id: number; unlocked_at: Date }[] = [];
  const seen = new Set<string>();

  for (const user of allUsers) {
    const numBadges = faker.number.int({ min: 0, max: 3 });
    const earned = pickUnique(allBadges, numBadges);
    for (const badge of earned) {
      const key = `${user.id}-${badge.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        userBadgeData.push({
          user_id: user.id,
          badge_id: badge.id,
          unlocked_at: recentBiasedDate(180),
        });
      }
    }
  }

  if (userBadgeData.length > 0) {
    await prisma.user_badges.createMany({
      data: userBadgeData,
      skipDuplicates: true,
    });
  }

  console.log(`  → ${allBadges.length} insignias | ${userBadgeData.length} asignadas`);
  return allBadges;
}

// ══════════════════════════════════════════════════════════════════════════════
//  SUSCRIPCIONES + PAGOS
// ══════════════════════════════════════════════════════════════════════════════

async function seedSubscriptions(allUsers: { id: number; membership: users_membership | null }[]) {
  console.log("💳 Creando suscripciones...");

  const planMap: Record<string, subscriptions_plan> = {
    free: "free",
    vip: "vip",
    pro: "pro",
  };

  const subData = allUsers.map((u) => {
    const plan = planMap[u.membership ?? "free"] as subscriptions_plan;
    const start = faker.date.past({ years: 1 });
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);

    return {
      user_id: u.id,
      plan,
      start_date: start,
      end_date: end,
      status: "active" as subscriptions_status,
      provider: "stripe" as subscriptions_provider,
      provider_subscription_id:
        plan !== "free" ? `sub_${faker.string.alphanumeric(14)}` : null,
    };
  });

  const BATCH = 500;
  for (let i = 0; i < subData.length; i += BATCH) {
    await prisma.subscriptions.createMany({
      data: subData.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }

  const allSubs = await prisma.subscriptions.findMany({
    select: { id: true, user_id: true, plan: true },
  });

  // Pagos para suscripciones de pago
  const priceMap: Record<string, number> = { vip: 4.99, pro: 9.99 };
  const paidSubs = allSubs.filter((s) => s.plan && s.plan !== "free");

  if (paidSubs.length > 0) {
    const payData = paidSubs.map((sub) => ({
      user_id: sub.user_id,
      subscription_id: sub.id,
      amount: priceMap[sub.plan ?? "vip"],
      currency: "EUR",
      provider: "stripe" as payments_provider,
      payment_status: "paid" as payments_payment_status,
      provider_payment_id: `pi_${faker.string.alphanumeric(24)}`,
      created_at: faker.date.past({ years: 1 }),
    }));

    for (let i = 0; i < payData.length; i += BATCH) {
      await prisma.payments.createMany({ data: payData.slice(i, i + BATCH) });
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  NOTIFICACIONES
// ══════════════════════════════════════════════════════════════════════════════

async function seedNotifications(allUsers: { id: number }[]) {
  console.log("🔔 Creando notificaciones...");
  const types: notifications_type[] = [
    "follow",
    "like",
    "comment",
    "like",
    "follow",
    "comment",
    "like",
  ];

  const data: {
    user_id: number;
    sender_id: number | null;
    type: notifications_type;
    read: boolean;
    created_at: Date;
  }[] = [];

  for (const user of allUsers) {
    const senders = pickUnique(
      allUsers.filter((u) => u.id !== user.id),
      CONFIG.NOTIFICATIONS_PER_USER
    );
    for (const sender of senders) {
      data.push({
        user_id: user.id,
        sender_id: sender.id,
        type: faker.helpers.arrayElement(types),
        read: faker.datatype.boolean({ probability: 0.46 }),
        created_at: recentBiasedDate(30),
      });
    }
  }

  const BATCH = 1000;
  for (let i = 0; i < data.length; i += BATCH) {
    await prisma.notifications.createMany({ data: data.slice(i, i + BATCH) });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  NOTICIAS
// ══════════════════════════════════════════════════════════════════════════════

async function seedNews() {
  console.log("📰 Creando noticias editoriales...");
  const categories: news_category[] = [
    "estrenos",
    "premios",
    "actores",
    "directores",
    "streaming",
  ];

  const allNews = [...NEWS_ITEMS_DATA];

  while (allNews.length < CONFIG.NEWS_ITEMS) {
    allNews.push({
      title: faker.lorem.sentence({ min: 6, max: 14 }).slice(0, 100),
      category: faker.helpers.arrayElement(categories),
      content: faker.lorem.paragraphs({ min: 2, max: 4 }),
    });
  }

  await prisma.news.createMany({
    data: allNews.slice(0, CONFIG.NEWS_ITEMS).map((n) => ({
      title: n.title,
      category: n.category,
      content: n.content,
      created_at: recentBiasedDate(60),
    })),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  ENHANCE PROTECTED USERS — datos curados para Josue (ID 1) y familia
// ══════════════════════════════════════════════════════════════════════════════

async function enhanceProtectedUsers(
  movies: { id: number; tmdb_id: number }[],
  allBadges: { id: number; name: string }[]
) {
  console.log("⭐ Enriqueciendo usuarios protegidos con datos curados...");

  // — Taste Profile de Josue (ID 1) — cinéfilo de arte con interés en Sci-Fi y Noir —
  await prisma.user_taste_profiles.upsert({
    where: { user_id: 1 },
    create: {
      user_id: 1,
      affinity_vector: JSON.stringify({
        Drama: 2.2,
        Crime: 1.9,
        Thriller: 1.7,
        History: 1.6,
        Mystery: 1.5,
        "Science Fiction": 1.4,
        War: 1.2,
        Romance: 0.9,
        Documentary: 0.8,
        Action: 0.6,
        Horror: 0.8,
        Comedy: 0.5,
        Animation: 0.4,
      }),
      vetoed_entities: JSON.stringify({
        genres: ["12", "35"], // Adventure, Comedy
        directors: ["Michael Bay"],
      }),
      weather_history: JSON.stringify({
        rainy: ["Drama", "Thriller", "Crime", "History"],
        sunny: ["Drama", "Science Fiction", "Mystery"],
        night: ["Thriller", "Horror", "Crime", "Science Fiction"],
      }),
    },
    update: {
      affinity_vector: JSON.stringify({
        Drama: 2.2,
        Crime: 1.9,
        Thriller: 1.7,
        History: 1.6,
        Mystery: 1.5,
        "Science Fiction": 1.4,
        War: 1.2,
        Romance: 0.9,
        Documentary: 0.8,
        Action: 0.6,
        Horror: 0.8,
        Comedy: 0.5,
        Animation: 0.4,
      }),
      vetoed_entities: JSON.stringify({
        genres: ["12", "35"],
        directors: ["Michael Bay"],
      }),
      weather_history: JSON.stringify({
        rainy: ["Drama", "Thriller", "Crime", "History"],
        sunny: ["Drama", "Science Fiction", "Mystery"],
        night: ["Thriller", "Horror", "Crime", "Science Fiction"],
      }),
    },
  });

  // — Vault curada de Josue — films que un admin cinéfilo habría visto —
  const josueTmdbIds = [
    238, 278, 240, 550, 680, 769, 424, 857, 98, 274,  // clásicos
    496243, 441130, 670, 353081,                         // coreanos
    11104, 18491, 11788,                                 // WKW
    27205, 157336, 77338, 1124,                          // Nolan
    2033, 5013, 10529,                                   // Tarkovsky
    62, 694, 185,                                        // Kubrick
    619, 2958, 3933,                                     // Nouvelle Vague
    539, 4151, 1018, 8079,                               // Psych/Horror
    11216, 11897,                                        // Italianos
  ];
  const josueMovies = movies.filter((m) => josueTmdbIds.includes(m.tmdb_id));

  if (josueMovies.length > 0) {
    await prisma.vault.createMany({
      data: josueMovies.map((m) => ({
        user_id: 1,
        movie_id: m.id,
        added_at: recentBiasedDate(365),
      })),
      skipDuplicates: true,
    });

    // Diary de Josue — últimos 30 días muy activos
    const josueDiaryMovies = pickUnique(josueMovies, 25);
    for (let i = 0; i < josueDiaryMovies.length; i += 2) {
      const watchedDate = recentBiasedDate(30);
      const isDouble = i + 1 < josueDiaryMovies.length && Math.random() > 0.5;
      
      const session = await prisma.diary_sessions.create({
        data: {
          user_id: 1,
          date: watchedDate,
          type: isDouble ? "double" : "single",
          mood: faker.helpers.arrayElement(["cinéfilo", "nostálgico", "crítico", "relajado"]),
          note: isDouble ? "Sesión doble de revisión de clásicos." : "Visionado solitario nocturno.",
          created_at: watchedDate,
        },
      });

      await prisma.diary_entries.create({
        data: {
          user_id: 1,
          movie_id: josueDiaryMovies[i].id,
          watched_date: watchedDate,
          session_id: session.id,
        },
      });

      if (isDouble) {
        await prisma.diary_entries.create({
          data: {
            user_id: 1,
            movie_id: josueDiaryMovies[i+1].id,
            watched_date: watchedDate,
            session_id: session.id,
          },
        });
      }
    }

    // Reviews curadas de Josue
    const josueReviewMovies = pickUnique(josueMovies, 10);
    for (const movie of josueReviewMovies) {
      const isCritico = [2033, 18491, 496243, 238, 550].includes(movie.tmdb_id);
      await prisma.reviews.create({
        data: {
          user_id: 1,
          movie_id: movie.id,
          content: faker.helpers.arrayElement(
            isCritico ? REVIEW_TEMPLATES.CRITICO : REVIEW_TEMPLATES.ESTANDAR
          ),
          rating: parseFloat(
            faker.number.float({ min: 3.8, max: 5.0, fractionDigits: 1 }).toFixed(1)
          ),
          mode: isCritico ? "CRITICO" : "ESTANDAR",
          media_type: "movie",
          veredicto: faker.helpers.arrayElement([
            "Obra maestra",
            "Esencial",
            "Imprescindible",
            "Magistral",
          ]),
          es_critica_larga: isCritico,
          likes: faker.number.int({ min: 15, max: 80 }),
          created_at: recentBiasedDate(45),
        },
      });
    }

    // Watchlist de Josue — pendientes
    const josuePendingTmdbIds = [539537, 374720, 22970, 11318, 13738, 9847];
    const josueWatchlist = movies.filter((m) =>
      josuePendingTmdbIds.includes(m.tmdb_id)
    );
    await prisma.watchlist.createMany({
      data: josueWatchlist.map((m) => ({ user_id: 1, movie_id: m.id })),
      skipDuplicates: true,
    });

    // Favorites de Josue
    const josueFavTmdbIds = [2033, 238, 18491, 550];
    const josueFavMovies = movies.filter((m) =>
      josueFavTmdbIds.includes(m.tmdb_id)
    );
    await prisma.favorites.createMany({
      data: josueFavMovies.map((m, i) => ({
        user_id: 1,
        movie_id: m.id,
        rank_position: i + 1,
      })),
      skipDuplicates: true,
    });
  }

  // — Listas curadas de Josue (admin lists = is_official) —
  const josueLists = [
    {
      name: "Mi Canon Personal",
      description:
        "Las películas que definen mi relación con el cine. Actualizadas cada año sin piedad.",
      tags: ["Canon", "Personal", "Esencial"],
      glow_color: "212,175,122",
      is_official: false,
      tmdb_ids: [238, 2033, 18491, 496243, 550, 694, 680, 857],
    },
    {
      name: "Selección Editorial CineVault",
      description:
        "Curación oficial de la plataforma. Films para explorar sin mapa previo.",
      tags: ["Oficial", "Curación", "Descubrimiento"],
      glow_color: "180,140,80",
      is_official: true,
      tmdb_ids: [62, 619, 11104, 2033, 670, 353081, 496243, 539],
    },
    {
      name: "Para empezar en serio",
      description:
        "La lista que le mando a alguien cuando me pregunta cómo entrar al cine de verdad.",
      tags: ["Iniciación", "Guía", "Imprescindible"],
      glow_color: "100,160,200",
      is_official: false,
      tmdb_ids: [278, 238, 680, 550, 496243, 27205, 129],
    },
  ];

  for (const listData of josueLists) {
    const listMovies = movies.filter((m) =>
      listData.tmdb_ids.includes(m.tmdb_id)
    );
    if (listMovies.length < 2) continue;

    const list = await prisma.user_lists.create({
      data: {
        user_id: 1,
        name: listData.name,
        description: listData.description,
        is_public: true,
        is_official: listData.is_official,
        tags: listData.tags,
        glow_color: listData.glow_color,
        created_at: faker.date.past({ years: 1 }),
      },
    });

    await prisma.user_list_items.createMany({
      data: listMovies.map((m) => ({ list_id: list.id, movie_id: m.id })),
      skipDuplicates: true,
    });
  }

  // — Vault Social Entries de Josue —
  const josueVaultMovies = movies.filter((m) =>
    [2033, 18491, 496243, 238, 550].includes(m.tmdb_id)
  );
  for (const movie of josueVaultMovies) {
    await prisma.vault_social_entries.create({
      data: {
        user_id: 1,
        movie_id: movie.id,
        entry_type:
          movie.tmdb_id === 2033 || movie.tmdb_id === 18491
            ? "reflexion"
            : "critica",
        title: faker.helpers.arrayElement([
          "Por qué esta película es el punto de partida",
          "Segunda revisión: todo es diferente",
          "El plano que no me abandona",
          "Lo que el cine puede ser cuando confía en el espectador",
        ]),
        content: faker.helpers.arrayElement(
          VAULT_SOCIAL_TEMPLATES["reflexion"]
        ),
        is_public: true,
        likes_count: faker.number.int({ min: 30, max: 120 }),
        comments_count: faker.number.int({ min: 8, max: 35 }),
        created_at: recentBiasedDate(20),
      },
    });
  }

  // — Interacciones Tonight para Josue (para que el algoritmo funcione) —
  const josueInterMovies = pickUnique(josueMovies, 10);
  for (let i = 0; i < josueInterMovies.length; i++) {
    const isTonight = i >= 6;
    await prisma.explicit_interactions
      .create({
        data: {
          user_id: 1,
          movie_id: josueInterMovies[i].id,
          interaction_type: isTonight
            ? i < 9
              ? "tonight_accept"
              : "tonight_reject"
            : "like_onboarding",
          metadata: JSON.stringify({
            source: isTonight ? "tonight_widget" : "onboarding_tinder",
            step: i + 1,
            local_hour: faker.number.int({ min: 19, max: 23 }),
            tmdb_id: josueInterMovies[i].tmdb_id,
          }),
          created_at: recentBiasedDate(10),
        },
      })
      .catch(() => {});
  }

  // — Todas las insignias para Josue —
  for (const badge of allBadges) {
    await prisma.user_badges
      .create({
        data: {
          user_id: 1,
          badge_id: badge.id,
          unlocked_at: faker.date.past({ years: 1 }),
        },
      })
      .catch(() => {});
  }

  console.log("  ✅ Josue (ID 1) y protegidos enriquecidos correctamente.");
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("\n🎬 CineVault v2 — Seeder Premium\n");
  console.log("═".repeat(50));

  faker.seed(CONFIG.SEED);
  CONFIG.HASHED_PASSWORD = await bcrypt.hash("cinevault123", 10);

  // 1. Limpieza
  await cleanDatabase();

  // 2. Películas
  const movies = await seedMovies();
  console.log(`  → ${movies.length} películas en movies_ref`);

  // 3. Usuarios
  const allUsers = await seedUsers();
  console.log(`  → ${allUsers.length} usuarios totales (protegidos + seed)`);

  // 4. Red social
  await seedFollows(allUsers);

  // 5. Actividad principal
  await seedDiarySessionsAndActivity(allUsers, movies);

  // 6. Reviews
  await seedReviews(allUsers, movies);

  // 7. Taste profiles (basados en personas)
  await seedTasteProfiles(allUsers);

  // 8. Interacciones explícitas
  await seedExplicitInteractions(allUsers, movies);

  // 9. Listas curadas
  await seedCuratedLists(allUsers, movies);

  // 10. Arcos editoriales
  await seedArcos(allUsers, movies);

  // 11. Vault social entries
  await seedVaultSocialEntries(allUsers, movies);

  // 12. Insignias
  const allBadges = await seedBadges(allUsers);

  // 13. Suscripciones y pagos
  await seedSubscriptions(allUsers);

  // 14. Notificaciones
  await seedNotifications(allUsers);

  // 15. Noticias
  await seedNews();

  // 16. Enriquecer usuarios protegidos (override con datos curados)
  await enhanceProtectedUsers(movies, allBadges);

  // ── Resumen final ──
  const [
    usersCount,
    moviesCount,
    reviewsCount,
    diaryCount,
    vaultCount,
    watchlistCount,
    followsCount,
    listsCount,
    arcosCount,
    tasteProfilesCount,
    interactionsCount,
    sessionsCount,
    socialEntriesCount,
    badgesAssigned,
  ] = await Promise.all([
    prisma.users.count(),
    prisma.movies_ref.count(),
    prisma.reviews.count(),
    prisma.diary_entries.count(),
    prisma.vault.count(),
    prisma.watchlist.count(),
    prisma.follows.count(),
    prisma.user_lists.count(),
    prisma.arcos.count(),
    prisma.user_taste_profiles.count(),
    prisma.explicit_interactions.count(),
    prisma.diary_sessions.count(),
    prisma.vault_social_entries.count(),
    prisma.user_badges.count(),
  ]);

  console.log(`
╔══════════════════════════════════════════════╗
║     CineVault v2 — Seed Premium Completo     ║
╠══════════════════════════════════════════════╣
║ 👤 Usuarios totales:          ${String(usersCount).padEnd(14)}║
║ 🎬 Películas (movies_ref):    ${String(moviesCount).padEnd(14)}║
║ 📝 Reviews:                   ${String(reviewsCount).padEnd(14)}║
║ 📓 Entradas de diario:        ${String(diaryCount).padEnd(14)}║
║ 🎞️  Sesiones de diario:        ${String(sessionsCount).padEnd(14)}║
║ 🗄️  Vault:                     ${String(vaultCount).padEnd(14)}║
║ 📋 Watchlist:                 ${String(watchlistCount).padEnd(14)}║
║ 🔗 Follows:                   ${String(followsCount).padEnd(14)}║
║ 📑 Listas curadas:            ${String(listsCount).padEnd(14)}║
║ 🌈 Arcos editoriales:         ${String(arcosCount).padEnd(14)}║
║ 🧠 Taste Profiles:            ${String(tasteProfilesCount).padEnd(14)}║
║ 🎭 Interacciones explícitas:  ${String(interactionsCount).padEnd(14)}║
║ ✍️  Entradas sociales Vault:   ${String(socialEntriesCount).padEnd(14)}║
║ 🏅 Insignias asignadas:       ${String(badgesAssigned).padEnd(14)}║
╚══════════════════════════════════════════════╝

🔑 Admin   → josue@cinevault.dev     / cinevault123 (ID 1)
🔑 Admin   → natalia@cinevault.dev   / cinevault123 (ID 2)
👤 Seed    → user200@cinevault.dev   / cinevault123
  `);
}

main()
  .catch((e) => {
    console.error("❌ Error en el seeder:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());