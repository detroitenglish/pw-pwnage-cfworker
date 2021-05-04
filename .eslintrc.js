module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    browser: true,
  },
  parser: `@babel/eslint-parser`,
  extends: [`eslint:recommended`, `plugin:prettier/recommended`],
  plugins: [`babel`, `prettier`],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: `module`,
    allowImportExportEverywhere: true,
    babelOptions: {
      configFile: `${__dirname}/.babelrc.js`,
    },
  },
  rules: {
    'no-console': process.env.NODE_ENV === `production` ? `error` : `off`,
    'no-debugger': process.env.NODE_ENV === `production` ? `error` : `off`,
    'require-atomic-updates': 0,
    'babel/no-invalid-this': 0,
    'babel/no-unused-expressions': 0,
    'babel/valid-typeof': 1,
    'no-empty': `off`,
    'no-var': `error`,
    'prefer-template': `error`,
    quotes: [`warn`, `backtick`],
    eqeqeq: `error`,
    strict: `error`,
    'require-await': `error`,
    'prettier/prettier': [
      `warn`,
      {},
      {
        usePrettierrc: true,
      },
    ],
  },
}
