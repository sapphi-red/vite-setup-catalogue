import { test, expect } from '@playwright/test'
import type { DockerComposeProcess } from '../utils/index.js'
import {
  editFile,
  getWorkspaceFileURL,
  ports,
  waitUntilOutput,
  useNodeModulesOutsideContainer,
  runDockerCompose,
  gotoAndWaitForHMRConnection
} from '../utils/index.js'

const workspaceFileURL = getWorkspaceFileURL('with-proxy')
const accessURL = `http://localhost:${ports.withProxy}/`

let dockerComposeProcess: DockerComposeProcess

test.beforeAll(async () => {
  const overrideFile = useNodeModulesOutsideContainer
    ? ' -f ../../tests/fixtures/compose.with-proxy.yaml'
    : ''

  dockerComposeProcess = runDockerCompose(
    `-p with-proxy-dev -f compose.dev.yaml${overrideFile}`,
    workspaceFileURL
  )
  await waitUntilOutput(
    dockerComposeProcess.process.stdout,
    dockerComposeProcess.process.stderr,
    'Network:'
  )
})

test('with-proxy test', async ({ page }) => {
  await gotoAndWaitForHMRConnection(page, accessURL)

  const title = page.locator('h1')
  await expect(title).toHaveText('Hello Vite!')

  await editFile('./src/main.js', workspaceFileURL, (content) =>
    content.replace('Vite!</h1>', 'Vite!!!</h1>')
  )

  await expect(title).toHaveText('Hello Vite!!!')
})

test.afterAll(async () => {
  await dockerComposeProcess.down()
})
