import { expect } from '@playwright/test'
import { test } from '@/fixtures/api'
import { CommentListSchema, CommentSchema } from '@/schemas/comment.schema'

test('a single comment matches the published contract', async ({ commentsApi }) => {
  const result = await commentsApi.getById(1)

  expect(result.status).toBe(200)

  const comment = CommentSchema.parse(result.body)

  expect(comment.id).toBe(1)
  expect(comment.postId).toBe(1)
})

test('comments nested under a post all belong to that post', async ({ postsApi }) => {
  const result = await postsApi.commentsFor(1)

  expect(result.status).toBe(200)

  const comments = CommentListSchema.parse(result.body)
  const owningPostIds = [...new Set(comments.map((comment) => comment.postId))]

  expect(comments.length).toBeGreaterThan(0)
  expect(owningPostIds).toEqual([1])
})

test('the nested and filtered comment routes return the same data', async ({
  postsApi,
  commentsApi,
}) => {
  const [nested, filtered] = await Promise.all([
    postsApi.commentsFor(1),
    commentsApi.listByPost(1),
  ])

  expect(nested.status).toBe(200)
  expect(filtered.status).toBe(200)

  expect(CommentListSchema.parse(nested.body)).toEqual(CommentListSchema.parse(filtered.body))
})
