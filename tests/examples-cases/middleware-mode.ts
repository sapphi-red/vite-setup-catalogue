import { test, expect } from '@playwright/test'
import { spawn } from 'cross-spawn'
import {
  editFile,
  getWorkspaceFileURL,
  killProcess,
  ports,
  collectAndWaitUntilOutput,
  createSetupAndGotoPage
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

const setupAndGotoPage = createSetupAndGotoPage(accessURL, 1000)

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
    await setupAndGotoPage(page, { waitUntil: 'load' })

    const loadPromise = page.waitForEvent('load', { timeout: 3000 })

    await finishVite1()
    finishVite1 = undefined

    finishVite2 = await startVite()

    await loadPromise
  } finally {
    await finishVite1?.()
    await finishVite2?.()
  }
})

// https://github.com/vitejs/vite/pull/14127
test('restart server by config change', async ({page}) => {
  const finishVite = await startVite()
  try {
    await setupAndGotoPage(page)

    // edit vite.config.js to restart server
    await editFile('./vite.config.js', workspaceFileURL, content =>
      content.replace('export default defineConfig({', 'export default defineConfig({\n')
    )

    const title = page.locator('h1')
    await expect(title).toHaveText('Hello Vite!!!')

    await editFile('./src/main.js', workspaceFileURL, content =>
      content.replace('Vite!!!</h1>', 'Vite!!!!</h1>')
    )

    await expect(title).toHaveText('Hello Vite!!!!')
  } finally {
    await finishVite()
  }
})

test.afterAll(async () => {
  // cleanup
  await editFile('./src/main.js', workspaceFileURL, content =>
    content.replace('Vite!!!!</h1>', 'Vite!</h1>')
  )
})
