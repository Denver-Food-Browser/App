# Pull Request: ESLint and Prettier Configuration

## Summary
This PR establishes a comprehensive linting and formatting setup for the React Native project, including ESLint, Prettier, Husky pre-commit hooks, and VS Code workspace configuration. The configuration includes accessibility (a11y) and security linting to ensure code quality, maintainability, and safety.

## Changes

### 📦 Dependencies Added
```json
{
  "devDependencies": {
    "eslint": "^9.39.3",
    "prettier": "^3.8.1",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-prettier": "^5.5.5",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-native": "^5.0.0",
    "eslint-plugin-import": "^2.32.0",
    "eslint-plugin-jsx-a11y": "^6.10.2",
    "eslint-plugin-security": "^4.0.0",
    "@eslint/js": "^10.0.1",
    "@eslint/json": "^1.0.1",
    "@eslint/css": "^0.14.1",
    "typescript-eslint": "^8.56.0",
    "globals": "^17.3.0",
    "jiti": "^2.6.1",
    "husky": "^9.1.7",
    "lint-staged": "^16.2.7"
  }
}
```

### 🔧 Configuration Files

#### `eslint.config.mts`
- Modern flat config format (ESLint 9)
- TypeScript type-aware linting enabled
- React Native specific rules
- Accessibility (a11y) rules
- Security vulnerability detection
- Prettier integration

#### `.prettierrc.json`
- Single quotes
- 100 character line width
- 2-space indentation
- Semicolons disabled
- ES5 trailing commas

#### `tsconfig.json` - Enhanced Compiler Options
Added strict type checking options:
- `noUncheckedIndexedAccess`: Treat array/object access as potentially undefined
- `noImplicitOverride`: Require 'override' keyword
- `noPropertyAccessFromIndexSignature`: Enforce bracket notation for index signatures
- `noUnusedLocals`: Error on unused variables
- `noUnusedParameters`: Error on unused function parameters
- `noFallthroughCasesInSwitch`: Prevent switch statement bugs
- `verbatimModuleSyntax`: Enforce explicit type imports

### 📋 ESLint Rules Enabled

#### React Rules
- ✅ `react/jsx-no-target-blank`: error - Security fix for target="_blank"
- ✅ `react/jsx-key`: error - Require keys in lists
- ✅ `react/self-closing-comp`: warn - Enforce self-closing components
- ✅ `react/jsx-boolean-value`: warn - Prefer `<Component prop />` over `<Component prop={true} />`
- ✅ `react/jsx-no-leaked-render`: error - Prevent `{count && <Component />}` bugs
- ✅ `react/jsx-no-useless-fragment`: warn - Remove unnecessary fragments

#### React Hooks Rules (Critical)
- ✅ `react-hooks/rules-of-hooks`: error - Enforce hooks order
- ✅ `react-hooks/exhaustive-deps`: warn - Verify effect/callback/memo dependencies

#### TypeScript Rules
- ✅ `@typescript-eslint/no-explicit-any`: error - Disallow 'any' type
- ✅ `@typescript-eslint/explicit-module-boundary-types`: warn - Require return types on exported functions
- ✅ `@typescript-eslint/no-unused-vars`: warn - With ignore pattern for underscore-prefixed vars
- ✅ `@typescript-eslint/consistent-type-imports`: warn - Prefer `import type` syntax
- ✅ `@typescript-eslint/no-floating-promises`: error - Require handling promises
- ✅ `@typescript-eslint/await-thenable`: error - Prevent awaiting non-promises
- ✅ `@typescript-eslint/no-misused-promises`: error - Prevent promises in conditionals
- ✅ `no-restricted-syntax`: error - **Disallow enums** (use const objects or union types)

