import type { FullConfig } from '@playwright/test'
import fs from 'fs/promises'
import { tempDirName, editFile } from './utils/index.js'
import fsExtra from 'fs-extra'
import url from 'url'

const addPollingToConfig = (content: string) => {
  const re = /^export default (defineConfig\({(.*)}\))$/ms
  if (!re.test(content)) throw new Error('Failed to add polling to config')

  return content.replace(
    re,
    `
const pollingConfig = config => {
  config.server ??= {}
  config.server.watch ??= {}
  config.server.usePolling = true
  config.server.interval = 100
  return config
}
export default pollingConfig($1)
`
  )
}

async function globalSetup(_config: FullConfig) {
  const src = new URL('../examples/', import.meta.url)
  const dest = new URL(`../${tempDirName}/`, import.meta.url)

  await fs.rm(dest, { force: true, recursive: true })
  // fs.cp does not work well with symlinks
  await fsExtra.copy(url.fileURLToPath(src), url.fileURLToPath(dest), {
    recursive: true,
    dereference: false
  })

  const dirs = await fs.readdir(dest)
  await Promise.all(
    dirs.map(async (dir) => {
      await editFile(
        './vite.config.js',
        new URL(`./${dir}/`, dest),
        addPollingToConfig
      )
    })
  )
}

export default globalSetup
