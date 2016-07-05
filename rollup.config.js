import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    plugins: [
        nodeResolve({ jsnext: true, main: true, browser: true }),
        commonjs()
    ]
};
