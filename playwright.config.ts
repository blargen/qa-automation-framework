import { defineConfig, devices } from '@playwright/test'

const API_BASE_URL = process.env.API_BASE_URL ?? 'https://jsonplaceholder.typicode.com'
const WEB_BASE_URL = process.env.WEB_BASE_URL ?? 'https://www.saucedemo.com'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    testIdAttribute: 'data-test',
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: API_BASE_URL },
    },
    {
      name: 'setup',
      testDir: './tests/setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: WEB_BASE_URL },
    },
    {
      name: 'web',
      testDir: './tests/web',
      use: { ...devices['Desktop Chrome'], baseURL: WEB_BASE_URL },
      dependencies: ['setup'],
    },
  ],
})
