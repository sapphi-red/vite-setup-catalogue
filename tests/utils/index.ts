import type {
  ChildProcess,
  ChildProcessWithoutNullStreams
} from 'child_process'
import stripAnsi from 'strip-ansi'
import kill from 'tree-kill'
import fs from 'fs/promises'
import { spawn } from 'cross-spawn'
import type { Page } from '@playwright/test'

export const isDebug = process.env.DEBUG === '1'

/**
 * If local machine `node_modules` is mounted to container.
 * Normally `node_modules` needs to be installed inside container.
 * But that makes it difficult to use local built dependencies (For example, when you want to use Vite built on the main branch).
 * This only works when it is running on Linux
 */
export const useNodeModulesOutsideContainer =
  process.env.USE_NODE_MODULES_OUTSIDE_CONTAINER === '1'

export const tempDirName = '.examples-temp'

export const getWorkspaceFileURL = (directoryName: string) => {
  return new URL(`../../${tempDirName}/${directoryName}/`, import.meta.url)
}

const collectOutput = (readable: NodeJS.ReadableStream) => {
  let result = { total: '' }
  ;(async () => {
    for await (const chunk of readable) {
      result.total += chunk
    }
  })()
  return result
}

type ReadableStreamWithCurrent = {
  current: { total: string }
  stream: NodeJS.ReadableStream
}
export const waitUntilOutput = async (
  stdout: ReadableStreamWithCurrent,
  stderr: ReadableStreamWithCurrent,
  match: string | string[]
) => {
  const m = Array.isArray(match) ? match : [match]

  const text = stripAnsi(stdout.current.total)
  if (m.every((v) => text.includes(v))) {
    return text
  }

  for await (const _ of stdout.stream) {
    const text = stripAnsi(stdout.current.total)
    if (m.every((v) => text.includes(v))) {
      return text
    }
  }

  throw new Error(
    `Expected output not found. Expected: ${JSON.stringify(
      match
    )}. Output:\n${stripAnsi(stdout.current.total)}\nError Output:\n${stripAnsi(
      stderr.current.total
    )}`
  )
}

export const outputError = (page: Page) => {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.warn(`[Browser error] ${msg.text()}`)
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
  stdout: ReadableStreamWithCurrent
  stderr: ReadableStreamWithCurrent
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

  return {
    process,
    stdout: { current: collectOutput(process.stdout), stream: process.stdout },
    stderr: { current: collectOutput(process.stderr), stream: process.stderr },
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
