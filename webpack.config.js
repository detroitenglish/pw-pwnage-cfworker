const webpack = require('webpack')

const { ALLOWED_ORIGIN, ALWAYS_RETURN_SCORE, CORS_MAXAGE } = process.env

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
  plugins: [
    new webpack.DefinePlugin({
      ALLOWED_ORIGIN: JSON.stringify(ALLOWED_ORIGIN),
      ALWAYS_RETURN_SCORE: JSON.stringify(!!ALWAYS_RETURN_SCORE),
      CORS_MAXAGE: JSON.stringify(CORS_MAXAGE),
    }),
  ],
}
