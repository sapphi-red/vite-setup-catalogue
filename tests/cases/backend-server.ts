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

const workspaceFileURL = getWorkspaceFileURL('backend-server')
const accessURL = `http://localhost:${ports.backendServer}/`

let viteDevProcess: ChildProcessWithoutNullStreams
let backendProcess: ChildProcessWithoutNullStreams

test.beforeAll(async () => {
  // pnpm run dev cannot be used because killing process does not work
  viteDevProcess = spawn('pnpm', ['run', 'dev:vite'], { cwd: workspaceFileURL })
  backendProcess = spawn('pnpm', ['run', 'dev:backend'], {
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
})

test('backend-server test', async ({ page }) => {
  outputError(page)
  await gotoAndWaitForHMRConnection(page, accessURL, { timeout: 10000 })

  const title = page.locator('h1')
  await expect(title).toHaveText('Hello Vite!')

  await editFile('./frontend-src/main.js', workspaceFileURL, (content) =>
    content.replace('Vite!</h1>', 'Vite!!!</h1>')
  )

  await expect(title).toHaveText('Hello Vite!!!')
})

test.afterAll(async () => {
  // cleanup
  await editFile('./frontend-src/main.js', workspaceFileURL, (content) =>
    content.replace('Vite!!!</h1>', 'Vite!</h1>')
  )

  try {
    await killProcess(viteDevProcess)
  } catch {}
  try {
    await killProcess(backendProcess)
  } catch {}
})
