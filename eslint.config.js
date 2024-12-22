import globals from 'globals';
import pluginJs from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsEslint from '@typescript-eslint/eslint-plugin';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import stylisticJs from '@stylistic/eslint-plugin-js';
import stylisticJsx from '@stylistic/eslint-plugin-jsx';
import pluginReact from 'eslint-plugin-react';

export default [
	{
		files: ['src/**/*.{js,ts,jsx,tsx}'],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 12,
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
				project: ['tsconfig.json']
			},
		},
		plugins: {
			'@typescript-eslint': tsEslint,
			'@stylistic/ts': stylisticTs,
			'@stylistic/js': stylisticJs,
			'@stylistic/jsx': stylisticJsx,
			react: pluginReact,
		},
		rules: {
			...pluginJs.configs.recommended.rules,
			...tsEslint.configs.recommendedTypeChecked,
			...pluginReact.configs.recommended.rules,
			// Tab indenting only
			'@stylistic/ts/indent': ['error', 'tab', {'MemberExpression': 'off', 'SwitchCase': 1}],
			// Single quotes, but allow backticks when single quotes are part of the string
			'@stylistic/ts/quotes': ['error', 'single', { 'avoidEscape': true, 'allowTemplateLiterals': true }],
			'@stylistic/js/jsx-quotes': ['error', 'prefer-single'],
			// Braces and parentheses
			'@stylistic/ts/brace-style': ['error', 'allman', { 'allowSingleLine': false }],
			'@stylistic/js/no-extra-parens': ['error', 'all'],
			'@stylistic/ts/no-extra-parens': ['error', 'all'],
			// Semicolons
			'@stylistic/ts/semi': ['error', 'always'],
			// Extraneous spaces and line breaks
			'@stylistic/js/no-multiple-empty-lines': ['error', { 'max': 2, 'maxEOF': 0 }],
			'@stylistic/js/eol-last': ['error', 'always'],
			'@stylistic/js/no-multi-spaces': ['error', { 'ignoreEOLComments': true }],
			'@stylistic/js/no-trailing-spaces': ['error', { 'ignoreComments': true }],
			'@stylistic/ts/space-infix-ops': 'error',
			'@stylistic/js/arrow-spacing': ['error', { 'before': true, 'after': true }],
			'@stylistic/ts/type-annotation-spacing': ['error', { 'before': false, 'after': true, 'overrides': { 'arrow': { 'before': true, 'after': true } } }],
			'@stylistic/js/block-spacing': ['error', 'always'],
			'@stylistic/js/space-before-blocks': ['error', 'always'],
			"@stylistic/js/template-curly-spacing": ["error", "never"],
			'@stylistic/js/padding-line-between-statements': [
				'error',
				{ 'blankLine': 'always', 'prev': 'block-like', 'next': 'block-like' },
				{ 'blankLine': 'never', 'prev': 'case', 'next': 'case' },
			],
			'@stylistic/ts/object-curly-spacing': ['error', 'always'],
			'@stylistic/js/space-in-parens': ['error', 'never'],
			'@stylistic/jsx/jsx-curly-spacing': ['error', { "when": "never", "children": true }],
			// Other
			eqeqeq: ['warn', 'always'], // Can't enforce this without a significant core TS rewrite, so just discourage it
			'@stylistic/ts/comma-dangle': ['error', 'always-multiline'],
			'react/jsx-closing-bracket-location': ['error', 'line-aligned'],
			'no-extra-boolean-cast': 'error',
			'@typescript-eslint/no-deprecated': 'error',
			// Disable these rules
			'react/no-unescaped-entities': 'off',
			'no-cond-assign': 'off',
			'no-fallthrough': 'off',
			'no-unused-vars': 'off',
			'no-var': 'error',
			// Allow unused vars when they're underscores
			'@typescript-eslint/no-unused-vars': ['error', {
				'argsIgnorePattern': '^_',
				'varsIgnorePattern': '^_',
				'caughtErrorsIgnorePattern': '^_',
			}]
		},
		'settings': {
			'react': {
				'version': 'detect',
			},
		},
	},
	{
		ignores: ['node_modules'],
	},
];
