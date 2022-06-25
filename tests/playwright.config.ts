import type { PlaywrightTestConfig } from '@playwright/test'
import { useNodeModulesOutsideContainer, isDebug } from './utils/index.js'

if (useNodeModulesOutsideContainer) {
  console.warn('Warning: Using local node_modules. It only works with linux.')
}

const config: PlaywrightTestConfig = {
  globalSetup: './globalSetup.ts',
  globalTeardown: './globalTeardown.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  testDir: 'cases',
  testMatch: '**/*.ts',
  use: {
    headless: !isDebug
  }
}
export default config
