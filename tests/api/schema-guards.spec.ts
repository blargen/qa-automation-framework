import { expect, test } from '@playwright/test'
import { PostSchema } from '@/schemas/post.schema'
import { UserSchema } from '@/schemas/user.schema'

const VALID_POST = { userId: 1, id: 1, title: 'a title', body: 'a body' }

test('the post contract accepts a well formed post', () => {
  expect(PostSchema.safeParse(VALID_POST).success).toBe(true)
})

test('the post contract rejects an unexpected field', () => {
  expect(PostSchema.safeParse({ ...VALID_POST, slug: 'unexpected' }).success).toBe(false)
})

test('the post contract rejects an id sent as a string', () => {
  expect(PostSchema.safeParse({ ...VALID_POST, id: '1' }).success).toBe(false)
})

test('the post contract rejects a missing field', () => {
  expect(PostSchema.safeParse({ userId: 1, id: 1, title: 'a title' }).success).toBe(false)
})

test('the user contract rejects a coordinate that is not numeric', async ({ request }) => {
  const response = await request.get('/users/1')
  const user = UserSchema.parse(await response.json())

  const corrupted = {
    ...user,
    address: { ...user.address, geo: { ...user.address.geo, lat: 'north' } },
  }

  expect(UserSchema.safeParse(corrupted).success).toBe(false)
})
