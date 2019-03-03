/**
 * Configuration file for running unit-tests with jest.
 * https://jestjs.io/docs/en/configuration
 */

module.exports = {
    transform: { '^.+\\.ts?$': 'ts-jest' },
    testEnvironment: 'node',
    testRegex: '/tests/unit/.*\\.(test|spec)?\\.(ts|tsx)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    globals: {
        'ts-jest': {
            diagnostics: {
                ignoreCodes: [151001]
            }
        }
    }
};
