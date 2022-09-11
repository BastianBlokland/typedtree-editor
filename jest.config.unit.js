/**
 * Configuration file for running unit-tests with jest.
 * https://jestjs.io/docs/en/configuration
 */

module.exports = {
    testEnvironment: 'node',
    transform: { '^.+\\.ts?$': 'ts-jest' },
    testRegex: '/tests/unit/.*\\.(test|spec)?\\.(ts|tsx)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
