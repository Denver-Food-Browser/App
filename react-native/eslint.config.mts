import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactNative from 'eslint-plugin-react-native'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import security from 'eslint-plugin-security'
import prettier from 'eslint-plugin-prettier/recommended'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,jsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      import: importPlugin,
      'jsx-a11y': jsxA11y,
      security: security,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,

      // React Rules
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/jsx-no-target-blank': 'error', // Security: prevent reverse tabnabbing
      'react/jsx-key': ['error', { checkFragmentShorthand: true }], // Require keys in lists
      'react/self-closing-comp': 'warn', // Enforce self-closing for components without children
      'react/jsx-boolean-value': ['warn', 'never'], // Prefer <Component prop /> over <Component prop={true} />
      'react/jsx-no-leaked-render': ['error', { validStrategies: ['ternary'] }], // Prevent {count && <Component />} bugs
      'react/jsx-no-useless-fragment': 'warn', // Remove unnecessary <></>

      // React Hooks Rules (CRITICAL for correctness)
      'react-hooks/rules-of-hooks': 'error', // Enforce hooks are called in the correct order
      'react-hooks/exhaustive-deps': 'warn', // Verify dependencies in useEffect, useCallback, useMemo

      // TypeScript Rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error', // Disallow 'any' type
      '@typescript-eslint/explicit-module-boundary-types': 'warn', // Require return types on exported functions
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Enums are not allowed. Use const objects or union types instead.',
        },
      ], // Disallow enums in favor of const objects or union types
      '@typescript-eslint/no-require-imports': 'off', // Allow require() for assets in React Native
      '@typescript-eslint/no-namespace': 'off', // Allow namespaces for React Navigation type augmentation
      '@typescript-eslint/no-empty-object-type': 'off', // Allow empty interfaces for type augmentation
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ], // Prefer "import type" for type-only imports
      '@typescript-eslint/no-floating-promises': 'error', // Require handling promises (async/await errors)
      '@typescript-eslint/await-thenable': 'error', // Prevent awaiting non-promises
      '@typescript-eslint/no-misused-promises': 'error', // Prevent promises in conditionals

      // Console & Debugging
      'no-console': 'warn', // Warn on console.log (should use proper logging in production)
      'no-debugger': 'error', // Disallow debugger statements

      // React Native Rules
      'react-native/no-inline-styles': 'warn',
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'warn',
      'react-native/no-color-literals': 'warn', // Encourage using theme/constants for colors
      'react-native/no-raw-text': 'off', // Allow raw text (can be strict for some projects)

      // Accessibility (a11y) - React Native specific
      'jsx-a11y/accessible-emoji': 'off', // Not applicable to RN
      'jsx-a11y/alt-text': 'warn', // Require alt text for images
      'jsx-a11y/anchor-has-content': 'off', // Not applicable to RN (no <a> tags)
      'jsx-a11y/anchor-is-valid': 'off', // Not applicable to RN
      'jsx-a11y/aria-props': 'error', // Valid ARIA props
      'jsx-a11y/aria-proptypes': 'error', // Valid ARIA prop values
      'jsx-a11y/aria-role': 'error', // Valid ARIA roles
      'jsx-a11y/aria-unsupported-elements': 'error', // ARIA not on unsupported elements
      'jsx-a11y/heading-has-content': 'warn', // Headings have content
      'jsx-a11y/iframe-has-title': 'off', // Not applicable to RN
      'jsx-a11y/img-redundant-alt': 'warn', // No "image" or "photo" in alt text
      'jsx-a11y/no-access-key': 'warn', // Avoid accessKey
      'jsx-a11y/no-autofocus': 'off', // Can be useful in RN
      'jsx-a11y/no-distracting-elements': 'warn', // No marquee/blink
      'jsx-a11y/no-redundant-roles': 'warn', // No redundant roles
      'jsx-a11y/role-has-required-aria-props': 'error', // Required ARIA props for roles
      'jsx-a11y/role-supports-aria-props': 'error', // Valid ARIA props for roles
      'jsx-a11y/tabindex-no-positive': 'warn', // No positive tabIndex

      // Security Rules
      'security/detect-buffer-noassert': 'error', // Unsafe Buffer usage
      'security/detect-child-process': 'warn', // Warn on child_process (unlikely in RN but good to know)
      'security/detect-disable-mustache-escape': 'error', // Template injection
      'security/detect-eval-with-expression': 'error', // eval() usage
      'security/detect-new-buffer': 'error', // Deprecated Buffer constructor
      'security/detect-no-csrf-before-method-override': 'warn', // CSRF vulnerabilities
      'security/detect-non-literal-fs-filename': 'warn', // Dynamic file paths
      'security/detect-non-literal-regexp': 'warn', // ReDoS vulnerabilities
      'security/detect-non-literal-require': 'warn', // Dynamic requires
      'security/detect-object-injection': 'off', // Too many false positives
      'security/detect-possible-timing-attacks': 'warn', // Timing attacks in comparisons
      'security/detect-pseudoRandomBytes': 'error', // Insecure random
      'security/detect-unsafe-regex': 'error', // ReDoS vulnerabilities

      // Import Organization
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ], // Organize imports consistently

      // General Code Quality
      'no-var': 'error', // Use let/const instead of var
      'prefer-const': 'warn', // Prefer const when variable is not reassigned
      eqeqeq: ['error', 'always'], // Require === and !== instead of == and !=
      'no-duplicate-imports': 'error', // Disallow duplicate imports
      'max-params': ['error', 2], // Enforce object parameters for functions with 3+ args
    },
  },
  // Disable specific rules for TypeScript declaration files
  {
    files: ['**/*.d.ts'],
    languageOptions: {
      parserOptions: {
        project: null, // Don't type-check .d.ts files
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off', // import() syntax is fine in .d.ts
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },
  prettier,
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'android/',
      'ios/',
      'dist/',
      'build/',
      'coverage/',
      '*.config.js',
      '*.config.mjs',
    ],
  },
)
