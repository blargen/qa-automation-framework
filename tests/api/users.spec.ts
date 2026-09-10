import { expect } from '@playwright/test'
import { test } from '@/fixtures/api'
import { PostListSchema } from '@/schemas/post.schema'
import { UserListSchema, UserSchema } from '@/schemas/user.schema'

const EXPECTED_USER_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

test('a single user matches the full nested contract', async ({ usersApi }) => {
  const result = await usersApi.getById(1)

  expect(result.status).toBe(200)

  const user = UserSchema.parse(result.body)

  expect(user.id).toBe(1)
  expect(user.name).toBe('Leanne Graham')
  expect(user.username).toBe('Bret')
  expect(user.email).toBe('Sincere@april.biz')
  expect(user.company.name).toBe('Romaguera-Crona')
})

test('the collection returns exactly the expected users', async ({ usersApi }) => {
  const result = await usersApi.list()

  expect(result.status).toBe(200)

  const users = UserListSchema.parse(result.body)

  expect(users.map((user) => user.id)).toEqual(EXPECTED_USER_IDS)
})

test('the single user endpoint agrees with the collection', async ({ usersApi }) => {
  const [singleResult, listResult] = await Promise.all([usersApi.getById(1), usersApi.list()])

  expect(singleResult.status).toBe(200)
  expect(listResult.status).toBe(200)

  const single = UserSchema.parse(singleResult.body)
  const fromCollection = UserListSchema.parse(listResult.body).find(
    (user) => user.id === single.id,
  )

  expect(fromCollection).toEqual(single)
})

test('posts nested under a user all belong to that user', async ({ usersApi }) => {
  const result = await usersApi.postsFor(1)

  expect(result.status).toBe(200)

  const posts = PostListSchema.parse(result.body)
  const owningUserIds = [...new Set(posts.map((post) => post.userId))]

  expect(posts).toHaveLength(10)
  expect(owningUserIds).toEqual([1])
})

test('an unknown user id returns 404', async ({ usersApi }) => {
  const result = await usersApi.getById(999)

  expect(result.status).toBe(404)
  expect(result.body).toEqual({})
})
