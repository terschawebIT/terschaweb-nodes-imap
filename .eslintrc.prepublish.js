/**
 * @type {import('@types/eslint').ESLint.ConfigData}
 */
module.exports = {
	root: true,

	env: {
		es6: true,
		node: true,
	},

	parser: '@typescript-eslint/parser',

	ignorePatterns: ['**/*.js', '**/node_modules/**', '**/dist/**'],

	plugins: ['eslint-plugin-n8n-nodes-base'],

	extends: ['plugin:n8n-nodes-base/community'],

	rules: {},
};