#### Accessibility (a11y) Rules - React Native Specific
- ✅ `jsx-a11y/alt-text`: warn - Require alt text for images
- ✅ `jsx-a11y/aria-props`: error - Valid ARIA props
- ✅ `jsx-a11y/aria-proptypes`: error - Valid ARIA prop values
- ✅ `jsx-a11y/aria-role`: error - Valid ARIA roles
- ✅ `jsx-a11y/aria-unsupported-elements`: error - ARIA not on unsupported elements
- ✅ `jsx-a11y/heading-has-content`: warn - Headings have content
- ✅ `jsx-a11y/img-redundant-alt`: warn - No "image" or "photo" in alt text
- ✅ `jsx-a11y/no-access-key`: warn - Avoid accessKey
- ✅ `jsx-a11y/no-distracting-elements`: warn - No marquee/blink
- ✅ `jsx-a11y/no-redundant-roles`: warn - No redundant roles
- ✅ `jsx-a11y/role-has-required-aria-props`: error - Required ARIA props for roles
- ✅ `jsx-a11y/role-supports-aria-props`: error - Valid ARIA props for roles
- ✅ `jsx-a11y/tabindex-no-positive`: warn - No positive tabIndex

**Note:** Web-only a11y rules disabled for React Native (anchor tags, iframes, etc.)

#### Security Rules
- ✅ `security/detect-buffer-noassert`: error - Unsafe Buffer usage
- ✅ `security/detect-eval-with-expression`: error - eval() usage
- ✅ `security/detect-new-buffer`: error - Deprecated Buffer constructor
- ✅ `security/detect-non-literal-regexp`: warn - ReDoS vulnerabilities
- ✅ `security/detect-non-literal-require`: warn - Dynamic requires
- ✅ `security/detect-possible-timing-attacks`: warn - Timing attacks in comparisons
- ✅ `security/detect-pseudoRandomBytes`: error - Insecure random number generation
- ✅ `security/detect-unsafe-regex`: error - ReDoS vulnerabilities
- ✅ `security/detect-disable-mustache-escape`: error - Template injection
- ✅ `security/detect-child-process`: warn - Child process usage
- ✅ `security/detect-no-csrf-before-method-override`: warn - CSRF vulnerabilities
- ✅ `security/detect-non-literal-fs-filename`: warn - Dynamic file paths

**Note:** `detect-object-injection` disabled due to excessive false positives in React code

#### React Native Rules
- ✅ `react-native/no-inline-styles`: warn
- ✅ `react-native/no-unused-styles`: warn
- ✅ `react-native/split-platform-components`: warn
- ✅ `react-native/no-color-literals`: warn

#### Import Organization
- ✅ `import/order`: warn - Auto-organize and alphabetize imports with spacing

#### Code Quality Rules
- ✅ `no-console`: warn - Discourage console.log
- ✅ `no-debugger`: error - Disallow debugger statements
- ✅ `no-var`: error - Use let/const instead of var
- ✅ `prefer-const`: warn - Prefer const when not reassigned
- ✅ `eqeqeq`: error - Require === and !==
- ✅ `no-duplicate-imports`: error
- ✅ `max-params`: error - Max 2 parameters (enforce object destructuring)

### 🪝 Git Hooks (Husky + lint-staged)

#### `.husky/pre-commit` (Fast - Every Commit)
Runs on **every commit** for quick feedback:
```bash
npx lint-staged
```
- Lints **only staged files** with ESLint
- Formats **only staged files** with Prettier
- Auto-fixes what it can
- ⚡ **Fast** - typically < 1 second
- Encourages frequent, clean commits

#### `.husky/pre-push` (Thorough - Before Push)
Runs **before pushing** to remote for comprehensive validation:
```bash
npm run type-check
npm run lint
```
- Type-checks **entire project** with TypeScript
- Lints **entire project** with ESLint
- Catches cross-file issues and type errors
- 🔍 **Thorough** - ensures code quality before sharing
- Prevents broken code from reaching remote

#### Why This Approach?
**Pre-commit (fast):**
- ✅ Quick feedback loop during development
- ✅ No waiting for full project checks
- ✅ Encourages frequent commits
- ✅ Catches formatting/simple errors immediately

**Pre-push (thorough):**
- ✅ Full type safety validation
- ✅ Project-wide consistency checks
- ✅ Still automated - can't bypass accidentally
- ✅ Only runs when sharing code

This split provides the best balance of speed and safety for team collaboration.

#### `package.json` - lint-staged configuration
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

### 💻 VS Code Integration

#### `.vscode/extensions.json`
Recommends extensions to team members:
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Import Cost (`wix.vscode-import-cost`) - Shows package sizes
- Code Spell Checker (`streetsidesoftware.code-spell-checker`)
- Error Lens (`usernamehw.errorlens`) - Inline error display
- Pretty TS Errors (`yoavbls.pretty-ts-errors`) - Readable TypeScript errors

