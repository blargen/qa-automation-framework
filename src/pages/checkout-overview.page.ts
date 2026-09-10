import type { Locator, Page } from '@playwright/test'

const toAmount = (label: string): number => Number(label.replace(/[^0-9.]/g, ''))

export class CheckoutOverviewPage {
  readonly title: Locator
  readonly subtotalLabel: Locator
  readonly taxLabel: Locator
  readonly totalLabel: Locator
  readonly finishButton: Locator
  readonly cancelButton: Locator
  readonly itemNameLabels: Locator
  readonly itemPriceLabels: Locator
  readonly paymentInformation: Locator
  readonly shippingInformation: Locator

  constructor(page: Page) {
    this.title = page.getByTestId('title')
    this.subtotalLabel = page.getByTestId('subtotal-label')
    this.taxLabel = page.getByTestId('tax-label')
    this.totalLabel = page.getByTestId('total-label')
    this.finishButton = page.getByTestId('finish')
    this.cancelButton = page.getByTestId('cancel')
    this.itemNameLabels = page.getByTestId('inventory-item-name')
    this.itemPriceLabels = page.getByTestId('inventory-item-price')
    this.paymentInformation = page.getByTestId('payment-info-value')
    this.shippingInformation = page.getByTestId('shipping-info-value')
  }

  async waitUntilLoaded(): Promise<void> {
    await this.finishButton.waitFor()
  }

  async itemNames(): Promise<string[]> {
    return this.itemNameLabels.allInnerTexts()
  }

  async itemPrices(): Promise<number[]> {
    const labels = await this.itemPriceLabels.allInnerTexts()
    return labels.map(toAmount)
  }

  async subtotalText(): Promise<string> {
    return this.subtotalLabel.innerText()
  }

  async subtotal(): Promise<number> {
    return toAmount(await this.subtotalLabel.innerText())
  }

  async tax(): Promise<number> {
    return toAmount(await this.taxLabel.innerText())
  }

  async total(): Promise<number> {
    return toAmount(await this.totalLabel.innerText())
  }

  async finish(): Promise<void> {
    await this.finishButton.click()
  }
}
