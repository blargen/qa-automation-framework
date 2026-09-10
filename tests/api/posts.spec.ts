import { expect } from '@playwright/test'
import { test } from '@/fixtures/api'
import { PostListSchema, PostSchema } from '@/schemas/post.schema'

test('a single post matches the published contract', async ({ postsApi }) => {
  const result = await postsApi.getById(1)

  expect(result.status).toBe(200)

  const post = PostSchema.parse(result.body)

  expect(post.id).toBe(1)
  expect(post.userId).toBe(1)
})

test('every post in the collection matches the contract', async ({ postsApi }) => {
  const result = await postsApi.list()

  expect(result.status).toBe(200)

  const posts = PostListSchema.parse(result.body)

  expect(posts).toHaveLength(100)
})

test('filtering by user returns only that users posts', async ({ postsApi }) => {
  const result = await postsApi.listByUser(1)

  expect(result.status).toBe(200)

  const posts = PostListSchema.parse(result.body)
  const owningUserIds = [...new Set(posts.map((post) => post.userId))]

  expect(posts).toHaveLength(10)
  expect(owningUserIds).toEqual([1])
})

test('an unknown post id returns 404 with an empty object', async ({ postsApi }) => {
  const result = await postsApi.getById(999)

  expect(result.status).toBe(404)
  expect(result.body).toEqual({})
})

test('filtering by an unknown user returns an empty list, not a 404', async ({ postsApi }) => {
  const result = await postsApi.listByUser(99)

  expect(result.status).toBe(200)
  expect(PostListSchema.parse(result.body)).toEqual([])
})
