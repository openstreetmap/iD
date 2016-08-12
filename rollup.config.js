import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

export default {
    plugins: [
        nodeResolve({ jsnext: true, main: true, browser: false }),
        commonjs(),
        json()
    ]
};
