require('dotenv').config({ path: __dirname + '/cloudflare.env' })

const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CloudflareWorkerPlugin = require('cloudflare-worker-webpack-plugin')

const {
  ALLOWED_ORIGIN = '*',
  ALLOWED_ORIGIN_PATTERNS = '',
  ALWAYS_RETURN_SCORE = false,
  CORS_MAXAGE = 300,
  RETURN_PW_METADATA = false,
  CUSTOM_PW_DICT = '',
  ROUTE_PATTERN,
  AUTH_EMAIL,
  AUTH_KEY,
  ZONE_ID,
  SITE_NAME,
} = process.env

if (ALLOWED_ORIGIN_PATTERNS.length) {
  const patterns = ALLOWED_ORIGIN_PATTERNS.split(',').map(p =>
    RegExp(p).toString()
  )
  console.info(`Allowed origin patterns: ${patterns.join(', ')}`)
}

module.exports = {
  entry: __dirname + '/src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'index.js',
  },
  target: 'webworker',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [/frequency_lists/],
      },
    ],
  },
  performance: {
    hints: false,
  },
  node: false,
  optimization: {
    minimize: false,
  },
  plugins: [
    new CleanWebpackPlugin(`dist/*`, {
      root: __dirname,
      verbose: false,
    }),

    new webpack.DefinePlugin({
      ALLOWED_ORIGIN: JSON.stringify(ALLOWED_ORIGIN),
      ALLOWED_ORIGIN_PATTERNS: JSON.stringify(ALLOWED_ORIGIN_PATTERNS),
      ALWAYS_RETURN_SCORE: JSON.stringify(!!ALWAYS_RETURN_SCORE),
      CORS_MAXAGE: JSON.stringify(CORS_MAXAGE),
      RETURN_PW_METADATA: JSON.stringify(!!RETURN_PW_METADATA),
      CUSTOM_PW_DICT: JSON.stringify(CUSTOM_PW_DICT),
      LAST_MODIFIED: JSON.stringify(new Date().toJSON()),
    }),

    new CloudflareWorkerPlugin(AUTH_EMAIL, AUTH_KEY, {
      enabled: !process.env.NO_UPLOAD,
      zone: ZONE_ID,
      site: SITE_NAME,
      pattern: ROUTE_PATTERN,
      clearRoutes: false,
      skipWorkerUpload: false,
      verbose: true,
      colors: true,
      emoji: true,
    }),
  ],
}
