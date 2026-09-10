import { expect } from '@playwright/test'
import { test } from '@/fixtures/api'
import { PostSchema } from '@/schemas/post.schema'
import type { NewPost } from '@/schemas/post.schema'

const NEW_POST: NewPost = {
  userId: 1,
  title: 'a title for the create contract',
  body: 'a body for the create contract',
}

const REPLACEMENT: NewPost = {
  userId: 1,
  title: 'a replacement title',
  body: 'a replacement body',
}

const FAKE_CREATED_ID = 101

test.describe('write response contracts', () => {
  test('creating a post returns 201 and echoes the submission', async ({ postsApi }) => {
    const result = await postsApi.create(NEW_POST)

    expect(result.status).toBe(201)

    const created = PostSchema.parse(result.body)

    expect(created.userId).toBe(NEW_POST.userId)
    expect(created.title).toBe(NEW_POST.title)
    expect(created.body).toBe(NEW_POST.body)
    expect(created.id).toBe(FAKE_CREATED_ID)
  })

  test('the assigned id is computed from collection size, not allocated', async ({ postsApi }) => {
    const [first, second] = await Promise.all([
      postsApi.create(NEW_POST),
      postsApi.create(NEW_POST),
    ])

    expect(PostSchema.parse(first.body).id).toBe(FAKE_CREATED_ID)
    expect(PostSchema.parse(second.body).id).toBe(FAKE_CREATED_ID)
  })

  test('replacing a post returns 200 with the full replacement', async ({ postsApi }) => {
    const result = await postsApi.replace(1, REPLACEMENT)

    expect(result.status).toBe(200)

    const replaced = PostSchema.parse(result.body)

    expect(replaced.id).toBe(1)
    expect(replaced.userId).toBe(REPLACEMENT.userId)
    expect(replaced.title).toBe(REPLACEMENT.title)
    expect(replaced.body).toBe(REPLACEMENT.body)
  })

  test('patching merges the change against the stored record', async ({ postsApi }) => {
    const stored = PostSchema.parse((await postsApi.getById(1)).body)

    const result = await postsApi.update(1, { title: 'a patched title' })

    expect(result.status).toBe(200)

    const patched = PostSchema.parse(result.body)

    expect(patched.title).toBe('a patched title')
    expect(patched.body).toBe(stored.body)
    expect(patched.userId).toBe(stored.userId)
  })

  test('deleting a post returns 200 with an empty object', async ({ postsApi }) => {
    const result = await postsApi.delete(1)

    expect(result.status).toBe(200)
    expect(result.body).toEqual({})
  })
})

test.describe('writes report success but never persist', () => {
  test('a created post is not retrievable afterwards', async ({ postsApi }) => {
    const created = await postsApi.create(NEW_POST)

    expect(created.status).toBe(201)

    const fetched = await postsApi.getById(FAKE_CREATED_ID)

    expect(fetched.status).toBe(404)
    expect(fetched.body).toEqual({})
  })

  test('a replaced post keeps its original stored values', async ({ postsApi }) => {
    const before = PostSchema.parse((await postsApi.getById(1)).body)

    const replaced = await postsApi.replace(1, REPLACEMENT)

    expect(replaced.status).toBe(200)

    const after = PostSchema.parse((await postsApi.getById(1)).body)

    expect(after).toEqual(before)
  })

  test('a deleted post is still retrievable afterwards', async ({ postsApi }) => {
    const deleted = await postsApi.delete(1)

    expect(deleted.status).toBe(200)

    const fetched = await postsApi.getById(1)

    expect(fetched.status).toBe(200)
    expect(PostSchema.parse(fetched.body).id).toBe(1)
  })
})
