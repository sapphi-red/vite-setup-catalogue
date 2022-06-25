import type { PlaywrightTestConfig } from '@playwright/test'
import { useNodeModulesOutsideContainer } from './utils/index.js'

if (useNodeModulesOutsideContainer) {
  console.warn('Warning: Using local node_modules. It only works with linux.')
}

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    headless: process.env.DEBUG !== '1'
  }
}
export default config
