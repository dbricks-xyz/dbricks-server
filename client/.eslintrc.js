module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/airbnb',
    '@vue/typescript/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
  "overrides": [
    {
      "files": ["*.ts", "*.js", "*.vue"],
      "rules": {
        "import/extensions": "off",
        "import/no-unresolved": "off",
        "import/prefer-default-export": "off",
        "no-shadow": "off",
        "no-unused-vars": "off",
        "class-methods-use-this": "off",
        "no-underscore-dangle": "off",
        "max-len": "off"
      }
    }
  ]
};
