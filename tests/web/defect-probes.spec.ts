import { expect } from '@playwright/test'
import { test } from '@/fixtures/web'
import { CATALOGUE_PRICES, PRODUCTS, type ProductName } from '@/data/products'
import { SHOPPER } from '@/data/shopper'
import { USERS } from '@/data/users'
import { storageStatePath } from '@/data/storage-state'

const PROBE_TIMEOUT = 3000

test.describe('problem_user', () => {
  test.use({ storageState: storageStatePath(USERS.problem) })

  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto()
    await inventoryPage.waitUntilLoaded()
  })

  test.fail('every product should have its own image', async ({ inventoryPage }) => {
    const sources = await inventoryPage.itemImageSources()

    expect(new Set(sources).size).toBe(sources.length)
  })

  test.fail('sorting by price high to low should reorder the catalogue', async ({
    inventoryPage,
  }) => {
    await inventoryPage.sortBy('hilo')

    const prices = await inventoryPage.itemPrices()

    expect(prices).toEqual([...prices].sort((a, b) => b - a))
  })

  test.fail('removing a product should restore the add to cart button', async ({
    inventoryPage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.backpack)
    await inventoryPage.removeButton(PRODUCTS.backpack).click()

    await expect(inventoryPage.addToCartButton(PRODUCTS.backpack)).toBeVisible({
      timeout: PROBE_TIMEOUT,
    })
  })

  test.fail('the last name field should keep what is typed into it', async ({
    inventoryPage,
    checkoutInformationPage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.backpack)
    await checkoutInformationPage.goto()
    await checkoutInformationPage.waitUntilLoaded()

    await checkoutInformationPage.lastNameInput.fill(SHOPPER.lastName)

    await expect(checkoutInformationPage.lastNameInput).toHaveValue(SHOPPER.lastName, {
      timeout: PROBE_TIMEOUT,
    })
  })
})

test.describe('error_user', () => {
  test.use({ storageState: storageStatePath(USERS.error) })

  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto()
    await inventoryPage.waitUntilLoaded()
  })

  test.fail('sorting by price high to low should reorder the catalogue', async ({
    inventoryPage,
  }) => {
    await inventoryPage.sortBy('hilo')

    const prices = await inventoryPage.itemPrices()

    expect(prices).toEqual([...prices].sort((a, b) => b - a))
  })

  test.fail('removing a product should restore the add to cart button', async ({
    inventoryPage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.backpack)
    await inventoryPage.removeButton(PRODUCTS.backpack).click()

    await expect(inventoryPage.addToCartButton(PRODUCTS.backpack)).toBeVisible({
      timeout: PROBE_TIMEOUT,
    })
  })

  test.fail('finishing checkout should complete the order', async ({
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

    await expect(checkoutCompletePage.header).toBeVisible({ timeout: PROBE_TIMEOUT })
  })
})

test.describe('visual_user', () => {
  test.use({ storageState: storageStatePath(USERS.visual) })

  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto()
    await inventoryPage.waitUntilLoaded()
  })

  test.fail('product prices should match the catalogue', async ({ inventoryPage }) => {
    const names = await inventoryPage.itemNames()
    const prices = await inventoryPage.itemPrices()

    expect(prices).toEqual(names.map((name) => CATALOGUE_PRICES[name as ProductName]))
  })

  test.fail('product prices should be stable across page loads', async ({
    inventoryPage,
    page,
  }) => {
    const firstRead = await inventoryPage.itemPrices()

    await page.reload()
    await inventoryPage.waitUntilLoaded()

    const secondRead = await inventoryPage.itemPrices()

    expect(secondRead).toEqual(firstRead)
  })
})
