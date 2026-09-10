import { expect } from '@playwright/test'
import { test } from '@/fixtures/web'
import { CATALOGUE_PRICES, PRODUCTS } from '@/data/products'
import { USERS } from '@/data/users'
import { storageStatePath } from '@/data/storage-state'

test.use({ storageState: storageStatePath(USERS.standard) })

const BASKET = [PRODUCTS.backpack, PRODUCTS.bikeLight, PRODUCTS.onesie]

test.beforeEach(async ({ inventoryPage }) => {
  await inventoryPage.goto()
  await inventoryPage.waitUntilLoaded()
})

test('the cart starts empty', async ({ inventoryPage }) => {
  await expect(inventoryPage.cartBadge).toHaveCount(0)
})

test('adding a product puts it in the cart', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.addToCart(PRODUCTS.backpack)

  await expect(inventoryPage.cartBadge).toHaveText('1')

  await inventoryPage.openCart()
  await cartPage.waitUntilLoaded()

  expect(await cartPage.itemNames()).toEqual([PRODUCTS.backpack])
})

test('the badge counts every product added', async ({ inventoryPage }) => {
  for (const product of BASKET) {
    await inventoryPage.addToCart(product)
  }

  await expect(inventoryPage.cartBadge).toHaveText(String(BASKET.length))
})

test('the cart contains exactly the products selected', async ({ inventoryPage, cartPage }) => {
  for (const product of BASKET) {
    await inventoryPage.addToCart(product)
  }

  await inventoryPage.openCart()
  await cartPage.waitUntilLoaded()

  expect((await cartPage.itemNames()).sort()).toEqual([...BASKET].sort())
})

test('cart prices match the catalogue', async ({ inventoryPage, cartPage }) => {
  for (const product of BASKET) {
    await inventoryPage.addToCart(product)
  }

  await inventoryPage.openCart()
  await cartPage.waitUntilLoaded()

  const names = await cartPage.itemNames()
  const prices = await cartPage.itemPrices()
  const expected = names.map((name) => CATALOGUE_PRICES[name as keyof typeof CATALOGUE_PRICES])

  expect(prices).toEqual(expected)
})

test('every cart line has a quantity of one', async ({ inventoryPage, cartPage }) => {
  for (const product of BASKET) {
    await inventoryPage.addToCart(product)
  }

  await inventoryPage.openCart()
  await cartPage.waitUntilLoaded()

  expect(await cartPage.quantities()).toEqual(BASKET.map(() => 1))
})

test('removing a product from the inventory page decrements the badge', async ({
  inventoryPage,
}) => {
  await inventoryPage.addToCart(PRODUCTS.backpack)
  await inventoryPage.addToCart(PRODUCTS.bikeLight)

  await expect(inventoryPage.cartBadge).toHaveText('2')

  await inventoryPage.removeFromCart(PRODUCTS.backpack)

  await expect(inventoryPage.cartBadge).toHaveText('1')
})

test('removing the last product empties the cart', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.addToCart(PRODUCTS.backpack)
  await inventoryPage.openCart()
  await cartPage.waitUntilLoaded()

  await cartPage.removeFromCart(PRODUCTS.backpack)

  expect(await cartPage.itemNames()).toEqual([])
  await expect(cartPage.cartBadge).toHaveCount(0)
})

test('the cart survives navigating back to the inventory', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.addToCart(PRODUCTS.backpack)
  await inventoryPage.openCart()
  await cartPage.waitUntilLoaded()

  await cartPage.continueShopping()
  await inventoryPage.waitUntilLoaded()

  await expect(inventoryPage.cartBadge).toHaveText('1')
  await expect(inventoryPage.removeButton(PRODUCTS.backpack)).toBeVisible()
})
