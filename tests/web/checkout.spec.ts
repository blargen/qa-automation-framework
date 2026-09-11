import { expect } from '@playwright/test'
import { test } from '@/fixtures/web'
import { CATALOGUE_PRICES, PRODUCTS, TAX_RATE } from '@/data/products'
import { USERS } from '@/data/users'
import { SHOPPER } from '@/data/shopper'
import { storageStatePath } from '@/data/storage-state'

test.use({ storageState: storageStatePath(USERS.standard) })

const BASKET = [PRODUCTS.fleeceJacket, PRODUCTS.onesie]

const roundToCents = (amount: number): number => Math.round(amount * 100) / 100

const EXPECTED_PRICES = BASKET.map((product) => CATALOGUE_PRICES[product])
const EXPECTED_SUBTOTAL = roundToCents(EXPECTED_PRICES.reduce((sum, price) => sum + price, 0))
const EXPECTED_TAX = roundToCents(EXPECTED_SUBTOTAL * TAX_RATE)
const EXPECTED_TOTAL = roundToCents(EXPECTED_SUBTOTAL + EXPECTED_TAX)

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

  test('the listed prices match the catalogue', async ({ checkoutOverviewPage }) => {
    const names = await checkoutOverviewPage.itemNames()
    const prices = await checkoutOverviewPage.itemPrices()
    const expected = names.map((name) => CATALOGUE_PRICES[name as keyof typeof CATALOGUE_PRICES])

    expect(prices).toEqual(expected)
  })

  test('the subtotal is the sum of the catalogue prices', async ({ checkoutOverviewPage }) => {
    const subtotal = await checkoutOverviewPage.subtotal()

    expect(subtotal).toBeCloseTo(EXPECTED_SUBTOTAL, 2)
  })

  test('the tax is eight percent of the subtotal', async ({ checkoutOverviewPage }) => {
    const tax = await checkoutOverviewPage.tax()

    expect(tax).toBeCloseTo(EXPECTED_TAX, 2)
  })

  test('the total is the subtotal plus the tax', async ({ checkoutOverviewPage }) => {
    const total = await checkoutOverviewPage.total()

    expect(total).toBeCloseTo(EXPECTED_TOTAL, 2)
  })

  test('the overview shows the payment and shipping details', async ({ checkoutOverviewPage }) => {
    await expect(checkoutOverviewPage.paymentInformation).toHaveText('SauceCard #31337')
    await expect(checkoutOverviewPage.shippingInformation).toHaveText(
      'Free Pony Express Delivery!',
    )
  })
})

test.describe('leaving checkout', () => {
  test('cancelling from the information page returns to the cart, basket intact', async ({
    inventoryPage,
    cartPage,
    checkoutInformationPage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.backpack)
    await checkoutInformationPage.goto()
    await checkoutInformationPage.waitUntilLoaded()

    await checkoutInformationPage.cancel()
    await cartPage.waitUntilLoaded()

    await expect(cartPage.title).toHaveText('Your Cart')
    expect(await cartPage.itemNames()).toEqual([PRODUCTS.backpack])
  })

  test('cancelling from the overview returns to the inventory, basket intact', async ({
    inventoryPage,
    checkoutInformationPage,
    checkoutOverviewPage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.backpack)
    await checkoutInformationPage.goto()
    await checkoutInformationPage.waitUntilLoaded()
    await checkoutInformationPage.submitInformation(
      SHOPPER.firstName,
      SHOPPER.lastName,
      SHOPPER.postalCode,
    )
    await checkoutOverviewPage.waitUntilLoaded()

    await checkoutOverviewPage.cancel()
    await inventoryPage.waitUntilLoaded()

    await expect(inventoryPage.title).toHaveText('Products')
    await expect(inventoryPage.cartBadge).toHaveText('1')
  })

  test('returning to products after an order leaves the cart empty', async ({
    inventoryPage,
    checkoutInformationPage,
    checkoutOverviewPage,
    checkoutCompletePage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.backpack)
    await checkoutInformationPage.goto()
    await checkoutInformationPage.waitUntilLoaded()
    await checkoutInformationPage.submitInformation(
      SHOPPER.firstName,
      SHOPPER.lastName,
      SHOPPER.postalCode,
    )
    await checkoutOverviewPage.waitUntilLoaded()
    await checkoutOverviewPage.finish()
    await checkoutCompletePage.waitUntilLoaded()

    await expect(checkoutCompletePage.message).toHaveText(
      'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
    )

    await checkoutCompletePage.backToProducts()
    await inventoryPage.waitUntilLoaded()

    await expect(inventoryPage.title).toHaveText('Products')
    await expect(inventoryPage.cartBadge).toHaveCount(0)
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
