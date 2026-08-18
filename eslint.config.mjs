import { FlatCompat } from '@eslint/eslintrc';
import eslintConfigPrettier from 'eslint-config-prettier';
import nxEslintPlugin from '@nx/eslint-plugin';
import js from '@eslint/js';
import jsoncParser from 'jsonc-eslint-parser';

const __dirname = import.meta.dirname;

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  { ignores: ['**/dist', '**/coverage', '**/tmp', '**/node_modules', '**/*__template__'] },
  eslintConfigPrettier,
  {
    plugins: {
      '@nx': nxEslintPlugin,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  ...compat.config({ extends: ['plugin:@nx/typescript'] }).map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      ...config.rules,
    },
  })),
  ...compat.config({ extends: ['plugin:@nx/javascript'] }).map((config) => ({
    ...config,
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      ...config.rules,
    },
  })),
  // Validate that generators.json / executors.json point at files that exist and
  // that every schema is valid - catches a broken plugin manifest before publish.
  {
    files: ['**/generators.json', '**/executors.json', '**/migrations.json', '**/package.json'],
    languageOptions: { parser: jsoncParser },
    rules: {
      '@nx/nx-plugin-checks': 'error',
    },
  },
];
