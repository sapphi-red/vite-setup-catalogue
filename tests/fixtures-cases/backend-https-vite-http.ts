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

const workspaceFileURL = getWorkspaceFileURL(
  'fixture',
  'backend-https-vite-http'
)
const accessURL = `https://localhost:${ports.backendHttpsViteHttp}/`

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

  return async () => {
    try {
      await killProcess(viteDevProcess)
    } catch {}
    try {
      await killProcess(backendProcess)
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

test.afterAll(async () => {
  // cleanup
  await editFile('./frontend-src/main.js', workspaceFileURL, content =>
    content.replace('Vite!!!</h1>', 'Vite!</h1>')
  )
})
