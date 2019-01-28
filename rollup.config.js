import pkg from './package.json'

export default {
    input: './tsout/main.js',
    output: {
        file: pkg.main,
        format: 'umd',
        globals: {
            'es6-promise': 'ES6Promise'
        },
    },
    external: ['svg.js', 'file-saver', 'es6-promise'],
    onwarn(warning, warn) {
        if (warning.code === 'THIS_IS_UNDEFINED')
            return;
        warn(warning);
    }
};
