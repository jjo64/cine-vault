import { expect, test } from '@playwright/test'

type EndpointCheck = {
  name: string
  path: string
  acceptedStatuses: number[]
}

const endpointChecks: EndpointCheck[] = [
  {
    name: 'Movies popular',
    path: '/api/movies/popular',
    acceptedStatuses: [200],
  },
  {
    name: 'Movies top rated',
    path: '/api/movies/top-rated',
    acceptedStatuses: [200],
  },
  {
    name: 'Search',
    path: '/api/search?q=matrix',
    acceptedStatuses: [200],
  },
  {
    name: 'Public profile by username (missing user)',
    path: '/api/users/username/__missing_user__',
    acceptedStatuses: [200, 404],
  },
  {
    name: 'Auth verify without token',
    path: '/api/auth/verify',
    acceptedStatuses: [401, 403],
  },
  {
    name: 'Watchlist without token',
    path: '/api/watchlist',
    acceptedStatuses: [401, 403],
  },
  {
    name: 'Vault without token',
    path: '/api/vault',
    acceptedStatuses: [401, 403],
  },
  {
    name: 'Public vault by user id (missing user)',
    path: '/api/vault/user/99999999',
    acceptedStatuses: [200, 404],
  },
  {
    name: 'Director autopsy by TMDB id',
    path: '/api/directors/5655/autopsy',
    acceptedStatuses: [200, 404],
  },
  {
    name: 'Mentiras ranking',
    path: '/api/mentiras/ranking',
    acceptedStatuses: [200],
  },
  {
    name: 'Arcos list',
    path: '/api/arcos',
    acceptedStatuses: [200],
  },
  {
    name: 'Arco detail by id',
    path: '/api/arcos/1',
    acceptedStatuses: [200, 404],
  },
  {
    name: 'Diary without token',
    path: '/api/diary',
    acceptedStatuses: [401, 403],
  },
  {
    name: 'Reviews without token',
    path: '/api/reviews',
    acceptedStatuses: [401, 403],
  },
]

test.describe('API endpoint smoke checks', () => {
  for (const check of endpointChecks) {
    test(`${check.name} responds with expected status`, async ({ request, baseURL }) => {
      const response = await request.get(check.path)
      const bodyText = await response.text()

      expect(
        check.acceptedStatuses.includes(response.status()),
        `${baseURL}${check.path} returned ${response.status()} with body: ${bodyText.slice(0, 280)}`
      ).toBeTruthy()
    })
  }
})
