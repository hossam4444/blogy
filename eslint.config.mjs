import { FlatCompat } from '@eslint/eslintrc';
import pluginJs from '@eslint/js';
import eslintPluginNode from 'eslint-plugin-node';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

const compat = new FlatCompat();

export default [
  {
    ignores: ['node_modules', 'dist', 'eslint.config.js'], // Ignore here
  },
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  pluginJs.configs.recommended,
  ...compat.extends('prettier'),
  {
    plugins: {
      prettier: eslintPluginPrettier,
      node: eslintPluginNode,
      'simple-import-sort': eslintPluginSimpleImportSort,
    },
    rules: {
      'prettier/prettier': 'error',
      'spaced-comment': 'off',
      // 'no-console': 'warn',
      'consistent-return': 'off',
      'func-names': 'off',
      'object-shorthand': 'off',
      'no-process-exit': 'off',
      'no-param-reassign': 'off',
      'no-return-await': 'off',
      'no-underscore-dangle': 'off',
      'class-methods-use-this': 'off',
      'prefer-destructuring': ['error', { object: true, array: false }],
      'no-unused-vars': ['warn', { argsIgnorePattern: 'req|res|next|val' }],
      'linebreak-style': ['error', 'unix'], // Ensures LF line endings across different machines
      // Node.js specific rules
      'node/no-missing-import': 'error', // Ensure all imports are available
      'node/no-unpublished-import': 'error', // Prevent importing unpublished modules
      // Simple Import Sort rules
      'simple-import-sort/imports': 'warn', // Sort imports
      'simple-import-sort/exports': 'warn', // Sort exports
    },
  },
];
