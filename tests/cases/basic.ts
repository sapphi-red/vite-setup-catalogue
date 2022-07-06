import { test, expect } from '@playwright/test'
import type { ChildProcessWithoutNullStreams } from 'child_process'
import { spawn } from 'cross-spawn'
import {
  editFile,
  getWorkspaceFileURL,
  killProcess,
  ports,
  waitUntilOutput,
  gotoAndWaitForHMRConnection
} from '../utils/index.js'

const workspaceFileURL = getWorkspaceFileURL('basic')
const accessURL = `http://localhost:${ports.basic}/`

let viteDevProcess: ChildProcessWithoutNullStreams

test.beforeAll(async () => {
  viteDevProcess = spawn('pnpm', ['run', 'dev'], { cwd: workspaceFileURL })
  await waitUntilOutput(
    viteDevProcess.stdout,
    viteDevProcess.stderr,
    'use --host to expose'
  )
})

test('basic test', async ({ page }) => {
  await gotoAndWaitForHMRConnection(page, accessURL, { timeout: 10000 })

  const title = page.locator('h1')
  await expect(title).toHaveText('Hello Vite!')

  await editFile('./main.js', workspaceFileURL, (content) =>
    content.replace('Vite!</h1>', 'Vite!!!</h1>')
  )

  await expect(title).toHaveText('Hello Vite!!!')
})

test.afterAll(async () => {
  // cleanup
  await editFile('./main.js', workspaceFileURL, (content) =>
    content.replace('Vite!!!</h1>', 'Vite!</h1>')
  )

  try {
    await killProcess(viteDevProcess)
  } catch {}
})
