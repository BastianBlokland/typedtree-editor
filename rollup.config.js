import pkg from './package.json'

export default {
    input: './tsout/main.js',
    output: {
        file: pkg.main,
        format: 'umd'
    },
    external: ['svg.js', 'file-saver'],
    onwarn(warning, warn) {
        if (warning.code === 'THIS_IS_UNDEFINED')
            return;
        warn(warning);
    }
};
