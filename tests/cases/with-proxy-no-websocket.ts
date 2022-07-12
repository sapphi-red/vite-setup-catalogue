import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import {
  editFile,
  getWorkspaceFileURL,
  ports,
  waitUntilOutput,
  useNodeModulesOutsideContainer,
  runDockerCompose,
  gotoAndWaitForHMRConnection,
  outputError
} from '../utils/index.js'

const workspaceFileURL = getWorkspaceFileURL('with-proxy-no-websocket')
const accessURL = `http://localhost:${ports.withProxyNoWebSocket}/`

const startVite = async () => {
  const overrideFile = useNodeModulesOutsideContainer
    ? ' -f ../../tests/fixtures/compose.with-proxy-no-websocket.yaml'
    : ''

  const dockerComposeProcess = runDockerCompose(
    `-p with-proxy-no-websocket-dev -f compose.dev.yaml${overrideFile}`,
    workspaceFileURL
  )
  await waitUntilOutput(
    dockerComposeProcess.stdout,
    dockerComposeProcess.stderr,
    'Network:',
    { timeout: 20000 }
  )

  return async () => {
    await dockerComposeProcess.down()
  }
}

const setupAndGotoPage = async (page: Page) => {
  outputError(page)
  await gotoAndWaitForHMRConnection(page, accessURL, { timeout: 1000 })
}

test('hmr test', async ({ page }) => {
  const finishVite = await startVite()
  try {
    await setupAndGotoPage(page)

    const title = page.locator('h1')
    await expect(title).toHaveText('Hello Vite!')

    await editFile('./src/main.js', workspaceFileURL, (content) =>
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

test.afterAll(async ({}, testInfo) => {
  if (testInfo.errors.length > 0) {
    dockerComposeProcess.printLogs()
  }

  // cleanup
  await editFile('./src/main.js', workspaceFileURL, (content) =>
    content.replace('Vite!!!</h1>', 'Vite!</h1>')
  )
})
