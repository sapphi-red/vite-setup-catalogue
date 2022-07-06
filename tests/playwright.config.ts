import type { PlaywrightTestConfig } from '@playwright/test'
import { isDebug } from './utils/index.js'

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
