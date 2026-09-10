import { expect, test } from '@playwright/test'
import { CommentListSchema, CommentSchema } from '@/schemas/comment.schema'

test('a single comment matches the published contract', async ({ request }) => {
  const response = await request.get('/comments/1')

  expect(response.status()).toBe(200)

  const comment = CommentSchema.parse(await response.json())

  expect(comment.id).toBe(1)
  expect(comment.postId).toBe(1)
})

test('comments nested under a post all belong to that post', async ({ request }) => {
  const response = await request.get('/posts/1/comments')

  expect(response.status()).toBe(200)

  const comments = CommentListSchema.parse(await response.json())
  const owningPostIds = [...new Set(comments.map((comment) => comment.postId))]

  expect(comments.length).toBeGreaterThan(0)
  expect(owningPostIds).toEqual([1])
})
