import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/main.js',
  output: {
    exports: 'default',
    file: 'dist/pfmindmap_umd.js',
    format: 'umd',
    name: 'pfmindmap'
  },
  plugins: [nodeResolve()]
};