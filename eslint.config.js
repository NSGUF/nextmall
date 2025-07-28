import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
});

export default tseslint.config(
    {
        ignores: ['.next'],
    },
    ...compat.extends('next/core-web-vitals'),
    {
        files: ['**/*.ts', '**/*.tsx'],
        extends: [
            ...tseslint.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        rules: {
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/prefer-optional-chain': 'off',
            '@typescript-eslint/prefer-nullish-coalescing': 'off',
            '@typescript-eslint/non-nullable-type-assertion-style': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/array-type': 'off',
            '@typescript-eslint/consistent-type-definitions': 'off',
            '@typescript-eslint/consistent-type-imports': [
                'warn',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
            ],
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/no-misused-promises': [
                'error',
                { checksVoidReturn: { attributes: false } },
            ],
        },
    },
    {
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    }
);
