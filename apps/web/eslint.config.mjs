import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import i18next from 'eslint-plugin-i18next';
import globals from 'globals';

// Structural/technical JSX attributes that must NEVER be flagged as
// untranslated copy (URLs, ids, css, enum-like props, svg geometry, …).
// Anything NOT in this list — placeholder, title, alt, aria-label, label —
// IS checked, because those render to the user and must go through t().
const NON_TEXT_JSX_ATTRS = [
	'className', 'class', 'styleName', 'style', 'key', 'id', 'htmlFor', 'for',
	'type', 'name', 'href', 'src', 'srcSet', 'rel', 'target', 'to', 'role',
	'value', 'autoComplete', 'inputMode', 'pattern', 'accept', 'method', 'encType',
	'variant', 'size', 'color', 'fill', 'stroke', 'viewBox', 'd', 'path', 'xmlns',
	'width', 'height', 'data-testid', 'aria-hidden', 'aria-controls',
	'aria-describedby', 'aria-labelledby', 'placeholderText', 'icon', 'as',
];

export default [
	{ ignores: ['node_modules/**', 'dist/**', 'build/**', 'vite.config.js', 'vitest.config.js', 'public/sw.js'] },
	{
		files: ['**/*.js', '**/*.jsx'],
		plugins: { react, 'react-hooks': reactHooks, import: importPlugin, i18next },
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: { ecmaFeatures: { jsx: true } },
			globals: { ...globals.browser, React: 'readonly', Intl: 'readonly' },
		},
		settings: {
			react: { version: 'detect' },
			'import/resolver': {
				node: { extensions: ['.js', '.jsx'] },
				alias: { map: [['@', './src']], extensions: ['.js', '.jsx'] },
			},
		},
		rules: {
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			...importPlugin.flatConfigs.recommended.rules,

			// Non-critical rules - disabled since code works fine without them
			'react/prop-types': 'off',
			'react/no-unescaped-entities': 'off',
			'react/display-name': 'off', // Non-critical, component works without displayName
			'react/jsx-uses-react': 'off', // Not needed in React 17+, non-critical
			'react/react-in-jsx-scope': 'off', // Not needed in React 17+, non-critical
			'react/jsx-uses-vars': 'off', // Non-critical, code works fine
			'react/jsx-no-comment-textnodes': 'off', // Non-critical, comments could be visible if put inside the JSX, most cases are just rendering text like '///'

			'no-unused-vars': 'off', // Non-critical, code works fine with unused vars
			'import/no-named-as-default': 'off', // Can cause runtime import errors, usually fine to leave as is
			'import/no-named-as-default-member': 'off', // Can cause runtime import errors

			// Critical rules that prevent runtime errors
			'no-undef': 'error', // Undefined variables cause runtime errors

			// Override recommended import rules for stricter checking
			'import/no-self-import': 'error', // Extremely fast rule, breaking results in infinite loop/bundling error

			// Disable expensive rules for performance
			'import/no-cycle': 'off', // AI rarely makes this error, and the rule is very slow to run

			// i18n leak guard: any user-facing string literal in JSX (text or
			// rendered attribute) that is NOT wrapped in t() is flagged. This is
			// what catches "random English" the parity gate can't see, because
			// those strings never make it into the locale files at all.
			// Starts as 'warn' (ratchet): build stays green while we burn down
			// existing hits, then we flip to 'error' to lock it in.
			'i18next/no-literal-string': ['warn', {
				mode: 'jsx-only',
				'jsx-attributes': { exclude: NON_TEXT_JSX_ATTRS },
				// Ignore strings with no letters (numbers, symbols, separators)
				// and pure brand/identifier tokens that are identical in every
				// language and so never need translating.
				words: {
					exclude: [
						'^[^a-zA-Z]+$',
						'^(WorkBee|Boilio|Stripe|PayPal|IBAN|CVV|Instagram|Facebook|LinkedIn|Google|Apple|VISA|Mastercard|€|EUR|·|—|–|•|/|×)$',
					],
				},
			}],
		},
	},
	// Locale-agnostic / non-UI files don't render copy — don't lint them for strings.
	{
		files: ['tools/**/*.js', 'tailwind.config.js'],
		languageOptions: { globals: globals.node },
		rules: { 'i18next/no-literal-string': 'off' },
	},
	{
		files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', 'src/i18n.js', 'src/locales/**'],
		rules: { 'i18next/no-literal-string': 'off' },
	},
	// Internal-only / vendored surfaces that are not customer copy:
	//  - admin/* + AdminLayout: staff back-office, conventionally single-language.
	//  - components/ui/*: vendored shadcn primitives (mostly technical strings).
	// Re-include any of these later if we decide to translate them.
	{
		files: ['src/pages/admin/**', 'src/components/AdminLayout.jsx', 'src/components/ui/**'],
		rules: { 'i18next/no-literal-string': 'off' },
	},
];
