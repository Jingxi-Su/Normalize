module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: 'standard',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'jest'
  ],
  rules: {
    'no-prototype-builtins': 'off'
  }
}
