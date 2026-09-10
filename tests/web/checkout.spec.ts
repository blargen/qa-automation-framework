import { expect } from '@playwright/test'
import { test } from '@/fixtures/web'
import { PRODUCTS, TAX_RATE } from '@/data/products'
import { USERS } from '@/data/users'
import { SHOPPER } from '@/data/shopper'
import { storageStatePath } from '@/data/storage-state'

test.use({ storageState: storageStatePath(USERS.standard) })

const BASKET = [PRODUCTS.fleeceJacket, PRODUCTS.onesie]

const roundToCents = (amount: number): number => Math.round(amount * 100) / 100

test.beforeEach(async ({ inventoryPage }) => {
  await inventoryPage.goto()
  await inventoryPage.waitUntilLoaded()
})

test.describe('completing an order', () => {
  test('a shopper can complete an order end to end', async ({
    inventoryPage,
    cartPage,
    checkoutInformationPage,
    checkoutOverviewPage,
    checkoutCompletePage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.backpack)
    await inventoryPage.openCart()
    await cartPage.waitUntilLoaded()
    await cartPage.checkout()

    await checkoutInformationPage.waitUntilLoaded()
    await checkoutInformationPage.submitInformation(
      SHOPPER.firstName,
      SHOPPER.lastName,
      SHOPPER.postalCode,
    )

    await checkoutOverviewPage.waitUntilLoaded()
    expect(await checkoutOverviewPage.itemNames()).toEqual([PRODUCTS.backpack])

    await checkoutOverviewPage.finish()
    await checkoutCompletePage.waitUntilLoaded()

    await expect(checkoutCompletePage.header).toHaveText('Thank you for your order!')
    await expect(checkoutCompletePage.cartBadge).toHaveCount(0)
  })

  test('the overview lists every product in the basket', async ({
    inventoryPage,
    checkoutInformationPage,
    checkoutOverviewPage,
  }) => {
    for (const product of BASKET) {
      await inventoryPage.addToCart(product)
    }

    await checkoutInformationPage.goto()
    await checkoutInformationPage.waitUntilLoaded()
    await checkoutInformationPage.submitInformation(
      SHOPPER.firstName,
      SHOPPER.lastName,
      SHOPPER.postalCode,
    )
    await checkoutOverviewPage.waitUntilLoaded()

    expect((await checkoutOverviewPage.itemNames()).sort()).toEqual([...BASKET].sort())
  })
})

test.describe('order totals', () => {
  test.beforeEach(async ({ inventoryPage, checkoutInformationPage, checkoutOverviewPage }) => {
    for (const product of BASKET) {
      await inventoryPage.addToCart(product)
    }

    await checkoutInformationPage.goto()
    await checkoutInformationPage.waitUntilLoaded()
    await checkoutInformationPage.submitInformation(
      SHOPPER.firstName,
      SHOPPER.lastName,
      SHOPPER.postalCode,
    )
    await checkoutOverviewPage.waitUntilLoaded()
  })

  test('the subtotal is the sum of the item prices', async ({ checkoutOverviewPage }) => {
    const prices = await checkoutOverviewPage.itemPrices()
    const subtotal = await checkoutOverviewPage.subtotal()

    expect(subtotal).toBeCloseTo(
      prices.reduce((sum, price) => sum + price, 0),
      2,
    )
  })

  test('the tax is eight percent of the subtotal', async ({ checkoutOverviewPage }) => {
    const subtotal = await checkoutOverviewPage.subtotal()
    const tax = await checkoutOverviewPage.tax()

    expect(tax).toBeCloseTo(roundToCents(subtotal * TAX_RATE), 2)
  })

  test('the total is the subtotal plus the tax', async ({ checkoutOverviewPage }) => {
    const subtotal = await checkoutOverviewPage.subtotal()
    const tax = await checkoutOverviewPage.tax()
    const total = await checkoutOverviewPage.total()

    expect(total).toBeCloseTo(roundToCents(subtotal + tax), 2)
  })
})

test.describe('information validation', () => {
  const CASES = [
    { name: 'no details at all', first: '', last: '', postal: '', error: 'First Name is required' },
    {
      name: 'a missing last name',
      first: SHOPPER.firstName,
      last: '',
      postal: '',
      error: 'Last Name is required',
    },
    {
      name: 'a missing postal code',
      first: SHOPPER.firstName,
      last: SHOPPER.lastName,
      postal: '',
      error: 'Postal Code is required',
    },
  ]

  for (const testCase of CASES) {
    test(`${testCase.name} is rejected`, async ({
      inventoryPage,
      checkoutInformationPage,
    }) => {
      await inventoryPage.addToCart(PRODUCTS.backpack)
      await checkoutInformationPage.goto()
      await checkoutInformationPage.waitUntilLoaded()

      await checkoutInformationPage.submitInformation(
        testCase.first,
        testCase.last,
        testCase.postal,
      )

      await expect(checkoutInformationPage.errorMessage).toHaveText(`Error: ${testCase.error}`)
      await expect(checkoutInformationPage.continueButton).toBeVisible()
    })
  }
})

test.describe('known defects', () => {
  test.fail(
    'the subtotal should be rendered to two decimal places',
    async ({ inventoryPage, checkoutInformationPage, checkoutOverviewPage }) => {
      for (const product of BASKET) {
        await inventoryPage.addToCart(product)
      }

      await checkoutInformationPage.goto()
      await checkoutInformationPage.waitUntilLoaded()
      await checkoutInformationPage.submitInformation(
        SHOPPER.firstName,
        SHOPPER.lastName,
        SHOPPER.postalCode,
      )
      await checkoutOverviewPage.waitUntilLoaded()

      expect(await checkoutOverviewPage.subtotalText()).toMatch(/^Item total: \$\d+\.\d{2}$/)
    },
  )
})
