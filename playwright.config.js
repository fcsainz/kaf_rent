// E2E de la interfaz (T-05, CLAUDE.md §7): Playwright contra el servidor local de tests/e2e, que ejecuta el código
// real del servidor sobre dobles de Google. Un solo worker: el servidor guarda estado y cada test lo reinicia.
const { defineConfig, devices } = require('@playwright/test');

const PUERTO = 4173;

module.exports = defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.js',
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PUERTO}`, trace: 'retain-on-failure' },
  webServer: {
    command: 'node tests/e2e/servidor.js',
    url: `http://localhost:${PUERTO}/__test/correos`,
    reuseExistingServer: !process.env.CI,
    env: { PUERTO_E2E: String(PUERTO), TZ: 'Europe/Madrid' },
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    // El uso real es sobre todo móvil (Motorola G85, Pixel 10, Redmi 9): ancho CSS aproximado del más estrecho.
    { name: 'movil', use: { ...devices['Pixel 7'], viewport: { width: 393, height: 851 }, screen: { width: 393, height: 851 } } },
  ],
});
