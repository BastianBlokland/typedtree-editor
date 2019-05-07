/**
 * Configuration file for rollup.
 * https://rollupjs.org/guide/en#configuration-files
 */

import pkg from './package.json'
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
    input: './tsout/main.js',
    output: {
        file: pkg.main,
        format: 'umd'
    },
    plugins: [
        nodeResolve(),
        commonjs({
            namedExports: {
                'node_modules/lz-string/libs/lz-string.js': [
                    'compressToEncodedURIComponent',
                    'decompressFromEncodedURIComponent'
                ]
            }
        })
    ],
    onwarn(warning, warn) {
        if (warning.code === 'THIS_IS_UNDEFINED')
            return;
        warn(warning);
    }
};
