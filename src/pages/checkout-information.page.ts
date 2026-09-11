import type { Locator, Page } from '@playwright/test'

export class CheckoutInformationPage {
  readonly title: Locator
  readonly firstNameInput: Locator
  readonly lastNameInput: Locator
  readonly postalCodeInput: Locator
  readonly continueButton: Locator
  readonly cancelButton: Locator
  readonly errorMessage: Locator

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title')
    this.firstNameInput = page.getByTestId('firstName')
    this.lastNameInput = page.getByTestId('lastName')
    this.postalCodeInput = page.getByTestId('postalCode')
    this.continueButton = page.getByTestId('continue')
    this.cancelButton = page.getByTestId('cancel')
    this.errorMessage = page.getByTestId('error')
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout-step-one.html')
  }

  async waitUntilLoaded(): Promise<void> {
    await this.continueButton.waitFor()
  }

  async submitInformation(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.firstNameInput.fill(firstName)
    await this.lastNameInput.fill(lastName)
    await this.postalCodeInput.fill(postalCode)
    await this.continueButton.click()
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click()
  }
}
