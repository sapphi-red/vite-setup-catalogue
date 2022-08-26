import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { spawn } from 'cross-spawn'
import {
  editFile,
  getWorkspaceFileURL,
  killProcess,
  ports,
  collectAndWaitUntilOutput,
  gotoAndWaitForHMRConnection,
  collectBrowserLogs
} from '../utils/index.js'

const workspaceFileURL = getWorkspaceFileURL('example', 'middleware-mode')
const accessURL = `http://localhost:${ports.middlewareMode}/`

const startVite = async () => {
  const viteDevProcess = spawn('pnpm', ['run', 'dev'], {
    cwd: workspaceFileURL
  })
  await collectAndWaitUntilOutput(
    viteDevProcess.stdout,
    viteDevProcess.stderr,
    'Open your browser.'
  )

  return async () => {
    try {
      await killProcess(viteDevProcess)
    } catch {}
  }
}

const setupAndGotoPage = async (page: Page) => {
  collectBrowserLogs(page)
  await gotoAndWaitForHMRConnection(page, accessURL, { timeout: 1000 })
}

test('hmr test', async ({ page }) => {
  const finishVite = await startVite()
  try {
    await setupAndGotoPage(page)

    const title = page.locator('h1')
    await expect(title).toHaveText('Hello Vite!')

    await editFile('./src/main.js', workspaceFileURL, content =>
      content.replace('Vite!</h1>', 'Vite!!!</h1>')
    )

    await expect(title).toHaveText('Hello Vite!!!')
  } finally {
    await finishVite()
  }
})

test('restart test', async ({ page }) => {
  let finishVite1: (() => Promise<void>) | undefined
  let finishVite2: (() => Promise<void>) | undefined

  try {
    finishVite1 = await startVite()
    await setupAndGotoPage(page)

    const navigationPromise = page.waitForNavigation()

    await finishVite1()
    finishVite1 = undefined

    finishVite2 = await startVite()

    await navigationPromise
  } finally {
    await finishVite1?.()
    await finishVite2?.()
  }
})

test.afterAll(async () => {
  // cleanup
  await editFile('./src/main.js', workspaceFileURL, content =>
    content.replace('Vite!!!</h1>', 'Vite!</h1>')
  )
})
