import type { FullConfig } from '@playwright/test'
import fs from 'fs/promises'
import {
  useNodeModulesOutsideContainer,
  tempDirName,
  editFile
} from './utils/index.js'
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
  config.server.watch.usePolling = true
  config.server.watch.interval = 100

  // FIXME: needs to change otherwise docker tests will fail with "EACCES: permission denied, mkdir"
  config.cacheDir = '.cache/vite'
  return config
}
export default pollingConfig($1)
`
  )
}

async function globalSetup(_config: FullConfig) {
  if (useNodeModulesOutsideContainer) {
    console.warn('Warning: Using local node_modules. It only works with linux.')
  }

  const src = new URL('../examples/', import.meta.url)
  const overrideSrc = new URL('./fixture-overrides/', import.meta.url)
  const dest = new URL(`../${tempDirName}/`, import.meta.url)

  await fs.rm(dest, { force: true, recursive: true })
  // fs.cp does not work well with symlinks
  await fsExtra.copy(url.fileURLToPath(src), url.fileURLToPath(dest), {
    recursive: true,
    dereference: false
  })
  await fsExtra.copy(url.fileURLToPath(overrideSrc), url.fileURLToPath(dest), {
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
