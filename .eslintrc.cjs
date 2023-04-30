module.exports = {
  root: true,
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  env: {
    node: true
  },
  overrides: [
    {
      files: ['**/*.cjs'],
      parserOptions: {
        sourceType: 'script'
      }
    },
    {
      files: ['**/*.{js,mjs,cjs}'],
      extends: ['eslint:recommended', 'prettier'],
      rules: {
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-empty': ['error', { allowEmptyCatch: true }]
      }
    },
    {
      files: ['**/*.{ts,mts,cts}'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:vitest/recommended',
        'prettier'
      ],
      rules: {
        'no-empty': ['error', { allowEmptyCatch: true }],
        '@typescript-eslint/no-unused-vars': 'off'
      }
    },
    {
      files: [
        'examples/**',
        'tests/examples-overrides/**',
        'tests/fixtures/**'
      ],
      excludedFiles: 'vite.config.{js,ts}',
      env: {
        browser: true
      }
    }
  ],
  reportUnusedDisableDirectives: true
}