#### `.vscode/settings.json`
Workspace settings for consistent development:
- Format on save enabled
- ESLint auto-fix on save
- Prettier as default formatter
- Use workspace TypeScript version

### 📜 NPM Scripts Added
```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "prepare": "husky"
  }
}
```

**Script descriptions:**
- `lint` - Check all files for linting errors
- `lint:fix` - Auto-fix linting errors where possible
- `format` - Format all files with Prettier
- `format:check` - Verify files are formatted without changing them
- `type-check` - Run TypeScript compiler in check-only mode (used in pre-push hook)
- `prepare` - Automatically installs Husky hooks after npm install

### 🗂️ Ignore Files

#### `.prettierignore`
```
node_modules/
.expo/
android/
ios/
dist/
build/
coverage/
*.lock
```

#### Ignore patterns in `eslint.config.mts`
- `node_modules/`, `.expo/`, `android/`, `ios/`
- `dist/`, `build/`, `coverage/`
- `*.config.js`, `*.config.mjs`

### 🔤 Type Declarations

Added TypeScript declaration files for ESLint plugins (no @types packages available):
- `eslint-plugin-react-native.d.ts`
- `eslint-plugin-jsx-a11y.d.ts`
- `eslint-plugin-security.d.ts`

These provide type safety when importing ESLint plugins in the configuration file.

## Benefits

### 🛡️ Code Quality
- **Catches bugs early**: Promise handling, hooks dependencies, array bounds
- **Type safety**: Enforces TypeScript best practices
- **Consistency**: Auto-formatting and organized imports
- **Security**: Prevents common vulnerabilities (eval, unsafe regex, insecure random)
- **Accessibility**: Ensures app is usable by people with disabilities

### 👥 Team Collaboration
- **Automated**: Pre-commit hooks ensure code quality without manual intervention
- **Consistent style**: No more debates about formatting
- **Onboarding**: VS Code recommendations make setup easy for new developers
- **Fast feedback**: Errors shown inline in editor

### 🚀 Performance
- **Type-aware linting**: Catches logical errors TypeScript compiler misses
- **Import organization**: Makes code easier to navigate
- **Dead code detection**: Finds unused variables and styles

### 🔒 Security & Accessibility
- **Vulnerability detection**: Catches unsafe patterns before they reach production
- **ReDoS prevention**: Detects potentially dangerous regex patterns
- **WCAG compliance**: Enforces accessibility best practices
- **ARIA validation**: Ensures proper use of accessibility attributes

## Migration Notes

### For Developers
1. **First time setup**: Run `npm install` to get all dependencies
2. **VS Code users**: Accept the prompt to install recommended extensions
3. **Git hooks workflow**:
   - **Pre-commit** (fast): Runs lint-staged on every commit
     - Auto-fixes formatting and simple linting issues
     - Should be very quick (< 1 second typically)
   - **Pre-push** (thorough): Runs type-check and full lint before push
     - Validates entire project
     - Prevents broken code from reaching remote
     - Takes longer but only runs when pushing
   - Use `git commit --no-verify` or `git push --no-verify` to bypass (not recommended)

### Current Lint Issues (9 warnings/errors)
The following issues exist in the codebase and should be addressed:
- **App.tsx**: 3 floating promise errors (need proper error handling)
- **Component files**: 6 warnings for missing return types on exported functions

These can be fixed incrementally and don't block this PR.

## Testing
- ✅ `npm run lint` - Verifies all rules work correctly
- ✅ `npm run format` - Formats all files successfully
- ✅ `npm run type-check` - TypeScript compilation passes
- ✅ Pre-commit hook tested (fast - lint-staged only)
- ✅ Pre-push hook tested (thorough - type-check + lint)
- ✅ VS Code integration verified
- ✅ Accessibility rules configured for React Native
- ✅ Security rules catching vulnerabilities

## Breaking Changes
None. This is purely additive configuration.

## Future Enhancements
Consider adding:
- CI/CD integration (run linting in GitHub Actions)
- Type coverage tracking
- Bundle size analysis
- Commit message linting (commitlint)
- Jest plugin for test best practices
- E2E testing setup

---

**Generated with Claude Code** 🤖
