import resolve from 'rollup-plugin-node-resolve';

import pkg from './package.json'

export default {
    input: 'build/app.js',
    output: {
        file: pkg.main,
        format: 'umd'
    },
    plugins: [
        resolve({
            jsnext: true,
            main: true,
            module: true
        })
    ],
    onwarn: function (warning, warn) {
        // Ignore 'Circular Dependency' warning as its caused by d3 and apparently harmless
        if (warning.code === 'CIRCULAR_DEPENDENCY')
            return;
        warn(warning);
    }
};
