import type {
  ChildProcess,
  ChildProcessWithoutNullStreams
} from 'child_process'
import stripAnsi from 'strip-ansi'
import kill from 'tree-kill'
import fs from 'fs/promises'
import { spawn } from 'cross-spawn'
import type { Page } from '@playwright/test'
import { test, expect } from '@playwright/test'

export const isDebug = process.env.DEBUG === '1'

/**
 * If local machine `node_modules` is mounted to container.
 * Normally `node_modules` needs to be installed inside container.
 * But that makes it difficult to use local built dependencies (For example, when you want to use Vite built on the main branch).
 * This only works when it is running on Linux
 */
export const useNodeModulesOutsideContainer =
  process.env.USE_NODE_MODULES_OUTSIDE_CONTAINER === '1'

const exampleTempDirName = '.examples-temp'
export const exampleTempDir = new URL(`../../${exampleTempDirName}/`, import.meta.url)
const fixtureTempDirName = '.fixtures-temp'
export const fixtureTempDir = new URL(`../${fixtureTempDirName}/`, import.meta.url)

export const recordedLogs: string[] = []
export const printRecordedLogs = () => {
  recordedLogs.forEach((l) => {
    console.log(l)
  })
  recordedLogs.length = 0
}

export const getWorkspaceFileURL = (type: 'example' | 'fixture', directoryName: string) => {
  if (type === 'example') {
    return new URL(`${directoryName}/`, exampleTempDir)
  }
  return new URL(`${directoryName}/`, fixtureTempDir)
}

const collectOutput = (readable: NodeJS.ReadableStream): CollectedOutput => {
  let result = { total: '' }
  ;(async () => {
    for await (const chunk of readable) {
      result.total += chunk
    }
  })()
  return result
}

export const collectAndWaitUntilOutput = async (
  stdout: NodeJS.ReadableStream,
  stderr: NodeJS.ReadableStream,
  match: string | RegExp,
  options?: { intervals?: number[]; timeout?: number }
) => {
  const stdoutC = collectOutput(stdout)
  const stderrC = collectOutput(stderr)
  await waitUntilOutput(stdoutC, stderrC, match, options)
}

type CollectedOutput = { total: string }

export const waitUntilOutput = async (
  stdout: CollectedOutput,
  stderr: CollectedOutput,
  match: string | RegExp,
  options?: { intervals?: number[]; timeout?: number }
) => {
  try {
    await expect.poll(() => stripAnsi(stdout.total), options).toMatch(match)
  } catch (e) {
    throw new Error(
      `${e}\n` +
        `Expected output not found. Output:\n${stripAnsi(
          stdout.total
        )}\nError Output:\n${stripAnsi(stderr.total)}`
    )
  }
}

export const outputError = (page: Page) => {
  page.on('console', (msg) => {
    let currentTestTitle = '---'
    try {
      currentTestTitle = test.info().titlePath.join(' > ')
    } catch {}

    const text = msg.text()
    if (msg.type() === 'error') {
      if (isDebug) {
        console.info(
          `[test: ${JSON.stringify(currentTestTitle)}][Browser error] ${text}`
        )
      }
    }
  })
}

type GotoOptions = Parameters<Page['goto']>[1]

export const gotoAndWaitForHMRConnection = async (
  page: Page,
  url: string,
  options?: GotoOptions
) => {
  const [, res] = await Promise.all([
    waitForHMRConnection(page, options?.timeout),
    page.goto(url, options)
  ])
  return res
}

export const waitForHMRConnection = (page: Page, timeout?: number) => {
  return page.waitForEvent('console', {
    // sometime the `msg.type()` is 'log', most time it is 'debug'
    predicate: (msg) => msg.text() === '[vite] connected.',
    timeout
  })
}

export type DockerComposeProcess = {
  process: ChildProcessWithoutNullStreams
  stdout: CollectedOutput
  stderr: CollectedOutput
  recordLogs: () => void
  down: () => Promise<void>
}

export const runDockerCompose = (
  options: string,
  cwd: string | URL
): DockerComposeProcess => {
  const process = spawn(
    'docker',
    `compose ${options} up --abort-on-container-exit`.split(' '),
    { cwd }
  )

  const stdout = collectOutput(process.stdout)
  const stderr = collectOutput(process.stderr)

  return {
    process,
    stdout,
    stderr,
    recordLogs: () => {
      recordedLogs.push('------')
      recordedLogs.push('Docker compose stdout:')
      recordedLogs.push(stripAnsi(stdout.total))
      recordedLogs.push('------')
      recordedLogs.push('Docker compose stderr:')
      recordedLogs.push(stripAnsi(stderr.total))
      recordedLogs.push('------')
    },
    down: async () => {
      process.kill()

      const downProcess = spawn(
        'docker',
        `compose ${options} down`.split(' '),
        { cwd }
      )
      await new Promise<void>((resolve, reject) => {
        downProcess.on('exit', (code) => {
          if (code !== null && code !== 0) {
            reject(
              new Error(`docker compose down failed with exit code ${code}`)
            )
          }
          resolve()
        })
      })
    }
  }
}

export const killProcess = (process: ChildProcess) => {
  return new Promise<void>((resolve, reject) => {
    if (process.pid === undefined) {
      resolve()
      return
    }

    kill(process.pid!, (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

export const editFile = async (
  file: string,
  workspaceFileURL: URL,
  replacer: (content: string) => string
) => {
  const fileURL = new URL(file, workspaceFileURL)
  const content = await fs.readFile(fileURL, 'utf-8')
  const newContent = replacer(content)
  await fs.writeFile(fileURL, newContent)
}

/**
 * Make sure these don't conflict each other to run tests parallelly.
 */
export const ports = {
  basic: 5173,
  backendServer: 3000, // vite: 5183
  middlewareMode: 3010,
  withProxy: 3030,
  withProxyNoWebSocket: 3040 // vite: 5193
}
