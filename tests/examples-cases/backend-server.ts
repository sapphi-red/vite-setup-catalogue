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
  collectBrowserLogs,
  wait
} from '../utils/index.js'

const workspaceFileURL = getWorkspaceFileURL('example', 'backend-server')
const accessURL = `http://localhost:${ports.backendServer}/`

const startVite = async () => {
  // pnpm run dev cannot be used because killing process does not work
  const viteDevProcess = spawn('pnpm', ['run', 'dev:vite'], {
    cwd: workspaceFileURL
  })
  const backendProcess = spawn('pnpm', ['run', 'dev:backend'], {
    cwd: workspaceFileURL
  })
  await Promise.all([
    collectAndWaitUntilOutput(
      viteDevProcess.stdout,
      viteDevProcess.stderr,
      'use --host to expose'
    ),
    collectAndWaitUntilOutput(
      backendProcess.stdout,
      backendProcess.stderr,
      'Open your browser.'
    )
  ])
  await wait(100)

  return async () => {
    try {
      await killProcess(viteDevProcess)
    } catch {}
    try {
      await killProcess(backendProcess)
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

    await editFile('./frontend-src/main.js', workspaceFileURL, content =>
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

    const navigationPromise = page.waitForNavigation({ timeout: 3000 })

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
  await editFile('./frontend-src/main.js', workspaceFileURL, content =>
    content.replace('Vite!!!</h1>', 'Vite!</h1>')
  )
})
