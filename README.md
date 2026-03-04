# Denver-Food-Browser

Community built website for information on food banks and food pantries.

## Client

The client consists of the following environment components:

- **Development platform:** [Tauri](https://tauri.app/start/)
  - Tauri is a framework analogous to React Native or Electron built in Rust that takes a slightly different approach to those. Rather than shipping a whole Chromium or a translation layer of web-esque (at best) elements to Swift/Kotlin components, it ships an empty webview and uses a plugin-based architecture to opt into native APIs as necessary, allowing us to ship the smallest bundle possible.
- **Development targets:** iOS, Android, Web, Desktop Native (MacOS, Linux, Windows)
- **Frontend framework:** [SvelteKit](https://svelte.dev/docs/kit/introduction), `adapter-static` single-page app (SPA)
  - Svelte takes a similar approach to Tauri in that it is able to "compile itself out" of the final production build, unlike React whose entirety ships with your app bundle.

## CMS

Content is managed by [Directus](https://directus.io/solutions/backend-as-a-service).

## Getting Started

### Installations

#### Bun

Follow Bun's [installation instructions](https://bun.com). This project uses Bun for its package manager and JavaScript runtime with near-complete feature parity with Node.js. Just replace `npm` with `bun` and you're set. TypeScript support is built-in, allowing us to skip the complexity of compilation steps, module extensions, commonjs. Just run TypeScript files directly with the executable.

#### Tauri

Follow the [prequisite instructions](https://tauri.app/start/prerequisites/) to install Tauri's dependencies. These will include:

- Rust
- Node.js LTS (Yes, even with Bun, a Node.js LTS installation is still necessary)
- Android Studio
- XCode (if you have a Mac)

#### Editor (recommended)

**Recommended:** some version of VS Code, whether it's Windsurf, Codium, or VS Code itself. When you pull this repo, it will recommend that you install the following extensions:

- oxlint and oxfmt - The `ox-` prefix refers to "oxidation," because these are Rust-based tools for ensuring code-quality and code-style adherence.
- Svelte for VS Code - includes Svelte-specific syntax highlighting, linting and helpers
- Tauri - adds VS Code Command Palette build commands
- Rust Analyzer - Rust specific syntax highlighing, linting, etc.

## Branching and Deployment

The repo's branch protection rules are set up so that any time you'd like to make changes, you'll want to pull- and create pull-requests against the `dev` branch. From there, we will rebase `staging` with all commits in `dev` and test
all staged features/changes against the definitive Directus schema snapshot. Once testing is complete, changes will be merged to `production`.

```
chore/directus-snapshot-to-staging ->
feature/map-view ---------------------> dev ---> staging ---> production
bugfix/android-location-services --->
```
