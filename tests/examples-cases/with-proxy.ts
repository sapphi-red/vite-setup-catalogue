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
  printRecordedLogs,
  waitForHMRPolling
} from '../utils/index.js'

const workspaceFileURL = getWorkspaceFileURL('example', 'with-proxy')
const accessURL = `http://localhost:${ports.withProxy}/`

const startVite = async () => {
  const overrideFile = useNodeModulesOutsideContainer
    ? ' -f compose.node-modules-outside-container.yaml'
    : ''

  const dockerComposeProcess = await runDockerCompose(
    `-p with-proxy-dev -f compose.dev.yaml${overrideFile}`,
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

  let i = 0
  try {
    console.log(`s${i++}`)
    finishVite1 = await startVite()
    console.log(`s${i++}`)
    await setupAndGotoPage(page)
    console.log(`s${i++}`)

    await Promise.all([waitForHMRPolling(page), finishVite1()])
    finishVite1 = undefined
    console.log(`s${i++}`)

    const navigationPromise = page.waitForNavigation({ timeout: 10000 })
    console.log(`s${i++}`)

    finishVite2 = await startVite()
    console.log(`s${i++}`)

    await navigationPromise
    console.log(`s${i++}`)
  } finally {
    console.log(`sf`)
    await finishVite1?.()
    console.log(`sfv`)
    await finishVite2?.()
    console.log(`sfv2`)
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
