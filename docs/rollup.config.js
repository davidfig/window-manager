import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

export default
{
    input: 'docs/src/code.js',
    plugins: [
        resolve(),
        commonjs(),
        terser()
    ],
    output:
    {
        file: 'docs/index.js',
        format: 'iife',
        sourcemap: true
    }
}