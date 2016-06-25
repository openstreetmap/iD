import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
    entry: 'modules/index.js',
    format: 'umd',
    moduleName: 'iD',
    dest: 'js/lib/iD/index.js',
    plugins: [
        nodeResolve({
            jsnext: true,
            // – see https://github.com/rollup/rollup-plugin-commonjs
            main: true,
            browser: true,
        }),
        commonjs()
    ]
};
