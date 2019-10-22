const { rollup } = require('rollup');
const amd = require('rollup-plugin-amd');
const lookup = require('module-lookup-amd');

rollup({
  preserveModules: true,
  input: [
    'js/libs/provoda/provoda.js',
    'js/utils/init.js',
    'js/views/map_slice/MapSliceSpyglassCore',
    'js/views/map_slice/BrowseLevViewCore',
    'js/views/map_slice/getAncestorByRooViCon',
    'js/views/map_slice/getMapSliceView',
  ],

  plugins: [
    amd({
      rewire: function (moduleId, parentPath) { // Optional, Default: false
        const result = lookup({
          directory: __dirname,
          partial: moduleId,
          filename: parentPath,
          config: {
            paths: {
              jquery: 'js/common-libs/jquery-2.1.4.min',
              angbo: 'js/libs/provoda/StatementsAngularParser.min',
            },
            map: {
              '*': {
                su: 'js/seesu',

                pv: 'js/libs/provoda/provoda',
                View: 'js/libs/provoda/View',
                js: 'js',
                spv: 'js/libs/spv',
                app_serv: "js/app_serv",
                localizer: 'js/libs/localizer',
                view_serv: "js/views/modules/view_serv",
                cache_ajax: 'js/libs/cache_ajax',
                env: "js/env",

                hex_md5: 'js/common-libs/md5',
                'Promise': 'js/common-libs/Promise-3.1.0.mod'
              }
            },
          } // Or an object
        })
        return result;
      }
    })
  ]
})
.then(async bundle => {
  await Promise.all([
    bundle.write({
      dir: 'dist/esm',
      format: 'esm',
      name: 'library',
      // sourcemap: true
    }),
    bundle.write({
      dir: 'dist/cjs', // use umd?
      format: 'cjs',
      name: 'library',
      // sourcemap: true
    })
  ])
})
.catch(console.error)