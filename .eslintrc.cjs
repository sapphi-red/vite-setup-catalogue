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
        'plugin:@typescript-eslint/stylistic',
        'plugin:vitest/recommended',
        'prettier'
      ],
      rules: {
        'no-empty': ['error', { allowEmptyCatch: true }],
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
        '@typescript-eslint/consistent-type-definitions': ['error', 'type']
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
