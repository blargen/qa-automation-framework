import type { Locator, Page } from '@playwright/test'
import { productTestId } from './product-test-id'

export class CartPage {
  readonly title: Locator
  readonly cartList: Locator
  readonly cartBadge: Locator
  readonly itemNameLabels: Locator
  readonly itemPriceLabels: Locator
  readonly quantityLabels: Locator
  readonly checkoutButton: Locator
  readonly continueShoppingButton: Locator

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title')
    this.cartList = page.getByTestId('cart-list')
    this.cartBadge = page.getByTestId('shopping-cart-badge')
    this.itemNameLabels = page.getByTestId('inventory-item-name')
    this.itemPriceLabels = page.getByTestId('inventory-item-price')
    this.quantityLabels = page.getByTestId('item-quantity')
    this.checkoutButton = page.getByTestId('checkout')
    this.continueShoppingButton = page.getByTestId('continue-shopping')
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart.html')
  }

  async waitUntilLoaded(): Promise<void> {
    await this.cartList.waitFor()
  }

  async itemNames(): Promise<string[]> {
    return this.itemNameLabels.allInnerTexts()
  }

  async itemPrices(): Promise<number[]> {
    const labels = await this.itemPriceLabels.allInnerTexts()
    return labels.map((label) => Number(label.replace('$', '')))
  }

  async quantities(): Promise<number[]> {
    const labels = await this.quantityLabels.allInnerTexts()
    return labels.map((label) => Number(label))
  }

  removeButton(productName: string): Locator {
    return this.page.getByTestId(`remove-${productTestId(productName)}`)
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.removeButton(productName).click()
    await this.removeButton(productName).waitFor({ state: 'detached' })
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click()
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click()
  }
}
