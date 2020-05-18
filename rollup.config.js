import { terser } from 'rollup-plugin-terser'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default [
{
    input: 'src/WindowManager.js',
    plugins: [
        resolve(),
        commonjs(),
        terser()
    ],
    output:
    {
        file: 'public/simple-window-manager.min.js',
        format: 'umd',
        name: 'WindowManager',
        sourcemap: true
    }
},
{
    input: 'src/WindowManager.js',
    plugins: [
        resolve(),
        commonjs()
    ],
    output:
    {
        file: 'public/simple-window-manager.es.js',
        format: 'esm',
        sourcemap: true
    }
}]