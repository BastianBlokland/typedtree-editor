import pkg from './package.json'

export default {
    input: 'build/app.js',
    output: {
        file: pkg.main,
        format: 'umd'
    },
    external: ['svg.js']
};
