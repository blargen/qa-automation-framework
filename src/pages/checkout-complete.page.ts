import type { Locator, Page } from '@playwright/test'

export class CheckoutCompletePage {
  readonly title: Locator
  readonly header: Locator
  readonly message: Locator
  readonly backToProductsButton: Locator
  readonly cartBadge: Locator

  constructor(page: Page) {
    this.title = page.getByTestId('title')
    this.header = page.getByTestId('complete-header')
    this.message = page.getByTestId('complete-text')
    this.backToProductsButton = page.getByTestId('back-to-products')
    this.cartBadge = page.getByTestId('shopping-cart-badge')
  }

  async waitUntilLoaded(): Promise<void> {
    await this.header.waitFor()
  }

  async backToProducts(): Promise<void> {
    await this.backToProductsButton.click()
  }
}
