import type { Locator, Page } from '@playwright/test'
import { productTestId } from './product-test-id'

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo'

export class InventoryPage {
  readonly title: Locator
  readonly inventoryList: Locator
  readonly openMenuButton: Locator
  readonly logoutLink: Locator
  readonly shoppingCartLink: Locator
  readonly cartBadge: Locator
  readonly sortDropdown: Locator
  readonly itemNameLabels: Locator
  readonly itemPriceLabels: Locator
  readonly itemImages: Locator

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title')
    this.inventoryList = page.getByTestId('inventory-list')
    this.openMenuButton = page.locator('#react-burger-menu-btn')
    this.logoutLink = page.getByTestId('logout-sidebar-link')
    this.shoppingCartLink = page.getByTestId('shopping-cart-link')
    this.cartBadge = page.getByTestId('shopping-cart-badge')
    this.sortDropdown = page.getByTestId('product-sort-container')
    this.itemNameLabels = page.getByTestId('inventory-item-name')
    this.itemPriceLabels = page.getByTestId('inventory-item-price')
    this.itemImages = page.locator('.inventory_item_img img')
  }

  async goto(path = '/inventory.html'): Promise<void> {
    await this.page.goto(path)
  }

  async waitUntilLoaded(): Promise<void> {
    await this.inventoryList.waitFor()
  }

  async logout(): Promise<void> {
    await this.openMenuButton.click()
    await this.logoutLink.waitFor({ state: 'visible' })
    await this.logoutLink.click()
  }

  async itemNames(): Promise<string[]> {
    return this.itemNameLabels.allInnerTexts()
  }

  async itemPrices(): Promise<number[]> {
    const labels = await this.itemPriceLabels.allInnerTexts()
    return labels.map((label) => Number(label.replace('$', '')))
  }

  async itemImageSources(): Promise<string[]> {
    return this.itemImages.evaluateAll((images) => images.map((image) => image.getAttribute('src') ?? ''))
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option)
  }

  addToCartButton(productName: string): Locator {
    return this.page.getByTestId(`add-to-cart-${productTestId(productName)}`)
  }

  removeButton(productName: string): Locator {
    return this.page.getByTestId(`remove-${productTestId(productName)}`)
  }

  async addToCart(productName: string): Promise<void> {
    await this.addToCartButton(productName).click()
    await this.removeButton(productName).waitFor()
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.removeButton(productName).click()
    await this.addToCartButton(productName).waitFor()
  }

  async openCart(): Promise<void> {
    await this.shoppingCartLink.click()
  }
}
