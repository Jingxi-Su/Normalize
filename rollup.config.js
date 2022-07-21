const { terser } = require('rollup-plugin-terser');

const path = require('path');

const resolveFile = function (filePath) {
  return path.join(__dirname, '.', filePath)
}


module.exports = [
  {
    input: 'src/shopeelize.js',
    output: {
      file: resolveFile('dist/shopeelize.js'),
      format: 'umd',
      name: 'shopeelize',
    },
    plugins: [
      terser()
    ]
  },
]
