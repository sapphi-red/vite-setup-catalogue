import type {
  ChildProcess,
  ChildProcessWithoutNullStreams
} from 'child_process'
import stripAnsi from 'strip-ansi'
import kill from 'tree-kill'
import fs from 'fs/promises'
import { spawn } from 'cross-spawn'
import type { Page } from '@playwright/test'
import { test, expect, errors } from '@playwright/test'

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
export const exampleTempDir = new URL(
  `../../${exampleTempDirName}/`,
  import.meta.url
)
const fixtureTempDirName = '.fixtures-temp'
export const fixtureTempDir = new URL(
  `../${fixtureTempDirName}/`,
  import.meta.url
)

export const recordedLogs: string[] = []
export const printRecordedLogs = () => {
  recordedLogs.forEach(l => {
    console.log(l)
  })
  recordedLogs.length = 0
}

const browserLogs: Array<{ type: string; text: string }> = []

export const getWorkspaceFileURL = (
  type: 'example' | 'fixture',
  directoryName: string
) => {
  if (type === 'example') {
    return new URL(`${directoryName}/`, exampleTempDir)
  }
  return new URL(`${directoryName}/`, fixtureTempDir)
}

const collectOutput = (readable: NodeJS.ReadableStream): CollectedOutput => {
  const result = { total: '' }
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
  await waitUntilOutput(
    { stdout: collectOutput(stdout), stderr: collectOutput(stderr) },
    'stdout',
    match,
    options
  )
}

type CollectedOutput = { total: string }

export const waitUntilOutput = async (
  stdouts: { stdout: CollectedOutput; stderr: CollectedOutput },
  outType: 'stdout' | 'stderr',
  match: string | RegExp,
  options?: { intervals?: number[]; timeout?: number }
) => {
  try {
    await expect
      .poll(() => stripAnsi(stdouts[outType].total), options)
      .toMatch(match)
  } catch (e) {
    throw new Error(
      `${e}\n` +
        `Expected output not found. Output:\n${stripAnsi(
          stdouts.stdout.total
        )}\n` +
        `Error Output:\n${stripAnsi(stdouts.stderr.total)}`
    )
  }
}

export const collectBrowserLogs = (page: Page) => {
  browserLogs.length = 0

  const getCurrentTestTitle = () => {
    let currentTestTitle = '---'
    try {
      currentTestTitle = test.info().titlePath.join(' > ')
    } catch {}
    return currentTestTitle
  }

  page.on('pageerror', err => {
    const currentTestTitle = getCurrentTestTitle()
    console.info(
      `[test: ${JSON.stringify(currentTestTitle)}][Browser page error]`,
      err
    )
  })

  page.on('console', msg => {
    const currentTestTitle = getCurrentTestTitle()
    const type = msg.type()
    const text = msg.text()
    if (type === 'error') {
      if (isDebug) {
        console.info(
          `[test: ${JSON.stringify(
            currentTestTitle
          )}][Browser console error] ${text}`
        )
      }
    }
    browserLogs.push({ type, text })
  })
}

export const createSetupAndGotoPage =
  (accessURL: string, timeout: number) =>
  async (
    page: Page,
    {
      waitUntil
    }: {
      waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit'
    } = {}
  ) => {
    collectBrowserLogs(page)
    await gotoAndWaitForHMRConnection(page, accessURL, {
      timeout,
      waitUntil
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

export const waitForHMRConnection = async (page: Page, timeout?: number) => {
  try {
    await page.waitForEvent('console', {
      // sometime the `msg.type()` is 'log', most time it is 'debug'
      predicate: msg => msg.text() === '[vite] connected.',
      timeout
    })
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((e as any).name === 'TimeoutError') {
      console.warn('waitForHMRConnection timeout:', browserLogs)
    } else {
      throw e
    }
  }
}

export const waitForHMRPolling = async (page: Page, timeout = 30000) => {
  try {
    await page.waitForEvent('console', {
      predicate: msg =>
        msg.text() === '[vite] server connection lost. polling for restart...',
      timeout
    })
  } catch (e) {
    if (e instanceof errors.TimeoutError) {
      console.warn('waitForHMRPolling timeout:', browserLogs)
    } else {
      throw e
    }
  }
}

export type DockerComposeProcess = {
  process: ChildProcessWithoutNullStreams
  stdout: CollectedOutput
  stderr: CollectedOutput
  recordLogs: () => void
  down: () => Promise<void>
}

export const runDockerCompose = async (
  options: string,
  cwd: string | URL
): Promise<DockerComposeProcess> => {
  // ensure there isn't any conflict with container name
  await new Promise<void>(resolve => {
    const downProcess = spawn(
      'docker',
      `compose ${options} -v down`.split(' '),
      {
        cwd
      }
    )
    downProcess.once('exit', () => {
      resolve()
    })
  })

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
      const success = process.kill('SIGINT')
      if (!success) {
        console.warn('failed to sigint docker compose')
      }

      const downProcess = spawn(
        'docker',
        `compose ${options} -v down`.split(' '),
        { cwd }
      )
      await new Promise<void>((resolve, reject) => {
        downProcess.once('exit', code => {
          if (code !== null && code !== 0) {
            reject(
              new Error(`docker compose down failed with exit code ${code}`)
            )
            return
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

    kill(process.pid, err => {
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
  /* examples */
  basic: 5173,
  backendServer: 3000, // vite: 5183
  middlewareMode: 3010,
  withProxy: 3030,
  withProxyNoWebSocket: 3040, // vite: 5193

  /* fixtures */
  backendHttpsViteHttp: 7002, // vite: 7001
  middlewareModeWithSeparatedVite: 7004 // vite: 7003
}
