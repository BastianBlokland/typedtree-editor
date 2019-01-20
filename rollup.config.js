import pkg from './package.json'

export default {
    input: './tsout/main.js',
    output: {
        file: pkg.main,
        format: 'umd'
    },
    external: ['svg.js']
};
