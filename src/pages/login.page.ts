import type { Locator, Page } from '@playwright/test'

export class LoginPage {
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly errorMessage: Locator

  constructor(private readonly page: Page) {
    this.usernameInput = page.getByTestId('username')
    this.passwordInput = page.getByTestId('password')
    this.loginButton = page.getByTestId('login-button')
    this.errorMessage = page.getByTestId('error')
  }

  async goto(): Promise<void> {
    await this.page.goto('/')
    await this.loginButton.waitFor()
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }
}
