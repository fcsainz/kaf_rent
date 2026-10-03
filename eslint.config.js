// ESLint (T-07, CLAUDE.md §7.1): estilo y patrones prohibidos en el código de Apps Script. Solo desarrollo.
// Apps Script comparte un único ámbito global entre los .gs de un proyecto: lo que declara un fichero es global en
// los demás del mismo proyecto. Hay dos proyectos: KAF Rent y el script del Form de viajeros (ADR-0021).
const fs = require('fs');
const path = require('path');
const js = require('@eslint/js');

const PROYECTOS = ['docs_dev/src', 'docs_dev/src_form_checkin'];
const SERVICIOS_GOOGLE = ['SpreadsheetApp', 'DriveApp', 'CalendarApp', 'MailApp', 'LockService', 'Session', 'Utilities',
  'HtmlService', 'ScriptApp', 'PropertiesService', 'UrlFetchApp', 'XmlService', 'FormApp', 'Logger'];

const ficherosGs = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.gs'));
const declaradasEn = (dir, fichero) => [...fs.readFileSync(path.join(dir, fichero), 'utf8')
  .matchAll(/^(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/gm)].map((m) => m[1]);

// Globales de un fichero: servicios de Google y lo que declaran los demás .gs de su proyecto (no lo propio).
const globalesPara = (dir, fichero) => Object.fromEntries([
  ...SERVICIOS_GOOGLE.map((g) => [g, 'readonly']),
  ...ficherosGs(dir).filter((f) => f !== fichero).flatMap((f) => declaradasEn(dir, f)).map((g) => [g, 'readonly']),
]);

const REGLAS = {
  ...js.configs.recommended.rules,
  'no-var': 'error',
  'prefer-const': 'error',
  eqeqeq: ['error', 'always'],
  // Los endpoints y las entradas del sistema se usan desde fuera (cliente, triggers): solo se vigilan las locales.
  'no-unused-vars': ['error', { vars: 'local', args: 'after-used', caughtErrors: 'none' }],
  'no-restricted-syntax': ['error',
    { selector: 'CallExpression[callee.property.name=/^(getValue|setValue)$/] :matches(ForStatement, ForOfStatement) *', message: 'Nada de getValue/setValue en bucles (CLAUDE.md §4.4).' },
    { selector: 'Literal[value=/^1[A-Za-z0-9_-]{40,}$/]', message: 'IDs de Google en el código: van en Config o en las propiedades del script (CLAUDE.md §4.8).' },
  ],
};

module.exports = PROYECTOS.flatMap((dir) => ficherosGs(dir).map((fichero) => ({
  files: [`${dir}/${fichero}`],
  languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globalesPara(dir, fichero), console: 'readonly' } },
  rules: REGLAS,
})));
