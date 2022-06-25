import type { FullConfig } from '@playwright/test'
import fs from 'fs/promises'
import { tempDirName } from './utils/index.js'

async function globalTeardown(_config: FullConfig) {
  const dest = new URL(`../${tempDirName}/`, import.meta.url)

  await fs.rm(dest, { force: true, recursive: true })
}

export default globalTeardown
