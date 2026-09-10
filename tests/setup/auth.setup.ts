import { test as setup } from '@/fixtures/web'
import { PASSWORD, SESSION_ACCOUNTS } from '@/data/users'
import { storageStatePath } from '@/data/storage-state'

for (const account of SESSION_ACCOUNTS) {
  setup(`save a session for ${account}`, async ({ page, loginPage, inventoryPage }) => {
    await loginPage.goto()
    await loginPage.login(account, PASSWORD)
    await inventoryPage.waitUntilLoaded()

    await page.context().storageState({ path: storageStatePath(account) })
  })
}
