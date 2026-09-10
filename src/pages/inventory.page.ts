import type { Locator, Page } from '@playwright/test'

export class InventoryPage {
  readonly title: Locator
  readonly inventoryList: Locator
  readonly openMenuButton: Locator
  readonly logoutLink: Locator
  readonly shoppingCartLink: Locator
  readonly sortDropdown: Locator

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title')
    this.inventoryList = page.getByTestId('inventory-list')
    this.openMenuButton = page.locator('#react-burger-menu-btn')
    this.logoutLink = page.getByTestId('logout-sidebar-link')
    this.shoppingCartLink = page.getByTestId('shopping-cart-link')
    this.sortDropdown = page.getByTestId('product-sort-container')
  }

  async waitUntilLoaded(): Promise<void> {
    await this.inventoryList.waitFor()
  }

  async logout(): Promise<void> {
    await this.openMenuButton.click()
    await this.logoutLink.waitFor({ state: 'visible' })
    await this.logoutLink.click()
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path)
  }
}
