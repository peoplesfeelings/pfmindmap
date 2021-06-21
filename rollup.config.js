import { nodeResolve } from '@rollup/plugin-node-resolve';
import banner from 'rollup-plugin-banner';
import path from 'path';
import license from 'rollup-plugin-license';

const bannerText = `
pfmindmap (github.com/peoplesfeelings/pfmindmap)

bundled with dependencies, including:
D3 (https://github.com/d3/d3)
Observable Runtime (https://github.com/observablehq/runtime)

see dependencies.txt, built with this bundle, for dependency licenses and copyrights
see LICENSE.txt, part of pfmindmap repo, for license/copyright of this module
`;

export default [
  {
    input: 'src/main.js',
    output: {
      exports: 'default',
      file: 'dist/pfmindmap_bundle.js',
      format: 'es',
      name: 'pfmindmap'
    },
    plugins: [
      nodeResolve(),
      banner(bannerText),
      license({
        thirdParty: {
          output: path.join(__dirname, 'dist', 'dependencies.txt'),
          includePrivate: true, 
        },
      })
    ]
  }
];
