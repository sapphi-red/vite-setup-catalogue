import { test, expect } from '@playwright/test'
import type { DockerComposeProcess } from './utils/index.js'
import { runDockerCompose } from './utils/index.js'
import {
  editFile,
  getWorkspaceFileURL,
  ports,
  waitUntilOutput
} from './utils/index.js'

const workspaceFileURL = getWorkspaceFileURL('with-proxy')
const accessURL = `http://localhost:${ports.withProxy}/`

let dockerComposeProcess: DockerComposeProcess

test.beforeAll(async () => {
  dockerComposeProcess = runDockerCompose(
    '-p with-proxy-dev -f compose.dev.yaml',
    workspaceFileURL
  )
  await waitUntilOutput(
    dockerComposeProcess.process.stdout,
    dockerComposeProcess.process.stderr,
    'Network:'
  )
})

test('with-proxy test', async ({ page }) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await page.goto(accessURL)
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

  await dockerComposeProcess.down()
})
