import { defineConfig } from '@playwright/test'

/**
 * 아주 작은 컨테이너(스레드 제한)에서는 크로미움을 단일 프로세스로 띄웁니다.
 * 일반 개발·CI 에서는 그대로 두고, 필요할 때만 PW_LOW_RESOURCE=1 로 실행하세요.
 */
const LOW_RESOURCE = process.env.PW_LOW_RESOURCE === '1'
const launchArgs = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  ...(LOW_RESOURCE ? ['--disable-gpu', '--single-process', '--no-zygote'] : []),
]

/**
 * E2E — 실제 화면에서 엔딩·티키타카·조사 처리를 확인합니다.
 * `npm run test:e2e` 로 실행합니다 (개발 서버를 자동으로 띄웁니다).
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 900 },
    trace: 'off',
    launchOptions: { args: launchArgs },
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
