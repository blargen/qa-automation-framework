import { expect } from '@playwright/test'
import { test } from '@/fixtures/web'
import { ACCOUNTS_THAT_AUTHENTICATE, PASSWORD, USERS } from '@/data/users'

const ERRORS = {
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
  mismatch: 'Epic sadface: Username and password do not match any user in this service',
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
} as const

const PROTECTED_PATHS = ['/inventory.html', '/cart.html', '/checkout-step-one.html']

const guardMessage = (path: string): string =>
  `Epic sadface: You can only access '${path}' when you are logged in.`

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto()
})

test.describe('successful authentication', () => {
  test('standard_user reaches the inventory page', async ({ loginPage, inventoryPage, page }) => {
    await loginPage.login(USERS.standard, PASSWORD)
    await inventoryPage.waitUntilLoaded()

    await expect(page).toHaveURL(/\/inventory\.html$/)
    await expect(inventoryPage.title).toHaveText('Products')
  })

  for (const account of ACCOUNTS_THAT_AUTHENTICATE) {
    test(`${account} authenticates despite its known defects`, async ({
      loginPage,
      inventoryPage,
      page,
    }) => {
      await loginPage.login(account, PASSWORD)
      await inventoryPage.waitUntilLoaded()

      await expect(page).toHaveURL(/\/inventory\.html$/)
    })
  }
})

test.describe('credential failures', () => {
  const CASES = [
    { name: 'both fields empty', username: '', password: '', error: ERRORS.usernameRequired },
    { name: 'a missing username', username: '', password: PASSWORD, error: ERRORS.usernameRequired },
    {
      name: 'a missing password',
      username: USERS.standard,
      password: '',
      error: ERRORS.passwordRequired,
    },
    {
      name: 'a wrong password',
      username: USERS.standard,
      password: 'not_the_password',
      error: ERRORS.mismatch,
    },
    {
      name: 'an unknown username',
      username: 'no_such_user',
      password: PASSWORD,
      error: ERRORS.mismatch,
    },
    {
      name: 'a locked out account',
      username: USERS.lockedOut,
      password: PASSWORD,
      error: ERRORS.lockedOut,
    },
  ]

  for (const testCase of CASES) {
    test(`${testCase.name} is rejected`, async ({ loginPage }) => {
      await loginPage.login(testCase.username, testCase.password)

      await expect(loginPage.errorMessage).toHaveText(testCase.error)
      await expect(loginPage.loginButton).toBeVisible()
    })
  }

  test('the username is validated before the password', async ({ loginPage }) => {
    await loginPage.login('', '')

    await expect(loginPage.errorMessage).toHaveText(ERRORS.usernameRequired)
  })
})

test.describe('route guard', () => {
  for (const path of PROTECTED_PATHS) {
    test(`${path} is not reachable without a session`, async ({ loginPage, inventoryPage }) => {
      await inventoryPage.goto(path)

      await expect(loginPage.errorMessage).toHaveText(guardMessage(path))
      await expect(loginPage.loginButton).toBeVisible()
    })
  }
})

test.describe('session lifecycle', () => {
  test('logging out returns to the login page', async ({ loginPage, inventoryPage }) => {
    await loginPage.login(USERS.standard, PASSWORD)
    await inventoryPage.waitUntilLoaded()
    await inventoryPage.logout()

    await expect(loginPage.loginButton).toBeVisible()
  })

  test('the route guard re-engages after logging out', async ({ loginPage, inventoryPage }) => {
    await loginPage.login(USERS.standard, PASSWORD)
    await inventoryPage.waitUntilLoaded()
    await inventoryPage.logout()
    await loginPage.loginButton.waitFor()

    await inventoryPage.goto('/inventory.html')

    await expect(loginPage.errorMessage).toHaveText(guardMessage('/inventory.html'))
  })
})
