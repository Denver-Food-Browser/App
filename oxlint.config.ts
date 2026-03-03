import { defineConfig } from 'oxlint'

export default defineConfig({
  ignorePatterns: ['**/bun.lock', '**/bun.lockb', 'bun.lock', 'bun.lockb'],
  overrides: [
    {
      files: ['**/*.svelte'],
      rules: {
        'eslint/prefer-const': 'off',
      },
    },
  ],
  categories: {
    perf: 'warn',
    style: 'warn',
    nursery: 'warn',
    pedantic: 'warn',
    suspicious: 'error',
    correctness: 'error',
    restriction: 'error',
  },
  globals: {
    /* JavaScript */
    fetch: 'readonly',
    prompt: 'readonly',
    Promise: 'readonly',
    console: 'readonly',

    /* Bun */
    Bun: 'readonly',
    process: 'readonly',
    AbortSignal: 'readonly',
    TextDecoder: 'readonly',

    /* Svelte Runes */
    $host: 'readonly',
    $props: 'readonly',
    $state: 'readonly',
    $effect: 'readonly',
    $derived: 'readonly',
    $inspect: 'readonly',
    $bindable: 'readonly',
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
  rules: {
    'eslint/curly': 'off',
    'eslint/no-void': 'off',
    'eslint/no-alert': 'off',
    'eslint/sort-keys': 'off',
    'eslint/func-style': 'off',
    'eslint/no-ternary': 'off',
    'unicorn/no-null': 'allow',
    'eslint/no-continue': 'off',
    'oxc/no-async-await': 'off',
    'eslint/no-undefined': 'off',
    'eslint/sort-imports': 'off',
    'eslint/no-unused-vars': 'error',
    'unicorn/prefer-ternary': 'off',
    'eslint/no-inline-comments': 'off',
    'no-rest-spread-properties': 'off',
    'eslint/init-declarations': 'allow',
    'eslint/capitalized-comments': 'off',
    'eslint/no-negated-condition': 'off',
    'eslint/max-lines-per-function': 'off',
    'unicorn/prefer-top-level-await': 'off',
    'unicorn/no-unreadable-array-destructuring': 'allow',
    '@typescript-eslint/no-unnecessary-condition': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    'eslint/id-length': ['warn', { min: 2, exceptions: ['_', 'i', 'j', 'k'] }],
    'eslint/max-lines': ['warn', { max: 450 }],
    'eslint/max-statements': ['warn', { max: 12 }],
    'eslint/no-magic-numbers': [
      'warn',
      {
        ignore: [0, 1, 2, -1], // oxlint-disable-line eslint/no-magic-numbers -- meta, eh?
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        enforceConst: true,
      },
    ],
  },
})
