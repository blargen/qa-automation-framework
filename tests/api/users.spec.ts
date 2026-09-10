import { expect, test } from '@playwright/test'
import { UserListSchema, UserSchema } from '@/schemas/user.schema'

const EXPECTED_USER_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

test('a single user matches the full nested contract', async ({ request }) => {
  const response = await request.get('/users/1')

  expect(response.status()).toBe(200)

  const user = UserSchema.parse(await response.json())

  expect(user.id).toBe(1)
  expect(user.name).toBe('Leanne Graham')
  expect(user.username).toBe('Bret')
  expect(user.email).toBe('Sincere@april.biz')
  expect(user.company.name).toBe('Romaguera-Crona')
})

test('the collection returns exactly the expected users', async ({ request }) => {
  const response = await request.get('/users')

  expect(response.status()).toBe(200)

  const users = UserListSchema.parse(await response.json())

  expect(users.map((user) => user.id)).toEqual(EXPECTED_USER_IDS)
})

test('the single user endpoint agrees with the collection', async ({ request }) => {
  const [singleResponse, listResponse] = await Promise.all([
    request.get('/users/1'),
    request.get('/users'),
  ])

  expect(singleResponse.status()).toBe(200)
  expect(listResponse.status()).toBe(200)

  const single = UserSchema.parse(await singleResponse.json())
  const fromCollection = UserListSchema.parse(await listResponse.json()).find(
    (user) => user.id === single.id,
  )

  expect(fromCollection).toEqual(single)
})
