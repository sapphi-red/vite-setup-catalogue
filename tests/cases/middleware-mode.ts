import { test, expect } from '@playwright/test'
import type { ChildProcessWithoutNullStreams } from 'child_process'
import { spawn } from 'cross-spawn'
import {
  editFile,
  getWorkspaceFileURL,
  killProcess,
  ports,
  collectAndWaitUntilOutput,
  gotoAndWaitForHMRConnection,
  outputError
} from '../utils/index.js'

const workspaceFileURL = getWorkspaceFileURL('middleware-mode')
const accessURL = `http://localhost:${ports.middlewareMode}/`

let viteDevProcess: ChildProcessWithoutNullStreams

test.beforeAll(async () => {
  viteDevProcess = spawn('pnpm', ['run', 'dev'], { cwd: workspaceFileURL })
  await collectAndWaitUntilOutput(
    viteDevProcess.stdout,
    viteDevProcess.stderr,
    'Open your browser.'
  )
})

test('middleware-mode test', async ({ page }) => {
  outputError(page)
  await gotoAndWaitForHMRConnection(page, accessURL, { timeout: 10000 })

  const title = page.locator('h1')
  await expect(title).toHaveText('Hello Vite!')

  await editFile('./src/main.js', workspaceFileURL, (content) =>
    content.replace('Vite!</h1>', 'Vite!!!</h1>')
  )

  await expect(title).toHaveText('Hello Vite!!!')
})

test.afterAll(async () => {
  // cleanup
  await editFile('./src/main.js', workspaceFileURL, (content) =>
    content.replace('Vite!!!</h1>', 'Vite!</h1>')
  )

  try {
    await killProcess(viteDevProcess)
  } catch {}
})
