declare module 'eslint-plugin-jsx-a11y' {
  import type { ESLint, Linter } from 'eslint';

  const plugin: ESLint.Plugin & {
    configs: {
      recommended: Linter.Config;
      strict: Linter.Config;
    };
  };

  export default plugin;
}
