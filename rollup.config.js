import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
  {
    input: 'src/main.js',
    output: {
      exports: 'default',
      file: 'dist/pfmindmap_esm.js',
      format: 'es',
      name: 'pfmindmap'
    },
    plugins: [nodeResolve()]
  }
];
