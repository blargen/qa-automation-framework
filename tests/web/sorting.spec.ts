import { expect } from '@playwright/test'
import { test } from '@/fixtures/web'
import type { SortOption } from '@/pages/inventory.page'
import { USERS } from '@/data/users'
import { storageStatePath } from '@/data/storage-state'

test.use({ storageState: storageStatePath(USERS.standard) })

const NAME_CASES: { option: SortOption; label: string; compare: (a: string, b: string) => number }[] =
  [
    { option: 'az', label: 'A to Z', compare: (a, b) => a.localeCompare(b) },
    { option: 'za', label: 'Z to A', compare: (a, b) => b.localeCompare(a) },
  ]

const PRICE_CASES: { option: SortOption; label: string; compare: (a: number, b: number) => number }[] =
  [
    { option: 'lohi', label: 'low to high', compare: (a, b) => a - b },
    { option: 'hilo', label: 'high to low', compare: (a, b) => b - a },
  ]

test.beforeEach(async ({ inventoryPage }) => {
  await inventoryPage.goto()
  await inventoryPage.waitUntilLoaded()
})

test('the catalogue defaults to name A to Z', async ({ inventoryPage }) => {
  const names = await inventoryPage.itemNames()

  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
})

for (const { option, label, compare } of NAME_CASES) {
  test(`sorting by name ${label} orders the catalogue`, async ({ inventoryPage }) => {
    await inventoryPage.sortBy(option)

    const names = await inventoryPage.itemNames()

    expect(names.length).toBeGreaterThan(1)
    expect(names).toEqual([...names].sort(compare))
  })
}

for (const { option, label, compare } of PRICE_CASES) {
  test(`sorting by price ${label} orders the catalogue`, async ({ inventoryPage }) => {
    await inventoryPage.sortBy(option)

    const prices = await inventoryPage.itemPrices()

    expect(prices.length).toBeGreaterThan(1)
    expect(prices).toEqual([...prices].sort(compare))
  })
}

test('sorting reorders without losing or duplicating products', async ({ inventoryPage }) => {
  const original = await inventoryPage.itemNames()

  await inventoryPage.sortBy('hilo')
  const reordered = await inventoryPage.itemNames()

  expect([...reordered].sort()).toEqual([...original].sort())
})
