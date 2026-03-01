module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
    extends: [
        'eslint:recommended',
    ],
    env: {
        node: true,
        es2022: true,
    },
    rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
    ignorePatterns: ['node_modules'],
};
