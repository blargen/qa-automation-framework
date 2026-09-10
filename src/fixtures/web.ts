import { test as base } from '@playwright/test'
import { InventoryPage } from '@/pages/inventory.page'
import { LoginPage } from '@/pages/login.page'

interface WebFixtures {
  loginPage: LoginPage
  inventoryPage: InventoryPage
}

export const test = base.extend<WebFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page))
  },
})
