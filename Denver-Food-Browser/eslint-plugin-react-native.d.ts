declare module 'eslint-plugin-react-native' {
  import type { ESLint, Linter } from 'eslint';

  const plugin: ESLint.Plugin & {
    configs: {
      recommended: Linter.Config;
      all: Linter.Config;
    };
  };

  export default plugin;
}
