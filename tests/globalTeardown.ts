import type { FullConfig } from '@playwright/test'
import fs from 'fs/promises'
import { isDebug, tempDirName } from './utils/index.js'

async function globalTeardown(_config: FullConfig) {
  const dest = new URL(`../${tempDirName}/`, import.meta.url)

  if (!isDebug) {
    await fs.rm(dest, { force: true, recursive: true })
  }
}

export default globalTeardown
