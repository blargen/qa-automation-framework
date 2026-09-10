import { expect, test } from '@playwright/test'

test('posts endpoint is reachable and returns JSON', async ({ request }) => {
  const response = await request.get('/posts/1')

  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('application/json')
})
