/**
 * Configuration file for running jest tests using puppeteer.
 * https://github.com/smooth-code/jest-puppeteer
 * https://github.com/smooth-code/jest-puppeteer/tree/master/packages/jest-dev-server
 */

module.exports = {
    server: {
        command: './node_modules/.bin/live-server build --no-browser --port=3000',
        protocol: 'http',
        host: "127.0.0.1",
        port: 3000,
        usedPortAction: 'kill'
    },
}
