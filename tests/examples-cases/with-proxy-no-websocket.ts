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
  collectBrowserLogs,
  printRecordedLogs
} from '../utils/index.js'

const workspaceFileURL = getWorkspaceFileURL(
  'example',
  'with-proxy-no-websocket'
)
const accessURL = `http://localhost:${ports.withProxyNoWebSocket}/`

const startVite = async () => {
  const overrideFile = useNodeModulesOutsideContainer
    ? ' -f compose.node-modules-outside-container.yaml'
    : ''

  const dockerComposeProcess = await runDockerCompose(
    `-p with-proxy-no-websocket-dev -f compose.dev.yaml${overrideFile}`,
    workspaceFileURL
  )
  console.log('[docker-compose] up command')
  await waitUntilOutput(
    dockerComposeProcess,
    'stdout',
    /Attaching to .+-caddy-\d+, .+-vite-\d+/,
    { timeout: 30000 } // pulling image might take long
  )
  console.log('[docker-compose] detected container start')
  await waitUntilOutput(
    dockerComposeProcess,
    'stdout',
    'Network:',
    { timeout: 30000 } // npm i might take long
  )
  console.log('[docker-compose] detected vite start')

  return async () => {
    dockerComposeProcess.recordLogs()
    await dockerComposeProcess.down()
  }
}

const setupAndGotoPage = async (page: Page) => {
  collectBrowserLogs(page)
  await gotoAndWaitForHMRConnection(page, accessURL, { timeout: 1000 })
}

test('hmr test', async ({ page }) => {
  const finishVite = await startVite()
  try {
    let i = 0
    console.log(`s${i++}`)
    await setupAndGotoPage(page)

    console.log(`s${i++}`)
    const title = page.locator('h1')
    await expect(title).toHaveText('Hello Vite!')
    console.log(`s${i++}`)

    await editFile('./src/main.js', workspaceFileURL, content =>
      content.replace('Vite!</h1>', 'Vite!!!</h1>')
    )
    console.log(`s${i++}`)

    await expect(title).toHaveText('Hello Vite!!!')
    console.log(`s${i++}`)
  } finally {
    console.log(`sf`)
    await finishVite()
    console.log(`sfv`)
  }
})

test('restart test', async ({ page }) => {
  let finishVite1: (() => Promise<void>) | undefined
  let finishVite2: (() => Promise<void>) | undefined

  try {
    finishVite1 = await startVite()
    await setupAndGotoPage(page)

    const navigationPromise = page.waitForNavigation({ timeout: 10000 })

    await finishVite1()
    finishVite1 = undefined

    finishVite2 = await startVite()

    await navigationPromise
  } finally {
    await finishVite1?.()
    await finishVite2?.()
  }
})

// eslint-disable-next-line no-empty-pattern
test.afterAll(async ({}, testInfo) => {
  if (testInfo.errors.length > 0) {
    printRecordedLogs()
  }

  // cleanup
  await editFile('./src/main.js', workspaceFileURL, content =>
    content.replace('Vite!!!</h1>', 'Vite!</h1>')
  )
})
