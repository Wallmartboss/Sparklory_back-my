module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            ['feature', 'fix', 'refactor', 'docs', 'test', 'chore'],
        ],
        'subject-case': [2, 'always', 'sentence-case'],
        'header-max-length': [2, 'always', 72],
    },
};
//# sourceMappingURL=commitlint.config.js.map