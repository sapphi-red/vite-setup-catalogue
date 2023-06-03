import { test, expect } from '@playwright/test'
import {
  editFile,
  getWorkspaceFileURL,
  ports,
  waitUntilOutput,
  useNodeModulesOutsideContainer,
  runDockerCompose,
  printRecordedLogs,
  waitForHMRPolling,
  createSetupAndGotoPage
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
  await waitUntilOutput(
    dockerComposeProcess,
    'stdout',
    /Attaching to .+-caddy-\d+, .+-vite-\d+/,
    { timeout: 30000 } // pulling image might take long
  )
  await waitUntilOutput(
    dockerComposeProcess,
    'stdout',
    'Network:',
    { timeout: 30000 } // npm i might take long
  )

  return async () => {
    dockerComposeProcess.recordLogs()
    await dockerComposeProcess.down()
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

test.fixme('restart test', async ({ page }) => {
  let finishVite1: (() => Promise<void>) | undefined
  let finishVite2: (() => Promise<void>) | undefined

  try {
    finishVite1 = await startVite()
    await setupAndGotoPage(page, { waitUntil: 'load' })

    await Promise.all([waitForHMRPolling(page), finishVite1()])
    finishVite1 = undefined

    const loadPromise = page.waitForEvent('load', { timeout: 10000 })
    finishVite2 = await startVite()

    await loadPromise
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
