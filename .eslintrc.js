module.exports = {
    extends: ['expo', 'prettier'],
    plugins: ['prettier'],
    rules: {
        'prettier/prettier': 'error',
        // Warn on console.log to prevent prod leaks
        'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
};
