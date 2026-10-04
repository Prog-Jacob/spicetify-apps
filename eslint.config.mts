import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['**/node_modules/', '**/dist/', '**/*.d.ts'] },
  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
    extends: [tseslint.configs.base],
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.mts', '.changeset/*.mts'] },
      },
      globals: {
        ...globals.browser,
        Spicetify: 'readonly',
        __APP_VERSION__: 'readonly',
        __APP_NAME__: 'readonly',
        __APP_DISPLAY_NAME__: 'readonly',
        __REPO__: 'readonly',
        __BUNDLED_LOCALES__: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          allowForKnownSafeCalls: [
            { from: 'package', package: 'node:test', name: ['test', 'it', 'describe', 'suite'] },
          ],
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['scripts/**/*.mts', '.changeset/**/*.mts', 'eslint.config.mts'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },
);
