// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import vitest from '@vitest/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  {
    languageOptions: {
      sourceType: 'module'
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error'
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    files: ['**/*.{js,mjs}'],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  {
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/member-delimiter-style': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }]
    }
  },
  {
    files: [
      'examples/**/*.{js,mjs}',
      'tests/examples-overrides/**/*.{js,mjs}',
      'tests/fixtures/**/*.{js,mjs}'
    ],
    languageOptions: {
      globals: globals.browser
    }
  },
  {
    files: [
      'examples/**/backend-src/**/*.{js,mjs}',
      'examples/**/server.{js,mjs}'
    ],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ['tests/**/*.{js,ts}'],
    ...vitest.configs.recommended
  },
  eslintConfigPrettier,
  {
    ignores: ['dist/**', '.examples-temp/**', 'tests/.fixtures-temp/**']
  }
)
