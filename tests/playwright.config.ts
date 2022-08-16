import type { PlaywrightTestConfig } from '@playwright/test'
import { isDebug } from './utils/index.js'

const config: PlaywrightTestConfig = {
  globalSetup: './globalSetup.ts',
  globalTeardown: './globalTeardown.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: process.env.CI ? 120 * 1000 : undefined,
  testDir: '.',
  testMatch: '{examples-cases,fixtures-cases}/**/*.ts',
  use: {
    headless: !isDebug,
    ignoreHTTPSErrors: true // allow self-signed cert
  }
}
export default config
