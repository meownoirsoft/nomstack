/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  webServer: {
    command: 'npm run preview -- --port 4173',
    port: 4173,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
};

export default config;
