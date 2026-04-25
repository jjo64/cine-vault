// prisma/seed.ts
// CineVault — Database Seeder
// Stack: Prisma ORM + @faker-js/faker + bcrypt

import { users_role, users_membership, subscriptions_plan, subscriptions_status, subscriptions_provider, payments_provider, payments_payment_status, notifications_type, reports_status, news_category } from '@prisma/client'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcrypt'
import { prisma } from "../src/lib/prisma.js"



// ─────────────────────────────────────────────
// CONFIG — ajusta estos valores según el caso
// ─────────────────────────────────────────────
const CONFIG = {
  SEED: 42,              // Reproducibilidad: mismos datos siempre con el mismo seed
  USERS: 150,            // Incrementado para simular comunidad activa
  MOVIES: 60,            // movies_ref (tmdb_ids ficticios)
  REVIEWS_PER_USER: 6,
  COMMENTS_PER_REVIEW: 5,
  VAULT_PER_USER: 15,
  WATCHLIST_PER_USER: 10,
  DIARY_PER_USER: 8,
  FAVORITES_PER_USER: 4,
  FOLLOWS_PER_USER: 10,
  NEWS_ITEMS: 30,
  NOTIFICATIONS_PER_USER: 8,
  ACTIVITY_PER_USER: 15,
  LISTS_PER_USER: 2,       // Nuevas Listas para recomendaciones
  LIST_ITEMS_MAX: 10,      // Ítems por lista

  HASHED_PASSWORD: '', // se rellena al inicio
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Devuelve N elementos únicos aleatorios de un array */
function pickUnique<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

/** TMDB IDs curados para CineVault */
const REAL_TMDB_IDS = [
  // — Selección del equipo CineVault —
  858024, 157336, 244786, 46738, 965150, 553,  249397, 258216,
  24,     16869,  550,    641,   598,    406,  496243, 103663,
  1233413,38,     11324,  680,   807,    68718,1317288,701387,
  1018,   389,    976893, 73,    1064213,493922,37165, 426,
  793,    8072,   34647,  979,   27205,  674,  299534, 634649,
  558,    2649,   105,
  // — Completando con clásicos que encajan en CineVault —
  238,    // El Padrino
  278,    // Cadena Perpetua
  240,    // El Padrino II
  424,    // La Lista de Schindler
  637,    // Belleza Americana
  372058, // Parásitos
  129,    // El viaje de Chihiro
  539,    // Psicosis
  637,    // Belleza Americana (evitar dup abajo)
  11216,  // Cinema Paradiso
  274,    // El Silencio de los Corderos
  745,    // Harvey
  769,    // Goodfellas
  857,    // Chinatown
  429,    // El Club de la Pelea (distinto a 550 Fight Club EN)
  98,     // Apocalypse Now
].filter((id, index, arr) => arr.indexOf(id) === index) // deduplicar

// ─────────────────────────────────────────────
// USUARIOS PROTEGIDOS — nunca se borran
// ─────────────────────────────────────────────
const PROTECTED_USER_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

// ─────────────────────────────────────────────
// LIMPIEZA — solo borra datos de usuarios NO protegidos
// ─────────────────────────────────────────────
async function cleanDatabase() {
  console.log('🗑️  Limpiando datos de seed anteriores (preservando usuarios reales)...')

  // Obtener IDs de usuarios que NO son protegidos (los generados por seeds anteriores)
  const seedUsers = await prisma.users.findMany({
    where: { id: { notIn: PROTECTED_USER_IDS } },
    select: { id: true },
  })
  const seedUserIds = seedUsers.map(u => u.id)

  if (seedUserIds.length === 0) {
    console.log('ℹ️  No hay datos de seed previos que limpiar.')
    return
  }

  // Borrar secuencialmente respetando FK constraints (sin transaction para evitar timeout)
  await prisma.user_activity.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.notifications.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.review_likes.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.review_comments.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.reports.deleteMany({ where: { reporter_id: { in: seedUserIds } } })
  await prisma.reviews.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.diary_entries.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.favorites.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.vault.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.watchlist.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.follows.deleteMany({ where: { follower_id: { in: seedUserIds } } })
  await prisma.payments.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.subscriptions.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.auth_tokens.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.sessions.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.explicit_interactions.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.user_arco_progress.deleteMany()
  await prisma.arco_movies.deleteMany()
  await prisma.arcos.deleteMany()
  await prisma.user_taste_profiles.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.user_list_items.deleteMany({ where: { movie_list: { user_id: { in: seedUserIds } } } })
  await prisma.user_lists.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.users.deleteMany({ where: { id: { in: seedUserIds } } })
  await prisma.user_followed_persons.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.user_badges.deleteMany({ where: { user_id: { in: seedUserIds } } })
  await prisma.badges.deleteMany()
  await prisma.persons_ref.deleteMany()

  console.log(`✅ Eliminados ${seedUserIds.length} usuarios de seed y sus datos asociados.`)
}

// ─────────────────────────────────────────────
// SEEDERS
// ─────────────────────────────────────────────

async function seedMovies() {
  console.log(`🎬 Creando ${REAL_TMDB_IDS.length} películas...`)

  await prisma.movies_ref.createMany({
    data: REAL_TMDB_IDS.map(tmdb_id => ({ 
      tmdb_id,
      media_type: 'movie'
    })),
    skipDuplicates: true,
  })

  // Añadir un par de series para testing
  await prisma.movies_ref.createMany({
    data: [
      { tmdb_id: 1396, media_type: 'tv' }, // Breaking Bad
      { tmdb_id: 1399, media_type: 'tv' }, // Game of Thrones
    ],
    skipDuplicates: true,
  })

  return await prisma.movies_ref.findMany()
}

async function seedUsers() {
  console.log(`👤 Creando ${CONFIG.USERS} usuarios...`)

  const roles: users_role[] = ['user', 'user', 'user', 'user', 'editor', 'admin']
  const memberships: users_membership[] = ['free', 'free', 'free', 'vip', 'pro']

  const usersData = Array.from({ length: CONFIG.USERS }, (_, i) => {
    const isAdmin = i === 0
    return {
      username: isAdmin ? 'cinevault_admin' : faker.internet.username().toLowerCase().slice(0, 48) + i,
      email: isAdmin ? 'admin@cinevault.dev' : faker.internet.email().toLowerCase(),
      password: CONFIG.HASHED_PASSWORD,
      avatar_url: faker.image.avatar(),
      bio: faker.helpers.arrayElement([
        faker.lorem.sentence(),
        `"${faker.lorem.words(6)}" — mi película favorita lo dice todo.`,
        null,
        null,
      ]),
      role: isAdmin ? 'admin' as users_role : faker.helpers.arrayElement(roles),
      membership: isAdmin ? 'pro' as users_membership : faker.helpers.arrayElement(memberships),
      is_verified: faker.datatype.boolean({ probability: 0.75 }),
      two_factor_enabled: faker.datatype.boolean({ probability: 0.15 }),
      failed_attempts: faker.number.int({ min: 0, max: 2 }),
      created_at: faker.date.past({ years: 2 }),
      updated_at: faker.date.recent({ days: 30 }),
    }
  })

  await prisma.users.createMany({ data: usersData, skipDuplicates: true })
  return await prisma.users.findMany()
}

async function seedSubscriptions(users: { id: number, membership: users_membership | null }[]) {
  console.log('💳 Creando suscripciones...')

  const plans: Record<users_membership, subscriptions_plan> = {
    free: 'free',
    vip: 'vip',
    pro: 'pro',
  }

  const data = users.map(u => {
    const plan = plans[u.membership ?? 'free']
    const start = faker.date.past({ years: 1 })
    const end = new Date(start)
    end.setFullYear(end.getFullYear() + 1)

    return {
      user_id: u.id,
      plan,
      start_date: start,
      end_date: end,
      status: 'active' as subscriptions_status,
      provider: 'stripe' as subscriptions_provider,
      provider_subscription_id: plan !== 'free' ? `sub_${faker.string.alphanumeric(14)}` : null,
    }
  })

  await prisma.subscriptions.createMany({ data })
  return await prisma.subscriptions.findMany()
}

async function seedPayments(users: { id: number }[], subscriptions: { id: number, user_id: number, plan: subscriptions_plan | null }[]) {
  console.log('💰 Creando pagos...')

  const paidSubs = subscriptions.filter(s => s.plan !== 'free')
  const priceMap: Record<string, number> = { vip: 4.99, pro: 9.99 }

  const data = paidSubs.map(sub => ({
    user_id: sub.user_id,
    subscription_id: sub.id,
    amount: priceMap[sub.plan ?? 'vip'],
    currency: 'EUR',
    provider: 'stripe' as payments_provider,
    payment_status: 'paid' as payments_payment_status,
    provider_payment_id: `pi_${faker.string.alphanumeric(24)}`,
    created_at: faker.date.past({ years: 1 }),
  }))

  await prisma.payments.createMany({ data })
}

async function seedFollows(users: { id: number }[]) {
  console.log('🔗 Creando follows...')

  const followPairs = new Set<string>()
  const data: { follower_id: number, following_id: number }[] = []

  for (const user of users) {
    const targets = pickUnique(
      users.filter(u => u.id !== user.id),
      CONFIG.FOLLOWS_PER_USER
    )

    for (const target of targets) {
      const key = `${user.id}-${target.id}`
      if (!followPairs.has(key)) {
        followPairs.add(key)
        data.push({ follower_id: user.id, following_id: target.id })
      }
    }
  }

  await prisma.follows.createMany({ data, skipDuplicates: true })
}

async function seedVaultWatchlistDiaryFavorites(
  users: { id: number }[],
  movies: { id: number }[]
) {
  console.log('🎞️  Creando vault, watchlist, diario y favoritos...')

  const vaultData: { user_id: number, movie_id: number }[] = []
  const watchlistData: { user_id: number, movie_id: number }[] = []
  const diaryData: { user_id: number, movie_id: number, watched_date: Date }[] = []
  const favoritesData: { user_id: number, movie_id: number, rank_position: number }[] = []

  for (const user of users) {
    const vaultMovies = pickUnique(movies, CONFIG.VAULT_PER_USER)
    const watchMovies = pickUnique(
      movies.filter(m => !vaultMovies.includes(m)),
      CONFIG.WATCHLIST_PER_USER
    )
    const diaryMovies = pickUnique(movies, CONFIG.DIARY_PER_USER)
    const favMovies = pickUnique(movies, CONFIG.FAVORITES_PER_USER)

    vaultMovies.forEach(m => vaultData.push({ user_id: user.id, movie_id: m.id }))
    watchMovies.forEach(m => watchlistData.push({ user_id: user.id, movie_id: m.id }))
    diaryMovies.forEach(m => diaryData.push({
      user_id: user.id,
      movie_id: m.id,
      watched_date: faker.date.past({ years: 3 }),
    }))
    favMovies.forEach((m, i) => favoritesData.push({
      user_id: user.id,
      movie_id: m.id,
      rank_position: i + 1,
    }))
  }

  await prisma.vault.createMany({ data: vaultData, skipDuplicates: true })
  await prisma.watchlist.createMany({ data: watchlistData, skipDuplicates: true })
  await prisma.diary_entries.createMany({ data: diaryData })
  await prisma.favorites.createMany({ data: favoritesData })
}

async function seedReviewsAndComments(users: { id: number }[], movies: { id: number }[]) {
  console.log('📝 Creando reviews, comentarios y likes...')

  const reviewLikesSet = new Set<string>()
  const reviewLikes: { user_id: number, review_id: number }[] = []
  const reviewComments: { review_id: number, user_id: number, content: string }[] = []

  for (const user of users) {
    const reviewMovies = pickUnique(movies, CONFIG.REVIEWS_PER_USER)

    for (const movie of reviewMovies) {
      const review = await prisma.reviews.create({
        data: {
          user_id: user.id,
          movie_id: movie.id,
          content: faker.helpers.arrayElement([
            faker.lorem.paragraph(),
            faker.lorem.paragraphs(2),
            null,
          ]),
          rating: parseFloat((faker.number.float({ min: 0.5, max: 5, fractionDigits: 1 })).toFixed(1)),
          likes: 0,
          created_at: faker.date.past({ years: 1 }),
        }
      })

      // Likes a la review
      const likers = pickUnique(
        users.filter(u => u.id !== user.id),
        faker.number.int({ min: 0, max: 12 })
      )
      for (const liker of likers) {
        const key = `${liker.id}-${review.id}`
        if (!reviewLikesSet.has(key)) {
          reviewLikesSet.add(key)
          reviewLikes.push({ user_id: liker.id, review_id: review.id })
        }
      }

      // Comentarios a la review
      const commenters = pickUnique(users, CONFIG.COMMENTS_PER_REVIEW)
      for (const commenter of commenters) {
        reviewComments.push({
          review_id: review.id,
          user_id: commenter.id,
          content: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
        })
      }
    }
  }

  if (reviewLikes.length > 0) {
    await prisma.review_likes.createMany({ data: reviewLikes, skipDuplicates: true })
  }
  if (reviewComments.length > 0) {
    await prisma.review_comments.createMany({ data: reviewComments })
  }

  // Actualizar contador de likes en reviews
  const likeCounts = await prisma.review_likes.groupBy({
    by: ['review_id'],
    _count: { review_id: true },
  })
  for (const { review_id, _count } of likeCounts) {
    await prisma.reviews.update({
      where: { id: review_id },
      data: { likes: _count.review_id },
    })
  }
}

async function seedReports(users: { id: number }[]) {
  console.log('🚨 Creando reports...')

  const reviews = await prisma.reviews.findMany({ take: 20 })
  if (reviews.length === 0) return

  const statuses: reports_status[] = ['pending', 'pending', 'resolved', 'rejected']

  const data = reviews.slice(0, 10).map(review => ({
    reporter_id: faker.helpers.arrayElement(users.filter(u => u.id !== review.user_id)).id,
    review_id: review.id,
    reason: faker.helpers.arrayElement([
      'contenido_inapropiado',
      'spoiler',
      'spam',
      'lenguaje_ofensivo',
      'acoso',
      'otro'
    ]),
    status: faker.helpers.arrayElement(statuses),
    created_at: faker.date.recent({ days: 30 }),
  }))

  await prisma.reports.createMany({ data })
}

async function seedNotifications(users: { id: number }[]) {
  console.log('🔔 Creando notificaciones...')

  const types: notifications_type[] = ['follow', 'like', 'comment']
  const data: {
    user_id: number,
    sender_id: number | null,
    type: notifications_type,
    read: boolean,
    created_at: Date
  }[] = []

  for (const user of users) {
    const senders = pickUnique(users.filter(u => u.id !== user.id), CONFIG.NOTIFICATIONS_PER_USER)
    for (const sender of senders) {
      data.push({
        user_id: user.id,
        sender_id: sender.id,
        type: faker.helpers.arrayElement(types),
        read: faker.datatype.boolean({ probability: 0.4 }),
        created_at: faker.date.recent({ days: 60 }),
      })
    }
  }

  await prisma.notifications.createMany({ data })
}

async function seedUserActivity(users: { id: number }[]) {
  console.log('📊 Creando actividad de usuario...')

  const actions = [
    'login', 'view_movie', 'add_to_vault', 'add_to_watchlist',
    'write_review', 'like_review', 'follow_user', 'update_profile',
  ]

  const data = users.flatMap(user =>
    Array.from({ length: CONFIG.ACTIVITY_PER_USER }, () => ({
      user_id: user.id,
      action: faker.helpers.arrayElement(actions),
      created_at: faker.date.recent({ days: 90 }),
    }))
  )

  await prisma.user_activity.createMany({ data })
}
async function seedNews() {
  console.log('📰 Creando noticias...')
  const categories: news_category[] = ['estrenos', 'premios', 'actores', 'directores', 'streaming']
  const data = Array.from({ length: CONFIG.NEWS_ITEMS }, () => ({
    title: faker.lorem.sentence().slice(0, 254),
    content: faker.lorem.paragraphs(3),
    category: faker.helpers.arrayElement(categories),
    created_at: faker.date.past({ years: 1 }),
  }))
  await prisma.news.createMany({ data })
}

async function seedBadges() {
  console.log('🏅 Creando insignias de ejemplo...')
  const badges = [
    {
      name: 'Cinéfilo Novato',
      description: 'Has registrado tus primeras 5 películas',
      icon_url: 'https://cdn-icons-png.flaticon.com/512/3163/3163478.png',
      criteria: 'DIARY_COUNT:5'
    },
    {
      name: 'Crítico de Hierro',
      description: 'Has escrito 10 reseñas en modo crítico',
      icon_url: 'https://cdn-icons-png.flaticon.com/512/10629/10629607.png',
      criteria: 'CRITICAL_REVIEWS:10'
    },
    {
      name: 'Explorador de Series',
      description: 'Has completado 3 series de TV',
      icon_url: 'https://cdn-icons-png.flaticon.com/512/2324/2324137.png',
      criteria: 'TV_COUNT:3'
    }
  ]

  await prisma.badges.createMany({ data: badges })
}

// ─────────────────────────────────────────────
// NUEVOS SEEDERS DE CINEVAULT FOR YOU (Fase 4)
// ─────────────────────────────────────────────

async function seedTasteProfilesAndLists(users: { id: number }[], movies: { id: number }[]) {
  console.log('🧠 Creando perfiles de gustos (Tastes), interacciones y listas...')

  const tasteData: {
    user_id: number;
    affinity_vector: string;
    vetoed_entities: string;
    weather_history: string;
  }[] = []

  const interactionData: {
    user_id: number;
    movie_id: number | null;
    interaction_type: string;
    metadata: string;
  }[] = []

  const listThemes = ['Clásicos de Domingo', 'Para llorar', 'Sci-Fi Mindbending', 'Mejores finales', 'Cortas y buenas', 'Maratón de Noche']

  for (const user of users) {
    // 1. Taste Profiles
    const isSciFiFan = faker.datatype.boolean()
    tasteData.push({
      user_id: user.id,
      affinity_vector: JSON.stringify({
        "Sci-Fi": isSciFiFan ? 1.5 : 0.2,
        "Drama": faker.number.float({ min: 0.5, max: 1.5, fractionDigits: 1 }),
        "Christopher Nolan": isSciFiFan ? 2.0 : 0.5,
      }),
      vetoed_entities: JSON.stringify({
        "directors": faker.datatype.boolean() ? ["Zack Snyder"] : [],
        "genres": faker.datatype.boolean() ? ["Horror"] : [],
      }),
      weather_history: JSON.stringify({
        "rainy": ["Thriller", "Drama"],
        "sunny": ["Comedy", "Action"]
      })
    })

    // 2. Explicit Interactions (Onboarding Tinder simulation)
    interactionData.push({
      user_id: user.id,
      movie_id: faker.helpers.arrayElement(movies).id,
      interaction_type: faker.helpers.arrayElement(["like_onboarding", "skip_onboarding", "tonight_accept"]),
      metadata: JSON.stringify({ "source": "tinder_mode" })
    })

    // 3. User Lists
    const numLists = faker.number.int({ min: 0, max: CONFIG.LISTS_PER_USER })
    for (let i = 0; i < numLists; i++) {
        const _list = await prisma.user_lists.create({
            data: {
                user_id: user.id,
                name: faker.helpers.arrayElement(listThemes) + ' ' + faker.number.int(100),
                description: faker.lorem.sentence(),
                is_public: true,
                created_at: faker.date.past({ years: 1 })
            }
        })

        // Poblar la lista
        const listMovies = pickUnique(movies, faker.number.int({ min: 1, max: CONFIG.LIST_ITEMS_MAX }))
        const listItemsData = listMovies.map(m => ({
            list_id: _list.id,
            movie_id: m.id,
            added_at: faker.date.recent({ days: 30 })
        }))
        await prisma.user_list_items.createMany({ data: listItemsData })
    }
  }

  await prisma.user_taste_profiles.createMany({ data: tasteData, skipDuplicates: true })
  await prisma.explicit_interactions.createMany({ data: interactionData })
}

async function seedArcos(users: { id: number }[], movies: { id: number }[]) {
  console.log('🌈 Creando Arcos Editoriales...')

  const adminUser = users[0] // Admin

  const arcosData = [
    {
      slug: 'iniciacion-kubrick',
      title: 'Iniciación a Stanley Kubrick',
      description: 'Un recorrido fundamental por la filmografía obsesiva de uno de los mejores directores de la historia.',
      poster_url: 'https://image.tmdb.org/t/p/w500/zVDZhHrgT0CiwEeyV9mHwe4bXfW.jpg',
      level: 'PRINCIPIANTE',
      moderation_status: 'approved' as const,
      is_official: true,
      created_by_user_id: adminUser.id,
    },
    {
      slug: 'korean-new-wave',
      title: 'Nueva Ola Coreana',
      description: 'El renacimiento del cine surcoreano, desde Park Chan-wook hasta Bong Joon-ho.',
      poster_url: 'https://image.tmdb.org/t/p/w500/7yNq16MEnk4bW0sD26c2gGgl71k.jpg',
      level: 'INTERMEDIO',
      moderation_status: 'approved' as const,
      is_official: true,
      created_by_user_id: adminUser.id,
    },
    {
      slug: 'french-extreme',
      title: 'Nuevo Extremismo Francés',
      description: 'Cine visceral y transgresor del siglo XXI en Francia.',
      poster_url: 'https://image.tmdb.org/t/p/w500/vXbU4zW25Yit9Fm1VnB5sS7IfH5.jpg',
      level: 'AVANZADO',
      moderation_status: 'approved' as const,
      is_official: true,
      created_by_user_id: adminUser.id,
    }
  ]

  for (const arcoData of arcosData) {
    const arco = await prisma.arcos.create({ data: arcoData })
    
    // Add movies to the arco
    const arcoMovies = pickUnique(movies, 5).map((m, i) => ({
      arco_id: arco.id,
      movie_id: m.id,
      order_index: i,
      note: 'Película fundamental del arco.',
      is_optional: false
    }))
    
    await prisma.arco_movies.createMany({ data: arcoMovies })

    // Some users progressing through the arco
    const progressingUsers = pickUnique(users, 15)
    for (const u of progressingUsers) {
      const completedCount = Math.floor(Math.random() * 5) + 1
      for (let i = 0; i < completedCount; i++) {
        await prisma.user_arco_progress.create({
          data: {
            user_id: u.id,
            arco_id: arco.id,
            movie_id: arcoMovies[i].movie_id,
          }
        })
      }
    }
  }
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  console.log('\n🎬 CineVault Seeder iniciando...\n')

  faker.seed(CONFIG.SEED)

  CONFIG.HASHED_PASSWORD = await bcrypt.hash('cinevault123', 10)

  await cleanDatabase()

  const movies = await seedMovies()
  const users = await seedUsers()
  await seedSubscriptions(users)
  await seedPayments(users, await prisma.subscriptions.findMany())
  await seedFollows(users)
  await seedVaultWatchlistDiaryFavorites(users, movies)
  await seedReviewsAndComments(users, movies)
  await seedReports(users)
  await seedNotifications(users)
  await seedUserActivity(users)
  await seedNews()
  await seedBadges()
  await seedArcos(users, movies)
  await seedTasteProfilesAndLists(users, movies)

  const counts = await Promise.all([
    prisma.users.count(),
    prisma.movies_ref.count(),
    prisma.reviews.count(),
    prisma.review_likes.count(),
    prisma.review_comments.count(),
    prisma.vault.count(),
    prisma.watchlist.count(),
    prisma.diary_entries.count(),
    prisma.follows.count(),
    prisma.subscriptions.count(),
    prisma.payments.count(),
    prisma.notifications.count(),
    prisma.news.count(),
  ])

  console.log(`
╔══════════════════════════════════╗
║     CineVault — Seed completo    ║
╠══════════════════════════════════╣
║ 👤 Usuarios:        ${String(counts[0]).padEnd(13)}║
║ 🎬 Películas:       ${String(counts[1]).padEnd(13)}║
║ 📝 Reviews:         ${String(counts[2]).padEnd(13)}║
║ ❤️  Likes reviews:  ${String(counts[3]).padEnd(13)}║
║ 💬 Comentarios:     ${String(counts[4]).padEnd(13)}║
║ 🗄️  Vault:          ${String(counts[5]).padEnd(13)}║
║ 📋 Watchlist:       ${String(counts[6]).padEnd(13)}║
║ 📓 Diario:          ${String(counts[7]).padEnd(13)}║
║ 🔗 Follows:         ${String(counts[8]).padEnd(13)}║
║ 💳 Suscripciones:   ${String(counts[9]).padEnd(13)}║
║ 💰 Pagos:           ${String(counts[10]).padEnd(13)}║
║ 🔔 Notificaciones:  ${String(counts[11]).padEnd(13)}║
║ 📰 Noticias:        ${String(counts[12]).padEnd(13)}║
║ 🧠 Taste Profiles:  ${String(await prisma.user_taste_profiles.count()).padEnd(13)}║
║ 📑 Listas (Lists):  ${String(await prisma.user_lists.count()).padEnd(13)}║
║ 🌈 Arcos:           ${String(await prisma.arcos.count()).padEnd(13)}║
╚══════════════════════════════════╝

🔑 Admin: admin@cinevault.dev / cinevault123
  `)
}

main()
  .catch(e => {
    console.error('❌ Error en el seeder:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())