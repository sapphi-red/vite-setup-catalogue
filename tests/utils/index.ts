import type {
  ChildProcess,
  ChildProcessWithoutNullStreams
} from 'child_process'
import stripAnsi from 'strip-ansi'
import kill from 'tree-kill'
import fs from 'fs/promises'
import { spawn } from 'cross-spawn'

export const getWorkspaceFileURL = (directoryName: string) => {
  return new URL(`../../${directoryName}/`, import.meta.url)
}

export const waitUntilOutput = async (
  stdout: NodeJS.ReadableStream,
  stderr: NodeJS.ReadableStream,
  match: string | string[]
) => {
  let out = ''
  let err = ''
  const m = Array.isArray(match) ? match : [match]

  ;(async () => {
    for await (const chunk of stderr) {
      err += chunk
    }
  })()

  for await (const chunk of stdout) {
    out += chunk

    const text = stripAnsi(out)
    if (m.every((v) => text.includes(v))) {
      return text
    }
  }

  throw new Error(
    `Expected output not found. Expected: ${JSON.stringify(
      match
    )}. Output:\n${stripAnsi(out)}\nError Output:\n${stripAnsi(err)}`
  )
}

export type DockerComposeProcess = {
  process: ChildProcessWithoutNullStreams
  down: () => Promise<void>
}

export const runDockerCompose = (
  options: string,
  cwd: string | URL
): DockerComposeProcess => {
  const process = spawn('docker', `compose ${options} up`.split(' '), { cwd })

  return {
    process,
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