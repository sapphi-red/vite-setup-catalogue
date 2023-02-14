import type { FullConfig } from '@playwright/test'
import fs from 'fs/promises'
import {
  useNodeModulesOutsideContainer,
  exampleTempDir,
  fixtureTempDir,
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

const setupExamples = async () => {
  const src = new URL('../examples/', import.meta.url)
  const overrideSrc = new URL('./examples-overrides/', import.meta.url)

  await fs.rm(exampleTempDir, { force: true, recursive: true })
  // fs.cp does not work well with symlinks
  await fsExtra.copy(
    url.fileURLToPath(src),
    url.fileURLToPath(exampleTempDir),
    {
      dereference: false
    }
  )
  await fsExtra.copy(
    url.fileURLToPath(overrideSrc),
    url.fileURLToPath(exampleTempDir),
    {
      dereference: false
    }
  )

  const dirs = await fs.readdir(exampleTempDir)
  await Promise.all(
    dirs.map(async dir => {
      await editFile(
        './vite.config.js',
        new URL(`./${dir}/`, exampleTempDir),
        addPollingToConfig
      )
    })
  )
}

const setupFixtures = async () => {
  const src = new URL('./fixtures/', import.meta.url)

  await fs.rm(fixtureTempDir, { force: true, recursive: true })
  // fs.cp does not work well with symlinks
  await fsExtra.copy(
    url.fileURLToPath(src),
    url.fileURLToPath(fixtureTempDir),
    {
      dereference: false
    }
  )
}

async function globalSetup(_config: FullConfig) {
  if (useNodeModulesOutsideContainer) {
    console.warn('Warning: Using local node_modules. It only works with linux.')
  }

  try {
    await Promise.all([setupExamples(), setupFixtures()])
  } catch (e) {
    console.error('globalSetup error')
    throw e
  }
}

export default globalSetup
