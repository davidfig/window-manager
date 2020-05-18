import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

export default
{
    input: 'docs/src/code.js',
    plugins: [
        resolve(),
        commonjs(),
        serve(
        {
            contentBase: 'docs',
            verbose: true
        }),
        livereload({ dist: 'docs' })
    ],
    output:
    {
        file: 'docs/index.js',
        format: 'iife',
        sourcemap: true
    }
}