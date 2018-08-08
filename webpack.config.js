require('dotenv').config({ path: __dirname + '/cloudflare.env' })

const webpack = require('webpack')

const {
  ALLOWED_ORIGIN = '*',
  ALLOWED_ORIGIN_PATTERNS = '',
  ALWAYS_RETURN_SCORE = false,
  CORS_MAXAGE = 300,
} = process.env

module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'index.js',
  },
  mode: 'production',
  optimization: {
    minimize: false,
  },
  performance: {
    hints: false,
  },
  plugins: [
    new webpack.DefinePlugin({
      ALLOWED_ORIGIN: JSON.stringify(ALLOWED_ORIGIN),
      ALLOWED_ORIGIN_PATTERNS: JSON.stringify(ALLOWED_ORIGIN_PATTERNS),
      ALWAYS_RETURN_SCORE: JSON.stringify(!!ALWAYS_RETURN_SCORE),
      CORS_MAXAGE: JSON.stringify(CORS_MAXAGE),
      LAST_MODIFIED: JSON.stringify(new Date().toJSON()),
    }),
  ],
}
