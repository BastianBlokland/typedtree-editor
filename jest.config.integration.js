/**
 * Configuration file for running integration-tests with jest.
 * https://jestjs.io/docs/en/configuration
 */

module.exports = {
    preset: 'jest-puppeteer',
    transform: { '^.+\\.ts?$': 'ts-jest' },
    testRegex: '/tests/integration/.*\\.(test|spec)?\\.(ts|tsx)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    globals: {
        'ts-jest': {
            diagnostics: {
                ignoreCodes: [151001]
            }
        }
    }
};
