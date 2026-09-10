import { expect, test } from '@playwright/test'
import { PostListSchema, PostSchema } from '@/schemas/post.schema'

test('a single post matches the published contract', async ({ request }) => {
  const response = await request.get('/posts/1')

  expect(response.status()).toBe(200)

  const post = PostSchema.parse(await response.json())

  expect(post.id).toBe(1)
  expect(post.userId).toBe(1)
})

test('every post in the collection matches the contract', async ({ request }) => {
  const response = await request.get('/posts')

  expect(response.status()).toBe(200)

  const posts = PostListSchema.parse(await response.json())

  expect(posts).toHaveLength(100)
})
