module.exports = {
  presets: [
    [
      `@babel/preset-env`,
      {
        modules: false,
        loose: true,
        useBuiltIns: `usage`,
        corejs: 3,
        debug: !!process.env.NO_UPLOAD,
        targets: {
          browsers: `last 1 Chrome version`,
        },
      },
    ],
  ],
  plugins: [`closure-elimination`],
}
