module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        loose: true,
        useBuiltIns: 'usage',
        debug: !!process.env.NO_UPLOAD,
        targets: {
          browsers: 'last 1 Chrome version',
        },
        exclude: ['web.dom.iterable', 'es6.promise'],
      },
    ],
  ],
  plugins: ['closure-elimination'],
}
