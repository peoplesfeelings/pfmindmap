import { nodeResolve } from '@rollup/plugin-node-resolve';
import path from 'path';
import rpl from 'rollup-plugin-license';

const bannerText = `
This file is a bundle of <%= pkg.name %> <%= pkg.version %> and its dependencies.

<%= pkg.name %> <%= pkg.version %>
copyright 2022 people's feelings
pseudonym hash: 2A73BD701A1CE2FBE2CB3B4D119E9DFC061AA38C26763BAE921FB87336E87E42

github.com/peoplesfeelings/pfmindmap

"2-Clause BSD"
Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this 
list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, 
this list of conditions and the following disclaimer in the documentation and/or 
other materials provided with the distribution.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR 
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES 
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; 
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON 
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT 
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS 
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.



Dependencies:

<% _.forEach(dependencies, function (dependency) { %>
  <%= dependency.name %> -- <%= dependency.version %>
  <%= dependency.licenseText %>
<% }) %>
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
      rpl({
        banner: bannerText,
        thirdParty: {
          output: path.join(__dirname, 'dist', 'dependencies_bundled.txt'),
          includePrivate: true, 
        },
      })
    ]
  }
];
