import type { FullConfig } from '@playwright/test'
import fs from 'fs/promises'
import { isDebug, exampleTempDir, fixtureTempDir } from './utils/index.js'

async function globalTeardown(_config: FullConfig) {
  if (!isDebug) {
    try {
      await fs.rm(exampleTempDir, { force: true, recursive: true })
      await fs.rm(fixtureTempDir, { force: true, recursive: true })
    } catch (e) {
      console.warn('globalTeardown error', e)
    }
  }
}

export default globalTeardown
