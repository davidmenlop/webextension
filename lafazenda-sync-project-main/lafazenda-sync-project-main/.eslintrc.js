module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    // 'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {

    'no-trailing-spaces': 'error',
    'eol-last': ['error', 'always'],
    indent: ['error', 2, { SwitchCase: 1, ObjectExpression: 1, ignoredNodes:['ClassBody.body > PropertyDefinition[decorators.length > 0] > .key',] }],
    quotes: ['error', 'single', { allowTemplateLiterals: true }],
    semi: ['error', 'always'],
    // 'linebreak-style': 0,
    'linebreak-style': 0,
    'no-empty': ['error', { allowEmptyCatch: true }],
    'array-element-newline': ['error', 'always'],
    'array-bracket-spacing': ['error', 'always'],
    'array-bracket-newline': ['error', { multiline: true }],
    'object-curly-spacing': ['error', 'always'],
    'func-call-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', 'always'],
    'no-multi-spaces': 'error',
    'space-infix-ops': 'warn',
    // 'object-curly-newline': ['error', 'always'],
    'key-spacing': ['error', { afterColon: true }],
    'comma-spacing': [
      'error',
      {
        before: false,
        after: true,
      },
    ],
    'comma-dangle': [
      'error',
      {
        arrays: 'never',
        objects: 'never',
        imports: 'never',
        exports: 'never',
        functions: 'never',
      },
    ],
    'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0 }],
    'keyword-spacing':['error', {
      before: true,
      after: true
    }],
    'space-before-blocks': ['error', 'always'],
    'space-in-parens': ['error', 'always', { 'exceptions': ['{}'] }],

    '@typescript-eslint/type-annotation-spacing': ['error', {
      before: false,
      after: true,
    }],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 'varsIgnorePattern': '_' }]
    ,
    '@typescript-eslint/ban-ts-comment': 'off',

    '@typescript-eslint/no-empty-function': 'off',

    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
